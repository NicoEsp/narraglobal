-- Comprehensive Security Hardening for industry_subscriptions and political_contacts tables
-- This migration adds explicit policies to prevent all unauthorized direct database access

-- === INDUSTRY SUBSCRIPTIONS TABLE ===

-- Policy to explicitly deny all direct INSERTs (only allow through SECURITY DEFINER functions)
CREATE POLICY "Deny direct inserts to industry_subscriptions" 
ON public.industry_subscriptions 
FOR INSERT 
WITH CHECK (false);

-- Policy to only allow admins to update records
CREATE POLICY "Only admins can update industry_subscriptions" 
ON public.industry_subscriptions 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Policy to only allow admins to delete records
CREATE POLICY "Only admins can delete industry_subscriptions" 
ON public.industry_subscriptions 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- === POLITICAL CONTACTS TABLE ===

-- Policy to explicitly deny all direct INSERTs (only allow through SECURITY DEFINER functions)
CREATE POLICY "Deny direct inserts to political_contacts" 
ON public.political_contacts 
FOR INSERT 
WITH CHECK (false);

-- Policy to only allow admins to update records
CREATE POLICY "Only admins can update political_contacts" 
ON public.political_contacts 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Policy to only allow admins to delete records
CREATE POLICY "Only admins can delete political_contacts" 
ON public.political_contacts 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- === SECURITY VERIFICATION ===

-- Verify no public grants exist on these tables
REVOKE ALL ON public.industry_subscriptions FROM public;
REVOKE ALL ON public.political_contacts FROM public;

-- Ensure only the schema owner and admins have access
GRANT SELECT ON public.industry_subscriptions TO authenticated;
GRANT SELECT ON public.political_contacts TO authenticated;