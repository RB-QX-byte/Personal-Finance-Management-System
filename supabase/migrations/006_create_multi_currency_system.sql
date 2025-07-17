-- Create exchange rates table
CREATE TABLE public.exchange_rates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    base_currency TEXT NOT NULL,
    target_currency TEXT NOT NULL,
    rate DECIMAL(15,8) NOT NULL,
    provider TEXT NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT unique_currency_pair_timestamp UNIQUE (base_currency, target_currency, timestamp)
);

-- Create currency preferences table
CREATE TABLE public.currency_preferences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    base_currency TEXT NOT NULL DEFAULT 'USD',
    display_currencies TEXT[] DEFAULT '{USD,EUR,GBP,JPY}',
    auto_convert BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT unique_user_currency_prefs UNIQUE (user_id)
);

-- Create currency conversions log table
CREATE TABLE public.currency_conversions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    original_amount DECIMAL(15,2) NOT NULL,
    original_currency TEXT NOT NULL,
    converted_amount DECIMAL(15,2) NOT NULL,
    converted_currency TEXT NOT NULL,
    exchange_rate DECIMAL(15,8) NOT NULL,
    provider TEXT NOT NULL,
    conversion_date TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add currency fields to existing tables
ALTER TABLE public.accounts ADD COLUMN currency TEXT DEFAULT 'USD';
ALTER TABLE public.transactions ADD COLUMN currency TEXT DEFAULT 'USD';
ALTER TABLE public.transactions ADD COLUMN original_currency TEXT;
ALTER TABLE public.transactions ADD COLUMN exchange_rate DECIMAL(15,8);
ALTER TABLE public.budgets ADD COLUMN currency TEXT DEFAULT 'USD';
ALTER TABLE public.goals ADD COLUMN currency TEXT DEFAULT 'USD';

-- Update profiles table with extended currency support
ALTER TABLE public.profiles ADD COLUMN display_currencies TEXT[] DEFAULT '{USD,EUR,GBP,JPY}';
ALTER TABLE public.profiles ADD COLUMN auto_convert_currencies BOOLEAN DEFAULT true;

-- Create indexes for better performance
CREATE INDEX idx_exchange_rates_base_currency ON public.exchange_rates(base_currency);
CREATE INDEX idx_exchange_rates_target_currency ON public.exchange_rates(target_currency);
CREATE INDEX idx_exchange_rates_timestamp ON public.exchange_rates(timestamp);
CREATE INDEX idx_exchange_rates_provider ON public.exchange_rates(provider);
CREATE INDEX idx_exchange_rates_currency_pair ON public.exchange_rates(base_currency, target_currency);

CREATE INDEX idx_currency_preferences_user_id ON public.currency_preferences(user_id);
CREATE INDEX idx_currency_preferences_base_currency ON public.currency_preferences(base_currency);

CREATE INDEX idx_currency_conversions_user_id ON public.currency_conversions(user_id);
CREATE INDEX idx_currency_conversions_date ON public.currency_conversions(conversion_date);
CREATE INDEX idx_currency_conversions_currencies ON public.currency_conversions(original_currency, converted_currency);

CREATE INDEX idx_accounts_currency ON public.accounts(currency);
CREATE INDEX idx_transactions_currency ON public.transactions(currency);
CREATE INDEX idx_budgets_currency ON public.budgets(currency);
CREATE INDEX idx_goals_currency ON public.goals(currency);

-- Create RLS policies
ALTER TABLE public.exchange_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.currency_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.currency_conversions ENABLE ROW LEVEL SECURITY;

-- Exchange rates policies (public read, system write)
CREATE POLICY "Anyone can view exchange rates"
    ON public.exchange_rates
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Service can insert exchange rates"
    ON public.exchange_rates
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Currency preferences policies
CREATE POLICY "Users can view their own currency preferences"
    ON public.currency_preferences
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own currency preferences"
    ON public.currency_preferences
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own currency preferences"
    ON public.currency_preferences
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Currency conversions policies
CREATE POLICY "Users can view their own currency conversions"
    ON public.currency_conversions
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own currency conversions"
    ON public.currency_conversions
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Function to store exchange rate
CREATE OR REPLACE FUNCTION public.store_exchange_rate(
    base_curr TEXT,
    target_curr TEXT,
    rate_value DECIMAL,
    provider_name TEXT,
    rate_timestamp TIMESTAMPTZ
)
RETURNS UUID AS $$
DECLARE
    rate_id UUID;
BEGIN
    INSERT INTO public.exchange_rates (
        base_currency,
        target_currency,
        rate,
        provider,
        timestamp
    ) VALUES (
        base_curr,
        target_curr,
        rate_value,
        provider_name,
        rate_timestamp
    ) 
    ON CONFLICT (base_currency, target_currency, timestamp) 
    DO UPDATE SET
        rate = EXCLUDED.rate,
        provider = EXCLUDED.provider
    RETURNING id INTO rate_id;
    
    RETURN rate_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get latest exchange rate
