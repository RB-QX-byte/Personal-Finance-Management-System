package handlers

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/personal-finance-management/backend/internal/services"
)

type DatabaseTestResponse struct {
	Success   bool      `json:"success"`
	Message   string    `json:"message"`
	Timestamp time.Time `json:"timestamp"`
}

func DatabaseTest(dbService *services.DatabaseService) gin.HandlerFunc {
	return func(c *gin.Context) {
		ctx := c.Request.Context()
		
		// Test database connection
		connected, err := dbService.TestConnection(ctx)
		if err != nil {
			response := DatabaseTestResponse{
				Success:   false,
				Message:   "Database connection failed: " + err.Error(),
				Timestamp: time.Now(),
			}
			
			c.JSON(http.StatusInternalServerError, response)
			return
		}

		response := DatabaseTestResponse{
			Success:   connected,
			Message:   "Database connection successful",
			Timestamp: time.Now(),
		}

		c.JSON(http.StatusOK, response)
	}
}