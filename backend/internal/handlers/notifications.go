package handlers

import (
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/personal-finance-management/backend/internal/middleware"
)

// NotificationHandler handles notification-related requests
type NotificationHandler struct{}

// NewNotificationHandler creates a new notification handler
func NewNotificationHandler() *NotificationHandler {
	return &NotificationHandler{}
}

// Notification represents a user notification
type Notification struct {
	ID        string    `json:"id"`
	UserID    string    `json:"user_id"`
	Type      string    `json:"type"`
	Title     string    `json:"title"`
	Message   string    `json:"message"`
	IsRead    bool      `json:"is_read"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// GetNotifications returns user notifications
func (h *NotificationHandler) GetNotifications(c *gin.Context) {
	userID, ok := middleware.GetUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	// Get limit parameter
	limitStr := c.DefaultQuery("limit", "20")
	limit, err := strconv.Atoi(limitStr)
	if err != nil || limit <= 0 {
		limit = 20
	}

	// In a real implementation, you would fetch from database
	// For now, return mock data
	notifications := []Notification{
		{
			ID:        "1",
			UserID:    userID,
			Type:      "budget_alert",
			Title:     "Budget Alert",
			Message:   "You've exceeded 80% of your monthly budget for groceries",
			IsRead:    false,
			CreatedAt: time.Now().Add(-2 * time.Hour),
			UpdatedAt: time.Now().Add(-2 * time.Hour),
		},
		{
			ID:        "2",
			UserID:    userID,
			Type:      "transaction_alert",
			Title:     "Large Transaction",
			Message:   "A transaction of $500 was recorded in your checking account",
			IsRead:    false,
			CreatedAt: time.Now().Add(-1 * time.Hour),
			UpdatedAt: time.Now().Add(-1 * time.Hour),
		},
		{
			ID:        "3",
			UserID:    userID,
			Type:      "goal_milestone",
			Title:     "Goal Achievement",
			Message:   "Congratulations! You've reached 75% of your emergency fund goal",
			IsRead:    true,
			CreatedAt: time.Now().Add(-24 * time.Hour),
			UpdatedAt: time.Now().Add(-23 * time.Hour),
		},
	}

	// Filter by limit
	if limit < len(notifications) {
		notifications = notifications[:limit]
	}

	c.JSON(http.StatusOK, gin.H{
		"notifications": notifications,
		"total":         len(notifications),
	})
}

// GetNotification returns a specific notification
func (h *NotificationHandler) GetNotification(c *gin.Context) {
	userID, ok := middleware.GetUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	notificationID := c.Param("id")
	if notificationID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Notification ID is required"})
		return
	}

	// In a real implementation, you would fetch from database
	// For now, return mock data
	notification := Notification{
		ID:        notificationID,
		UserID:    userID,
		Type:      "budget_alert",
		Title:     "Budget Alert",
		Message:   "You've exceeded 80% of your monthly budget for groceries",
		IsRead:    false,
		CreatedAt: time.Now().Add(-2 * time.Hour),
		UpdatedAt: time.Now().Add(-2 * time.Hour),
	}

	c.JSON(http.StatusOK, notification)
}

// UpdateNotificationRequest represents the request to update a notification
type UpdateNotificationRequest struct {
	IsRead *bool `json:"is_read"`
}

// UpdateNotification updates a notification (typically to mark as read)
func (h *NotificationHandler) UpdateNotification(c *gin.Context) {
	userID, ok := middleware.GetUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	notificationID := c.Param("id")
	if notificationID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Notification ID is required"})
		return
	}

	var req UpdateNotificationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// In a real implementation, you would update in database
	// For now, return success
	c.JSON(http.StatusOK, gin.H{
		"message": "Notification updated successfully",
		"notification": gin.H{
			"id":      notificationID,
			"user_id": userID,
			"is_read": req.IsRead,
		},
	})
}

// NotificationActionRequest represents bulk actions on notifications
type NotificationActionRequest struct {
	Action string `json:"action" binding:"required"`
}

// HandleNotificationActions handles bulk actions on notifications
func (h *NotificationHandler) HandleNotificationActions(c *gin.Context) {
	userID, ok := middleware.GetUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	var req NotificationActionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	switch req.Action {
	case "mark_all_read":
		// In a real implementation, you would update all user notifications in database
		c.JSON(http.StatusOK, gin.H{
			"message": "All notifications marked as read",
			"user_id": userID,
		})
	case "delete_all":
		// In a real implementation, you would delete all user notifications from database
		c.JSON(http.StatusOK, gin.H{
			"message": "All notifications deleted",
			"user_id": userID,
		})
	default:
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid action"})
	}
}

// DeleteNotification deletes a specific notification
func (h *NotificationHandler) DeleteNotification(c *gin.Context) {
	userID, ok := middleware.GetUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	notificationID := c.Param("id")
	if notificationID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Notification ID is required"})
		return
	}

	// In a real implementation, you would delete from database
	// For now, return success
	c.JSON(http.StatusOK, gin.H{
		"message": "Notification deleted successfully",
		"notification_id": notificationID,
		"user_id": userID,
	})
}