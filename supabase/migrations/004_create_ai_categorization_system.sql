-- Create AI categorization logs table
CREATE TABLE public.ai_categorization_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    transaction_description TEXT NOT NULL,
    transaction_amount DECIMAL(15,2) NOT NULL,
    predicted_category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    confidence INTEGER NOT NULL CHECK (confidence >= 0 AND confidence <= 100),
    reasoning TEXT,
    alternatives JSONB,
    is_high_confidence BOOLEAN DEFAULT false,
    actual_category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    was_correct BOOLEAN,
    user_feedback TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_ai_categorization_logs_user_id ON public.ai_categorization_logs(user_id);
CREATE INDEX idx_ai_categorization_logs_created_at ON public.ai_categorization_logs(created_at);
CREATE INDEX idx_ai_categorization_logs_confidence ON public.ai_categorization_logs(confidence);
CREATE INDEX idx_ai_categorization_logs_predicted_category ON public.ai_categorization_logs(predicted_category_id);

-- Create RLS policies
ALTER TABLE public.ai_categorization_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own AI categorization logs"
    ON public.ai_categorization_logs
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own AI categorization logs"
    ON public.ai_categorization_logs
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own AI categorization logs"
    ON public.ai_categorization_logs
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Create AI categorization accuracy tracking table
CREATE TABLE public.ai_categorization_accuracy (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    total_predictions INTEGER DEFAULT 0,
    correct_predictions INTEGER DEFAULT 0,
    high_confidence_predictions INTEGER DEFAULT 0,
    high_confidence_correct INTEGER DEFAULT 0,
    accuracy_percentage DECIMAL(5,2) DEFAULT 0,
    high_confidence_accuracy_percentage DECIMAL(5,2) DEFAULT 0,
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create unique constraint on user_id
ALTER TABLE public.ai_categorization_accuracy ADD CONSTRAINT unique_user_accuracy UNIQUE (user_id);

-- Create RLS policies for accuracy tracking
ALTER TABLE public.ai_categorization_accuracy ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own AI accuracy stats"
    ON public.ai_categorization_accuracy
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own AI accuracy stats"
    ON public.ai_categorization_accuracy
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own AI accuracy stats"
    ON public.ai_categorization_accuracy
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Function to update AI categorization accuracy
CREATE OR REPLACE FUNCTION public.update_ai_categorization_accuracy(user_uuid UUID)
RETURNS void AS $$
DECLARE
    total_count INTEGER;
    correct_count INTEGER;
    high_conf_count INTEGER;
    high_conf_correct_count INTEGER;
    accuracy_pct DECIMAL(5,2);
    high_conf_accuracy_pct DECIMAL(5,2);
BEGIN
    -- Calculate accuracy metrics
    SELECT 
        COUNT(*),
        COUNT(*) FILTER (WHERE was_correct = true),
        COUNT(*) FILTER (WHERE is_high_confidence = true),
        COUNT(*) FILTER (WHERE is_high_confidence = true AND was_correct = true)
    INTO total_count, correct_count, high_conf_count, high_conf_correct_count
    FROM public.ai_categorization_logs
    WHERE user_id = user_uuid 
    AND was_correct IS NOT NULL;

    -- Calculate percentages
    accuracy_pct := CASE WHEN total_count > 0 THEN (correct_count::DECIMAL / total_count::DECIMAL) * 100 ELSE 0 END;
    high_conf_accuracy_pct := CASE WHEN high_conf_count > 0 THEN (high_conf_correct_count::DECIMAL / high_conf_count::DECIMAL) * 100 ELSE 0 END;

    -- Insert or update accuracy record
    INSERT INTO public.ai_categorization_accuracy (
        user_id, 
        total_predictions, 
        correct_predictions, 
        high_confidence_predictions, 
        high_confidence_correct,
        accuracy_percentage,
        high_confidence_accuracy_percentage,
        last_updated
    ) VALUES (
        user_uuid,
        total_count,
        correct_count,
        high_conf_count,
        high_conf_correct_count,
        accuracy_pct,
        high_conf_accuracy_pct,
        NOW()
    )
    ON CONFLICT (user_id) DO UPDATE SET
        total_predictions = total_count,
        correct_predictions = correct_count,
        high_confidence_predictions = high_conf_count,
        high_confidence_correct = high_conf_correct_count,
        accuracy_percentage = accuracy_pct,
        high_confidence_accuracy_percentage = high_conf_accuracy_pct,
        last_updated = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update accuracy when categorization logs are updated
CREATE OR REPLACE FUNCTION public.trigger_update_ai_accuracy()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'UPDATE' AND OLD.was_correct IS DISTINCT FROM NEW.was_correct THEN
        PERFORM public.update_ai_categorization_accuracy(NEW.user_id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_ai_accuracy_trigger
    AFTER UPDATE ON public.ai_categorization_logs
    FOR EACH ROW
    EXECUTE FUNCTION public.trigger_update_ai_accuracy();

-- Add AI categorization feature flag to user profiles
ALTER TABLE public.profiles ADD COLUMN ai_categorization_enabled BOOLEAN DEFAULT true;
ALTER TABLE public.profiles ADD COLUMN ai_categorization_auto_apply BOOLEAN DEFAULT false;

-- Create function to get AI categorization suggestions for a transaction
CREATE OR REPLACE FUNCTION public.get_ai_categorization_suggestions(
    transaction_desc TEXT,
    transaction_amt DECIMAL,
    user_uuid UUID
)
RETURNS TABLE (
    category_id UUID,
    category_name TEXT,
    confidence INTEGER,
    reasoning TEXT
) AS $$
BEGIN
    -- This is a placeholder function that would integrate with the AI service
    -- In practice, this would call the AI categorization API
    RETURN QUERY
    SELECT 
        c.id,
        c.name,
        80 as confidence,
        'AI suggestion based on transaction pattern' as reasoning
    FROM public.categories c
    WHERE c.user_id = user_uuid
    AND c.is_active = true
    LIMIT 3;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON public.ai_categorization_logs TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.ai_categorization_accuracy TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_ai_categorization_accuracy(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_ai_categorization_suggestions(TEXT, DECIMAL, UUID) TO authenticated;