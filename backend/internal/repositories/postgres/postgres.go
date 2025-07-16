package postgres

import (
	"context"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/personal-finance-management/backend/internal/models"
	"github.com/personal-finance-management/backend/internal/repositories"
)

// PostgresRepositories implements all repository interfaces
type PostgresRepositories struct {
	pool *pgxpool.Pool
}

// NewPostgresRepositories creates a new instance of PostgresRepositories
func NewPostgresRepositories(pool *pgxpool.Pool) *PostgresRepositories {
	return &PostgresRepositories{pool: pool}
}

// User Repository Implementation
func (r *PostgresRepositories) GetUserByID(ctx context.Context, id string) (*models.User, error) {
	query := `SELECT id, email, created_at, updated_at FROM auth.users WHERE id = $1`

	user := &models.User{}
	err := r.pool.QueryRow(ctx, query, id).Scan(
		&user.ID,
		&user.Email,
		&user.Created,
		&user.Updated,
	)

	if err != nil {
		return nil, fmt.Errorf("failed to get user by ID: %w", err)
	}

	return user, nil
}

func (r *PostgresRepositories) GetUserByEmail(ctx context.Context, email string) (*models.User, error) {
	query := `SELECT id, email, created_at, updated_at FROM auth.users WHERE email = $1`

	user := &models.User{}
	err := r.pool.QueryRow(ctx, query, email).Scan(
		&user.ID,
		&user.Email,
		&user.Created,
		&user.Updated,
	)

	if err != nil {
		return nil, fmt.Errorf("failed to get user by email: %w", err)
	}

	return user, nil
}

// Profile Repository Implementation
func (r *PostgresRepositories) GetProfileByUserID(ctx context.Context, userID string) (*models.Profile, error) {
	query := `SELECT id, full_name, currency_preference, created_at, updated_at 
	         FROM public.profiles WHERE id = $1`

	profile := &models.Profile{}
	err := r.pool.QueryRow(ctx, query, userID).Scan(
		&profile.ID,
		&profile.FullName,
		&profile.CurrencyPreference,
		&profile.CreatedAt,
		&profile.UpdatedAt,
	)

	if err != nil {
		return nil, fmt.Errorf("failed to get profile by user ID: %w", err)
	}

	return profile, nil
}

// Budget Repository Implementation
func (r *PostgresRepositories) GetBudgetsByUserID(ctx context.Context, userID string) ([]models.Budget, error) {
	query := `
		SELECT b.id, b.user_id, b.category_id, b.name, b.amount, b.period, 
		       b.start_date, b.end_date, b.description, b.is_active, b.created_at, b.updated_at,
		       c.name as category_name, c.color as category_color, c.icon as category_icon
		FROM public.budgets b
		LEFT JOIN public.categories c ON b.category_id = c.id
		WHERE b.user_id = $1 AND b.is_active = true
		ORDER BY b.created_at DESC`

	rows, err := r.pool.Query(ctx, query, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to get budgets: %w", err)
	}
	defer rows.Close()

	var budgets []models.Budget
	for rows.Next() {
		var b models.Budget
		var categoryName, categoryColor, categoryIcon *string

		err := rows.Scan(
			&b.ID,
			&b.UserID,
			&b.CategoryID,
			&b.Name,
			&b.Amount,
			&b.Period,
			&b.StartDate,
			&b.EndDate,
			&b.Description,
			&b.IsActive,
			&b.CreatedAt,
			&b.UpdatedAt,
			&categoryName,
			&categoryColor,
			&categoryIcon,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan budget: %w", err)
		}

		if categoryName != nil {
			b.Category = &models.Category{
				Name:  *categoryName,
				Color: *categoryColor,
				Icon:  categoryIcon,
			}
		}

		budgets = append(budgets, b)
	}

	return budgets, nil
}

