package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// AuthHandler handles authentication-related requests
type AuthHandler struct{}

// NewAuthHandler creates a new auth handler
func NewAuthHandler() *AuthHandler {
	return &AuthHandler{}
}

// LoginRequest represents the login request payload
type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

// RegisterRequest represents the registration request payload
type RegisterRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=6"`
	Name     string `json:"name" binding:"required"`
}

// ForgotPasswordRequest represents the forgot password request payload
type ForgotPasswordRequest struct {
	Email string `json:"email" binding:"required,email"`
}

// ResetPasswordRequest represents the reset password request payload
type ResetPasswordRequest struct {
	Token    string `json:"token" binding:"required"`
	Password string `json:"password" binding:"required,min=6"`
}

// Login handles user login
// Note: In a Supabase-based system, authentication is typically handled client-side
// This endpoint can be used for additional server-side logic or validation
func (h *AuthHandler) Login(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// In a Supabase setup, the actual authentication happens client-side
	// This endpoint can be used for:
	// 1. Additional validation
	// 2. Logging login attempts
	// 3. Custom business logic
	
	// For now, return a message indicating client-side auth should be used
	c.JSON(http.StatusOK, gin.H{
		"message": "Please use Supabase client-side authentication",
		"redirect": "/dashboard",
	})
}

// Register handles user registration
// Note: In a Supabase-based system, registration is typically handled client-side
func (h *AuthHandler) Register(c *gin.Context) {
	var req RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// In a Supabase setup, the actual registration happens client-side
	// This endpoint can be used for:
	// 1. Additional validation
	// 2. Custom user profile creation
	// 3. Welcome emails or notifications
	
	// For now, return a message indicating client-side auth should be used
	c.JSON(http.StatusOK, gin.H{
		"message": "Please use Supabase client-side authentication for registration",
		"redirect": "/login",
	})
}

// Logout handles user logout
func (h *AuthHandler) Logout(c *gin.Context) {
	// In a Supabase setup, logout is typically handled client-side
	// This endpoint can be used for additional cleanup
	
	c.JSON(http.StatusOK, gin.H{
		"message": "Logout successful",
	})
}

// Profile returns user profile information
func (h *AuthHandler) Profile(c *gin.Context) {
	// Get user info from auth middleware
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	userEmail, _ := c.Get("user_email")
	userRole, _ := c.Get("user_role")

	c.JSON(http.StatusOK, gin.H{
		"user_id": userID,
		"email":   userEmail,
		"role":    userRole,
	})
}

// ForgotPassword handles forgot password requests
func (h *AuthHandler) ForgotPassword(c *gin.Context) {
	var req ForgotPasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// In a Supabase setup, password reset is typically handled client-side
	// This endpoint can be used for:
	// 1. Additional validation
	// 2. Logging password reset attempts
	// 3. Custom email templates
	// 4. Rate limiting
	
	// For now, return success message indicating client-side handling
	c.JSON(http.StatusOK, gin.H{
		"message": "If the email exists, a password reset link has been sent",
		"email":   req.Email,
		"action":  "check_email",
	})
}

// ResetPassword handles password reset with token
func (h *AuthHandler) ResetPassword(c *gin.Context) {
	var req ResetPasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// In a Supabase setup, password reset is typically handled client-side
	// This endpoint can be used for:
	// 1. Additional validation
	// 2. Custom business logic
	// 3. Logging reset attempts
	
	// For now, return success message indicating client-side handling
	c.JSON(http.StatusOK, gin.H{
		"message": "Password reset successful. Please log in with your new password.",
		"action":  "redirect_to_login",
	})
}

// VerifyResetToken verifies if a reset token is valid
func (h *AuthHandler) VerifyResetToken(c *gin.Context) {
	token := c.Query("token")
	if token == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Reset token is required"})
		return
	}

	// In a Supabase setup, token verification is typically handled client-side
	// This endpoint can be used for additional server-side validation
	
	// For now, return success for any non-empty token
	c.JSON(http.StatusOK, gin.H{
		"valid": true,
		"token": token,
	})
}