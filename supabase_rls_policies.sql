-- ============================================================================
-- HYNAOS — Supabase Row Level Security (RLS) Policies
-- Run this script in the Supabase SQL Editor to secure the database.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Enable RLS on all tables
-- ----------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.salaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- 2. Helper Functions
-- ----------------------------------------------------------------------------
-- Function to check if the current user is an admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id::text = auth.uid()::text AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ----------------------------------------------------------------------------
-- 3. Policies for Profiles
-- ----------------------------------------------------------------------------
-- Everyone can view profiles (for company directory)
CREATE POLICY "Profiles are viewable by all authenticated users" 
ON public.profiles FOR SELECT 
TO authenticated 
USING (true);

-- Users can update their own non-sensitive profile data (e.g., avatar, phone)
CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE 
TO authenticated 
USING (auth.uid()::text = id::text);

-- Admins can do everything
CREATE POLICY "Admins have full access to profiles" 
ON public.profiles FOR ALL 
TO authenticated 
USING (public.is_admin());

-- ----------------------------------------------------------------------------
-- 4. Policies for Salaries (HIGHLY SENSITIVE)
-- ----------------------------------------------------------------------------
-- Employees can ONLY view their own salary
CREATE POLICY "Employees can view own salary" 
ON public.salaries FOR SELECT 
TO authenticated 
USING (employee_id = (SELECT employee_id FROM public.profiles WHERE id::text = auth.uid()::text));

-- Admins can do everything
CREATE POLICY "Admins have full access to salaries" 
ON public.salaries FOR ALL 
TO authenticated 
USING (public.is_admin());

-- ----------------------------------------------------------------------------
-- 5. Policies for Performance Reviews (SENSITIVE)
-- ----------------------------------------------------------------------------
-- Employees can ONLY view their own reviews
CREATE POLICY "Employees can view own reviews" 
ON public.performance_reviews FOR SELECT 
TO authenticated 
USING (employee_id = (SELECT employee_id FROM public.profiles WHERE id::text = auth.uid()::text));

-- Admins can do everything
CREATE POLICY "Admins have full access to performance reviews" 
ON public.performance_reviews FOR ALL 
TO authenticated 
USING (public.is_admin());

-- ----------------------------------------------------------------------------
-- 6. Policies for Attendance & Work Logs & Leave Requests
-- ----------------------------------------------------------------------------
-- Employees can view and insert their own records
CREATE POLICY "Employees can view own records (attendance, logs, leaves)" 
ON public.attendance FOR SELECT TO authenticated 
USING (employee_id = (SELECT employee_id FROM public.profiles WHERE id::text = auth.uid()::text));

CREATE POLICY "Employees can insert own attendance" 
ON public.attendance FOR INSERT TO authenticated 
WITH CHECK (employee_id = (SELECT employee_id FROM public.profiles WHERE id::text = auth.uid()::text));

CREATE POLICY "Employees can view own work logs" 
ON public.work_logs FOR SELECT TO authenticated 
USING (employee_name = (SELECT full_name FROM public.profiles WHERE id::text = auth.uid()::text));

CREATE POLICY "Employees can insert own work logs" 
ON public.work_logs FOR INSERT TO authenticated 
WITH CHECK (employee_name = (SELECT full_name FROM public.profiles WHERE id::text = auth.uid()::text));

CREATE POLICY "Employees can view own leave requests" 
ON public.leave_requests FOR SELECT TO authenticated 
USING (employee_name = (SELECT full_name FROM public.profiles WHERE id::text = auth.uid()::text));

CREATE POLICY "Employees can insert own leave requests" 
ON public.leave_requests FOR INSERT TO authenticated 
WITH CHECK (employee_name = (SELECT full_name FROM public.profiles WHERE id::text = auth.uid()::text));

-- Admins can do everything on these tables
CREATE POLICY "Admins have full access to attendance" 
ON public.attendance FOR ALL TO authenticated USING (public.is_admin());
CREATE POLICY "Admins have full access to work_logs" 
ON public.work_logs FOR ALL TO authenticated USING (public.is_admin());
CREATE POLICY "Admins have full access to leave_requests" 
ON public.leave_requests FOR ALL TO authenticated USING (public.is_admin());

-- ----------------------------------------------------------------------------
-- 7. Policies for Projects, Tasks, Announcements (Shared/Public Internal)
-- ----------------------------------------------------------------------------
-- All authenticated users can view these
CREATE POLICY "All users can view projects" ON public.projects FOR SELECT TO authenticated USING (true);
CREATE POLICY "All users can view tasks" ON public.tasks FOR SELECT TO authenticated USING (true);
CREATE POLICY "All users can view announcements" ON public.announcements FOR SELECT TO authenticated USING (true);
CREATE POLICY "All users can view metrics" ON public.analytics_metrics FOR SELECT TO authenticated USING (true);

-- Employees can update tasks assigned to them (progress/status)
CREATE POLICY "Employees can update their assigned tasks" 
ON public.tasks FOR UPDATE TO authenticated 
USING (assignee_name = (SELECT full_name FROM public.profiles WHERE id::text = auth.uid()::text));

-- Admins can do everything on these tables
CREATE POLICY "Admins have full access to projects" ON public.projects FOR ALL TO authenticated USING (public.is_admin());
CREATE POLICY "Admins have full access to tasks" ON public.tasks FOR ALL TO authenticated USING (public.is_admin());
CREATE POLICY "Admins have full access to announcements" ON public.announcements FOR ALL TO authenticated USING (public.is_admin());
CREATE POLICY "Admins have full access to metrics" ON public.analytics_metrics FOR ALL TO authenticated USING (public.is_admin());
