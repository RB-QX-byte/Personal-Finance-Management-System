package models

import (
	"time"
)

// User represents the auth.users table
type User struct {
	ID       string    `json:"id" db:"id"`
	Email    string    `json:"email" db:"email"`
	Password string    `json:"-" db:"password"` // Never expose in JSON
	Created  time.Time `json:"created_at" db:"created_at"`
	Updated  time.Time `json:"updated_at" db:"updated_at"`
}

// Profile represents the public.profiles table
type Profile struct {
	ID                 string    `json:"id" db:"id"`
	FullName           string    `json:"full_name" db:"full_name"`
	CurrencyPreference string    `json:"currency_preference" db:"currency_preference"`
	CreatedAt          time.Time `json:"created_at" db:"created_at"`
	UpdatedAt          time.Time `json:"updated_at" db:"updated_at"`
}

// AccountType enum
type AccountType string

const (
	AccountTypeChecking   AccountType = "checking"
	AccountTypeSavings    AccountType = "savings"
	AccountTypeCreditCard AccountType = "credit_card"
	AccountTypeInvestment AccountType = "investment"
	AccountTypeLoan       AccountType = "loan"
	AccountTypeOther      AccountType = "other"
)

// Account represents the public.accounts table
type Account struct {
	ID          string      `json:"id" db:"id"`
	UserID      string      `json:"user_id" db:"user_id"`
	Name        string      `json:"name" db:"name"`
	AccountType AccountType `json:"account_type" db:"account_type"`
	Balance     float64     `json:"balance" db:"balance"`
	Description *string     `json:"description,omitempty" db:"description"`
	IsActive    bool        `json:"is_active" db:"is_active"`
	CreatedAt   time.Time   `json:"created_at" db:"created_at"`
	UpdatedAt   time.Time   `json:"updated_at" db:"updated_at"`
}

// Category represents the public.categories table
type Category struct {
	ID          string    `json:"id" db:"id"`
	UserID      string    `json:"user_id" db:"user_id"`
	Name        string    `json:"name" db:"name"`
	Description *string   `json:"description,omitempty" db:"description"`
	Color       string    `json:"color" db:"color"`
	Icon        *string   `json:"icon,omitempty" db:"icon"`
	IsActive    bool      `json:"is_active" db:"is_active"`
	CreatedAt   time.Time `json:"created_at" db:"created_at"`
	UpdatedAt   time.Time `json:"updated_at" db:"updated_at"`
}

// TransactionType enum
type TransactionType string

const (
	TransactionTypeIncome   TransactionType = "income"
	TransactionTypeExpense  TransactionType = "expense"
	TransactionTypeTransfer TransactionType = "transfer"
)

// Transaction represents the public.transactions table
type Transaction struct {
	ID              string          `json:"id" db:"id"`
	UserID          string          `json:"user_id" db:"user_id"`
	AccountID       string          `json:"account_id" db:"account_id"`
	CategoryID      *string         `json:"category_id,omitempty" db:"category_id"`
	Amount          float64         `json:"amount" db:"amount"`
	TransactionType TransactionType `json:"transaction_type" db:"transaction_type"`
	Description     *string         `json:"description,omitempty" db:"description"`
	TransactionDate time.Time       `json:"transaction_date" db:"transaction_date"`
	Notes           *string         `json:"notes,omitempty" db:"notes"`
	TransferID      *string         `json:"transfer_id,omitempty" db:"transfer_id"`
	CreatedAt       time.Time       `json:"created_at" db:"created_at"`
	UpdatedAt       time.Time       `json:"updated_at" db:"updated_at"`

	// Joined fields from related tables
	Account  *Account  `json:"account,omitempty"`
	Category *Category `json:"category,omitempty"`
}

// BudgetPeriod enum
type BudgetPeriod string

const (
	BudgetPeriodWeekly    BudgetPeriod = "weekly"
	BudgetPeriodMonthly   BudgetPeriod = "monthly"
	BudgetPeriodQuarterly BudgetPeriod = "quarterly"
	BudgetPeriodYearly    BudgetPeriod = "yearly"
)

