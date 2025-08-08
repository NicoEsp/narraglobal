-- SECURITY HARDENING MIGRATION
-- 1) Roles system for admin-only reads

-- Create enum for app roles if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'app_role' AND n.nspname = 'public'
  ) THEN
    CREATE TYPE public.app_role AS ENUM ('admin','moderator','user');
  END IF;
END$$;

-- Create user_roles table if missing
CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Basic policies: users can see their own roles; admins can see all
DROP POLICY IF EXISTS "Users can view their roles" ON public.user_roles;
CREATE POLICY "Users can view their roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- 2) Helper function to check roles (security definer to avoid RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.user_id = _user_id
      AND ur.role = _role
  );
$$;

-- 3) Lock down SELECT on PII tables to admins only; keep anonymous INSERTS intact
-- industry_subscriptions
DROP POLICY IF EXISTS "auth_read_industry_subscriptions" ON public.industry_subscriptions;
DROP POLICY IF EXISTS "Admins can read industry_subscriptions" ON public.industry_subscriptions;
CREATE POLICY "Admins can read industry_subscriptions"
ON public.industry_subscriptions
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- political_contacts
DROP POLICY IF EXISTS "auth_read_political_contacts" ON public.political_contacts;
DROP POLICY IF EXISTS "Admins can read political_contacts" ON public.political_contacts;
CREATE POLICY "Admins can read political_contacts"
ON public.political_contacts
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 4) Data hygiene: normalize email to lowercase/trim on insert/update
CREATE OR REPLACE FUNCTION public.normalize_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.email IS NOT NULL THEN
    NEW.email := lower(trim(NEW.email));
  END IF;
  RETURN NEW;
END;
$$;

-- Attach normalization triggers (drop if exist to avoid duplicates)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'trg_normalize_email_industry_subscriptions'
  ) THEN
    DROP TRIGGER trg_normalize_email_industry_subscriptions ON public.industry_subscriptions;
  END IF;
  CREATE TRIGGER trg_normalize_email_industry_subscriptions
  BEFORE INSERT OR UPDATE ON public.industry_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.normalize_email();
END$$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'trg_normalize_email_political_contacts'
  ) THEN
    DROP TRIGGER trg_normalize_email_political_contacts ON public.political_contacts;
  END IF;
  CREATE TRIGGER trg_normalize_email_political_contacts
  BEFORE INSERT OR UPDATE ON public.political_contacts
  FOR EACH ROW EXECUTE FUNCTION public.normalize_email();
END$$;

-- 5) Basic rate limiting per email: max 3 inserts per 24h
CREATE OR REPLACE FUNCTION public.enforce_rate_limit_industry_subscriptions()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  recent_count int;
BEGIN
  SELECT count(*) INTO recent_count
  FROM public.industry_subscriptions
  WHERE email = NEW.email
    AND created_at > now() - interval '24 hours';

  IF recent_count >= 3 THEN
    RAISE EXCEPTION 'Rate limit exceeded. Please try again later.' USING ERRCODE = 'P0001';
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.enforce_rate_limit_political_contacts()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  recent_count int;
BEGIN
  SELECT count(*) INTO recent_count
  FROM public.political_contacts
  WHERE email = NEW.email
    AND created_at > now() - interval '24 hours';

  IF recent_count >= 3 THEN
    RAISE EXCEPTION 'Rate limit exceeded. Please try again later.' USING ERRCODE = 'P0001';
  END IF;
  RETURN NEW;
END;
$$;

-- Attach rate-limit triggers
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'trg_rate_limit_industry_subscriptions'
  ) THEN
    DROP TRIGGER trg_rate_limit_industry_subscriptions ON public.industry_subscriptions;
  END IF;
  CREATE TRIGGER trg_rate_limit_industry_subscriptions
  BEFORE INSERT ON public.industry_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.enforce_rate_limit_industry_subscriptions();
END$$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'trg_rate_limit_political_contacts'
  ) THEN
    DROP TRIGGER trg_rate_limit_political_contacts ON public.political_contacts;
  END IF;
  CREATE TRIGGER trg_rate_limit_political_contacts
  BEFORE INSERT ON public.political_contacts
  FOR EACH ROW EXECUTE FUNCTION public.enforce_rate_limit_political_contacts();
END$$;

-- 6) Indexes to support rate-limit lookups
CREATE INDEX IF NOT EXISTS idx_industry_subscriptions_email_created_at
  ON public.industry_subscriptions (email, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_political_contacts_email_created_at
  ON public.political_contacts (email, created_at DESC);
