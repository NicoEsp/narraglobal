-- Harden public writes by removing anon INSERT policies and routing inserts via SECURITY DEFINER RPCs
-- Add normalization and rate-limit triggers, and supporting indexes

BEGIN;

-- 1) Remove anonymous insert policies (public write access)
DROP POLICY IF EXISTS "anon_insert_political_contacts" ON public.political_contacts;
DROP POLICY IF EXISTS "anon_insert_industry_subscriptions" ON public.industry_subscriptions;

-- 2) Create BEFORE INSERT triggers to normalize email and enforce rate limiting
-- Political contacts
DROP TRIGGER IF EXISTS bi1_political_normalize_email ON public.political_contacts;
DROP TRIGGER IF EXISTS bi2_political_rate_limit ON public.political_contacts;
CREATE TRIGGER bi1_political_normalize_email
BEFORE INSERT ON public.political_contacts
FOR EACH ROW EXECUTE FUNCTION public.normalize_email();

CREATE TRIGGER bi2_political_rate_limit
BEFORE INSERT ON public.political_contacts
FOR EACH ROW EXECUTE FUNCTION public.enforce_rate_limit_political_contacts();

-- Industry subscriptions
DROP TRIGGER IF EXISTS bi1_industry_normalize_email ON public.industry_subscriptions;
DROP TRIGGER IF EXISTS bi2_industry_rate_limit ON public.industry_subscriptions;
CREATE TRIGGER bi1_industry_normalize_email
BEFORE INSERT ON public.industry_subscriptions
FOR EACH ROW EXECUTE FUNCTION public.normalize_email();

CREATE TRIGGER bi2_industry_rate_limit
BEFORE INSERT ON public.industry_subscriptions
FOR EACH ROW EXECUTE FUNCTION public.enforce_rate_limit_industry_subscriptions();

-- 3) Supporting indexes for rate limit checks
CREATE INDEX IF NOT EXISTS idx_political_contacts_email_created_at
  ON public.political_contacts (email, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_industry_subscriptions_email_created_at
  ON public.industry_subscriptions (email, created_at DESC);

-- 4) RPC functions (SECURITY DEFINER) to handle validated inserts
CREATE OR REPLACE FUNCTION public.submit_political_contact(
  _name text,
  _email text,
  _phone text,
  _organization text DEFAULT NULL,
  _source text DEFAULT 'web',
  _honeypot text DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  new_id uuid;
BEGIN
  -- Honeypot: if filled, treat as abuse
  IF coalesce(trim(_honeypot),'') <> '' THEN
    RAISE EXCEPTION 'Bot detected' USING ERRCODE = 'P0001';
  END IF;

  IF coalesce(trim(_name),'') = '' THEN
    RAISE EXCEPTION 'Name is required' USING ERRCODE = 'P0001';
  END IF;

  IF coalesce(trim(_email),'') = '' OR position('@' in _email) = 0 THEN
    RAISE EXCEPTION 'Valid email is required' USING ERRCODE = 'P0001';
  END IF;

  INSERT INTO public.political_contacts (name, email, phone, organization, source)
  VALUES (_name, _email, _phone, _organization, coalesce(nullif(_source,''),'web'))
  RETURNING id INTO new_id;

  RETURN new_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.submit_industry_subscription(
  _email text,
  _source text DEFAULT 'web',
  _honeypot text DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  new_id uuid;
BEGIN
  -- Honeypot: if filled, treat as abuse
  IF coalesce(trim(_honeypot),'') <> '' THEN
    RAISE EXCEPTION 'Bot detected' USING ERRCODE = 'P0001';
  END IF;

  IF coalesce(trim(_email),'') = '' OR position('@' in _email) = 0 THEN
    RAISE EXCEPTION 'Valid email is required' USING ERRCODE = 'P0001';
  END IF;

  INSERT INTO public.industry_subscriptions (email, source)
  VALUES (_email, coalesce(nullif(_source,''),'web'))
  RETURNING id INTO new_id;

  RETURN new_id;
END;
$$;

-- 5) Allow anonymous role to execute these RPCs
GRANT EXECUTE ON FUNCTION public.submit_political_contact(text, text, text, text, text, text) TO anon;
GRANT EXECUTE ON FUNCTION public.submit_industry_subscription(text, text, text) TO anon;

COMMIT;