CREATE OR REPLACE FUNCTION public.get_latest_exchange_rate(
    base_curr TEXT,
    target_curr TEXT
)
RETURNS TABLE (
    rate DECIMAL,
    provider TEXT,
    timestamp TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        er.rate,
        er.provider,
        er.timestamp
    FROM public.exchange_rates er
    WHERE er.base_currency = base_curr 
    AND er.target_currency = target_curr
    ORDER BY er.timestamp DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to convert currency amount
CREATE OR REPLACE FUNCTION public.convert_currency(
    amount DECIMAL,
    from_currency TEXT,
    to_currency TEXT,
    user_uuid UUID DEFAULT NULL
)
RETURNS TABLE (
    original_amount DECIMAL,
    converted_amount DECIMAL,
    exchange_rate DECIMAL,
    provider TEXT,
    conversion_timestamp TIMESTAMPTZ
) AS $$
DECLARE
    rate_record RECORD;
    converted_amt DECIMAL;
BEGIN
    -- If same currency, return original amount
    IF from_currency = to_currency THEN
        RETURN QUERY SELECT 
            amount,
            amount,
            1.0::DECIMAL,
            'same_currency'::TEXT,
            NOW();
        RETURN;
    END IF;
    
    -- Get latest exchange rate
    SELECT INTO rate_record *
    FROM public.get_latest_exchange_rate(from_currency, to_currency);
    
    IF rate_record IS NULL THEN
        -- Try reverse rate
        SELECT INTO rate_record *
        FROM public.get_latest_exchange_rate(to_currency, from_currency);
        
        IF rate_record IS NOT NULL THEN
            -- Use inverse rate
            converted_amt := amount / rate_record.rate;
            
            -- Log conversion if user provided
            IF user_uuid IS NOT NULL THEN
                INSERT INTO public.currency_conversions (
                    user_id,
                    original_amount,
                    original_currency,
                    converted_amount,
                    converted_currency,
                    exchange_rate,
                    provider,
                    conversion_date
                ) VALUES (
                    user_uuid,
                    amount,
                    from_currency,
                    converted_amt,
                    to_currency,
                    1.0 / rate_record.rate,
                    rate_record.provider,
                    NOW()
                );
            END IF;
            
            RETURN QUERY SELECT 
                amount,
                converted_amt,
                1.0 / rate_record.rate,
                rate_record.provider,
                rate_record.timestamp;
            RETURN;
        END IF;
        
        -- No rate found, return original amount
        RETURN QUERY SELECT 
            amount,
            amount,
            1.0::DECIMAL,
            'no_rate_found'::TEXT,
            NOW();
        RETURN;
    END IF;
    
    -- Calculate converted amount
    converted_amt := amount * rate_record.rate;
    
    -- Log conversion if user provided
    IF user_uuid IS NOT NULL THEN
        INSERT INTO public.currency_conversions (
            user_id,
            original_amount,
            original_currency,
            converted_amount,
            converted_currency,
            exchange_rate,
            provider,
            conversion_date
        ) VALUES (
            user_uuid,
            amount,
            from_currency,
            converted_amt,
            to_currency,
            rate_record.rate,
            rate_record.provider,
            NOW()
        );
    END IF;
    
    RETURN QUERY SELECT 
        amount,
        converted_amt,
        rate_record.rate,
        rate_record.provider,
        rate_record.timestamp;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's multi-currency net worth
CREATE OR REPLACE FUNCTION public.get_user_multi_currency_net_worth(
    user_uuid UUID,
    base_currency TEXT DEFAULT 'USD'
)
RETURNS TABLE (
    currency TEXT,
    amount DECIMAL,
    converted_amount DECIMAL,
    exchange_rate DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    WITH account_balances AS (
        SELECT 
            a.currency,
            SUM(a.balance) as total_balance
        FROM public.accounts a
        WHERE a.user_id = user_uuid
        AND a.is_active = true
        GROUP BY a.currency
    )
    SELECT 
        ab.currency,
        ab.total_balance,
        CASE 
            WHEN ab.currency = base_currency THEN ab.total_balance
            ELSE (
                SELECT converted_amount 
                FROM public.convert_currency(ab.total_balance, ab.currency, base_currency, user_uuid)
            )
        END as converted_amount,
        CASE 
            WHEN ab.currency = base_currency THEN 1.0::DECIMAL
            ELSE (
                SELECT exchange_rate 
                FROM public.convert_currency(ab.total_balance, ab.currency, base_currency, user_uuid)
            )
        END as exchange_rate
    FROM account_balances ab;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get currency conversion history
CREATE OR REPLACE FUNCTION public.get_currency_conversion_history(
    user_uuid UUID,
    days_back INTEGER DEFAULT 30
)
RETURNS TABLE (
    original_amount DECIMAL,
    original_currency TEXT,
    converted_amount DECIMAL,
    converted_currency TEXT,
    exchange_rate DECIMAL,
    provider TEXT,
    conversion_date TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        cc.original_amount,
        cc.original_currency,
        cc.converted_amount,
        cc.converted_currency,
        cc.exchange_rate,
        cc.provider,
        cc.conversion_date
    FROM public.currency_conversions cc
    WHERE cc.user_id = user_uuid
    AND cc.conversion_date >= NOW() - INTERVAL '1 day' * days_back
    ORDER BY cc.conversion_date DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to update currency preferences timestamp
CREATE OR REPLACE FUNCTION public.update_currency_preferences_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_currency_preferences_timestamp_trigger
    BEFORE UPDATE ON public.currency_preferences
    FOR EACH ROW
    EXECUTE FUNCTION public.update_currency_preferences_timestamp();

-- Insert default currency preferences for existing users
INSERT INTO public.currency_preferences (user_id, base_currency, display_currencies, auto_convert)
SELECT 
    id,
    COALESCE(currency_preference, 'USD'),
    ARRAY[COALESCE(currency_preference, 'USD'), 'EUR', 'GBP', 'JPY'],
    true
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM public.currency_preferences);

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON public.exchange_rates TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.currency_preferences TO authenticated;
GRANT SELECT, INSERT ON public.currency_conversions TO authenticated;

GRANT EXECUTE ON FUNCTION public.store_exchange_rate(TEXT, TEXT, DECIMAL, TEXT, TIMESTAMPTZ) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_latest_exchange_rate(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.convert_currency(DECIMAL, TEXT, TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_multi_currency_net_worth(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_currency_conversion_history(UUID, INTEGER) TO authenticated;