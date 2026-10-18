-- 001_initial_schema.sql
-- Lost-Link: Initial PostgreSQL Schema for Supabase

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES TABLE (Linked to Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    college_email TEXT UNIQUE NOT NULL,
    roll_number TEXT NOT NULL,
    phone_number TEXT,
    role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'staff', 'admin')),
    department TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    icon TEXT NOT NULL DEFAULT 'Tag',
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. CAMPUS LOCATIONS TABLE
CREATE TABLE IF NOT EXISTS public.campus_locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    building TEXT NOT NULL,
    zone TEXT NOT NULL, -- e.g. Academic, Residential, Sports, Dining
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. FOUND ITEMS TABLE
CREATE TABLE IF NOT EXISTS public.found_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT NOT NULL,
    found_location TEXT NOT NULL,
    found_date DATE NOT NULL DEFAULT CURRENT_DATE,
    found_time TEXT,
    storage_location TEXT, -- e.g. "Security Desk Box #4", "Admin Office Shelf B"
    image_url TEXT,
    reported_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'unclaimed' CHECK (status IN ('unclaimed', 'in_review', 'claimed', 'returned', 'archived')),
    is_verified BOOLEAN NOT NULL DEFAULT false,
    verified_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    tags TEXT[] DEFAULT '{}',
    secret_identifying_details TEXT, -- hidden from public, visible only to admins and finder
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5. LOST REPORTS TABLE
CREATE TABLE IF NOT EXISTS public.lost_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT NOT NULL,
    last_seen_location TEXT NOT NULL,
    date_lost DATE NOT NULL DEFAULT CURRENT_DATE,
    image_url TEXT,
    unique_identifiers TEXT, -- Serial numbers, lock screen wallpaper, scratches
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'matched', 'resolved', 'closed')),
    matched_item_id UUID REFERENCES public.found_items(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 6. CLAIMS TABLE
CREATE TABLE IF NOT EXISTS public.claims (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    item_id UUID NOT NULL REFERENCES public.found_items(id) ON DELETE CASCADE,
    claimant_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    proof_description TEXT NOT NULL,
    proof_image_url TEXT,
    contact_phone TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    admin_notes TEXT,
    reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    pickup_scheduled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 7. ITEM STATUS AUDIT HISTORY TABLE
CREATE TABLE IF NOT EXISTS public.item_status_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    item_id UUID NOT NULL REFERENCES public.found_items(id) ON DELETE CASCADE,
    changed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    changer_name TEXT NOT NULL,
    changer_role TEXT NOT NULL,
    old_status TEXT,
    new_status TEXT NOT NULL,
    reason TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Indices for performance
CREATE INDEX IF NOT EXISTS idx_found_items_status ON public.found_items(status);
CREATE INDEX IF NOT EXISTS idx_found_items_category ON public.found_items(category);
CREATE INDEX IF NOT EXISTS idx_found_items_found_date ON public.found_items(found_date DESC);
CREATE INDEX IF NOT EXISTS idx_lost_reports_status ON public.lost_reports(status);
CREATE INDEX IF NOT EXISTS idx_lost_reports_user_id ON public.lost_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_claims_item_id ON public.claims(item_id);
CREATE INDEX IF NOT EXISTS idx_claims_claimant_id ON public.claims(claimant_id);
CREATE INDEX IF NOT EXISTS idx_item_status_history_item_id ON public.item_status_history(item_id);
