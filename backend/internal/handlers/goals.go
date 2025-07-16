package handlers

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/personal-finance-management/backend/internal/middleware"
	"github.com/personal-finance-management/backend/internal/models"
	"github.com/personal-finance-management/backend/internal/services"
)

// GoalsHandler handles goal-related HTTP requests
type GoalsHandler struct {
	dbService *services.DatabaseService
}

// NewGoalsHandler creates a new goals handler
func NewGoalsHandler(dbService *services.DatabaseService) *GoalsHandler {
	return &GoalsHandler{
		dbService: dbService,
	}
}

// GetGoals handles GET /api/goals
func (h *GoalsHandler) GetGoals(c *gin.Context) {
	userID := middleware.MustGetUserID(c)

	goals, err := h.dbService.Repositories.GetGoalsByUserID(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to get goals",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"goals": goals,
	})
}

// GetGoal handles GET /api/goals/:id
func (h *GoalsHandler) GetGoal(c *gin.Context) {
	userID := middleware.MustGetUserID(c)
	goalID := c.Param("id")

	goal, err := h.dbService.Repositories.GetGoalByID(c.Request.Context(), goalID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "Goal not found",
		})
		return
	}

	// Ensure the goal belongs to the authenticated user
	if goal.UserID != userID {
		c.JSON(http.StatusForbidden, gin.H{
			"error": "Access denied",
		})
		return
	}

	c.JSON(http.StatusOK, goal)
}

// CreateGoalRequest represents the request body for creating a goal
type CreateGoalRequest struct {
	Name         string  `json:"name" binding:"required"`
	Description  *string `json:"description"`
	TargetAmount float64 `json:"target_amount" binding:"required,gt=0"`
	TargetDate   *string `json:"target_date"` // ISO date string
}

// CreateGoal handles POST /api/goals
func (h *GoalsHandler) CreateGoal(c *gin.Context) {
	userID := middleware.MustGetUserID(c)

	var req CreateGoalRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid request body",
			"details": err.Error(),
		})
		return
	}

	// Parse target date if provided
	var targetDate *time.Time
	if req.TargetDate != nil && *req.TargetDate != "" {
		parsed, err := time.Parse("2006-01-02", *req.TargetDate)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"error": "Invalid target_date format. Use YYYY-MM-DD",
			})
			return
		}
		targetDate = &parsed
	}

	goal := &models.Goal{
		UserID:        userID,
		Name:          req.Name,
		Description:   req.Description,
		TargetAmount:  req.TargetAmount,
		CurrentAmount: 0.0, // Start with 0
		TargetDate:    targetDate,
	}

	err := h.dbService.Repositories.CreateGoal(c.Request.Context(), goal)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to create goal",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, goal)
}

// UpdateGoalRequest represents the request body for updating a goal
type UpdateGoalRequest struct {
	Name          *string  `json:"name"`
	Description   *string  `json:"description"`
	TargetAmount  *float64 `json:"target_amount"`
	CurrentAmount *float64 `json:"current_amount"`
	TargetDate    *string  `json:"target_date"` // ISO date string
	IsCompleted   *bool    `json:"is_completed"`
}

// UpdateGoal handles PUT /api/goals/:id
func (h *GoalsHandler) UpdateGoal(c *gin.Context) {
	userID := middleware.MustGetUserID(c)
	goalID := c.Param("id")

	var req UpdateGoalRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid request body",
			"details": err.Error(),
		})
		return
	}

	// Get existing goal
	goal, err := h.dbService.Repositories.GetGoalByID(c.Request.Context(), goalID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "Goal not found",
		})
		return
	}

	// Ensure the goal belongs to the authenticated user
	if goal.UserID != userID {
		c.JSON(http.StatusForbidden, gin.H{
			"error": "Access denied",
		})
		return
	}

	// Update fields if provided
	if req.Name != nil {
		goal.Name = *req.Name
	}
	if req.Description != nil {
		goal.Description = req.Description
	}
	if req.TargetAmount != nil {
		if *req.TargetAmount <= 0 {
			c.JSON(http.StatusBadRequest, gin.H{
				"error": "Target amount must be greater than 0",
			})
			return
		}
		goal.TargetAmount = *req.TargetAmount
	}
	if req.CurrentAmount != nil {
		if *req.CurrentAmount < 0 {
			c.JSON(http.StatusBadRequest, gin.H{
				"error": "Current amount cannot be negative",
			})
			return
		}
		goal.CurrentAmount = *req.CurrentAmount
	}
	if req.TargetDate != nil {
		if *req.TargetDate == "" {
			goal.TargetDate = nil
		} else {
			parsed, err := time.Parse("2006-01-02", *req.TargetDate)
			if err != nil {
				c.JSON(http.StatusBadRequest, gin.H{
					"error": "Invalid target_date format. Use YYYY-MM-DD",
				})
				return
			}
			goal.TargetDate = &parsed
		}
	}
	if req.IsCompleted != nil {
		goal.IsCompleted = *req.IsCompleted
	}

	err = h.dbService.Repositories.UpdateGoal(c.Request.Context(), goal)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to update goal",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, goal)
}

