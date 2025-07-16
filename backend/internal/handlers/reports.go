package handlers

import (
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/personal-finance-management/backend/internal/middleware"
	"github.com/personal-finance-management/backend/internal/services"
)

// ReportsHandler handles report-related HTTP requests
type ReportsHandler struct {
	dbService *services.DatabaseService
}

// NewReportsHandler creates a new reports handler
func NewReportsHandler(dbService *services.DatabaseService) *ReportsHandler {
	return &ReportsHandler{
		dbService: dbService,
	}
}

// GetMonthlySummary handles GET /api/reports/monthly-summary
func (h *ReportsHandler) GetMonthlySummary(c *gin.Context) {
	userID := middleware.MustGetUserID(c)

	// Parse query parameters
	monthStr := c.DefaultQuery("month", strconv.Itoa(int(time.Now().Month())))
	yearStr := c.DefaultQuery("year", strconv.Itoa(time.Now().Year()))

	month, err := strconv.Atoi(monthStr)
	if err != nil || month < 1 || month > 12 {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid month parameter. Must be between 1 and 12",
		})
		return
	}

	year, err := strconv.Atoi(yearStr)
	if err != nil || year < 1900 || year > 2100 {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid year parameter. Must be between 1900 and 2100",
		})
		return
	}

	// Get the monthly summary
	summary, err := h.dbService.Repositories.GetMonthlySummary(c.Request.Context(), userID, month, year)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to generate monthly summary",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, summary)
}

// GetSpendingTrends handles GET /api/reports/spending-trends
func (h *ReportsHandler) GetSpendingTrends(c *gin.Context) {
	userID := middleware.MustGetUserID(c)

	// Parse query parameters
	monthsStr := c.DefaultQuery("months", "12")
	categoryID := c.Query("category_id")

	months, err := strconv.Atoi(monthsStr)
	if err != nil || months < 1 || months > 60 {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid months parameter. Must be between 1 and 60",
		})
		return
	}

	var categoryPtr *string
	if categoryID != "" {
		categoryPtr = &categoryID
	}

	// Get spending trends
	trends, err := h.dbService.Repositories.GetSpendingTrends(c.Request.Context(), userID, categoryPtr, months)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to generate spending trends",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, trends)
}

// GetCashFlow handles GET /api/reports/cash-flow
func (h *ReportsHandler) GetCashFlow(c *gin.Context) {
	userID := middleware.MustGetUserID(c)

	// Parse query parameters
	startDateStr := c.Query("start_date")
	endDateStr := c.Query("end_date")

	// Default to current month if no dates provided
	now := time.Now()
	defaultStart := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, time.UTC)
	defaultEnd := defaultStart.AddDate(0, 1, 0).Add(-time.Second)

	var startDate, endDate time.Time
	var err error

	if startDateStr != "" {
		startDate, err = time.Parse("2006-01-02", startDateStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"error": "Invalid start_date format. Use YYYY-MM-DD",
			})
			return
		}
	} else {
		startDate = defaultStart
	}

	if endDateStr != "" {
		endDate, err = time.Parse("2006-01-02", endDateStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"error": "Invalid end_date format. Use YYYY-MM-DD",
			})
			return
		}
	} else {
		endDate = defaultEnd
	}

	// Validate date range
	if endDate.Before(startDate) {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "end_date must be after start_date",
		})
		return
	}

	// Limit the date range to prevent excessive queries
	if endDate.Sub(startDate) > 365*24*time.Hour {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Date range cannot exceed 365 days",
		})
		return
	}

	// Get cash flow data
	cashFlow, err := h.dbService.Repositories.GetCashFlow(c.Request.Context(), userID, startDate, endDate)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to generate cash flow report",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, cashFlow)
}

