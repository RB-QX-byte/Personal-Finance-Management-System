package middleware

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/personal-finance-management/backend/internal/config"
	"github.com/stretchr/testify/assert"
)

func TestAuthMiddleware_RequireAuth_MissingHeader(t *testing.T) {
	gin.SetMode(gin.TestMode)
	
	cfg := &config.Config{
		SupabaseURL:       "https://test.supabase.co",
		SupabaseJWTSecret: "test-secret",
	}
	
	authMiddleware := NewAuthMiddleware(cfg)
	
	router := gin.New()
	router.Use(authMiddleware.RequireAuth())
	router.GET("/protected", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"message": "success"})
	})
	
	req, _ := http.NewRequest("GET", "/protected", nil)
	w := httptest.NewRecorder()
	
	router.ServeHTTP(w, req)
	
	assert.Equal(t, http.StatusUnauthorized, w.Code)
	assert.Contains(t, w.Body.String(), "Authorization header required")
}

func TestAuthMiddleware_RequireAuth_InvalidHeader(t *testing.T) {
	gin.SetMode(gin.TestMode)
	
	cfg := &config.Config{
		SupabaseURL:       "https://test.supabase.co",
		SupabaseJWTSecret: "test-secret",
	}
	
	authMiddleware := NewAuthMiddleware(cfg)
	
	router := gin.New()
	router.Use(authMiddleware.RequireAuth())
	router.GET("/protected", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"message": "success"})
	})
	
	req, _ := http.NewRequest("GET", "/protected", nil)
	req.Header.Set("Authorization", "InvalidToken")
	w := httptest.NewRecorder()
	
	router.ServeHTTP(w, req)
	
	assert.Equal(t, http.StatusUnauthorized, w.Code)
	assert.Contains(t, w.Body.String(), "Invalid authorization header format")
}

func TestAuthMiddleware_OptionalAuth_MissingHeader(t *testing.T) {
	gin.SetMode(gin.TestMode)
	
	cfg := &config.Config{
		SupabaseURL:       "https://test.supabase.co",
		SupabaseJWTSecret: "test-secret",
	}
	
	authMiddleware := NewAuthMiddleware(cfg)
	
	router := gin.New()
	router.Use(authMiddleware.OptionalAuth())
	router.GET("/optional", func(c *gin.Context) {
		userID, exists := GetUserID(c)
		if !exists {
			c.JSON(http.StatusOK, gin.H{"message": "no auth", "user_id": nil})
		} else {
			c.JSON(http.StatusOK, gin.H{"message": "with auth", "user_id": userID})
		}
	})
	
	req, _ := http.NewRequest("GET", "/optional", nil)
	w := httptest.NewRecorder()
	
	router.ServeHTTP(w, req)
	
	assert.Equal(t, http.StatusOK, w.Code)
	assert.Contains(t, w.Body.String(), "no auth")
}

func TestGetUserID(t *testing.T) {
	gin.SetMode(gin.TestMode)
	
	router := gin.New()
	router.GET("/test", func(c *gin.Context) {
		c.Set("user_id", "test-user-123")
		
		userID, exists := GetUserID(c)
		assert.True(t, exists)
		assert.Equal(t, "test-user-123", userID)
		
		c.JSON(http.StatusOK, gin.H{"user_id": userID})
	})
	
	req, _ := http.NewRequest("GET", "/test", nil)
	w := httptest.NewRecorder()
	
	router.ServeHTTP(w, req)
	
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestGetUserEmail(t *testing.T) {
	gin.SetMode(gin.TestMode)
	
	router := gin.New()
	router.GET("/test", func(c *gin.Context) {
		c.Set("user_email", "test@example.com")
		
		email, exists := GetUserEmail(c)
		assert.True(t, exists)
		assert.Equal(t, "test@example.com", email)
		
		c.JSON(http.StatusOK, gin.H{"user_email": email})
	})
	
	req, _ := http.NewRequest("GET", "/test", nil)
	w := httptest.NewRecorder()
	
	router.ServeHTTP(w, req)
	
	assert.Equal(t, http.StatusOK, w.Code)
}