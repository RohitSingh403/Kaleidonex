import { supabase } from "@/integrations/supabase/client";

/**
 * Returns the backend client, or null when backend env vars are missing
 * (e.g. a static/standalone deployment). Never throws.
 */
export function getSupabase(): typeof supabase | null {
  try {
    // Touching a property forces the lazy client to initialise.
    void supabase.auth;
    return supabase;
  } catch {
    return null;
  }
}

export const BACKEND_UNAVAILABLE =
  "Backend is not configured for this deployment, so this action is unavailable.";
