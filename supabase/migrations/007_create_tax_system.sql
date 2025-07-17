-- Add tax-related fields to categories table
ALTER TABLE public.categories ADD COLUMN tax_deductible BOOLEAN DEFAULT false;
ALTER TABLE public.categories ADD COLUMN business_expense BOOLEAN DEFAULT false;
ALTER TABLE public.categories ADD COLUMN tax_form_section TEXT;
ALTER TABLE public.categories ADD COLUMN tax_schedule TEXT; -- Schedule A, B, C, etc.
ALTER TABLE public.categories ADD COLUMN tax_line_item TEXT; -- Specific line on tax form

-- Create tax exports table
CREATE TABLE public.tax_exports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    tax_year INTEGER NOT NULL,
    export_format TEXT NOT NULL,
    export_options JSONB DEFAULT '{}',
    transaction_count INTEGER DEFAULT 0,
    total_deductible DECIMAL(15,2) DEFAULT 0,
    total_business DECIMAL(15,2) DEFAULT 0,
    file_name TEXT,
    file_size INTEGER,
    exported_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create tax categories mapping table
CREATE TABLE public.tax_category_mappings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
    tax_form TEXT NOT NULL, -- 1040, Schedule A, Schedule C, etc.
    tax_section TEXT NOT NULL, -- Specific section on form
    line_number TEXT, -- Line number on form
    is_business_expense BOOLEAN DEFAULT false,
    is_deductible BOOLEAN DEFAULT false,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT unique_category_tax_mapping UNIQUE (user_id, category_id, tax_form, tax_section)
);

-- Create tax documents table
CREATE TABLE public.tax_documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    document_type TEXT NOT NULL, -- 1099, W-2, receipt, etc.
    document_name TEXT NOT NULL,
    tax_year INTEGER NOT NULL,
    file_path TEXT,
    file_size INTEGER,
    uploaded_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create tax preferences table
CREATE TABLE public.tax_preferences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    tax_preparation_software TEXT, -- TurboTax, H&R Block, etc.
    preferred_export_format TEXT DEFAULT 'csv',
    auto_categorize_deductibles BOOLEAN DEFAULT true,
    separate_business_personal BOOLEAN DEFAULT true,
    default_tax_year INTEGER,
    business_name TEXT,
    business_ein TEXT,
    is_business_owner BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT unique_user_tax_prefs UNIQUE (user_id)
);

-- Create tax reminders table
CREATE TABLE public.tax_reminders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    reminder_type TEXT NOT NULL, -- quarterly, annual, deadline, etc.
    title TEXT NOT NULL,
    description TEXT,
    due_date DATE NOT NULL,
    is_completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_tax_exports_user_id ON public.tax_exports(user_id);
CREATE INDEX idx_tax_exports_tax_year ON public.tax_exports(tax_year);
CREATE INDEX idx_tax_exports_exported_at ON public.tax_exports(exported_at);

CREATE INDEX idx_tax_category_mappings_user_id ON public.tax_category_mappings(user_id);
CREATE INDEX idx_tax_category_mappings_category_id ON public.tax_category_mappings(category_id);
CREATE INDEX idx_tax_category_mappings_tax_form ON public.tax_category_mappings(tax_form);

CREATE INDEX idx_tax_documents_user_id ON public.tax_documents(user_id);
CREATE INDEX idx_tax_documents_tax_year ON public.tax_documents(tax_year);
CREATE INDEX idx_tax_documents_document_type ON public.tax_documents(document_type);

CREATE INDEX idx_tax_preferences_user_id ON public.tax_preferences(user_id);

CREATE INDEX idx_tax_reminders_user_id ON public.tax_reminders(user_id);
CREATE INDEX idx_tax_reminders_due_date ON public.tax_reminders(due_date);
CREATE INDEX idx_tax_reminders_is_completed ON public.tax_reminders(is_completed);

CREATE INDEX idx_categories_tax_deductible ON public.categories(tax_deductible);
CREATE INDEX idx_categories_business_expense ON public.categories(business_expense);

-- Create RLS policies
ALTER TABLE public.tax_exports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tax_category_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tax_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tax_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tax_reminders ENABLE ROW LEVEL SECURITY;

