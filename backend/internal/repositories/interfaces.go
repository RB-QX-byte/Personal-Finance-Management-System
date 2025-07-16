package repositories

import (
	"context"
	"time"

	"github.com/personal-finance-management/backend/internal/models"
)

// UserRepository defines the interface for user data operations
type UserRepository interface {
	GetByID(ctx context.Context, id string) (*models.User, error)
	GetByEmail(ctx context.Context, email string) (*models.User, error)
	Create(ctx context.Context, user *models.User) error
	Update(ctx context.Context, user *models.User) error
}

// ProfileRepository defines the interface for profile data operations
type ProfileRepository interface {
	GetByUserID(ctx context.Context, userID string) (*models.Profile, error)
	Create(ctx context.Context, profile *models.Profile) error
	Update(ctx context.Context, profile *models.Profile) error
}

// AccountRepository defines the interface for account data operations
type AccountRepository interface {
	GetByUserID(ctx context.Context, userID string) ([]models.Account, error)
	GetByID(ctx context.Context, id string) (*models.Account, error)
	Create(ctx context.Context, account *models.Account) error
	Update(ctx context.Context, account *models.Account) error
	Delete(ctx context.Context, id string) error
}

// CategoryRepository defines the interface for category data operations
type CategoryRepository interface {
	GetByUserID(ctx context.Context, userID string) ([]models.Category, error)
	GetByID(ctx context.Context, id string) (*models.Category, error)
	Create(ctx context.Context, category *models.Category) error
	Update(ctx context.Context, category *models.Category) error
	Delete(ctx context.Context, id string) error
}

// TransactionRepository defines the interface for transaction data operations
type TransactionRepository interface {
	GetByUserID(ctx context.Context, userID string, limit, offset int) ([]models.Transaction, error)
	GetByID(ctx context.Context, id string) (*models.Transaction, error)
	GetByAccountID(ctx context.Context, accountID string, limit, offset int) ([]models.Transaction, error)
	GetByCategoryID(ctx context.Context, categoryID string, limit, offset int) ([]models.Transaction, error)
	GetByDateRange(ctx context.Context, userID string, startDate, endDate time.Time) ([]models.Transaction, error)
	Create(ctx context.Context, transaction *models.Transaction) error
	Update(ctx context.Context, transaction *models.Transaction) error
	Delete(ctx context.Context, id string) error
}

// BudgetRepository defines the interface for budget data operations
type BudgetRepository interface {
	GetByUserID(ctx context.Context, userID string) ([]models.Budget, error)
	GetByID(ctx context.Context, id string) (*models.Budget, error)
	GetByCategoryID(ctx context.Context, categoryID string) ([]models.Budget, error)
	Create(ctx context.Context, budget *models.Budget) error
	Update(ctx context.Context, budget *models.Budget) error
	Delete(ctx context.Context, id string) error
}

// GoalRepository defines the interface for goal data operations
type GoalRepository interface {
	GetByUserID(ctx context.Context, userID string) ([]models.Goal, error)
	GetByID(ctx context.Context, id string) (*models.Goal, error)
	Create(ctx context.Context, goal *models.Goal) error
	Update(ctx context.Context, goal *models.Goal) error
	Delete(ctx context.Context, id string) error
}

// ReportsRepository defines the interface for reporting operations
type ReportsRepository interface {
	GetMonthlySummary(ctx context.Context, userID string, month, year int) (*models.MonthlySummary, error)
	GetSpendingTrends(ctx context.Context, userID string, categoryID *string, months int) (*models.SpendingTrends, error)
	GetCashFlow(ctx context.Context, userID string, startDate, endDate time.Time) (*models.CashFlow, error)
}