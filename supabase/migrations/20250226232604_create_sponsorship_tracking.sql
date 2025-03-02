-- First, create profiles table if it doesn't exist yet
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    username TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    website TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create enum type for sponsorship status
CREATE TYPE sponsorship_status AS ENUM (
  'pending',
  'under_review', 
  'approved',
  'rejected',
  'changes_requested'
);

-- Create main sponsorship requests table
-- Modified to reference id in profiles table instead of username
CREATE TABLE sponsorship_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    requirements TEXT NOT NULL,
    target_criteria TEXT NOT NULL,
    event_date DATE NOT NULL,
    event_category TEXT NOT NULL,
    expected_footfall INTEGER NOT NULL,
    application_deadline DATE NOT NULL,
    status sponsorship_status NOT NULL DEFAULT 'pending',
    reviewer_id UUID REFERENCES auth.users(id),
    review_date TIMESTAMP WITH TIME ZONE,
    feedback TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create status history tracking table
CREATE TABLE sponsorship_status_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sponsorship_id UUID REFERENCES sponsorship_requests(id) NOT NULL,
    previous_status sponsorship_status NOT NULL,
    new_status sponsorship_status NOT NULL,
    changed_by UUID REFERENCES auth.users(id) NOT NULL,
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reason TEXT
);

-- Create change requests table
CREATE TABLE sponsorship_change_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sponsorship_id UUID REFERENCES sponsorship_requests(id) NOT NULL,
    field_name TEXT NOT NULL,
    current_value TEXT NOT NULL,
    requested_value TEXT NOT NULL,
    requested_by UUID REFERENCES auth.users(id) NOT NULL,
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status sponsorship_status NOT NULL DEFAULT 'pending',
    response_message TEXT,
    responded_at TIMESTAMP WITH TIME ZONE,
    responded_by UUID REFERENCES auth.users(id)
);

-- Create notifications table
CREATE TABLE sponsorship_notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sponsorship_id UUID REFERENCES sponsorship_requests(id) NOT NULL,
    recipient_id UUID REFERENCES auth.users(id) NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('status_change', 'change_request', 'reminder', 'feedback')),
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    read_at TIMESTAMP WITH TIME ZONE,
    action_url TEXT
);

-- Add indexes for better query performance
CREATE INDEX idx_sponsorship_requests_user_id ON sponsorship_requests(user_id);
CREATE INDEX idx_sponsorship_requests_status ON sponsorship_requests(status);
CREATE INDEX idx_sponsorship_status_history_sponsorship_id ON sponsorship_status_history(sponsorship_id);
CREATE INDEX idx_sponsorship_change_requests_sponsorship_id ON sponsorship_change_requests(sponsorship_id);
CREATE INDEX idx_sponsorship_notifications_recipient_id ON sponsorship_notifications(recipient_id);
CREATE INDEX idx_sponsorship_notifications_unread ON sponsorship_notifications(recipient_id) WHERE read_at IS NULL;

-- Add RLS policies
ALTER TABLE sponsorship_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE sponsorship_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE sponsorship_change_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE sponsorship_notifications ENABLE ROW LEVEL SECURITY;

-- Users can view their own sponsorships
CREATE POLICY "Users can view own sponsorships"
ON sponsorship_requests
FOR SELECT
USING (auth.uid() = user_id);

-- Users can create their own sponsorships
CREATE POLICY "Users can create own sponsorships"
ON sponsorship_requests
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Only admins can update sponsorship status
CREATE POLICY "Only admins can update sponsorships"
ON sponsorship_requests
FOR UPDATE
USING (
    EXISTS (
        SELECT 1
        FROM auth.users
        WHERE auth.users.id = auth.uid()
        AND role = 'admin'
    )
);

-- Create timestamp trigger function if it doesn't already exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at trigger to sponsorship_requests
CREATE TRIGGER update_sponsorship_requests_updated_at
    BEFORE UPDATE ON sponsorship_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create function to record status changes
CREATE OR REPLACE FUNCTION record_sponsorship_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO sponsorship_status_history (
            sponsorship_id,
            previous_status,
            new_status,
            changed_by,
            reason
        ) VALUES (
            NEW.id,
            OLD.status,
            NEW.status,
            auth.uid(),
            NEW.feedback
        );

        -- Create notification for status change
        INSERT INTO sponsorship_notifications (
            sponsorship_id,
            recipient_id,
            type,
            message,
            action_url
        )
        SELECT
            NEW.id,
            NEW.user_id,
            'status_change',
            CASE NEW.status
                WHEN 'approved' THEN 'Your sponsorship request has been approved!'
                WHEN 'rejected' THEN 'Your sponsorship request has been rejected.'
                WHEN 'changes_requested' THEN 'Changes have been requested for your sponsorship.'
                WHEN 'under_review' THEN 'Your sponsorship request is under review.'
                ELSE 'Your sponsorship status has been updated.'
            END,
            '/sponsorships/' || NEW.id;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add status change trigger to sponsorship_requests
CREATE TRIGGER record_sponsorship_status_changes
    AFTER UPDATE OF status ON sponsorship_requests
    FOR EACH ROW
    EXECUTE FUNCTION record_sponsorship_status_change();

-- Comments for documentation
COMMENT ON TABLE public.profiles IS 'Stores user profile information';
COMMENT ON TABLE sponsorship_requests IS 'Stores main sponsorship request information';
COMMENT ON TABLE sponsorship_status_history IS 'Tracks all status changes for sponsorship requests';
COMMENT ON TABLE sponsorship_change_requests IS 'Tracks change requests for sponsorship details';
COMMENT ON TABLE sponsorship_notifications IS 'Stores notifications for sponsorship updates';