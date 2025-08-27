-- Fix security vulnerability: Change restrictive policy to permissive for industry_subscriptions
-- This ensures only admins can read the table, preventing public access to email addresses

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Admins can read industry_subscriptions" ON public.industry_subscriptions;

-- Create a new permissive policy that explicitly grants access only to admins
CREATE POLICY "Admins can read industry_subscriptions" 
ON public.industry_subscriptions 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Also apply the same fix to political_contacts table for consistency
DROP POLICY IF EXISTS "Admins can read political_contacts" ON public.political_contacts;

CREATE POLICY "Admins can read political_contacts" 
ON public.political_contacts 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));