-- 004_functions_triggers.sql
-- Functions and triggers for automatic profile creation and item status audit logging

-- 1. Automatic Profile Creation on Signup (auth.users -> public.profiles)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_full_name TEXT;
  user_roll TEXT;
  user_phone TEXT;
  user_role TEXT;
BEGIN
  user_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1));
  user_roll := COALESCE(NEW.raw_user_meta_data->>'roll_number', 'UNASSIGNED');
  user_phone := NEW.raw_user_meta_data->>'phone_number';
  user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'student');

  -- First user registered can automatically be designated as admin, or explicit role
  IF (SELECT count(*) FROM public.profiles) = 0 THEN
    user_role := 'admin';
  END IF;

  INSERT INTO public.profiles (
    id,
    full_name,
    college_email,
    roll_number,
    phone_number,
    role
  ) VALUES (
    NEW.id,
    user_full_name,
    NEW.email,
    user_roll,
    user_phone,
    user_role
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    college_email = EXCLUDED.college_email,
    roll_number = EXCLUDED.roll_number,
    phone_number = EXCLUDED.phone_number;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 2. Audit Trail Trigger: Automatically log status changes of found_items
CREATE OR REPLACE FUNCTION public.log_item_status_change()
RETURNS TRIGGER AS $$
DECLARE
  changer_rec RECORD;
  changer_uid UUID;
  c_name TEXT;
  c_role TEXT;
  custom_reason TEXT;
BEGIN
  -- Only log if status actually changed
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    changer_uid := auth.uid();
    
    -- Fetch updater profile details
    SELECT full_name, role INTO changer_rec
    FROM public.profiles
    WHERE id = changer_uid;

    IF FOUND THEN
      c_name := changer_rec.full_name;
      c_role := changer_rec.role;
    ELSE
      c_name := 'System Process';
      c_role := 'system';
    END IF;

    -- Derive default reason if not provided in session/context
    custom_reason := 'Status transition from ' || COALESCE(OLD.status, 'none') || ' to ' || NEW.status;

    INSERT INTO public.item_status_history (
      item_id,
      changed_by,
      changer_name,
      changer_role,
      old_status,
      new_status,
      reason
    ) VALUES (
      NEW.id,
      changer_uid,
      c_name,
      c_role,
      OLD.status,
      NEW.status,
      custom_reason
    );
  END IF;

  NEW.updated_at := timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on found_items
DROP TRIGGER IF EXISTS on_found_item_status_update ON public.found_items;
CREATE TRIGGER on_found_item_status_update
  BEFORE UPDATE ON public.found_items
  FOR EACH ROW EXECUTE PROCEDURE public.log_item_status_change();

-- 3. Initial Seed Data Helper (Categories & Locations)
INSERT INTO public.categories (name, icon, description) VALUES
  ('Electronics', 'Laptop', 'Laptops, phones, tablets, earphones, chargers, calculators'),
  ('Wallets & IDs', 'CreditCard', 'Student IDs, driver licenses, purses, cash wallets, access badges'),
  ('Keys', 'Key', 'Dorm keys, bike locks, car key fobs, locker keys'),
  ('Bags & Backpacks', 'Briefcase', 'Backpacks, tote bags, gym duffels, laptop sleeves'),
  ('Books & Stationery', 'BookOpen', 'Textbooks, notebooks, binders, scientific calculators, pencil cases'),
  ('Clothing & Accessories', 'Shirt', 'Jackets, hoodies, caps, umbrellas, scarves, watches, glasses'),
  ('Water Bottles & Mugs', 'Coffee', 'Hydro flasks, insulated mugs, shaker bottles'),
  ('Sports Equipment', 'Activity', 'Basketballs, gym gear, badminton rackets, skateboards'),
  ('Other', 'Package', 'Miscellaneous personal items')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.campus_locations (name, building, zone) VALUES
  ('Central Library - 1st Floor Study Area', 'W.E.B. Du Bois Library', 'Academic'),
  ('Central Library - 2nd Floor Quiet Stacks', 'W.E.B. Du Bois Library', 'Academic'),
  ('Science Complex - Lecture Hall 101', 'Hasbrouck Laboratory', 'Academic'),
  ('Engineering Wing - Computer Lab 3', 'Marston Hall', 'Academic'),
  ('Student Union - Main Food Court', 'Student Union Building', 'Dining'),
  ('Campus Recreation Center - Gym Floor', 'Recreation Center', 'Sports'),
  ('North Quad - Residence Hall Lobby', 'North Residential Area', 'Residential'),
  ('South Quad - Common Lounge', 'Southwest Residential', 'Residential'),
  ('Campus Shuttle Terminal & Bus Stop', 'Transit Hub', 'Transit'),
  ('Auditorium & Fine Arts Center', 'Bromery Center for Arts', 'Arts')
ON CONFLICT (name) DO NOTHING;