// Transaction Repository Implementation
func (r *PostgresRepositories) GetTransactionsByUserID(ctx context.Context, userID string, limit, offset int) ([]models.Transaction, error) {
	query := `
		SELECT t.id, t.user_id, t.account_id, t.category_id, t.amount, t.transaction_type, 
		       t.description, t.transaction_date, t.notes, t.transfer_id, t.created_at, t.updated_at,
		       a.name as account_name, a.account_type,
		       c.name as category_name, c.color as category_color
		FROM public.transactions t
		LEFT JOIN public.accounts a ON t.account_id = a.id
		LEFT JOIN public.categories c ON t.category_id = c.id
		WHERE t.user_id = $1
		ORDER BY t.transaction_date DESC, t.created_at DESC
		LIMIT $2 OFFSET $3`

	rows, err := r.pool.Query(ctx, query, userID, limit, offset)
	if err != nil {
		return nil, fmt.Errorf("failed to get transactions: %w", err)
	}
	defer rows.Close()

	var transactions []models.Transaction
	for rows.Next() {
		var t models.Transaction
		var accountName, categoryName *string
		var accountType *models.AccountType
		var categoryColor *string

		err := rows.Scan(
			&t.ID,
			&t.UserID,
			&t.AccountID,
			&t.CategoryID,
			&t.Amount,
			&t.TransactionType,
			&t.Description,
			&t.TransactionDate,
			&t.Notes,
			&t.TransferID,
			&t.CreatedAt,
			&t.UpdatedAt,
			&accountName,
			&accountType,
			&categoryName,
			&categoryColor,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan transaction: %w", err)
		}

		if accountName != nil {
			t.Account = &models.Account{
				Name:        *accountName,
				AccountType: *accountType,
			}
		}

		if categoryName != nil {
			t.Category = &models.Category{
				Name:  *categoryName,
				Color: *categoryColor,
			}
		}

		transactions = append(transactions, t)
	}

	return transactions, nil
}

func (r *PostgresRepositories) GetTransactionsByDateRange(ctx context.Context, userID string, startDate, endDate time.Time) ([]models.Transaction, error) {
	query := `
		SELECT t.id, t.user_id, t.account_id, t.category_id, t.amount, t.transaction_type, 
		       t.description, t.transaction_date, t.notes, t.transfer_id, t.created_at, t.updated_at,
		       a.name as account_name, a.account_type,
		       c.name as category_name, c.color as category_color
		FROM public.transactions t
		LEFT JOIN public.accounts a ON t.account_id = a.id
		LEFT JOIN public.categories c ON t.category_id = c.id
		WHERE t.user_id = $1 AND t.transaction_date >= $2 AND t.transaction_date <= $3
		ORDER BY t.transaction_date DESC, t.created_at DESC`

	rows, err := r.pool.Query(ctx, query, userID, startDate, endDate)
	if err != nil {
		return nil, fmt.Errorf("failed to get transactions by date range: %w", err)
	}
	defer rows.Close()

	var transactions []models.Transaction
	for rows.Next() {
		var t models.Transaction
		var accountName, categoryName *string
		var accountType *models.AccountType
		var categoryColor *string

		err := rows.Scan(
			&t.ID,
			&t.UserID,
			&t.AccountID,
			&t.CategoryID,
			&t.Amount,
			&t.TransactionType,
			&t.Description,
			&t.TransactionDate,
			&t.Notes,
			&t.TransferID,
			&t.CreatedAt,
			&t.UpdatedAt,
			&accountName,
			&accountType,
			&categoryName,
			&categoryColor,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan transaction: %w", err)
		}

		if accountName != nil {
			t.Account = &models.Account{
				Name:        *accountName,
				AccountType: *accountType,
			}
		}

		if categoryName != nil {
			t.Category = &models.Category{
				Name:  *categoryName,
				Color: *categoryColor,
			}
		}

		transactions = append(transactions, t)
	}

	return transactions, nil
}

// Reports Repository Implementation
func (r *PostgresRepositories) GetMonthlySummary(ctx context.Context, userID string, month, year int) (*models.MonthlySummary, error) {
	startDate := time.Date(year, time.Month(month), 1, 0, 0, 0, 0, time.UTC)
	endDate := startDate.AddDate(0, 1, 0).Add(-time.Second)

	// Get category spending
	categoryQuery := `
		SELECT 
			COALESCE(t.category_id, ''), 
			COALESCE(c.name, 'Uncategorized'),
			SUM(ABS(t.amount)) as total_amount,
			COUNT(*) as count
		FROM public.transactions t
		LEFT JOIN public.categories c ON t.category_id = c.id
		WHERE t.user_id = $1 
		  AND t.transaction_date >= $2 
		  AND t.transaction_date <= $3
		  AND t.transaction_type = 'expense'
		GROUP BY t.category_id, c.name
		ORDER BY total_amount DESC`

	rows, err := r.pool.Query(ctx, categoryQuery, userID, startDate, endDate)
	if err != nil {
		return nil, fmt.Errorf("failed to get category spending: %w", err)
	}
	defer rows.Close()

	var categories []models.MonthlySummaryItem
	for rows.Next() {
		var item models.MonthlySummaryItem
		err := rows.Scan(
			&item.CategoryID,
			&item.CategoryName,
			&item.TotalAmount,
			&item.Count,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan category item: %w", err)
		}
		categories = append(categories, item)
	}

	// Get total income and expenses
	totalQuery := `
		SELECT 
			SUM(CASE WHEN transaction_type = 'income' THEN amount ELSE 0 END) as total_income,
			SUM(CASE WHEN transaction_type = 'expense' THEN ABS(amount) ELSE 0 END) as total_expenses
		FROM public.transactions
		WHERE user_id = $1 
		  AND transaction_date >= $2 
		  AND transaction_date <= $3`

	var totalIncome, totalExpenses float64
	err = r.pool.QueryRow(ctx, totalQuery, userID, startDate, endDate).Scan(&totalIncome, &totalExpenses)
	if err != nil {
		return nil, fmt.Errorf("failed to get totals: %w", err)
	}

	summary := &models.MonthlySummary{
		UserID:        userID,
		Month:         month,
		Year:          year,
		TotalIncome:   totalIncome,
		TotalExpenses: totalExpenses,
		NetAmount:     totalIncome - totalExpenses,
		Categories:    categories,
		GeneratedAt:   time.Now(),
	}

	return summary, nil
}

