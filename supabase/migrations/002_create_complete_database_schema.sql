        -- =============================================================================
-- Personal Finance Management System - Complete Database Schema
-- Migration 002: Core Tables, Relationships, and Security Policies
-- =============================================================================

-- Note: profiles table and related functions already exist in migration 001

-- =============================================================================
-- TASK 3.1: Create Core User, Profile, and Account Tables
-- =============================================================================

-- Create account types enum
CREATE TYPE account_type AS ENUM (
    'checking',
    'savings', 
    'credit_card',
    'investment',
    'loan',
    'other'
);

-- Create accounts table for user financial accounts
CREATE TABLE public.accounts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    account_type account_type NOT NULL,
    balance DECIMAL(15,2) DEFAULT 0.00,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure account names are unique per user
    CONSTRAINT unique_account_name_per_user UNIQUE (user_id, name)
);

-- =============================================================================
-- TASK 3.2: Implement Transaction and Category Tables  
-- =============================================================================

-- Create transaction types enum
CREATE TYPE transaction_type AS ENUM ('income', 'expense', 'transfer');

-- Create categories table for transaction categorization
CREATE TABLE public.categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    color TEXT DEFAULT '#6366f1', -- Default indigo color
    icon TEXT, -- For UI display
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure category names are unique per user
    CONSTRAINT unique_category_name_per_user UNIQUE (user_id, name)
);

-- Create transactions table for financial transactions
CREATE TABLE public.transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    amount DECIMAL(15,2) NOT NULL,
    transaction_type transaction_type NOT NULL,
    description TEXT,
    transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
    notes TEXT,
    -- For transfers, link to the other transaction
    transfer_id UUID REFERENCES public.transactions(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure amount is not zero
    CONSTRAINT non_zero_amount CHECK (amount != 0),
    -- For transfers, ensure we have a transfer_id
    CONSTRAINT transfer_requires_transfer_id CHECK (
        (transaction_type != 'transfer') OR (transfer_id IS NOT NULL)
    )
);

-- =============================================================================
-- TASK 3.3: Define Budgeting and Goal-Setting Tables
-- =============================================================================

-- Create budget period enum
CREATE TYPE budget_period AS ENUM ('weekly', 'monthly', 'quarterly', 'yearly');

-- Create budgets table for expense budgeting
CREATE TABLE public.budgets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    period budget_period NOT NULL DEFAULT 'monthly',
    start_date DATE NOT NULL,
    end_date DATE,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure budget amount is positive
    CONSTRAINT positive_budget_amount CHECK (amount > 0),
    -- Ensure end_date is after start_date if provided
    CONSTRAINT valid_date_range CHECK (end_date IS NULL OR end_date > start_date),
    -- Ensure unique budget per category per period
    CONSTRAINT unique_budget_per_category_period UNIQUE (user_id, category_id, period, start_date)
);

-- Create goals table for financial goal tracking
CREATE TABLE public.goals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    target_amount DECIMAL(15,2) NOT NULL,
    current_amount DECIMAL(15,2) DEFAULT 0.00,
    target_date DATE,
    is_completed BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure target amount is positive
    CONSTRAINT positive_target_amount CHECK (target_amount > 0),
    -- Ensure current amount is not negative
    CONSTRAINT non_negative_current_amount CHECK (current_amount >= 0),
    -- Ensure current amount doesn't exceed target (unless goal is completed)
    CONSTRAINT current_not_exceeding_target CHECK (
        current_amount <= target_amount OR is_completed = true
    )
);

-- =============================================================================
-- TASK 3.4: Implement Row Level Security (RLS) Policies
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;

-- RLS Policies for accounts table
CREATE POLICY "Users can view own accounts" 
    ON public.accounts 
    FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own accounts" 
    ON public.accounts 
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own accounts" 
    ON public.accounts 
    FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own accounts" 
    ON public.accounts 
    FOR DELETE 
    USING (auth.uid() = user_id);

-- RLS Policies for categories table
CREATE POLICY "Users can view own categories" 
    ON public.categories 
    FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own categories" 
    ON public.categories 
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own categories" 
    ON public.categories 
    FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own categories" 
    ON public.categories 
    FOR DELETE 
    USING (auth.uid() = user_id);

-- RLS Policies for transactions table
CREATE POLICY "Users can view own transactions" 
    ON public.transactions 
    FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions" 
    ON public.transactions 
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own transactions" 
    ON public.transactions 
    FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own transactions" 
    ON public.transactions 
    FOR DELETE 
    USING (auth.uid() = user_id);

-- RLS Policies for budgets table
CREATE POLICY "Users can view own budgets" 
    ON public.budgets 
    FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own budgets" 
    ON public.budgets 
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own budgets" 
    ON public.budgets 
    FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own budgets" 
    ON public.budgets 
    FOR DELETE 
    USING (auth.uid() = user_id);

-- RLS Policies for goals table
CREATE POLICY "Users can view own goals" 
    ON public.goals 
    FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own goals" 
    ON public.goals 
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own goals" 
    ON public.goals 
    FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own goals" 
    ON public.goals 
    FOR DELETE 
    USING (auth.uid() = user_id);

-- =============================================================================
-- TASK 3.5: Add Indexes and Performance Optimization
-- =============================================================================

-- Indexes for foreign keys and frequently queried columns
CREATE INDEX idx_accounts_user_id ON public.accounts(user_id);
CREATE INDEX idx_accounts_type ON public.accounts(account_type);
CREATE INDEX idx_accounts_active ON public.accounts(is_active);

