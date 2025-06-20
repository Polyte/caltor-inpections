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
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN FALSE;
  END IF;
  RETURN EXISTS (
    SELECT 1
    FROM public.users
    WHERE public.users.id = auth.uid() AND public.users.role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;


-- Update RLS policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
CREATE POLICY "Users can view own profile" ON public.users
FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile" ON public.users
FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
CREATE POLICY "Admins can view all users" ON public.users
FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can manage all users" ON public.users;
CREATE POLICY "Admins can manage all users" ON public.users
FOR ALL USING (public.is_admin());


ALTER TABLE public.inspection_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own reports" ON public.inspection_reports;
CREATE POLICY "Users can view own reports" ON public.inspection_reports
FOR SELECT USING (inspector_id = auth.uid());

DROP POLICY IF EXISTS "Users can manage own reports" ON public.inspection_reports;
CREATE POLICY "Users can manage own reports" ON public.inspection_reports
FOR ALL USING (inspector_id = auth.uid());

DROP POLICY IF EXISTS "Admins can view all reports" ON public.inspection_reports;
CREATE POLICY "Admins can view all reports" ON public.inspection_reports
FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can manage all reports" ON public.inspection_reports;
CREATE POLICY "Admins can manage all reports" ON public.inspection_reports
FOR ALL USING (public.is_admin());

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own notifications." ON public.notifications;
CREATE POLICY "Users can view their own notifications." ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all notifications." ON public.notifications;
CREATE POLICY "Admins can view all notifications." ON public.notifications
  FOR SELECT USING (public.is_admin());


-- RPC function to check if an email exists (SECURITY DEFINER)
DROP FUNCTION IF EXISTS public.rpc_check_email_exists(TEXT);
CREATE OR REPLACE FUNCTION public.rpc_check_email_exists(p_email TEXT) -- Simplified parameter name
RETURNS BOOLEAN AS $$
-- #variable_conflict use_variable -- psql directive, may not be needed in all environments
BEGIN
  -- SET search_path TO public; -- Usually not needed if objects are schema-qualified or function is in public
  RETURN EXISTS (
    SELECT 1
    FROM public.users -- Explicitly schema-qualify
    WHERE email = p_email -- Use the simplified parameter name
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Add a comment to the function, which can sometimes help refresh the cache
COMMENT ON FUNCTION public.rpc_check_email_exists(TEXT) IS 'Checks if an email exists in the public.users table. Parameter: p_email TEXT. Returns BOOLEAN.';

GRANT EXECUTE ON FUNCTION public.rpc_check_email_exists(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.rpc_check_email_exists(TEXT) TO authenticated;

-- Attempt to notify PostgREST to reload schema.
-- This is a direct approach. If it fails due to permissions, it's non-critical for the function itself but means cache refresh is manual.
DO $$
BEGIN
  PERFORM pg_notify('pgrst', 'reload schema');
  RAISE NOTICE 'Successfully sent pg_notify to pgrst channel.';
EXCEPTION
  WHEN insufficient_privilege THEN
    RAISE NOTICE 'Insufficient privilege to send pg_notify to pgrst. Schema reload might be delayed or require manual intervention.';
  WHEN undefined_object THEN
    RAISE NOTICE 'pg_notify or pgrst channel not available. Schema reload might be delayed or require manual intervention.';
  WHEN OTHERS THEN
    RAISE NOTICE 'An error occurred attempting to pg_notify pgrst: %', SQLERRM;
END;
$$;


-- Success message
SELECT 'Database updated for no email verification flow with RLS recursion fixes! 🎉' as status;
SELECT 'Users can now register and login immediately without email verification.' as message;
SELECT 'Admin RLS policies and email check function are updated.' as details;