func (r *PostgresRepositories) GetSpendingTrends(ctx context.Context, userID string, categoryID *string, months int) (*models.SpendingTrends, error) {
	query := `
		SELECT 
			EXTRACT(MONTH FROM transaction_date) as month,
			EXTRACT(YEAR FROM transaction_date) as year,
			SUM(ABS(amount)) as amount
		FROM public.transactions
		WHERE user_id = $1 
		  AND transaction_type = 'expense'
		  AND transaction_date >= $2`

	args := []interface{}{userID, time.Now().AddDate(0, -months, 0)}

	if categoryID != nil {
		query += " AND category_id = $3"
		args = append(args, *categoryID)
	}

	query += ` GROUP BY EXTRACT(MONTH FROM transaction_date), EXTRACT(YEAR FROM transaction_date)
		ORDER BY year, month`

	rows, err := r.pool.Query(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to get spending trends: %w", err)
	}
	defer rows.Close()

	var trends []models.SpendingTrendItem
	for rows.Next() {
		var item models.SpendingTrendItem
		err := rows.Scan(&item.Month, &item.Year, &item.Amount)
		if err != nil {
			return nil, fmt.Errorf("failed to scan trend item: %w", err)
		}
		trends = append(trends, item)
	}

	return &models.SpendingTrends{
		UserID:      userID,
		CategoryID:  categoryID,
		Period:      "monthly",
		Trends:      trends,
		GeneratedAt: time.Now(),
	}, nil
}

func (r *PostgresRepositories) GetCashFlow(ctx context.Context, userID string, startDate, endDate time.Time) (*models.CashFlow, error) {
	query := `
		SELECT 
			DATE(transaction_date) as date,
			SUM(CASE WHEN transaction_type = 'income' THEN amount ELSE 0 END) as income,
			SUM(CASE WHEN transaction_type = 'expense' THEN ABS(amount) ELSE 0 END) as expenses
		FROM public.transactions
		WHERE user_id = $1 
		  AND transaction_date >= $2 
		  AND transaction_date <= $3
		GROUP BY DATE(transaction_date)
		ORDER BY date`

	rows, err := r.pool.Query(ctx, query, userID, startDate, endDate)
	if err != nil {
		return nil, fmt.Errorf("failed to get cash flow: %w", err)
	}
	defer rows.Close()

	var items []models.CashFlowItem
	var totalIncome, totalExpense float64

	for rows.Next() {
		var item models.CashFlowItem
		err := rows.Scan(&item.Date, &item.Income, &item.Expenses)
		if err != nil {
			return nil, fmt.Errorf("failed to scan cash flow item: %w", err)
		}

		item.NetFlow = item.Income - item.Expenses
		items = append(items, item)

		totalIncome += item.Income
		totalExpense += item.Expenses
	}

	return &models.CashFlow{
		UserID:       userID,
		StartDate:    startDate,
		EndDate:      endDate,
		Items:        items,
		TotalIncome:  totalIncome,
		TotalExpense: totalExpense,
		NetCashFlow:  totalIncome - totalExpense,
		GeneratedAt:  time.Now(),
	}, nil
}

