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
-- Analytics / Usage Stats Table
-- ==========================================
CREATE TABLE IF NOT EXISTS public.usage_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_type TEXT NOT NULL, -- e.g., 'app_opened', 'flowchart_created'
    user_identifier TEXT,     -- A local identifier to count unique users (not tied to real identity)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.usage_events ENABLE ROW LEVEL SECURITY;

-- Clean up any existing policies with the same name before creating
DROP POLICY IF EXISTS "Allow public insert to usage events" ON public.usage_events;

-- Security Policy: Anyone (public) can INSERT usage events
CREATE POLICY "Allow public insert to usage events"
ON public.usage_events FOR INSERT
WITH CHECK (true);

-- No SELECT policy is created. The public frontend CANNOT read analytics data.
-- This prevents attackers from scraping your analytics.
