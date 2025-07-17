-- Create ML predictions table
CREATE TABLE public.ml_predictions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    transaction_description TEXT NOT NULL,
    transaction_amount DECIMAL(15,2) NOT NULL,
    predicted_category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    confidence INTEGER NOT NULL CHECK (confidence >= 0 AND confidence <= 100),
    reasoning TEXT,
    model_version TEXT DEFAULT '1.0.0',
    prediction_sources JSONB DEFAULT '[]',
    alternatives JSONB DEFAULT '[]',
    model_accuracy DECIMAL(5,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create ML feedback table
CREATE TABLE public.ml_feedback (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    transaction_id UUID REFERENCES public.transactions(id) ON DELETE CASCADE,
    predicted_category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    actual_category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    confidence INTEGER NOT NULL CHECK (confidence >= 0 AND confidence <= 100),
    was_correct BOOLEAN NOT NULL,
    model_version TEXT DEFAULT '1.0.0',
    prediction_sources JSONB DEFAULT '[]',
    feedback_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create ML accuracy stats table
CREATE TABLE public.ml_accuracy_stats (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    total_predictions INTEGER DEFAULT 0,
    correct_predictions INTEGER DEFAULT 0,
    accuracy_percentage DECIMAL(5,2) DEFAULT 0,
    high_confidence_predictions INTEGER DEFAULT 0,
    high_confidence_correct INTEGER DEFAULT 0,
    high_confidence_accuracy DECIMAL(5,2) DEFAULT 0,
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT unique_user_ml_stats UNIQUE (user_id)
);

-- Create user ML models table for persistence
CREATE TABLE public.user_ml_models (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    model_data JSONB NOT NULL,
    accuracy DECIMAL(5,2) DEFAULT 0,
    total_predictions INTEGER DEFAULT 0,
    correct_predictions INTEGER DEFAULT 0,
    pattern_count INTEGER DEFAULT 0,
    last_trained TIMESTAMPTZ DEFAULT NOW(),
    model_version TEXT DEFAULT '1.0.0',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT unique_user_model UNIQUE (user_id)
);

-- Create ML training sessions table
CREATE TABLE public.ml_training_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    training_data_count INTEGER NOT NULL,
    accuracy_before DECIMAL(5,2) DEFAULT 0,
    accuracy_after DECIMAL(5,2) DEFAULT 0,
    training_duration_ms INTEGER,
    model_version TEXT DEFAULT '1.0.0',
    training_type TEXT DEFAULT 'incremental', -- 'full', 'incremental', 'validation'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_ml_predictions_user_id ON public.ml_predictions(user_id);
CREATE INDEX idx_ml_predictions_created_at ON public.ml_predictions(created_at);
CREATE INDEX idx_ml_predictions_confidence ON public.ml_predictions(confidence);
CREATE INDEX idx_ml_predictions_category ON public.ml_predictions(predicted_category_id);

CREATE INDEX idx_ml_feedback_user_id ON public.ml_feedback(user_id);
CREATE INDEX idx_ml_feedback_transaction_id ON public.ml_feedback(transaction_id);
CREATE INDEX idx_ml_feedback_created_at ON public.ml_feedback(created_at);
CREATE INDEX idx_ml_feedback_was_correct ON public.ml_feedback(was_correct);

CREATE INDEX idx_ml_accuracy_stats_user_id ON public.ml_accuracy_stats(user_id);
CREATE INDEX idx_ml_accuracy_stats_accuracy ON public.ml_accuracy_stats(accuracy_percentage);

CREATE INDEX idx_user_ml_models_user_id ON public.user_ml_models(user_id);
CREATE INDEX idx_user_ml_models_updated_at ON public.user_ml_models(updated_at);

CREATE INDEX idx_ml_training_sessions_user_id ON public.ml_training_sessions(user_id);
CREATE INDEX idx_ml_training_sessions_created_at ON public.ml_training_sessions(created_at);

-- Create RLS policies
ALTER TABLE public.ml_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ml_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ml_accuracy_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_ml_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ml_training_sessions ENABLE ROW LEVEL SECURITY;

-- ML predictions policies
CREATE POLICY "Users can view their own ML predictions"
    ON public.ml_predictions
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own ML predictions"
    ON public.ml_predictions
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- ML feedback policies
CREATE POLICY "Users can view their own ML feedback"
    ON public.ml_feedback
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own ML feedback"
    ON public.ml_feedback
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own ML feedback"
    ON public.ml_feedback
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- ML accuracy stats policies
CREATE POLICY "Users can view their own ML accuracy stats"
    ON public.ml_accuracy_stats
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own ML accuracy stats"
    ON public.ml_accuracy_stats
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own ML accuracy stats"
    ON public.ml_accuracy_stats
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- User ML models policies
CREATE POLICY "Users can view their own ML models"
    ON public.user_ml_models
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own ML models"
    ON public.user_ml_models
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own ML models"
    ON public.user_ml_models
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- ML training sessions policies
CREATE POLICY "Users can view their own ML training sessions"
    ON public.ml_training_sessions
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own ML training sessions"
    ON public.ml_training_sessions
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Function to update ML accuracy stats automatically
CREATE OR REPLACE FUNCTION public.update_ml_accuracy_stats_from_feedback()
RETURNS TRIGGER AS $$
BEGIN
    -- Update or insert ML accuracy stats
    INSERT INTO public.ml_accuracy_stats (
        user_id,
        total_predictions,
        correct_predictions,
        accuracy_percentage,
        high_confidence_predictions,
        high_confidence_correct,
        high_confidence_accuracy,
        last_updated
    )
    SELECT 
        NEW.user_id,
        COUNT(*),
        COUNT(*) FILTER (WHERE was_correct = true),
        CASE 
            WHEN COUNT(*) > 0 THEN (COUNT(*) FILTER (WHERE was_correct = true)::DECIMAL / COUNT(*)) * 100
            ELSE 0
        END,
        COUNT(*) FILTER (WHERE confidence >= 80),
        COUNT(*) FILTER (WHERE confidence >= 80 AND was_correct = true),
        CASE 
            WHEN COUNT(*) FILTER (WHERE confidence >= 80) > 0 THEN 
                (COUNT(*) FILTER (WHERE confidence >= 80 AND was_correct = true)::DECIMAL / COUNT(*) FILTER (WHERE confidence >= 80)) * 100
            ELSE 0
        END,
        NOW()
    FROM public.ml_feedback
    WHERE user_id = NEW.user_id
    ON CONFLICT (user_id) DO UPDATE SET
        total_predictions = EXCLUDED.total_predictions,
        correct_predictions = EXCLUDED.correct_predictions,
        accuracy_percentage = EXCLUDED.accuracy_percentage,
        high_confidence_predictions = EXCLUDED.high_confidence_predictions,
        high_confidence_correct = EXCLUDED.high_confidence_correct,
        high_confidence_accuracy = EXCLUDED.high_confidence_accuracy,
        last_updated = EXCLUDED.last_updated;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update ML accuracy stats when feedback is added
CREATE TRIGGER update_ml_accuracy_stats_trigger
    AFTER INSERT ON public.ml_feedback
    FOR EACH ROW
    EXECUTE FUNCTION public.update_ml_accuracy_stats_from_feedback();

-- Function to get ML categorization suggestions
CREATE OR REPLACE FUNCTION public.get_ml_categorization_suggestions(
    transaction_desc TEXT,
    transaction_amt DECIMAL,
    user_uuid UUID
)
RETURNS TABLE (
    category_id UUID,
    category_name TEXT,
    confidence INTEGER,
    reasoning TEXT,
    prediction_sources JSONB
) AS $$
BEGIN
    -- This function would integrate with the ML service
    -- For now, return a placeholder that promotes learning
    RETURN QUERY
    SELECT 
        c.id,
        c.name,
        CASE 
            WHEN ml_stats.accuracy_percentage > 80 THEN 85
            WHEN ml_stats.accuracy_percentage > 60 THEN 70
            ELSE 60
        END::INTEGER as confidence,
        'ML model suggestion based on historical patterns'::TEXT as reasoning,
        '["patterns", "ml"]'::JSONB as prediction_sources
    FROM public.categories c
    LEFT JOIN public.ml_accuracy_stats ml_stats ON ml_stats.user_id = user_uuid
    WHERE c.user_id = user_uuid
    AND c.is_active = true
    ORDER BY 
        CASE 
            WHEN LOWER(transaction_desc) LIKE '%' || LOWER(c.name) || '%' THEN 1
            ELSE 2
        END,
        c.created_at DESC
    LIMIT 3;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log ML model training
CREATE OR REPLACE FUNCTION public.log_ml_training_session(
    user_uuid UUID,
    data_count INTEGER,
    accuracy_before DECIMAL,
    accuracy_after DECIMAL,
    duration_ms INTEGER,
    model_version TEXT DEFAULT '1.0.0',
    training_type TEXT DEFAULT 'incremental'
)
RETURNS UUID AS $$
DECLARE
    session_id UUID;
BEGIN
    INSERT INTO public.ml_training_sessions (
        user_id,
        training_data_count,
        accuracy_before,
        accuracy_after,
        training_duration_ms,
        model_version,
        training_type
    ) VALUES (
        user_uuid,
        data_count,
        accuracy_before,
        accuracy_after,
        duration_ms,
        model_version,
        training_type
    ) RETURNING id INTO session_id;
    
    RETURN session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add ML settings to user profiles
ALTER TABLE public.profiles ADD COLUMN ml_enabled BOOLEAN DEFAULT true;
ALTER TABLE public.profiles ADD COLUMN ml_auto_categorization BOOLEAN DEFAULT true;
ALTER TABLE public.profiles ADD COLUMN ml_confidence_threshold INTEGER DEFAULT 80 CHECK (ml_confidence_threshold >= 0 AND ml_confidence_threshold <= 100);
ALTER TABLE public.profiles ADD COLUMN ml_last_trained TIMESTAMPTZ DEFAULT NOW();

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON public.ml_predictions TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.ml_feedback TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.ml_accuracy_stats TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.user_ml_models TO authenticated;
GRANT SELECT, INSERT ON public.ml_training_sessions TO authenticated;

GRANT EXECUTE ON FUNCTION public.get_ml_categorization_suggestions(TEXT, DECIMAL, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_ml_training_session(UUID, INTEGER, DECIMAL, DECIMAL, INTEGER, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_ml_accuracy_stats_from_feedback() TO authenticated;