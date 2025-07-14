-- Migration: Create Users and Profiles Tables
-- Created at: 2024-07-14 05:45:00 UTC
-- Description: Creates the users and profiles tables for the Personal Finance Management System

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    bio TEXT,
    phone TEXT,
    date_of_birth DATE,
    currency_preference TEXT DEFAULT 'USD',
    timezone TEXT DEFAULT 'UTC',
    language_preference TEXT DEFAULT 'en',
    email_notifications BOOLEAN DEFAULT true,
    push_notifications BOOLEAN DEFAULT true,
    marketing_emails BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at on profiles
DROP TRIGGER IF EXISTS handle_profiles_updated_at ON public.profiles;
CREATE TRIGGER handle_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Users can insert their own profile (during registration)
CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Create a function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, username, email)
    VALUES (
        NEW.id,
        NEW.raw_user_meta_data->>'username',
        NEW.email
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user registration
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Create accounts table for financial accounts
CREATE TABLE IF NOT EXISTS public.accounts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('checking', 'savings', 'credit', 'investment', 'cash', 'loan', 'other')),
    balance DECIMAL(15,2) DEFAULT 0.00 NOT NULL,
    currency TEXT DEFAULT 'USD' NOT NULL,
    institution_name TEXT,
    account_number TEXT,
    is_active BOOLEAN DEFAULT true,
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create indexes for accounts
CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON public.accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_accounts_type ON public.accounts(type);

-- Create trigger for updated_at on accounts
DROP TRIGGER IF EXISTS handle_accounts_updated_at ON public.accounts;
CREATE TRIGGER handle_accounts_updated_at
    BEFORE UPDATE ON public.accounts
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Enable RLS for accounts
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;

-- RLS policies for accounts
CREATE POLICY "Users can view own accounts" ON public.accounts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own accounts" ON public.accounts
    FOR ALL USING (auth.uid() = user_id);

-- Create categories table for transaction categorization
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    color TEXT DEFAULT '#3B82F6',
    icon TEXT DEFAULT 'tag',
    parent_id UUID REFERENCES public.categories(id) ON DELETE CASCADE,
    is_system BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(user_id, name)
);

-- Create indexes for categories
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON public.categories(user_id);
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON public.categories(parent_id);

-- Create trigger for updated_at on categories
DROP TRIGGER IF EXISTS handle_categories_updated_at ON public.categories;
CREATE TRIGGER handle_categories_updated_at
    BEFORE UPDATE ON public.categories
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Enable RLS for categories
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- RLS policies for categories
CREATE POLICY "Users can view own categories" ON public.categories
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own categories" ON public.categories
    FOR ALL USING (auth.uid() = user_id);

-- Insert default system categories
INSERT INTO public.categories (name, color, icon, is_system) VALUES
    ('Food & Dining', '#EF4444', 'utensils', true),
    ('Transportation', '#3B82F6', 'car', true),
    ('Shopping', '#8B5CF6', 'shopping-bag', true),
    ('Entertainment', '#10B981', 'film', true),
    ('Bills & Utilities', '#F59E0B', 'file-invoice-dollar', true),
    ('Healthcare', '#EC4899', 'heartbeat', true),
    ('Education', '#6366F1', 'graduation-cap', true),
    ('Travel', '#14B8A6', 'plane', true),
    ('Income', '#22C55E', 'dollar-sign', true),
    ('Investment', '#A855F7', 'chart-line', true),
    ('Other', '#6B7280', 'circle', true)
ON CONFLICT DO NOTHING;

