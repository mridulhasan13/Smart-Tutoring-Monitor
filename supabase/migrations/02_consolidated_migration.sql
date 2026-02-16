-- Consolidated Migration (Files 02 through 12)

-- 1. Profiles Table Updates
DO $$
BEGIN
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS school text;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS college text;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS university text;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS level text;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS term text;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS city text;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS contact_number text;
EXCEPTION
    WHEN duplicate_column THEN RAISE NOTICE 'column already exists';
END $$;

-- 2. Students Table Updates
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS guardian_phone text;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS gender text;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS whatsapp_group text;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS location_lat numeric;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS location_lng numeric;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS location_address text;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS group_data jsonb;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS institution text;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'students' AND column_name = 'target_sessions') THEN
        ALTER TABLE public.students ADD COLUMN target_sessions integer DEFAULT 12;
    END IF;
END $$;

-- 3. Payments Table Updates
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payments' AND column_name = 'payment_month') THEN
        ALTER TABLE public.payments ADD COLUMN payment_month text;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payments' AND column_name = 'notes') THEN
        ALTER TABLE public.payments ADD COLUMN notes text;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payments' AND column_name = 'student_name') THEN
        ALTER TABLE public.payments ADD COLUMN student_name TEXT;
    END IF;
END $$;

-- 4. Sessions Table Updates
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sessions' AND column_name = 'student_name') THEN
        ALTER TABLE public.sessions ADD COLUMN student_name TEXT;
    END IF;
END $$;

-- 5. Data Backfills
-- Backfill student_name for sessions
UPDATE public.sessions s
SET student_name = st.name
FROM public.students st
WHERE s.student_id = st.id AND s.student_name IS NULL;

-- Backfill student_name for payments
UPDATE public.payments p
SET student_name = st.name
FROM public.students st
WHERE p.student_id = st.id AND p.student_name IS NULL;

-- Sync emails from auth.users to public.profiles
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id AND (p.email IS NULL OR p.email = '');

-- 6. RLS Policies
-- Add delete policy for emails table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'emails' 
        AND policyname = 'Users can delete their own emails.'
    ) THEN
        CREATE POLICY "Users can delete their own emails." ON public.emails FOR DELETE USING ( auth.uid() = user_id );
    END IF;
END $$;
