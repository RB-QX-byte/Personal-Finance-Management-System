# Personal Finance Management System - Database Schema Documentation

## Overview

This document describes the complete database schema for the Personal Finance Management System, implementing all tables, relationships, constraints, and security policies required for the application.

## Migration Files

1. `001_create_profiles_table_and_trigger.sql` - Initial profiles table and user registration trigger
2. `002_create_complete_database_schema.sql` - Complete schema with all tables, relationships, and policies
3. `test_complete_schema.sql` - Comprehensive test script for schema verification

## Database Schema

### Core Tables

#### 1. profiles (from migration 001)
- **Purpose**: Store additional user profile information
- **Key Fields**: `id` (FK to auth.users), `full_name`, `currency_preference`
- **Triggers**: Auto-created on user registration, auto-updated timestamps

#### 2. accounts
- **Purpose**: User's financial accounts (checking, savings, credit cards, etc.)
- **Key Fields**: `id`, `user_id`, `name`, `account_type`, `balance`
- **Features**: 
  - Unique account names per user
  - Automatic balance updates via triggers
  - Support for multiple account types

#### 3. categories  
- **Purpose**: Transaction categorization system
- **Key Fields**: `id`, `user_id`, `name`, `color`, `icon`
- **Features**:
  - User-specific categories
  - Visual customization (color, icon)
  - Default categories auto-created for new users

#### 4. transactions
- **Purpose**: Financial transaction records
- **Key Fields**: `id`, `user_id`, `account_id`, `category_id`, `amount`, `transaction_type`
- **Features**:
  - Support for income, expense, and transfer types
  - Automatic account balance updates
  - Transfer linking for account-to-account transfers

#### 5. budgets
- **Purpose**: Budget planning and tracking
- **Key Fields**: `id`, `user_id`, `category_id`, `amount`, `period`
- **Features**:
  - Multiple budget periods (weekly, monthly, quarterly, yearly)
  - Category-based budgeting
  - Date range support

#### 6. goals
- **Purpose**: Financial goal setting and tracking
- **Key Fields**: `id`, `user_id`, `name`, `target_amount`, `current_amount`
- **Features**:
  - Progress tracking
  - Target date support
  - Completion status

## Data Types and Enums

### Custom Enums
- `account_type`: checking, savings, credit_card, investment, loan, other
- `transaction_type`: income, expense, transfer  
- `budget_period`: weekly, monthly, quarterly, yearly

### Key Data Types
- **UUID**: Primary keys and foreign keys
- **DECIMAL(15,2)**: Monetary amounts (supports up to $999,999,999,999.99)
- **TIMESTAMPTZ**: Timestamps with timezone support
- **TEXT**: Variable-length strings

## Relationships

```
auth.users (Supabase Auth)
    ↓ 1:1
profiles
    ↓ 1:many
accounts ←→ transactions
    ↓ 1:many     ↓ many:1
categories ←→ transactions
    ↓ 1:many
budgets

auth.users
    ↓ 1:many
goals
```

## Row Level Security (RLS)

All tables have RLS enabled with policies ensuring users can only:
- **SELECT**: View their own data (`user_id = auth.uid()`)
- **INSERT**: Create records for themselves 
- **UPDATE**: Modify their own records
- **DELETE**: Delete their own records

## Indexes

Performance indexes are created on:
- All foreign key columns
- Frequently queried columns (dates, types, status flags)
- Composite indexes for common query patterns

### Key Indexes
- `idx_transactions_user_date`: Optimizes date-range queries
- `idx_accounts_user_id`: Fast account lookups
- `idx_transactions_account_id`: Transaction by account queries

## Constraints

### Data Integrity Constraints
- **Non-zero amounts**: Transaction amounts cannot be zero
- **Positive budgets**: Budget amounts must be positive  
- **Valid date ranges**: End dates must be after start dates
- **Unique names**: Account and category names unique per user

### Business Logic Constraints
- **Transfer validation**: Transfer transactions must have transfer_id
- **Goal progress**: Current amount ≤ target amount (unless completed)
- **Account balance**: Maintained automatically via triggers

## Triggers and Functions

### Automatic Timestamp Updates
- All tables have `updated_at` fields automatically maintained
- Trigger: `update_{table}_updated_at`

### User Registration
- `handle_new_user()`: Creates profile and default categories
- Trigger: `on_auth_user_created`

### Account Balance Management
- `update_account_balance()`: Maintains account balances automatically
- Trigger: `update_account_balance_trigger`

### Default Data Creation
- `create_default_categories()`: Creates 12 default categories for new users

## Default Categories

New users automatically get these categories:

**Expenses:**
- Food & Dining 🍽️
- Transportation 🚗  
- Shopping 🛒
- Entertainment 🎬
- Bills & Utilities 💡
- Healthcare 🏥
- Education 📚
- Travel ✈️

**Income:**
- Salary 💼
- Freelance 💻
- Investment 📈
- Other Income 💰

## Migration Application

### Using Supabase CLI (Recommended)
```bash
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
```

### Manual Application
1. Apply `001_create_profiles_table_and_trigger.sql`
2. Apply `002_create_complete_database_schema.sql`
3. Run `test_complete_schema.sql` to verify

## Testing

Use the `test_complete_schema.sql` script to verify:
- All tables and columns exist
- Foreign key relationships are correct
- RLS policies are properly configured
- Indexes are created
- Triggers and functions are installed

## Security Features

1. **Row Level Security**: Complete data isolation between users
2. **Secure Functions**: All triggers use `SECURITY DEFINER`
3. **Input Validation**: Constraints prevent invalid data
4. **Audit Trail**: Created/updated timestamps on all records

## Performance Considerations

1. **Indexed Queries**: All common query patterns are indexed
2. **Efficient RLS**: Policies use indexed columns (user_id)
3. **Constraint Checks**: Business rules enforced at database level
4. **Automatic Maintenance**: Triggers handle data consistency

## Backup and Recovery

- All data tied to `auth.users` for easy user data export
- CASCADE deletes ensure clean user data removal
- Foreign key constraints maintain referential integrity

## Future Enhancements

The schema is designed to support future features:
- Recurring transactions
- Investment tracking
- Multi-currency support
- Shared accounts/budgets
- Advanced reporting