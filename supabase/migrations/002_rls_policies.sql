-- 002_rls_policies.sql
-- Row Level Security (RLS) Policies for Lost-Link

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campus_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.found_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lost_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.item_status_history ENABLE ROW LEVEL SECURITY;

-- Helper function: Is current user an admin?
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 1. PROFILES POLICIES
-- Anyone authenticated can view user profiles (needed to see finder/claimant name)
CREATE POLICY "Public profiles are readable by authenticated users"
ON public.profiles FOR SELECT
TO authenticated
USING (true);

-- Users can update only their own profile
CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Admins can update any profile (e.g., promote to admin/staff)
CREATE POLICY "Admins can update any profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (public.is_admin());

-- 2. CATEGORIES & CAMPUS LOCATIONS
CREATE POLICY "Anyone can view categories"
ON public.categories FOR SELECT
TO authenticated, anon
USING (true);

CREATE POLICY "Anyone can view campus locations"
ON public.campus_locations FOR SELECT
TO authenticated, anon
USING (true);

CREATE POLICY "Only admins can insert or update categories"
ON public.categories FOR ALL
TO authenticated
USING (public.is_admin());

CREATE POLICY "Only admins can insert or update locations"
ON public.campus_locations FOR ALL
TO authenticated
USING (public.is_admin());

-- 3. FOUND ITEMS POLICIES
-- Any authenticated user (and public) can view found items (inventory search)
CREATE POLICY "Anyone can browse found items"
ON public.found_items FOR SELECT
TO authenticated, anon
USING (true);

-- Authenticated users can report found items
CREATE POLICY "Authenticated users can report found items"
ON public.found_items FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = reported_by);

-- Reporter can edit their own reported item if it's still unclaimed
CREATE POLICY "Reporters can update their reported items if unclaimed"
ON public.found_items FOR UPDATE
TO authenticated
USING (auth.uid() = reported_by AND status = 'unclaimed')
WITH CHECK (auth.uid() = reported_by);

-- Admins can update any found item (change status, storage bin, verification)
CREATE POLICY "Admins can update any found item"
ON public.found_items FOR UPDATE
TO authenticated
USING (public.is_admin());

-- Admins can delete found items if needed
CREATE POLICY "Admins can delete found items"
ON public.found_items FOR DELETE
TO authenticated
USING (public.is_admin());

-- 4. LOST REPORTS POLICIES
-- Any authenticated user can read lost reports (to help spot matches or check own)
CREATE POLICY "Authenticated users can view lost reports"
ON public.lost_reports FOR SELECT
TO authenticated
USING (true);

-- Users can insert their own lost report
CREATE POLICY "Users can create lost reports"
ON public.lost_reports FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can update their own lost report
CREATE POLICY "Users can update their own lost reports"
ON public.lost_reports FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own lost report
CREATE POLICY "Users can delete their own lost reports"
ON public.lost_reports FOR DELETE
TO authenticated
USING (auth.uid() = user_id OR public.is_admin());

-- 5. CLAIMS POLICIES
-- Claimants can view their own claims; Admins can view all claims
CREATE POLICY "Users can view their own claims"
ON public.claims FOR SELECT
TO authenticated
USING (auth.uid() = claimant_id OR public.is_admin());

-- Users can submit a claim for an item
CREATE POLICY "Users can create a claim"
ON public.claims FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = claimant_id);

-- Only Admins can update claim status (approve/reject/add notes)
CREATE POLICY "Admins can review and update claims"
ON public.claims FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- 6. ITEM STATUS AUDIT HISTORY POLICIES
-- Anyone can view the audit history of an item for campus transparency
CREATE POLICY "Anyone can view status history"
ON public.item_status_history FOR SELECT
TO authenticated
USING (true);

-- Inserts are triggered via database function or authenticated staff
CREATE POLICY "Authenticated users can append audit history"
ON public.item_status_history FOR INSERT
TO authenticated
WITH CHECK (true);