// Goal Repository Implementation
func (r *PostgresRepositories) GetGoalsByUserID(ctx context.Context, userID string) ([]models.Goal, error) {
	query := `
		SELECT id, user_id, name, description, target_amount, current_amount, 
		       target_date, is_completed, is_active, created_at, updated_at
		FROM public.goals
		WHERE user_id = $1 AND is_active = true
		ORDER BY created_at DESC`

	rows, err := r.pool.Query(ctx, query, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to get goals: %w", err)
	}
	defer rows.Close()

	var goals []models.Goal
	for rows.Next() {
		var g models.Goal
		err := rows.Scan(
			&g.ID,
			&g.UserID,
			&g.Name,
			&g.Description,
			&g.TargetAmount,
			&g.CurrentAmount,
			&g.TargetDate,
			&g.IsCompleted,
			&g.IsActive,
			&g.CreatedAt,
			&g.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan goal: %w", err)
		}
		goals = append(goals, g)
	}

	return goals, nil
}

func (r *PostgresRepositories) GetGoalByID(ctx context.Context, id string) (*models.Goal, error) {
	query := `
		SELECT id, user_id, name, description, target_amount, current_amount, 
		       target_date, is_completed, is_active, created_at, updated_at
		FROM public.goals
		WHERE id = $1`

	goal := &models.Goal{}
	err := r.pool.QueryRow(ctx, query, id).Scan(
		&goal.ID,
		&goal.UserID,
		&goal.Name,
		&goal.Description,
		&goal.TargetAmount,
		&goal.CurrentAmount,
		&goal.TargetDate,
		&goal.IsCompleted,
		&goal.IsActive,
		&goal.CreatedAt,
		&goal.UpdatedAt,
	)

	if err != nil {
		return nil, fmt.Errorf("failed to get goal by ID: %w", err)
	}

	return goal, nil
}

func (r *PostgresRepositories) CreateGoal(ctx context.Context, goal *models.Goal) error {
	query := `
		INSERT INTO public.goals (user_id, name, description, target_amount, current_amount, target_date)
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING id, created_at, updated_at, is_completed, is_active`

	err := r.pool.QueryRow(ctx, query,
		goal.UserID,
		goal.Name,
		goal.Description,
		goal.TargetAmount,
		goal.CurrentAmount,
		goal.TargetDate,
	).Scan(&goal.ID, &goal.CreatedAt, &goal.UpdatedAt, &goal.IsCompleted, &goal.IsActive)

	if err != nil {
		return fmt.Errorf("failed to create goal: %w", err)
	}

	return nil
}

func (r *PostgresRepositories) UpdateGoal(ctx context.Context, goal *models.Goal) error {
	query := `
		UPDATE public.goals 
		SET name = $2, description = $3, target_amount = $4, current_amount = $5, 
		    target_date = $6, is_completed = $7, updated_at = NOW()
		WHERE id = $1 AND user_id = $8
		RETURNING updated_at`

	err := r.pool.QueryRow(ctx, query,
		goal.ID,
		goal.Name,
		goal.Description,
		goal.TargetAmount,
		goal.CurrentAmount,
		goal.TargetDate,
		goal.IsCompleted,
		goal.UserID,
	).Scan(&goal.UpdatedAt)

	if err != nil {
		return fmt.Errorf("failed to update goal: %w", err)
	}

	return nil
}

func (r *PostgresRepositories) DeleteGoal(ctx context.Context, id string) error {
	query := `UPDATE public.goals SET is_active = false, updated_at = NOW() WHERE id = $1`

	result, err := r.pool.Exec(ctx, query, id)
	if err != nil {
		return fmt.Errorf("failed to delete goal: %w", err)
	}

	if result.RowsAffected() == 0 {
		return fmt.Errorf("goal not found")
	}

	return nil
}

// GoalRepository interface methods (wrappers for existing methods)
func (r *PostgresRepositories) GetByUserID(ctx context.Context, userID string) ([]models.Goal, error) {
	return r.GetGoalsByUserID(ctx, userID)
}

func (r *PostgresRepositories) GetByID(ctx context.Context, id string) (*models.Goal, error) {
	return r.GetGoalByID(ctx, id)
}

func (r *PostgresRepositories) Create(ctx context.Context, goal *models.Goal) error {
	return r.CreateGoal(ctx, goal)
}

func (r *PostgresRepositories) Update(ctx context.Context, goal *models.Goal) error {
	return r.UpdateGoal(ctx, goal)
}

func (r *PostgresRepositories) Delete(ctx context.Context, id string) error {
	return r.DeleteGoal(ctx, id)
}

// Interface compliance check
var _ repositories.ReportsRepository = (*PostgresRepositories)(nil)
var _ repositories.GoalRepository = (*PostgresRepositories)(nil)
