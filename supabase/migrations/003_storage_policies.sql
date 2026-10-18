-- 003_storage_policies.sql
-- Storage bucket creation and access policies for Supabase Storage

-- Insert buckets if not present
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('item-photos', 'item-photos', true),
  ('claim-proofs', 'claim-proofs', false)
ON CONFLICT (id) DO NOTHING;

-- Policy 1: Anyone can view item photos (public bucket)
CREATE POLICY "Public read access for item-photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'item-photos');

-- Policy 2: Authenticated users can upload item photos
CREATE POLICY "Authenticated users can upload item photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'item-photos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 3: Claim proofs are accessible only by the claimant and admins
CREATE POLICY "Claimants and admins can view claim proofs"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'claim-proofs' AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
);

-- Policy 4: Authenticated users can upload their own claim proofs
CREATE POLICY "Authenticated users can upload claim proofs"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'claim-proofs' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
