package services

import (
	"context"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/personal-finance-management/backend/internal/config"
	"github.com/personal-finance-management/backend/internal/repositories/postgres"
)

type DatabaseService struct {
	pool         *pgxpool.Pool
	Repositories *postgres.PostgresRepositories
}

func NewDatabaseService(cfg *config.Config) (*DatabaseService, error) {
	if cfg.DatabaseURL == "" {
		return nil, fmt.Errorf("database URL is required")
	}

	// Create connection pool
	pool, err := pgxpool.New(context.Background(), cfg.DatabaseURL)
	if err != nil {
		return nil, fmt.Errorf("failed to create connection pool: %w", err)
	}

	// Initialize repositories
	repos := postgres.NewPostgresRepositories(pool)

	return &DatabaseService{
		pool:         pool,
		Repositories: repos,
	}, nil
}

func (db *DatabaseService) Pool() *pgxpool.Pool {
	return db.pool
}

func (db *DatabaseService) Ping(ctx context.Context) error {
	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	return db.pool.Ping(ctx)
}

func (db *DatabaseService) TestConnection(ctx context.Context) (bool, error) {
	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	var result int
	err := db.pool.QueryRow(ctx, "SELECT 1").Scan(&result)
	if err != nil {
		return false, fmt.Errorf("failed to test connection: %w", err)
	}

	return result == 1, nil
}

func (db *DatabaseService) Close() {
	if db.pool != nil {
		db.pool.Close()
	}
}