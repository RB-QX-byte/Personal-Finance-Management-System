package config

import (
	"os"
	"time"

	"github.com/joho/godotenv"
)

type Config struct {
	// Server Configuration
	Port        string
	GinMode     string
	Environment string

	// Database Configuration
	DatabaseURL string

	// Supabase Configuration
	SupabaseURL        string
	SupabaseAnonKey    string
	SupabaseServiceKey string
	SupabaseJWTSecret  string

	// JWT Configuration
	JWTSecret   string
	JWTExpires  time.Duration

	// CORS Configuration
	CORSAllowedOrigins []string
}

func Load() *Config {
	// Load .env file if it exists
	godotenv.Load()

	return &Config{
		Port:        getEnv("PORT", ":8080"),
		GinMode:     getEnv("GIN_MODE", "debug"),
		Environment: getEnv("ENVIRONMENT", "development"),

		DatabaseURL: getEnv("DATABASE_URL", ""),

		SupabaseURL:        getEnv("SUPABASE_URL", ""),
		SupabaseAnonKey:    getEnv("SUPABASE_ANON_KEY", ""),
		SupabaseServiceKey: getEnv("SUPABASE_SERVICE_KEY", ""),
		SupabaseJWTSecret:  getEnv("SUPABASE_JWT_SECRET", ""),

		JWTSecret:  getEnv("JWT_SECRET", "default-secret-key"),
		JWTExpires: getEnvDuration("JWT_EXPIRES_IN", 24*time.Hour),

		CORSAllowedOrigins: getEnvSlice("CORS_ALLOWED_ORIGINS", []string{"http://localhost:3000", "http://localhost:4321"}),
	}
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func getEnvDuration(key string, defaultValue time.Duration) time.Duration {
	if value := os.Getenv(key); value != "" {
		if duration, err := time.ParseDuration(value); err == nil {
			return duration
		}
	}
	return defaultValue
}

func getEnvSlice(key string, defaultValue []string) []string {
	if value := os.Getenv(key); value != "" {
		// Simple comma-separated parsing
		var result []string
		for _, item := range []string{value} {
			if item != "" {
				result = append(result, item)
			}
		}
		if len(result) > 0 {
			return result
		}
	}
	return defaultValue
}