import { createClient, type SupabaseClient } from "@supabase/supabase-js";

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

    if (!url || !key) {
      throw new Error(
        "Supabase no está configurado aún. Conecta la integración en Lovable y asegúrate de que el cliente del navegador tenga URL y anon key."
      );
    }

    client = createClient(url, key);
  }

  return client;
}
