package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/rs/cors"

	"github.com/personal-finance-management/backend/internal/config"
	"github.com/personal-finance-management/backend/internal/handlers"
	"github.com/personal-finance-management/backend/internal/middleware"
	"github.com/personal-finance-management/backend/internal/services"
)

func main() {
	cfg := config.Load()

	// Set Gin mode
	gin.SetMode(cfg.GinMode)

	// Initialize database service (optional, only if DATABASE_URL is provided)
	var dbService *services.DatabaseService
	if cfg.DatabaseURL != "" {
		var err error
		dbService, err = services.NewDatabaseService(cfg)
		if err != nil {
			log.Printf("Warning: Failed to initialize database service: %v", err)
		} else {
			defer dbService.Close()
		}
	}

	// Initialize Gin router
	r := gin.New()

	// Add middleware
	r.Use(gin.Logger())
	r.Use(gin.Recovery())

	// Setup CORS
	c := cors.New(cors.Options{
		AllowedOrigins:   cfg.CORSAllowedOrigins,
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"*"},
		ExposedHeaders:   []string{"*"},
		AllowCredentials: true,
		MaxAge:           int(12 * time.Hour / time.Second),
	})

	// Add CORS middleware
	r.Use(func(c *gin.Context) {
		c.Header("Access-Control-Allow-Origin", "*")
		c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Content-Type, Authorization")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	})

	// Health check endpoint
	r.GET("/health", handlers.HealthCheck)

	// Database test endpoint (only if database service is available)
	if dbService != nil {
		r.GET("/db-test", handlers.DatabaseTest(dbService))
	}

	// Initialize authentication middleware
	authMiddleware := middleware.NewAuthMiddleware(cfg)

	// Initialize handlers
	var reportsHandler *handlers.ReportsHandler
	var goalsHandler *handlers.GoalsHandler
	if dbService != nil {
		reportsHandler = handlers.NewReportsHandler(dbService)
		goalsHandler = handlers.NewGoalsHandler(dbService)
	}

	// API routes group
	api := r.Group("/api")
	{
		// Health check for API
		api.GET("/health", handlers.HealthCheck)

		// Protected routes group
		protected := api.Group("/")
		protected.Use(authMiddleware.RequireAuth())
		{
			// Reports endpoints
			if reportsHandler != nil {
				reports := protected.Group("/reports")
				{
					reports.GET("/monthly-summary", reportsHandler.GetMonthlySummary)
					reports.GET("/spending-trends", reportsHandler.GetSpendingTrends)
					reports.GET("/cash-flow", reportsHandler.GetCashFlow)
					reports.GET("/summary", reportsHandler.GetReportSummary)
					reports.GET("/budget-performance", reportsHandler.GetBudgetPerformance)
				}
			}

			// Goals endpoints
			if goalsHandler != nil {
				goals := protected.Group("/goals")
				{
					goals.GET("/", goalsHandler.GetGoals)
					goals.POST("/", goalsHandler.CreateGoal)
					goals.GET("/:id", goalsHandler.GetGoal)
					goals.PUT("/:id", goalsHandler.UpdateGoal)
					goals.DELETE("/:id", goalsHandler.DeleteGoal)
					goals.GET("/:id/progress", goalsHandler.GetGoalProgress)
					goals.PATCH("/:id/progress", goalsHandler.UpdateGoalProgress)
				}
			}
		}
	}

	// Create HTTP server
	server := &http.Server{
		Addr:    cfg.Port,
		Handler: c.Handler(r),
	}

	// Start server in a goroutine
	go func() {
		log.Printf("Server starting on port %s", cfg.Port)
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Server failed to start: %v", err)
		}
	}()

	// Wait for interrupt signal to gracefully shutdown
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	log.Println("Shutting down server...")

	// Give the server 5 seconds to finish current requests
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := server.Shutdown(ctx); err != nil {
		log.Fatalf("Server forced to shutdown: %v", err)
	}

	log.Println("Server exited")
}