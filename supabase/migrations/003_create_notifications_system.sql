-- =============================================================================
-- Personal Finance Management System - Notifications System
-- Migration 003: Notifications Table and Triggers for Budget/Goal Alerts
-- =============================================================================

-- Create notification types enum
CREATE TYPE notification_type AS ENUM (
    'budget_alert',
    'goal_milestone', 
    'transaction_alert',
    'info'
);

-- Create notifications table
CREATE TABLE public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type notification_type NOT NULL DEFAULT 'info',
    is_read BOOLEAN DEFAULT false,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on notifications table
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for notifications table
CREATE POLICY "Users can view own notifications" 
    ON public.notifications 
    FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notifications" 
    ON public.notifications 
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" 
    ON public.notifications 
    FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notifications" 
    ON public.notifications 
    FOR DELETE 
    USING (auth.uid() = user_id);

-- Create indexes for notifications
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_type ON public.notifications(type);
CREATE INDEX idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);

-- Add updated_at trigger
CREATE TRIGGER update_notifications_updated_at
    BEFORE UPDATE ON public.notifications
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================================================
-- NOTIFICATION FUNCTIONS
-- =============================================================================

-- Function to create a notification
CREATE OR REPLACE FUNCTION public.create_notification(
    p_user_id UUID,
    p_title TEXT,
    p_message TEXT,
    p_type notification_type DEFAULT 'info',
    p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
    notification_id UUID;
BEGIN
    INSERT INTO public.notifications (user_id, title, message, type, metadata)
    VALUES (p_user_id, p_title, p_message, p_type, p_metadata)
    RETURNING id INTO notification_id;
    
    RETURN notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- BUDGET ALERT FUNCTIONS AND TRIGGERS
-- =============================================================================

-- Function to check budget limits when transactions are added/updated
CREATE OR REPLACE FUNCTION public.check_budget_limits()
RETURNS TRIGGER AS $$
DECLARE
    budget_record RECORD;
    total_spent DECIMAL(15,2);
    budget_percentage DECIMAL(5,2);
    notification_title TEXT;
    notification_message TEXT;
    notification_metadata JSONB;
BEGIN
    -- Only process expense transactions
    IF NEW.transaction_type != 'expense' THEN
        RETURN NEW;
    END IF;
    
    -- Check all active budgets for this user and category
    FOR budget_record IN 
        SELECT b.*, c.name as category_name
        FROM public.budgets b
        LEFT JOIN public.categories c ON b.category_id = c.id
        WHERE b.user_id = NEW.user_id 
        AND b.category_id = NEW.category_id
        AND b.is_active = true
        AND (b.end_date IS NULL OR b.end_date >= CURRENT_DATE)
    LOOP
        -- Calculate total spent in this budget period
        SELECT COALESCE(SUM(ABS(amount)), 0) INTO total_spent
        FROM public.transactions
        WHERE user_id = NEW.user_id
        AND category_id = NEW.category_id
        AND transaction_type = 'expense'
        AND transaction_date >= budget_record.start_date
        AND (budget_record.end_date IS NULL OR transaction_date <= budget_record.end_date);
        
        -- Calculate percentage of budget used
        budget_percentage := (total_spent / budget_record.amount) * 100;
        
        -- Create notification metadata
        notification_metadata := jsonb_build_object(
            'budget_id', budget_record.id,
            'budget_name', budget_record.name,
            'category_name', budget_record.category_name,
            'budgeted_amount', budget_record.amount,
            'spent_amount', total_spent,
            'percentage_used', budget_percentage,
            'transaction_id', NEW.id
        );
        
        -- Check if budget is exceeded (100%+)
        IF budget_percentage >= 100 THEN
            notification_title := 'Budget Exceeded!';
            notification_message := format(
                'You have exceeded your "%s" budget by $%.2f (%.1f%% used)',
                budget_record.name,
                total_spent - budget_record.amount,
                budget_percentage
            );
            
            PERFORM public.create_notification(
                NEW.user_id,
                notification_title,
                notification_message,
                'budget_alert',
                notification_metadata
            );
            
        -- Check if budget is at 80% threshold
        ELSIF budget_percentage >= 80 AND budget_percentage < 100 THEN
            notification_title := 'Budget Warning';
            notification_message := format(
                'You have used %.1f%% of your "%s" budget ($%.2f of $%.2f)',
                budget_percentage,
                budget_record.name,
                total_spent,
                budget_record.amount
            );
            
            PERFORM public.create_notification(
                NEW.user_id,
                notification_title,
                notification_message,
                'budget_alert',
                notification_metadata
            );
        END IF;
    END LOOP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for budget checking
CREATE TRIGGER check_budget_limits_trigger
    AFTER INSERT OR UPDATE ON public.transactions
    FOR EACH ROW
    EXECUTE FUNCTION public.check_budget_limits();

-- =============================================================================
-- GOAL MILESTONE FUNCTIONS AND TRIGGERS
-- =============================================================================

-- Function to check goal milestones when goals are updated
CREATE OR REPLACE FUNCTION public.check_goal_milestones()
RETURNS TRIGGER AS $$
DECLARE
    progress_percentage DECIMAL(5,2);
    old_progress_percentage DECIMAL(5,2);
    notification_title TEXT;
    notification_message TEXT;
    notification_metadata JSONB;
    milestone_reached INTEGER;
BEGIN
    -- Calculate current and old progress percentages
    progress_percentage := (NEW.current_amount / NEW.target_amount) * 100;
    
    IF TG_OP = 'UPDATE' THEN
        old_progress_percentage := (OLD.current_amount / OLD.target_amount) * 100;
    ELSE
        old_progress_percentage := 0;
    END IF;
    
    -- Create notification metadata
    notification_metadata := jsonb_build_object(
        'goal_id', NEW.id,
        'goal_name', NEW.name,
        'target_amount', NEW.target_amount,
        'current_amount', NEW.current_amount,
        'progress_percentage', progress_percentage,
        'old_progress_percentage', old_progress_percentage
    );
    
    -- Check for goal completion (100%)
    IF progress_percentage >= 100 AND old_progress_percentage < 100 THEN
        notification_title := '🎉 Goal Completed!';
        notification_message := format(
            'Congratulations! You have completed your goal "%s" with $%.2f',
            NEW.name,
            NEW.current_amount
        );
        
        PERFORM public.create_notification(
            NEW.user_id,
            notification_title,
            notification_message,
            'goal_milestone',
            notification_metadata
        );
        
    -- Check for major milestones (25%, 50%, 75%)
    ELSE
        -- Check which milestone was reached
        FOR milestone_reached IN SELECT * FROM unnest(ARRAY[25, 50, 75]) LOOP
            IF progress_percentage >= milestone_reached AND old_progress_percentage < milestone_reached THEN
                notification_title := format('🎯 %s%% Progress!', milestone_reached);
                notification_message := format(
                    'Great progress! You are %s%% towards your goal "%s" ($%.2f of $%.2f)',
                    milestone_reached,
                    NEW.name,
                    NEW.current_amount,
                    NEW.target_amount
                );
                
                PERFORM public.create_notification(
                    NEW.user_id,
                    notification_title,
                    notification_message,
                    'goal_milestone',
                    notification_metadata
                );
                
                EXIT; -- Only notify for the first milestone reached
            END IF;
        END LOOP;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for goal milestones
CREATE TRIGGER check_goal_milestones_trigger
    AFTER UPDATE ON public.goals
    FOR EACH ROW
    WHEN (NEW.current_amount != OLD.current_amount)
    EXECUTE FUNCTION public.check_goal_milestones();

-- =============================================================================
-- UTILITY FUNCTIONS
-- =============================================================================

-- Function to mark notification as read
CREATE OR REPLACE FUNCTION public.mark_notification_read(notification_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE public.notifications 
    SET is_read = true, updated_at = NOW()
    WHERE id = notification_id AND user_id = auth.uid();
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark all notifications as read for a user
CREATE OR REPLACE FUNCTION public.mark_all_notifications_read()
RETURNS INTEGER AS $$
DECLARE
    updated_count INTEGER;
BEGIN
    UPDATE public.notifications 
    SET is_read = true, updated_at = NOW()
    WHERE user_id = auth.uid() AND is_read = false;
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to delete old notifications (cleanup)
CREATE OR REPLACE FUNCTION public.cleanup_old_notifications(days_old INTEGER DEFAULT 30)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM public.notifications 
    WHERE created_at < NOW() - INTERVAL '1 day' * days_old
    AND is_read = true;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;