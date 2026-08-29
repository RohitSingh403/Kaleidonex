import { createMiddleware } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type AppRole = "admin" | "ceo" | "hr" | "editor" | "employee";

/** Roles that are allowed to open the internal panel at all. */
export const STAFF_ROLES: AppRole[] = ["admin", "ceo", "hr", "employee"];
/** Roles with company-wide (super admin) reach. */
export const SUPER_ROLES: AppRole[] = ["admin", "ceo"];

/**
 * Base gate: any staff member (CEO, HR or Employee) may pass.
 * Adds `roles`, `isSuper` and `isHr` to the server function context.
 */
export const requireStaff = createMiddleware({ type: "function" })
  .middleware([requireSupabaseAuth])
  .server(async ({ next, context }) => {
    const { data, error } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId);

    if (error) throw new Response("Forbidden", { status: 403 });

    const roles = (data ?? []).map((r) => r.role as AppRole);
    if (!roles.some((r) => STAFF_ROLES.includes(r))) {
      throw new Response("Forbidden: staff access only", { status: 403 });
    }

    return next({
      context: {
        roles,
        isSuper: roles.some((r) => SUPER_ROLES.includes(r)),
        isHr: roles.includes("hr"),
      },
    });
  });

/** Company-wide gate: CEO / admin only. */
export const requireSuperAdmin = createMiddleware({ type: "function" })
  .middleware([requireStaff])
  .server(async ({ next, context }) => {
    if (!context.isSuper) {
      throw new Response("Forbidden: CEO access only", { status: 403 });
    }
    return next();
  });

/** Manager gate: CEO / admin or HR. */
export const requireManager = createMiddleware({ type: "function" })
  .middleware([requireStaff])
  .server(async ({ next, context }) => {
    if (!context.isSuper && !context.isHr) {
      throw new Response("Forbidden: manager access only", { status: 403 });
    }
    return next();
  });

/** Back-compat alias used across existing server functions. */
export const requireAdmin = requireStaff;