-- Create transactions table for financial transactions
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    account_id UUID REFERENCES public.accounts(id) ON DELETE CASCADE NOT NULL,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    amount DECIMAL(15,2) NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense', 'transfer')),
    description TEXT,
    notes TEXT,
    transaction_date DATE NOT NULL,
    payee TEXT,
    is_recurring BOOLEAN DEFAULT false,
    recurring_rule TEXT,
    is_pending BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create indexes for transactions
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_account_id ON public.transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_category_id ON public.transactions(category_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON public.transactions(transaction_date);

-- Create trigger for updated_at on transactions
DROP TRIGGER IF EXISTS handle_transactions_updated_at ON public.transactions;
CREATE TRIGGER handle_transactions_updated_at
    BEFORE UPDATE ON public.transactions
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Enable RLS for transactions
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- RLS policies for transactions
CREATE POLICY "Users can view own transactions" ON public.transactions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own transactions" ON public.transactions
    FOR ALL USING (auth.uid() = user_id);

-- Create budgets table for budget management
CREATE TABLE IF NOT EXISTS public.budgets (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    category_id UUID REFERENCES public.categories(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    period TEXT NOT NULL CHECK (period IN ('weekly', 'monthly', 'quarterly', 'yearly')),
    start_date DATE NOT NULL,
    end_date DATE,
    is_active BOOLEAN DEFAULT true,
    alert_threshold DECIMAL(5,2) DEFAULT 80.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(user_id, category_id, name)
);

-- Create indexes for budgets
CREATE INDEX IF NOT EXISTS idx_budgets_user_id ON public.budgets(user_id);
CREATE INDEX IF NOT EXISTS idx_budgets_category_id ON public.budgets(category_id);

-- Create trigger for updated_at on budgets
DROP TRIGGER IF EXISTS handle_budgets_updated_at ON public.budgets;
CREATE TRIGGER handle_budgets_updated_at
    BEFORE UPDATE ON public.budgets
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Enable RLS for budgets
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;

-- RLS policies for budgets
CREATE POLICY "Users can view own budgets" ON public.budgets
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own budgets" ON public.budgets
    FOR ALL USING (auth.uid() = user_id);

-- Create goals table for financial goals
CREATE TABLE IF NOT EXISTS public.goals (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    target_amount DECIMAL(15,2) NOT NULL,
    current_amount DECIMAL(15,2) DEFAULT 0.00 NOT NULL,
    target_date DATE,
    category TEXT,
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create indexes for goals
CREATE INDEX IF NOT EXISTS idx_goals_user_id ON public.goals(user_id);

-- Create trigger for updated_at on goals
DROP TRIGGER IF EXISTS handle_goals_updated_at ON public.goals;
CREATE TRIGGER handle_goals_updated_at
    BEFORE UPDATE ON public.goals
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Enable RLS for goals
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;

-- RLS policies for goals
CREATE POLICY "Users can view own goals" ON public.goals
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own goals" ON public.goals
    FOR ALL USING (auth.uid() = user_id);

-- Create a view for budget spending summary
CREATE OR REPLACE VIEW public.budget_spending_summary AS
SELECT 
    b.id,
    b.user_id,
    b.name,
    b.amount as budgeted_amount,
    b.category_id,
    c.name as category_name,
    COALESCE(SUM(t.amount), 0) as spent_amount,
    (b.amount - COALESCE(SUM(t.amount), 0)) as remaining_amount,
    CASE 
        WHEN b.amount > 0 THEN 
            ROUND((COALESCE(SUM(t.amount), 0) / b.amount) * 100, 2)
        ELSE 0 
    END as spent_percentage,
    b.start_date,
    b.end_date,
    b.is_active,
    b.alert_threshold
FROM public.budgets b
LEFT JOIN public.categories c ON b.category_id = c.id
LEFT JOIN public.transactions t ON b.category_id = t.category_id 
    AND t.user_id = b.user_id 
    AND t.type = 'expense'
    AND t.transaction_date >= b.start_date
    AND (b.end_date IS NULL OR t.transaction_date <= b.end_date)
GROUP BY b.id, b.user_id, b.name, b.amount, b.category_id, c.name, b.start_date, b.end_date, b.is_active, b.alert_threshold;

-- Create a view for account balance summary
CREATE OR REPLACE VIEW public.account_balance_summary AS
SELECT 
    a.id,
    a.user_id,
    a.name,
    a.type,
    a.balance as current_balance,
    a.currency,
    a.institution_name,
    a.is_active,
    COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE -t.amount END), 0) as net_change,
    COUNT(t.id) as transaction_count
FROM public.accounts a
LEFT JOIN public.transactions t ON a.id = t.account_id
WHERE a.is_active = true
GROUP BY a.id, a.user_id, a.name, a.type, a.balance, a.currency, a.institution_name, a.is_active;

-- Create a view for monthly spending summary
CREATE OR REPLACE VIEW public.monthly_spending_summary AS
SELECT 
    user_id,
    DATE_TRUNC('month', transaction_date) as month,
    category_id,
    SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as total_expenses,
    SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as total_income,
    COUNT(*) as transaction_count
FROM public.transactions
GROUP BY user_id, DATE_TRUNC('month', transaction_date), category_id;

-- Create a function to update account balance after transaction
CREATE OR REPLACE FUNCTION public.update_account_balance()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.accounts 
        SET balance = balance + CASE 
            WHEN NEW.type = 'income' THEN NEW.amount 
            WHEN NEW.type = 'expense' THEN -NEW.amount 
            ELSE 0 
        END
        WHERE id = NEW.account_id;
    ELSIF TG_OP = 'UPDATE' THEN
        -- Revert old transaction amount
        UPDATE public.accounts 
        SET balance = balance - CASE 
            WHEN OLD.type = 'income' THEN OLD.amount 
            WHEN OLD.type = 'expense' THEN -OLD.amount 
            ELSE 0 
        END
        WHERE id = OLD.account_id;
        
        -- Apply new transaction amount
        UPDATE public.accounts 
        SET balance = balance + CASE 
            WHEN NEW.type = 'income' THEN NEW.amount 
            WHEN NEW.type = 'expense' THEN -NEW.amount 
            ELSE 0 
        END
        WHERE id = NEW.account_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.accounts 
        SET balance = balance - CASE 
            WHEN OLD.type = 'income' THEN OLD.amount 
            WHEN OLD.type = 'expense' THEN -OLD.amount 
            ELSE 0 
        END
        WHERE id = OLD.account_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updating account balance
DROP TRIGGER IF EXISTS update_account_balance_trigger ON public.transactions;
CREATE TRIGGER update_account_balance_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.transactions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_account_balance();

-- Create a function to update goal progress
CREATE OR REPLACE FUNCTION public.update_goal_progress()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.type = 'income' THEN
        UPDATE public.goals 
        SET current_amount = current_amount + NEW.amount
        WHERE user_id = NEW.user_id 
        AND is_active = true
        AND (category IS NULL OR category = (SELECT name FROM public.categories WHERE id = NEW.category_id));
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updating goal progress
DROP TRIGGER IF EXISTS update_goal_progress_trigger ON public.transactions;
