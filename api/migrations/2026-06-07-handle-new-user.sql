-- =============================================================================
-- NexoLearn Auth P0 — B1 handle_new_user + B2 backfill
-- Target: Supabase production SQL Editor
--
-- profiles (verified production schema):
--   id          UUID PK REFERENCES auth.users(id)
--   email       TEXT UNIQUE NOT NULL
--   skills      (nullable / default — not set on stub insert)
--   interests   (nullable / default — not set on stub insert)
--   created_at  (DEFAULT — not set on stub insert)
--   full_name   (nullable — not set on stub insert)
--   first_name  (nullable — not set on stub insert)
--   avatar_url  (nullable — not set on stub insert)
--
-- Stub insert uses ONLY: id, email
-- Does NOT reference: role (column does not exist in production)
-- =============================================================================

-- Pre-check (optional): count users missing profile
-- SELECT COUNT(*) AS users_without_profile
-- FROM auth.users u
-- LEFT JOIN public.profiles p ON p.id = u.id
-- WHERE p.id IS NULL;

-- -----------------------------------------------------------------------------
-- B1: handle_new_user() + on_auth_user_created
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  profile_email TEXT;
BEGIN
  profile_email := COALESCE(
    NULLIF(TRIM(NEW.email), ''),
    NEW.id::text || '@unknown.local'
  );

  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, profile_email)
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    -- email UNIQUE conflict with another profile row; do not block auth signup
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- -----------------------------------------------------------------------------
-- B2: backfill profiles for existing auth.users without a row
-- -----------------------------------------------------------------------------
INSERT INTO public.profiles (id, email)
SELECT
  u.id,
  COALESCE(NULLIF(TRIM(u.email), ''), u.id::text || '@unknown.local')
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL
  AND NOT EXISTS (
    SELECT 1
    FROM public.profiles existing
    WHERE existing.email = COALESCE(
      NULLIF(TRIM(u.email), ''),
      u.id::text || '@unknown.local'
    )
  )
ON CONFLICT (id) DO NOTHING;

-- Post-check (expect 0)
-- SELECT COUNT(*) AS users_without_profile
-- FROM auth.users u
-- LEFT JOIN public.profiles p ON p.id = u.id
-- WHERE p.id IS NULL;

-- -----------------------------------------------------------------------------
-- Rollback B1 (does not undo backfill rows)
-- -----------------------------------------------------------------------------
-- DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
-- DROP FUNCTION IF EXISTS public.handle_new_user();