// DeleteGoal handles DELETE /api/goals/:id
func (h *GoalsHandler) DeleteGoal(c *gin.Context) {
	userID := middleware.MustGetUserID(c)
	goalID := c.Param("id")

	// Get existing goal to verify ownership
	goal, err := h.dbService.Repositories.GetGoalByID(c.Request.Context(), goalID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "Goal not found",
		})
		return
	}

	// Ensure the goal belongs to the authenticated user
	if goal.UserID != userID {
		c.JSON(http.StatusForbidden, gin.H{
			"error": "Access denied",
		})
		return
	}

	err = h.dbService.Repositories.DeleteGoal(c.Request.Context(), goalID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to delete goal",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Goal deleted successfully",
	})
}

// GetGoalProgress handles GET /api/goals/:id/progress
func (h *GoalsHandler) GetGoalProgress(c *gin.Context) {
	userID := middleware.MustGetUserID(c)
	goalID := c.Param("id")

	goal, err := h.dbService.Repositories.GetGoalByID(c.Request.Context(), goalID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "Goal not found",
		})
		return
	}

	// Ensure the goal belongs to the authenticated user
	if goal.UserID != userID {
		c.JSON(http.StatusForbidden, gin.H{
			"error": "Access denied",
		})
		return
	}

	// Calculate progress metrics
	progressPercentage := (goal.CurrentAmount / goal.TargetAmount) * 100
	remaining := goal.TargetAmount - goal.CurrentAmount

	var daysRemaining *int
	if goal.TargetDate != nil {
		days := int(time.Until(*goal.TargetDate).Hours() / 24)
		if days >= 0 {
			daysRemaining = &days
		}
	}

	progress := gin.H{
		"goal_id":             goal.ID,
		"name":                goal.Name,
		"target_amount":       goal.TargetAmount,
		"current_amount":      goal.CurrentAmount,
		"progress_percentage": progressPercentage,
		"remaining_amount":    remaining,
		"is_completed":        goal.IsCompleted,
		"target_date":         goal.TargetDate,
		"days_remaining":      daysRemaining,
		"status": func() string {
			if goal.IsCompleted {
				return "completed"
			}
			if progressPercentage >= 100 {
				return "target_reached"
			}
			if progressPercentage >= 75 {
				return "on_track"
			}
			if progressPercentage >= 25 {
				return "making_progress"
			}
			return "just_started"
		}(),
	}

	c.JSON(http.StatusOK, progress)
}

// UpdateGoalProgress handles PATCH /api/goals/:id/progress
func (h *GoalsHandler) UpdateGoalProgress(c *gin.Context) {
	userID := middleware.MustGetUserID(c)
	goalID := c.Param("id")

	type ProgressUpdateRequest struct {
		Amount      *float64 `json:"amount" binding:"required"`
		SetAbsolute *bool    `json:"set_absolute"` // If true, set to absolute value, otherwise add to current
	}

	var req ProgressUpdateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid request body",
			"details": err.Error(),
		})
		return
	}

	goal, err := h.dbService.Repositories.GetGoalByID(c.Request.Context(), goalID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "Goal not found",
		})
		return
	}

	// Ensure the goal belongs to the authenticated user
	if goal.UserID != userID {
		c.JSON(http.StatusForbidden, gin.H{
			"error": "Access denied",
		})
		return
	}

	// Update current amount
	if req.SetAbsolute != nil && *req.SetAbsolute {
		goal.CurrentAmount = *req.Amount
	} else {
		goal.CurrentAmount += *req.Amount
	}

	// Ensure current amount is not negative
	if goal.CurrentAmount < 0 {
		goal.CurrentAmount = 0
	}

	// Mark as completed if target reached
	if goal.CurrentAmount >= goal.TargetAmount {
		goal.IsCompleted = true
	}

	err = h.dbService.Repositories.UpdateGoal(c.Request.Context(), goal)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to update goal progress",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, goal)
}
