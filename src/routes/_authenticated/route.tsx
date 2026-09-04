import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { getSupabase } from "@/lib/supabase-optional";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const supabase = getSupabase();
    if (!supabase) throw redirect({ to: "/auth" });
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });

    const { data: roleRows } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", data.user.id);

    const roles = (roleRows ?? []).map((r) => r.role as string);
    const allowed = ["admin", "ceo", "hr", "employee"];
    if (!roles.some((r) => allowed.includes(r))) {
      await supabase.auth.signOut();
      throw redirect({ to: "/auth" });
    }

    const isSuper = roles.some((r) => r === "admin" || r === "ceo");
    const isHr = roles.includes("hr");
    const scope: "ceo" | "hr" | "employee" = isSuper ? "ceo" : isHr ? "hr" : "employee";

    return {
      user: data.user,
      roles,
      isSuper,
      isHr,
      scope,
    };
  },
  component: () => <Outlet />,
});
