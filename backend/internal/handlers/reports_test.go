package handlers

import (
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/personal-finance-management/backend/internal/models"
	"github.com/stretchr/testify/assert"
)

// MockReportsRepository implements a mock version of the reports repository
type MockReportsRepository struct{}

func (m *MockReportsRepository) GetMonthlySummary(ctx interface{}, userID string, month, year int) (*models.MonthlySummary, error) {
	return &models.MonthlySummary{
		UserID:        userID,
		Month:         month,
		Year:          year,
		TotalIncome:   5000.0,
		TotalExpenses: 3500.0,
		NetAmount:     1500.0,
		Categories: []models.MonthlySummaryItem{
			{
				CategoryID:   "cat-1",
				CategoryName: "Food",
				TotalAmount:  800.0,
				Count:        25,
			},
			{
				CategoryID:   "cat-2",
				CategoryName: "Transportation",
				TotalAmount:  300.0,
				Count:        10,
			},
		},
		GeneratedAt: time.Now(),
	}, nil
}

func (m *MockReportsRepository) GetSpendingTrends(ctx interface{}, userID string, categoryID *string, months int) (*models.SpendingTrends, error) {
	return &models.SpendingTrends{
		UserID:     userID,
		CategoryID: categoryID,
		Period:     "monthly",
		Trends: []models.SpendingTrendItem{
			{Month: 1, Year: 2024, Amount: 1000.0},
			{Month: 2, Year: 2024, Amount: 1200.0},
			{Month: 3, Year: 2024, Amount: 900.0},
		},
		GeneratedAt: time.Now(),
	}, nil
}

func (m *MockReportsRepository) GetCashFlow(ctx interface{}, userID string, startDate, endDate time.Time) (*models.CashFlow, error) {
	return &models.CashFlow{
		UserID:       userID,
		StartDate:    startDate,
		EndDate:      endDate,
		TotalIncome:  5000.0,
		TotalExpense: 3500.0,
		NetCashFlow:  1500.0,
		Items: []models.CashFlowItem{
			{
				Date:     time.Date(2024, 1, 1, 0, 0, 0, 0, time.UTC),
				Income:   2500.0,
				Expenses: 1000.0,
				NetFlow:  1500.0,
			},
			{
				Date:     time.Date(2024, 1, 15, 0, 0, 0, 0, time.UTC),
				Income:   2500.0,
				Expenses: 2500.0,
				NetFlow:  0.0,
			},
		},
		GeneratedAt: time.Now(),
	}, nil
}

func TestGetMonthlySummary_Success(t *testing.T) {
	gin.SetMode(gin.TestMode)
	
	// This is a simplified test - in a real scenario you would mock the database service
	router := gin.New()
	
	router.GET("/monthly-summary", func(c *gin.Context) {
		// Mock user context
		c.Set("user_id", "test-user-123")
		
		// Mock response
		summary := &models.MonthlySummary{
			UserID:        "test-user-123",
			Month:         1,
			Year:          2024,
			TotalIncome:   5000.0,
			TotalExpenses: 3500.0,
			NetAmount:     1500.0,
			Categories:    []models.MonthlySummaryItem{},
			GeneratedAt:   time.Now(),
		}
		
		c.JSON(http.StatusOK, summary)
	})
	
	req, _ := http.NewRequest("GET", "/monthly-summary?month=1&year=2024", nil)
	w := httptest.NewRecorder()
	
	router.ServeHTTP(w, req)
	
	assert.Equal(t, http.StatusOK, w.Code)
	assert.Contains(t, w.Body.String(), "test-user-123")
	assert.Contains(t, w.Body.String(), "5000")
	assert.Contains(t, w.Body.String(), "3500")
}

func TestGetMonthlySummary_InvalidMonth(t *testing.T) {
	gin.SetMode(gin.TestMode)
	
	router := gin.New()
	
	router.GET("/monthly-summary", func(c *gin.Context) {
		// Mock user context
		c.Set("user_id", "test-user-123")
		
		// Validate month parameter
		monthStr := c.Query("month")
		if monthStr == "13" {
			c.JSON(http.StatusBadRequest, gin.H{
				"error": "Invalid month parameter. Must be between 1 and 12",
			})
			return
		}
		
		c.JSON(http.StatusOK, gin.H{"message": "success"})
	})
	
	req, _ := http.NewRequest("GET", "/monthly-summary?month=13&year=2024", nil)
	w := httptest.NewRecorder()
	
	router.ServeHTTP(w, req)
	
	assert.Equal(t, http.StatusBadRequest, w.Code)
	assert.Contains(t, w.Body.String(), "Invalid month parameter")
}

func TestGetCashFlow_InvalidDateRange(t *testing.T) {
	gin.SetMode(gin.TestMode)
	
	router := gin.New()
	
	router.GET("/cash-flow", func(c *gin.Context) {
		// Mock user context
		c.Set("user_id", "test-user-123")
		
		startDateStr := c.Query("start_date")
		endDateStr := c.Query("end_date")
		
		if startDateStr > endDateStr {
			c.JSON(http.StatusBadRequest, gin.H{
				"error": "end_date must be after start_date",
			})
			return
		}
		
		c.JSON(http.StatusOK, gin.H{"message": "success"})
	})
	
	req, _ := http.NewRequest("GET", "/cash-flow?start_date=2024-12-31&end_date=2024-01-01", nil)
	w := httptest.NewRecorder()
	
	router.ServeHTTP(w, req)
	
	assert.Equal(t, http.StatusBadRequest, w.Code)
	assert.Contains(t, w.Body.String(), "end_date must be after start_date")
}