// GetReportSummary handles GET /api/reports/summary
func (h *ReportsHandler) GetReportSummary(c *gin.Context) {
	userID := middleware.MustGetUserID(c)

	// Get current month summary
	now := time.Now()
	currentMonth := int(now.Month())
	currentYear := now.Year()

	monthlySummary, err := h.dbService.Repositories.GetMonthlySummary(c.Request.Context(), userID, currentMonth, currentYear)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to generate report summary",
			"details": err.Error(),
		})
		return
	}

	// Get spending trends for last 6 months
	trends, err := h.dbService.Repositories.GetSpendingTrends(c.Request.Context(), userID, nil, 6)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to get spending trends",
			"details": err.Error(),
		})
		return
	}

	// Get cash flow for current month
	startOfMonth := time.Date(currentYear, time.Month(currentMonth), 1, 0, 0, 0, 0, time.UTC)
	endOfMonth := startOfMonth.AddDate(0, 1, 0).Add(-time.Second)

	cashFlow, err := h.dbService.Repositories.GetCashFlow(c.Request.Context(), userID, startOfMonth, endOfMonth)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to get cash flow",
			"details": err.Error(),
		})
		return
	}

	// Create summary response
	summary := gin.H{
		"user_id":         userID,
		"generated_at":    time.Now(),
		"current_month":   monthlySummary,
		"spending_trends": trends,
		"cash_flow":       cashFlow,
	}

	c.JSON(http.StatusOK, summary)
}

// GetBudgetPerformance handles GET /api/reports/budget-performance
func (h *ReportsHandler) GetBudgetPerformance(c *gin.Context) {
	userID := middleware.MustGetUserID(c)

	// Parse query parameters
	monthStr := c.DefaultQuery("month", strconv.Itoa(int(time.Now().Month())))
	yearStr := c.DefaultQuery("year", strconv.Itoa(time.Now().Year()))

	month, err := strconv.Atoi(monthStr)
	if err != nil || month < 1 || month > 12 {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid month parameter. Must be between 1 and 12",
		})
		return
	}

	year, err := strconv.Atoi(yearStr)
	if err != nil || year < 1900 || year > 2100 {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid year parameter. Must be between 1900 and 2100",
		})
		return
	}

	// Calculate date range for the month
	startDate := time.Date(year, time.Month(month), 1, 0, 0, 0, 0, time.UTC)
	endDate := startDate.AddDate(0, 1, 0).Add(-time.Second)

	// Get all active budgets
	budgets, err := h.dbService.Repositories.GetBudgetsByUserID(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to get budgets",
			"details": err.Error(),
		})
		return
	}

	// Calculate performance for each budget
	var budgetPerformance []gin.H
	totalBudgeted := 0.0
	totalSpent := 0.0
	overBudgetCount := 0

	for _, budget := range budgets {
		// Get transactions for this budget's category in the date range
		transactions, err := h.dbService.Repositories.GetTransactionsByDateRange(c.Request.Context(), userID, startDate, endDate)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error":   "Failed to get transactions",
				"details": err.Error(),
			})
			return
		}

		// Calculate spending for this category
		categorySpending := 0.0
		for _, transaction := range transactions {
			if transaction.CategoryID != nil && *transaction.CategoryID == budget.CategoryID && transaction.TransactionType == "expense" {
				categorySpending += transaction.Amount
			}
		}

		// Calculate performance metrics
		budgetAmount := budget.Amount
		remaining := budgetAmount - categorySpending
		percentageUsed := (categorySpending / budgetAmount) * 100
		isOverBudget := categorySpending > budgetAmount

		if isOverBudget {
			overBudgetCount++
		}

		totalBudgeted += budgetAmount
		totalSpent += categorySpending

		// Determine status
		status := "under_budget"
		if isOverBudget {
			status = "over_budget"
		} else if percentageUsed >= 80 {
			status = "at_risk"
		}

		budgetPerformance = append(budgetPerformance, gin.H{
			"budget_id":       budget.ID,
			"budget_name":     budget.Name,
			"category_id":     budget.CategoryID,
			"budgeted_amount": budgetAmount,
			"spent_amount":    categorySpending,
			"remaining":       remaining,
			"percentage_used": percentageUsed,
			"status":          status,
			"is_over_budget":  isOverBudget,
			"period":          budget.Period,
		})
	}

	// Calculate overall performance
	overallPerformance := gin.H{
		"total_budgeted":     totalBudgeted,
		"total_spent":        totalSpent,
		"total_remaining":    totalBudgeted - totalSpent,
		"overall_percentage": (totalSpent / totalBudgeted) * 100,
		"budgets_count":      len(budgets),
		"over_budget_count":  overBudgetCount,
		"on_track_count":     len(budgets) - overBudgetCount,
	}

	response := gin.H{
		"user_id":             userID,
		"month":               month,
		"year":                year,
		"budget_performance":  budgetPerformance,
		"overall_performance": overallPerformance,
		"generated_at":        time.Now(),
	}

	c.JSON(http.StatusOK, response)
}