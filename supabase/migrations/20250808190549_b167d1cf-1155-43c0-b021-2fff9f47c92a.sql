-- Enable normalization and rate limiting via triggers for public forms
DO $$
BEGIN
  -- Normalize email on political_contacts (before insert/update)
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'normalize_email_on_political_contacts'
  ) THEN
    CREATE TRIGGER normalize_email_on_political_contacts
    BEFORE INSERT OR UPDATE ON public.political_contacts
    FOR EACH ROW
    EXECUTE FUNCTION public.normalize_email();
  END IF;

  -- Rate limit inserts on political_contacts
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'rate_limit_political_contacts'
  ) THEN
    CREATE TRIGGER rate_limit_political_contacts
    BEFORE INSERT ON public.political_contacts
    FOR EACH ROW
    EXECUTE FUNCTION public.enforce_rate_limit_political_contacts();
  END IF;

  -- Normalize email on industry_subscriptions (before insert/update)
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'normalize_email_on_industry_subscriptions'
  ) THEN
    CREATE TRIGGER normalize_email_on_industry_subscriptions
    BEFORE INSERT OR UPDATE ON public.industry_subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION public.normalize_email();
  END IF;

  -- Rate limit inserts on industry_subscriptions
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'rate_limit_industry_subscriptions'
  ) THEN
    CREATE TRIGGER rate_limit_industry_subscriptions
    BEFORE INSERT ON public.industry_subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION public.enforce_rate_limit_industry_subscriptions();
  END IF;
END
$$;