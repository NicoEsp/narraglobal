import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { supabase as generatedClient } from "@/integrations/supabase/client";

declare global {
  interface Window {
    __SUPABASE_URL__?: string;
    __SUPABASE_ANON_KEY__?: string;
  }
}

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!client) {
    const url = window.__SUPABASE_URL__;
    const key = window.__SUPABASE_ANON_KEY__;

    if (url && key) {
      client = createClient(url, key, {
        auth: {
          storage: localStorage,
          persistSession: true,
          autoRefreshToken: true,
        },
      });
    } else {
      console.info("[Supabase] Usando cliente auto-generado (fallback)");
      client = generatedClient as unknown as SupabaseClient;
    }
  }

  return client;
}
