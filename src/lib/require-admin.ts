import { createMiddleware } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Admin-only gate for server functions.
 * Runs after requireSupabaseAuth and rejects anyone without the `admin` role.
 */
export const requireAdmin = createMiddleware({ type: "function" })
  .middleware([requireSupabaseAuth])
  .server(async ({ next, context }) => {
    const { data: isAdmin, error } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });

    if (error || !isAdmin) {
      throw new Response("Forbidden: admin access only", { status: 403 });
    }

    return next();
  });
