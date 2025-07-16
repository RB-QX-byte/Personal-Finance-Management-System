package middleware

import (
	"crypto/rsa"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/personal-finance-management/backend/internal/config"
)

// UserClaims represents the JWT claims from Supabase
type UserClaims struct {
	Sub               string                 `json:"sub"`
	Email             string                 `json:"email"`
	Phone             string                 `json:"phone"`
	AppMetadata       map[string]interface{} `json:"app_metadata"`
	UserMetadata      map[string]interface{} `json:"user_metadata"`
	Role              string                 `json:"role"`
	AuthenticatedAt   int64                  `json:"iat"`
	ExpiresAt         int64                  `json:"exp"`
	SessionID         string                 `json:"session_id"`
	IsAnonymous       bool                   `json:"is_anonymous"`
	jwt.RegisteredClaims
}

// JWK represents a JSON Web Key
type JWK struct {
	Kty string `json:"kty"`
	Use string `json:"use"`
	Kid string `json:"kid"`
	X5t string `json:"x5t"`
	N   string `json:"n"`
	E   string `json:"e"`
	X5c []string `json:"x5c"`
}

// JWKS represents a JSON Web Key Set
type JWKS struct {
	Keys []JWK `json:"keys"`
}

// AuthMiddleware provides JWT authentication middleware
type AuthMiddleware struct {
	cfg        *config.Config
	jwksCache  *JWKS
	cacheTime  time.Time
	httpClient *http.Client
}

// NewAuthMiddleware creates a new authentication middleware
func NewAuthMiddleware(cfg *config.Config) *AuthMiddleware {
	return &AuthMiddleware{
		cfg: cfg,
		httpClient: &http.Client{
			Timeout: 30 * time.Second,
		},
	}
}

// RequireAuth middleware that validates JWT tokens
func (am *AuthMiddleware) RequireAuth() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authorization header required"})
			c.Abort()
			return
		}

		// Extract token from "Bearer <token>"
		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid authorization header format"})
			c.Abort()
			return
		}

		tokenString := parts[1]

		// Parse and validate token
		claims, err := am.validateToken(tokenString)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token", "details": err.Error()})
			c.Abort()
			return
		}

		// Add user info to context
		c.Set("user_id", claims.Sub)
		c.Set("user_email", claims.Email)
		c.Set("user_role", claims.Role)
		c.Set("user_claims", claims)

		c.Next()
	}
}

// OptionalAuth middleware that validates JWT tokens if present
func (am *AuthMiddleware) OptionalAuth() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.Next()
			return
		}

		// Extract token from "Bearer <token>"
		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			c.Next()
			return
		}

		tokenString := parts[1]

		// Parse and validate token
		claims, err := am.validateToken(tokenString)
		if err != nil {
			// Don't abort for optional auth, just continue without user context
			c.Next()
			return
		}

		// Add user info to context
		c.Set("user_id", claims.Sub)
		c.Set("user_email", claims.Email)
		c.Set("user_role", claims.Role)
		c.Set("user_claims", claims)

		c.Next()
	}
}

// validateToken validates a JWT token using Supabase JWKS
func (am *AuthMiddleware) validateToken(tokenString string) (*UserClaims, error) {
	// Parse token to get header
	token, _, err := new(jwt.Parser).ParseUnverified(tokenString, &UserClaims{})
	if err != nil {
		return nil, fmt.Errorf("failed to parse token: %w", err)
	}

	// Get key ID from header
	kid, ok := token.Header["kid"].(string)
	if !ok {
		return nil, fmt.Errorf("token missing kid header")
	}

	// Get JWKS
	jwks, err := am.getJWKS()
	if err != nil {
		return nil, fmt.Errorf("failed to get JWKS: %w", err)
	}

	// Find the right key
	var jwk *JWK
	for _, key := range jwks.Keys {
		if key.Kid == kid {
			jwk = &key
			break
		}
	}

	if jwk == nil {
		return nil, fmt.Errorf("key not found in JWKS")
	}

	// Parse the public key
	publicKey, err := am.parseRSAPublicKey(jwk)
	if err != nil {
		return nil, fmt.Errorf("failed to parse public key: %w", err)
	}

	// Parse and validate the token
	claims := &UserClaims{}
	parsedToken, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
		// Verify signing method
		if _, ok := token.Method.(*jwt.SigningMethodRSA); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return publicKey, nil
	})

	if err != nil {
		return nil, fmt.Errorf("failed to validate token: %w", err)
	}

	if !parsedToken.Valid {
		return nil, fmt.Errorf("token is not valid")
	}

	// Verify issuer if configured
	if am.cfg.SupabaseURL != "" {
		expectedIssuer := am.cfg.SupabaseURL + "/auth/v1"
		if claims.Issuer != expectedIssuer {
			return nil, fmt.Errorf("invalid issuer: %s", claims.Issuer)
		}
	}

	return claims, nil
}

// getJWKS retrieves the JSON Web Key Set from Supabase
func (am *AuthMiddleware) getJWKS() (*JWKS, error) {
	// Check cache (cache for 1 hour)
	if am.jwksCache != nil && time.Since(am.cacheTime) < time.Hour {
		return am.jwksCache, nil
	}

	// Fetch JWKS from Supabase
	jwksURL := am.cfg.SupabaseURL + "/auth/v1/jwks"
	
	resp, err := am.httpClient.Get(jwksURL)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch JWKS: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("JWKS endpoint returned status %d", resp.StatusCode)
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read JWKS response: %w", err)
	}

	var jwks JWKS
	if err := json.Unmarshal(body, &jwks); err != nil {
		return nil, fmt.Errorf("failed to parse JWKS: %w", err)
	}

	// Cache the result
	am.jwksCache = &jwks
	am.cacheTime = time.Now()

	return &jwks, nil
}

// parseRSAPublicKey converts JWK to RSA public key
func (am *AuthMiddleware) parseRSAPublicKey(jwk *JWK) (*rsa.PublicKey, error) {
	// This is a simplified implementation
	// In a production environment, you would properly decode the JWK
	// For now, we'll use a fallback approach with the JWT secret
	if am.cfg.SupabaseJWTSecret != "" {
		return jwt.ParseRSAPublicKeyFromPEM([]byte(am.cfg.SupabaseJWTSecret))
	}
	
	return nil, fmt.Errorf("JWT secret not configured")
}

// GetUserID extracts user ID from Gin context
func GetUserID(c *gin.Context) (string, bool) {
	userID, exists := c.Get("user_id")
	if !exists {
		return "", false
	}
	
	id, ok := userID.(string)
	return id, ok
}

// GetUserEmail extracts user email from Gin context
func GetUserEmail(c *gin.Context) (string, bool) {
	userEmail, exists := c.Get("user_email")
	if !exists {
		return "", false
	}
	
	email, ok := userEmail.(string)
	return email, ok
}

// GetUserClaims extracts full user claims from Gin context
func GetUserClaims(c *gin.Context) (*UserClaims, bool) {
	claims, exists := c.Get("user_claims")
	if !exists {
		return nil, false
	}
	
	userClaims, ok := claims.(*UserClaims)
	return userClaims, ok
}

// MustGetUserID extracts user ID from context or panics
func MustGetUserID(c *gin.Context) string {
	userID, ok := GetUserID(c)
	if !ok {
		panic("user ID not found in context")
	}
	return userID
}