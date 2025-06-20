-- Enhanced Database Setup for No Email Verification Flow
-- This ensures the database works properly without email verification

-- Function to automatically create user profile when auth user is created
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
INSERT INTO public.users (id, email, full_name, role)
VALUES (
  NEW.id,
  NEW.email,
  COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
  COALESCE(NEW.raw_user_meta_data->>'role', 'employee')::public.user_role -- Ensure casting to enum if 'role' is an enum
);
RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger to ensure it works with the updated function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Helper function to check current user's admin status (SECURITY DEFINER)
-- This function is used in RLS policies to prevent recursion.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN FALSE;
  END IF;
  RETURN EXISTS (
    SELECT 1
    FROM public.users -- This query runs as definer, RLS of caller not applied to *this* select
    WHERE public.users.id = auth.uid() AND public.users.role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Grant execute permission on is_admin to authenticated users
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;


-- Update RLS policies to not depend on email verification
-- Users can access their data regardless of email confirmation status

-- RLS for 'public.users' table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
CREATE POLICY "Users can view own profile" ON public.users
FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile" ON public.users
FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Admin policies for 'public.users' - Corrected to use is_admin()
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
CREATE POLICY "Admins can view all users" ON public.users
FOR SELECT USING (public.is_admin()); -- Use the helper function

DROP POLICY IF EXISTS "Admins can manage all users" ON public.users;
CREATE POLICY "Admins can manage all users" ON public.users
FOR ALL USING (public.is_admin()); -- Use the helper function


-- RLS for 'public.inspection_reports' table
ALTER TABLE public.inspection_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own reports" ON public.inspection_reports;
CREATE POLICY "Users can view own reports" ON public.inspection_reports
FOR SELECT USING (inspector_id = auth.uid()); -- Assuming inspector_id is the user's ID

DROP POLICY IF EXISTS "Users can manage own reports" ON public.inspection_reports;
CREATE POLICY "Users can manage own reports" ON public.inspection_reports
FOR ALL USING (inspector_id = auth.uid()); -- Assuming inspector_id is the user's ID

DROP POLICY IF EXISTS "Admins can view all reports" ON public.inspection_reports;
CREATE POLICY "Admins can view all reports" ON public.inspection_reports
FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can manage all reports" ON public.inspection_reports;
CREATE POLICY "Admins can manage all reports" ON public.inspection_reports
FOR ALL USING (public.is_admin());

-- RLS Policies for 'notifications' table
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own notifications." ON public.notifications;
CREATE POLICY "Users can view their own notifications." ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all notifications." ON public.notifications;
CREATE POLICY "Admins can view all notifications." ON public.notifications
  FOR SELECT USING (public.is_admin());


-- RPC function to check if an email exists (SECURITY DEFINER)
-- This is called by the AuthService.checkEmailExists method.
CREATE OR REPLACE FUNCTION public.rpc_check_email_exists(email_param TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  email_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM public.users
    WHERE email = email_param
  ) INTO email_exists;
  RETURN email_exists;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Grant execute permission on the RPC function to anon and authenticated roles
GRANT EXECUTE ON FUNCTION public.rpc_check_email_exists(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.rpc_check_email_exists(TEXT) TO authenticated;


-- Success message
SELECT 'Database updated for no email verification flow with RLS recursion fixes! 🎉' as status;
SELECT 'Users can now register and login immediately without email verification.' as message;
SELECT 'Admin RLS policies and email check function are updated.' as details;
