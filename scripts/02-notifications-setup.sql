-- Create notification types enum
CREATE TYPE notification_type AS ENUM (
  'inspection_assigned',
  'inspection_completed',
  'inspection_reviewed',
  'status_changed',
  'urgent_alert',
  'system_announcement',
  'user_mention'
);

-- Create notification priorities enum
CREATE TYPE notification_priority AS ENUM ('low', 'medium', 'high', 'urgent');

-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  recipient_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  type notification_type NOT NULL,
  priority notification_priority DEFAULT 'medium',
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  read_at TIMESTAMP WITH TIME ZONE,
  dismissed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create notification preferences table
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  email_enabled BOOLEAN DEFAULT true,
  push_enabled BOOLEAN DEFAULT true,
  inspection_assigned_email BOOLEAN DEFAULT true,
  inspection_assigned_push BOOLEAN DEFAULT true,
  inspection_completed_email BOOLEAN DEFAULT true,
  inspection_completed_push BOOLEAN DEFAULT true,
  inspection_reviewed_email BOOLEAN DEFAULT false,
  inspection_reviewed_push BOOLEAN DEFAULT true,
  status_changed_email BOOLEAN DEFAULT true,
  status_changed_push BOOLEAN DEFAULT true,
  urgent_alert_email BOOLEAN DEFAULT true,
  urgent_alert_push BOOLEAN DEFAULT true,
  system_announcement_email BOOLEAN DEFAULT false,
  system_announcement_push BOOLEAN DEFAULT true,
  email_frequency VARCHAR(20) DEFAULT 'immediate' CHECK (email_frequency IN ('immediate', 'hourly', 'daily', 'weekly')),
  quiet_hours_start TIME DEFAULT '22:00',
  quiet_hours_end TIME DEFAULT '08:00',
  timezone VARCHAR(50) DEFAULT 'UTC',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create notification queue for email processing
CREATE TABLE IF NOT EXISTS public.notification_queue (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  notification_id UUID REFERENCES public.notifications(id) ON DELETE CASCADE NOT NULL,
  email_address VARCHAR(255) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'cancelled')),
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  scheduled_for TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  sent_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_created ON public.notifications(recipient_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON public.notifications(recipient_id, read_at) WHERE read_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_notification_queue_status ON public.notification_queue(status, scheduled_for);

-- Function to create default notification preferences for new users
CREATE OR REPLACE FUNCTION public.create_default_notification_preferences()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.notification_preferences (user_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create default preferences for new users
DROP TRIGGER IF EXISTS on_user_created_notification_prefs ON public.users;
CREATE TRIGGER on_user_created_notification_prefs
  AFTER INSERT ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.create_default_notification_preferences();

-- Function to automatically create notifications for inspection status changes
CREATE OR REPLACE FUNCTION public.handle_inspection_status_change()
RETURNS TRIGGER AS $$
DECLARE
  notification_title TEXT;
  notification_message TEXT;
  admin_user_id UUID;
BEGIN
  -- Only create notifications for status changes
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    -- Determine notification content based on status
    CASE NEW.status
      WHEN 'completed' THEN
        notification_title := 'Inspection Completed';
        notification_message := 'Inspection for ' || NEW.client_name || ' has been completed and is ready for review.';
      WHEN 'reviewed' THEN
        notification_title := 'Inspection Reviewed';
        notification_message := 'Your inspection for ' || NEW.client_name || ' has been reviewed.';
      ELSE
        notification_title := 'Inspection Status Changed';
        notification_message := 'Inspection for ' || NEW.client_name || ' status changed to ' || NEW.status || '.';
    END CASE;

    -- Notify the inspector
    INSERT INTO public.notifications (recipient_id, type, priority, title, message, data)
    VALUES (
      NEW.inspector_id,
      'status_changed',
      CASE WHEN NEW.status = 'reviewed' THEN 'high' ELSE 'medium' END,
      notification_title,
      notification_message,
      jsonb_build_object(
        'inspection_id', NEW.id,
        'client_name', NEW.client_name,
        'old_status', OLD.status,
        'new_status', NEW.status
      )
    );

    -- If completed, notify all admins
    IF NEW.status = 'completed' THEN
      FOR admin_user_id IN 
        SELECT id FROM public.users WHERE role = 'admin'
      LOOP
        INSERT INTO public.notifications (recipient_id, sender_id, type, priority, title, message, data)
        VALUES (
          admin_user_id,
          NEW.inspector_id,
          'inspection_completed',
          'high',
          'New Inspection Ready for Review',
          'Inspection for ' || NEW.client_name || ' by ' || (SELECT full_name FROM public.users WHERE id = NEW.inspector_id) || ' is ready for review.',
          jsonb_build_object(
            'inspection_id', NEW.id,
            'client_name', NEW.client_name,
            'inspector_name', (SELECT full_name FROM public.users WHERE id = NEW.inspector_id)
          )
        );
      END LOOP;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for inspection status changes
DROP TRIGGER IF EXISTS on_inspection_status_changed ON public.inspection_reports;
CREATE TRIGGER on_inspection_status_changed
  AFTER UPDATE ON public.inspection_reports
  FOR EACH ROW EXECUTE FUNCTION public.handle_inspection_status_change();

-- Enable RLS on new tables
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_queue ENABLE ROW LEVEL SECURITY;

-- RLS Policies for notifications
CREATE POLICY "Users can view own notifications" ON public.notifications
  FOR SELECT USING (recipient_id = auth.uid());

CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE USING (recipient_id = auth.uid());

CREATE POLICY "Admins can create notifications" ON public.notifications
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    OR auth.uid() = sender_id
  );

-- RLS Policies for notification preferences
CREATE POLICY "Users can manage own preferences" ON public.notification_preferences
  FOR ALL USING (user_id = auth.uid());

-- RLS Policies for notification queue (admin only)
CREATE POLICY "Admins can manage notification queue" ON public.notification_queue
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- Grant permissions
GRANT ALL ON public.notifications TO authenticated;
GRANT ALL ON public.notification_preferences TO authenticated;
GRANT ALL ON public.notification_queue TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
