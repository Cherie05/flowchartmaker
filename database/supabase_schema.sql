-- ==========================================
-- Waitlist Table
-- ==========================================
CREATE TABLE IF NOT EXISTS public.waitlist (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;

-- Clean up any existing policies with the same name before creating
DROP POLICY IF EXISTS "Allow public insert to waitlist" ON public.waitlist;

-- Security Policy: Anyone (public) can INSERT into the waitlist
CREATE POLICY "Allow public insert to waitlist"
ON public.waitlist FOR INSERT
WITH CHECK (true);

-- No SELECT policy is created. This means the public frontend CANNOT read the waitlist.
-- Only database admins can view the waitlist data from the Supabase dashboard.


-- ==========================================
-- Users Table (Try Tool sign-in)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Clean up any existing policies with the same name before creating
DROP POLICY IF EXISTS "Allow public insert to users" ON public.users;

-- Security Policy: Anyone (public) can INSERT into users
CREATE POLICY "Allow public insert to users"
ON public.users FOR INSERT
WITH CHECK (true);

-- No SELECT policy is created. The public frontend CANNOT read user data.
-- Only database admins can view user data from the Supabase dashboard.


-- ==========================================
-- Feedback Table
-- ==========================================
CREATE TABLE IF NOT EXISTS public.feedbacks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    message TEXT,
    user_email TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.feedbacks ENABLE ROW LEVEL SECURITY;

-- Clean up any existing policies with the same name before creating
DROP POLICY IF EXISTS "Allow public insert to feedbacks" ON public.feedbacks;

-- Security Policy: Anyone (public) can INSERT into feedbacks
CREATE POLICY "Allow public insert to feedbacks"
ON public.feedbacks FOR INSERT
WITH CHECK (true);

-- No SELECT policy is created. The public frontend CANNOT read feedback data.