// Budget represents the public.budgets table
type Budget struct {
	ID          string       `json:"id" db:"id"`
	UserID      string       `json:"user_id" db:"user_id"`
	CategoryID  string       `json:"category_id" db:"category_id"`
	Name        string       `json:"name" db:"name"`
	Amount      float64      `json:"amount" db:"amount"`
	Period      BudgetPeriod `json:"period" db:"period"`
	StartDate   time.Time    `json:"start_date" db:"start_date"`
	EndDate     *time.Time   `json:"end_date,omitempty" db:"end_date"`
	Description *string      `json:"description,omitempty" db:"description"`
	IsActive    bool         `json:"is_active" db:"is_active"`
	CreatedAt   time.Time    `json:"created_at" db:"created_at"`
	UpdatedAt   time.Time    `json:"updated_at" db:"updated_at"`

	// Joined fields
	Category *Category `json:"category,omitempty"`
}

// Goal represents the public.goals table
type Goal struct {
	ID            string     `json:"id" db:"id"`
	UserID        string     `json:"user_id" db:"user_id"`
	Name          string     `json:"name" db:"name"`
	Description   *string    `json:"description,omitempty" db:"description"`
	TargetAmount  float64    `json:"target_amount" db:"target_amount"`
	CurrentAmount float64    `json:"current_amount" db:"current_amount"`
	TargetDate    *time.Time `json:"target_date,omitempty" db:"target_date"`
	IsCompleted   bool       `json:"is_completed" db:"is_completed"`
	IsActive      bool       `json:"is_active" db:"is_active"`
	CreatedAt     time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt     time.Time  `json:"updated_at" db:"updated_at"`
}

// MonthlySummaryItem represents an item in the monthly spending summary
type MonthlySummaryItem struct {
	CategoryID   string  `json:"category_id" db:"category_id"`
	CategoryName string  `json:"category_name" db:"category_name"`
	TotalAmount  float64 `json:"total_amount" db:"total_amount"`
	Count        int     `json:"count" db:"count"`
}

// MonthlySummary represents the monthly spending summary response
type MonthlySummary struct {
	UserID        string               `json:"user_id"`
	Month         int                  `json:"month"`
	Year          int                  `json:"year"`
	TotalIncome   float64              `json:"total_income"`
	TotalExpenses float64              `json:"total_expenses"`
	NetAmount     float64              `json:"net_amount"`
	Categories    []MonthlySummaryItem `json:"categories"`
	GeneratedAt   time.Time            `json:"generated_at"`
}

// SpendingTrendItem represents a single point in spending trends
type SpendingTrendItem struct {
	Month  int     `json:"month" db:"month"`
	Year   int     `json:"year" db:"year"`
	Amount float64 `json:"amount" db:"amount"`
}

// SpendingTrends represents spending trends over time
type SpendingTrends struct {
	UserID      string              `json:"user_id"`
	CategoryID  *string             `json:"category_id,omitempty"`
	Period      string              `json:"period"` // "monthly", "quarterly", "yearly"
	Trends      []SpendingTrendItem `json:"trends"`
	GeneratedAt time.Time           `json:"generated_at"`
}

// CashFlowItem represents a cash flow entry
type CashFlowItem struct {
	Date     time.Time `json:"date" db:"date"`
	Income   float64   `json:"income" db:"income"`
	Expenses float64   `json:"expenses" db:"expenses"`
	NetFlow  float64   `json:"net_flow" db:"net_flow"`
}

// CashFlow represents cash flow analysis
type CashFlow struct {
	UserID      string         `json:"user_id"`
	StartDate   time.Time      `json:"start_date"`
	EndDate     time.Time      `json:"end_date"`
	Items       []CashFlowItem `json:"items"`
	TotalIncome float64        `json:"total_income"`
	TotalExpense float64       `json:"total_expense"`
	NetCashFlow float64        `json:"net_cash_flow"`
	GeneratedAt time.Time      `json:"generated_at"`
}