CREATE INDEX idx_categories_user_id ON public.categories(user_id);
CREATE INDEX idx_categories_active ON public.categories(is_active);

CREATE INDEX idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX idx_transactions_account_id ON public.transactions(account_id);
CREATE INDEX idx_transactions_category_id ON public.transactions(category_id);
CREATE INDEX idx_transactions_date ON public.transactions(transaction_date);
CREATE INDEX idx_transactions_type ON public.transactions(transaction_type);
CREATE INDEX idx_transactions_transfer_id ON public.transactions(transfer_id);

-- Composite index for transaction queries by user and date range
CREATE INDEX idx_transactions_user_date ON public.transactions(user_id, transaction_date DESC);

CREATE INDEX idx_budgets_user_id ON public.budgets(user_id);
CREATE INDEX idx_budgets_category_id ON public.budgets(category_id);
CREATE INDEX idx_budgets_period ON public.budgets(period);
CREATE INDEX idx_budgets_active ON public.budgets(is_active);
CREATE INDEX idx_budgets_date_range ON public.budgets(start_date, end_date);

CREATE INDEX idx_goals_user_id ON public.goals(user_id);
CREATE INDEX idx_goals_active ON public.goals(is_active);
CREATE INDEX idx_goals_completed ON public.goals(is_completed);
CREATE INDEX idx_goals_target_date ON public.goals(target_date);

-- =============================================================================
-- Additional Functions and Triggers
-- =============================================================================

-- Extend the update_updated_at_column function to work with all tables
CREATE TRIGGER update_accounts_updated_at
    BEFORE UPDATE ON public.accounts
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_categories_updated_at
    BEFORE UPDATE ON public.categories
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at
    BEFORE UPDATE ON public.transactions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_budgets_updated_at
    BEFORE UPDATE ON public.budgets
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_goals_updated_at
    BEFORE UPDATE ON public.goals
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Function to update account balance when transactions are added/modified
CREATE OR REPLACE FUNCTION public.update_account_balance()
RETURNS TRIGGER AS $$
BEGIN
    -- Handle INSERT
    IF TG_OP = 'INSERT' THEN
        UPDATE public.accounts 
        SET balance = balance + 
            CASE 
                WHEN NEW.transaction_type = 'income' THEN NEW.amount
                WHEN NEW.transaction_type = 'expense' THEN -NEW.amount
                ELSE 0 -- transfers are handled separately
            END
        WHERE id = NEW.account_id;
        RETURN NEW;
    END IF;
    
    -- Handle UPDATE
    IF TG_OP = 'UPDATE' THEN
        -- Revert old transaction effect
        UPDATE public.accounts 
        SET balance = balance - 
            CASE 
                WHEN OLD.transaction_type = 'income' THEN OLD.amount
                WHEN OLD.transaction_type = 'expense' THEN -OLD.amount
                ELSE 0
            END
        WHERE id = OLD.account_id;
        
        -- Apply new transaction effect
        UPDATE public.accounts 
        SET balance = balance + 
            CASE 
                WHEN NEW.transaction_type = 'income' THEN NEW.amount
                WHEN NEW.transaction_type = 'expense' THEN -NEW.amount
                ELSE 0
            END
        WHERE id = NEW.account_id;
        RETURN NEW;
    END IF;
    
    -- Handle DELETE
    IF TG_OP = 'DELETE' THEN
        UPDATE public.accounts 
        SET balance = balance - 
            CASE 
                WHEN OLD.transaction_type = 'income' THEN OLD.amount
                WHEN OLD.transaction_type = 'expense' THEN -OLD.amount
                ELSE 0
            END
        WHERE id = OLD.account_id;
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for automatic account balance updates
CREATE TRIGGER update_account_balance_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.transactions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_account_balance();

-- =============================================================================
-- Default Categories Creation Function
-- =============================================================================

-- Function to create default categories for new users
CREATE OR REPLACE FUNCTION public.create_default_categories(user_uuid UUID)
RETURNS void AS $$
BEGIN
    INSERT INTO public.categories (user_id, name, description, color, icon) VALUES
    (user_uuid, 'Food & Dining', 'Restaurants, groceries, and food expenses', '#ef4444', '🍽️'),
    (user_uuid, 'Transportation', 'Gas, public transit, car payments', '#3b82f6', '🚗'),
    (user_uuid, 'Shopping', 'Clothing, electronics, and general purchases', '#8b5cf6', '🛒'),
    (user_uuid, 'Entertainment', 'Movies, games, subscriptions', '#f59e0b', '🎬'),
    (user_uuid, 'Bills & Utilities', 'Rent, electricity, phone, internet', '#6b7280', '💡'),
    (user_uuid, 'Healthcare', 'Medical expenses, insurance, pharmacy', '#10b981', '🏥'),
    (user_uuid, 'Education', 'Books, courses, tuition', '#06b6d4', '📚'),
    (user_uuid, 'Travel', 'Flights, hotels, vacation expenses', '#84cc16', '✈️'),
    (user_uuid, 'Salary', 'Primary income from employment', '#22c55e', '💼'),
    (user_uuid, 'Freelance', 'Income from freelance work', '#a855f7', '💻'),
    (user_uuid, 'Investment', 'Dividends, capital gains, interest', '#f97316', '📈'),
    (user_uuid, 'Other Income', 'Miscellaneous income sources', '#64748b', '💰');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the handle_new_user function to create default categories
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Create profile (existing functionality)
    INSERT INTO public.profiles (id, full_name, currency_preference)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'currency_preference', 'USD')
    );
    
    -- Create default categories
    PERFORM public.create_default_categories(NEW.id);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;