-- Tax exports policies
CREATE POLICY "Users can view their own tax exports"
    ON public.tax_exports
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tax exports"
    ON public.tax_exports
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Tax category mappings policies
CREATE POLICY "Users can view their own tax category mappings"
    ON public.tax_category_mappings
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tax category mappings"
    ON public.tax_category_mappings
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tax category mappings"
    ON public.tax_category_mappings
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tax category mappings"
    ON public.tax_category_mappings
    FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- Tax documents policies
CREATE POLICY "Users can view their own tax documents"
    ON public.tax_documents
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tax documents"
    ON public.tax_documents
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tax documents"
    ON public.tax_documents
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tax documents"
    ON public.tax_documents
    FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- Tax preferences policies
CREATE POLICY "Users can view their own tax preferences"
    ON public.tax_preferences
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tax preferences"
    ON public.tax_preferences
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tax preferences"
    ON public.tax_preferences
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Tax reminders policies
CREATE POLICY "Users can view their own tax reminders"
    ON public.tax_reminders
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tax reminders"
    ON public.tax_reminders
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tax reminders"
    ON public.tax_reminders
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tax reminders"
    ON public.tax_reminders
    FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- Function to get tax deductible transactions for a year
CREATE OR REPLACE FUNCTION public.get_tax_deductible_transactions(
    user_uuid UUID,
    tax_year INTEGER
)
RETURNS TABLE (
    transaction_id UUID,
    transaction_date DATE,
    description TEXT,
    amount DECIMAL,
    category_name TEXT,
    tax_form_section TEXT,
    is_business_expense BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.id as transaction_id,
        t.transaction_date,
        t.description,
        t.amount,
        c.name as category_name,
        c.tax_form_section,
        c.business_expense as is_business_expense
    FROM public.transactions t
    JOIN public.categories c ON t.category_id = c.id
    WHERE t.user_id = user_uuid
    AND EXTRACT(YEAR FROM t.transaction_date) = tax_year
    AND t.transaction_type = 'expense'
    AND (c.tax_deductible = true OR c.business_expense = true)
    ORDER BY t.transaction_date DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate tax summary for a year
CREATE OR REPLACE FUNCTION public.calculate_tax_summary(
    user_uuid UUID,
    tax_year INTEGER
)
RETURNS TABLE (
    total_deductible DECIMAL,
    total_business DECIMAL,
    total_transactions INTEGER,
    category_breakdown JSONB
) AS $$
DECLARE
    deductible_total DECIMAL := 0;
    business_total DECIMAL := 0;
    transaction_count INTEGER := 0;
    category_summary JSONB := '{}';
BEGIN
    -- Calculate totals
    SELECT 
        COALESCE(SUM(CASE WHEN c.tax_deductible = true THEN ABS(t.amount) ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN c.business_expense = true THEN ABS(t.amount) ELSE 0 END), 0),
        COUNT(*)
    INTO deductible_total, business_total, transaction_count
    FROM public.transactions t
    LEFT JOIN public.categories c ON t.category_id = c.id
    WHERE t.user_id = user_uuid
    AND EXTRACT(YEAR FROM t.transaction_date) = tax_year
    AND t.transaction_type = 'expense'
    AND (c.tax_deductible = true OR c.business_expense = true);

    -- Calculate category breakdown
    SELECT json_object_agg(
        category_name,
        json_build_object(
            'total', category_total,
            'tax_deductible', is_tax_deductible,
            'business_expense', is_business_expense,
            'tax_form_section', tax_form_section
        )
    )
    INTO category_summary
    FROM (
        SELECT 
            COALESCE(c.name, 'Uncategorized') as category_name,
            SUM(ABS(t.amount)) as category_total,
            COALESCE(c.tax_deductible, false) as is_tax_deductible,
            COALESCE(c.business_expense, false) as is_business_expense,
            c.tax_form_section
        FROM public.transactions t
        LEFT JOIN public.categories c ON t.category_id = c.id
        WHERE t.user_id = user_uuid
        AND EXTRACT(YEAR FROM t.transaction_date) = tax_year
        AND t.transaction_type = 'expense'
        AND (c.tax_deductible = true OR c.business_expense = true)
        GROUP BY c.name, c.tax_deductible, c.business_expense, c.tax_form_section
    ) category_data;

    RETURN QUERY SELECT 
        deductible_total,
        business_total,
        transaction_count,
        COALESCE(category_summary, '{}');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create default tax categories
CREATE OR REPLACE FUNCTION public.create_default_tax_categories(user_uuid UUID)
RETURNS void AS $$
BEGIN
    -- Business expense categories
    INSERT INTO public.categories (user_id, name, description, color, icon, tax_deductible, business_expense, tax_form_section) VALUES
    (user_uuid, 'Office Supplies', 'Business office supplies and equipment', '#3b82f6', '📎', true, true, 'Schedule C - Line 18'),
    (user_uuid, 'Business Travel', 'Business travel expenses and meals', '#10b981', '✈️', true, true, 'Schedule C - Line 24'),
    (user_uuid, 'Professional Services', 'Legal, accounting, and professional fees', '#8b5cf6', '💼', true, true, 'Schedule C - Line 17'),
    (user_uuid, 'Marketing & Advertising', 'Business marketing and advertising costs', '#f59e0b', '📢', true, true, 'Schedule C - Line 8'),
    (user_uuid, 'Business Equipment', 'Business equipment and software', '#ef4444', '💻', true, true, 'Schedule C - Line 13'),
    (user_uuid, 'Vehicle Expenses', 'Business vehicle and transportation costs', '#6b7280', '🚗', true, true, 'Schedule C - Line 9'),
    (user_uuid, 'Home Office', 'Home office expenses', '#84cc16', '🏠', true, true, 'Schedule C - Line 30'),
    (user_uuid, 'Business Insurance', 'Business insurance premiums', '#06b6d4', '🛡️', true, true, 'Schedule C - Line 15'),
    
    -- Personal deductible categories
    (user_uuid, 'Medical Expenses', 'Medical and dental expenses', '#22c55e', '🏥', true, false, 'Schedule A - Line 1'),
    (user_uuid, 'Charitable Donations', 'Charitable contributions and donations', '#a855f7', '❤️', true, false, 'Schedule A - Line 11'),
    (user_uuid, 'Property Tax', 'State and local property taxes', '#f97316', '🏠', true, false, 'Schedule A - Line 5'),
    (user_uuid, 'Mortgage Interest', 'Home mortgage interest payments', '#64748b', '🏠', true, false, 'Schedule A - Line 8'),
    (user_uuid, 'Student Loan Interest', 'Student loan interest payments', '#ec4899', '📚', true, false, 'Form 1040 - Line 20'),
    (user_uuid, 'Investment Fees', 'Investment and financial planning fees', '#14b8a6', '📈', true, false, 'Schedule A - Line 16');
    
    -- Update existing categories that might be tax deductible
    UPDATE public.categories 
    SET tax_deductible = true, tax_form_section = 'Schedule A - Line 1'
    WHERE user_id = user_uuid AND name = 'Healthcare';
    
    UPDATE public.categories 
    SET tax_deductible = true, tax_form_section = 'Schedule A - Line 11'
    WHERE user_id = user_uuid AND name LIKE '%Charity%' OR name LIKE '%Donation%';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update tax category mappings timestamp
CREATE OR REPLACE FUNCTION public.update_tax_category_mappings_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_tax_category_mappings_timestamp_trigger
    BEFORE UPDATE ON public.tax_category_mappings
    FOR EACH ROW
    EXECUTE FUNCTION public.update_tax_category_mappings_timestamp();

-- Function to update tax preferences timestamp
CREATE OR REPLACE FUNCTION public.update_tax_preferences_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_tax_preferences_timestamp_trigger
    BEFORE UPDATE ON public.tax_preferences
    FOR EACH ROW
    EXECUTE FUNCTION public.update_tax_preferences_timestamp();

-- Create default tax preferences for existing users
INSERT INTO public.tax_preferences (user_id, preferred_export_format, auto_categorize_deductibles, separate_business_personal, default_tax_year)
SELECT 
    id,
    'csv',
    true,
    true,
    EXTRACT(YEAR FROM NOW())::INTEGER
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM public.tax_preferences);

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tax_exports TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tax_category_mappings TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tax_documents TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.tax_preferences TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tax_reminders TO authenticated;

GRANT EXECUTE ON FUNCTION public.get_tax_deductible_transactions(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.calculate_tax_summary(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_default_tax_categories(UUID) TO authenticated;