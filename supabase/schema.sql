-- ============================================================================
-- FILE: supabase/schema.sql
-- ROUTE: Database migration (executed manually in Supabase SQL Editor; not a
--        Next.js route or API endpoint)
-- PURPOSE: PostgreSQL schema for Knowledge Breach (GNC BSIT Peer Commons).
--          Defines four core tables: profiles, posts, ratings, and messages.
--          Row Level Security (RLS) is disabled for initial capstone testing.
--          Zero seed/dummy data is included.
-- DATA FLOW:
--   • public.profiles: 1-to-1 with Supabase Auth users. Stores user identity
--     (full_name, email, role), optional profile details (gender, location,
--     achievements), and trust metrics (trust_score, ratings_count).
--   • public.posts: Peer threads / team recruitment posts. Each post references
--     an author profile, a subject, post_type, title, content, and optional
--     looking_for role tags. Author profile is joined on read via author_id.
--   • public.ratings: 1-5 star peer endorsements. Each rating links a rater to
--     a ratee, optionally to a post, with stars (1-5) and an optional comment.
--     Used to recalculate the ratee's trust_score and ratings_count.
--   • public.messages: 1-on-1 direct messages between two profiles. Each
--     message links a sender and receiver with content and timestamp.
-- USED BY / CALLED BY: Executed manually in the Supabase SQL Editor. All API
--                      routes (src/app/api/*) and client pages read/write these
--                      tables via the Supabase JS client.
-- TROUBLESHOOT: If API routes return relation-does-not-exist errors, ensure
--               this script has been executed in your Supabase project. If
--               inserts/updates are silently rejected, verify RLS is disabled
--               on all four tables (see ALTER TABLE statements at the bottom).
-- ============================================================================

-- Enable UUID generation extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ----------------------------------------------------------------------------
-- 1. PROFILES TABLE (1-to-1 with auth.users)
--    Stores identity, optional details, and trust metrics for every authenticated user.
--    Columns:
--      id              UUID PK → references auth.users (cascade on delete)
--      full_name       TEXT NOT NULL → display name across the app
--      email           TEXT NOT NULL → user's email address
--      role            TEXT DEFAULT 'student' → 'student' | 'admin' (controls admin actions)
--      gender          TEXT DEFAULT '' → optional profile detail
--      location        TEXT DEFAULT '' → optional profile detail
--      achievements    TEXT[] DEFAULT '{}' → array of achievement/certification strings
--      trust_score     NUMERIC(3,2) DEFAULT 0.00 → recalculated average of received ratings
--      ratings_count   INTEGER DEFAULT 0 → number of ratings received
--      created_at      TIMESTAMPTZ → account creation timestamp
--      updated_at      TIMESTAMPTZ → last profile update timestamp
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'student', -- 'student' | 'admin'
  gender TEXT DEFAULT '',
  location TEXT DEFAULT '',
  achievements TEXT[] DEFAULT '{}',
  trust_score NUMERIC(3, 2) NOT NULL DEFAULT 0.00,
  ratings_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 2. POSTS TABLE (Peer threads & team recruitment)
--    Stores posts created by students for study help, team recruitment, or
--    resource sharing. Each post is linked to its author profile.
--    Columns:
--      id            UUID PK (auto-generated) → unique post identifier
--      author_id     UUID FK → references public.profiles(id) (cascade on delete)
--      subject       TEXT NOT NULL → IT subject category (e.g., "Networking 1 & Cisco Labs")
--      post_type     TEXT DEFAULT 'Team Recruitment' → 'Team Recruitment' | 'Study Help' | 'Resource Share'
--      title         TEXT NOT NULL → post title/headline
--      content       TEXT NOT NULL → post body/description
--      looking_for   TEXT[] DEFAULT '{}' → comma-separated role tags stored as array
--      created_at    TIMESTAMPTZ → post creation timestamp
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  post_type TEXT NOT NULL DEFAULT 'Team Recruitment', -- 'Team Recruitment' | 'Study Help' | 'Resource Share'
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  looking_for TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 3. RATINGS TABLE (1-5 star peer endorsements & comments)
--    Stores peer-to-peer ratings. A rater rates a ratee (cannot rate self),
--    optionally tied to a specific post. Used to compute trust_score.
--    Columns:
--      id         UUID PK (auto-generated) → unique rating identifier
--      rater_id   UUID FK → references public.profiles(id) (the person giving the rating)
--      ratee_id   UUID FK → references public.profiles(id) (the person being rated)
--      post_id    UUID FK → references public.posts(id) (nullable; set NULL if post deleted)
--      stars      INTEGER CHECK (1-5) → star rating value
--      comment    TEXT DEFAULT '' → optional endorsement comment
--      created_at TIMESTAMPTZ → rating submission timestamp
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ratings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rater_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  ratee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  post_id UUID REFERENCES public.posts(id) ON DELETE SET NULL,
  stars INTEGER NOT NULL CHECK (stars >= 1 AND stars <= 5),
  comment TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 4. MESSAGES TABLE (1-on-1 Direct Messages)
--    Stores direct messages exchanged between two profiles. Queried bidirectionally
--    (sender A → receiver B, or sender B → receiver A) to build conversation threads.
--    Columns:
--      id          UUID PK (auto-generated) → unique message identifier
--      sender_id   UUID FK → references public.profiles(id) (cascade on delete)
--      receiver_id UUID FK → references public.profiles(id) (cascade on delete)
--      content     TEXT NOT NULL → message text
--      created_at  TIMESTAMPTZ → message send timestamp
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Disable Row Level Security (RLS) for initial capstone testing
-- NOTE: All four tables have RLS disabled so inserts/selects/updates/deletes
--       work without explicit RLS policies during capstone development.
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.ratings DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages DISABLE ROW LEVEL SECURITY;
