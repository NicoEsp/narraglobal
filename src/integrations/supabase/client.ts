import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://aydtxqhtkcyytsamervs.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF5ZHR4cWh0a2N5eXRzYW1lcnZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ2MTEyMTMsImV4cCI6MjA3MDE4NzIxM30.HjOcO041A-BiDSIM2kTOzdEim9nI8-Kw87aWkQqzID8";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});