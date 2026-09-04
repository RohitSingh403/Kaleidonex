import { createServerFn } from "@tanstack/react-start";
import { requireSuperAdmin as requireAdmin } from "@/lib/require-admin";

// ─── Leads ──────────────────────────────────────────────

export const getLeads = createServerFn({ method: "GET" })
  .middleware([requireAdmin])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("leads")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data;
  });

export const updateLeadStatus = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .validator((input: { id: string; status: "new" | "contacted" | "closed" }) => input)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("leads")
      .update({ status: data.status })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteLead = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .validator((input: { id: string }) => input)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("leads").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ─── Products ────────────────────────────────────────────

export const getProducts = createServerFn({ method: "GET" })
  .middleware([requireAdmin])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("products")
      .select("*")
      .order("sort_order", { ascending: true });
    if (error) throw new Error(error.message);
    return data;
  });

export const upsertProduct = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .validator(
    (input: {
      id?: string;
      name: string;
      category: string;
      price: string;
      stock: string;
      features: string[];
      published: boolean;
      sort_order: number;
    }) => input,
  )
  .handler(async ({ data, context }) => {
    const { id, ...payload } = data;
    if (id) {
      const { error } = await context.supabase.from("products").update(payload).eq("id", id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await context.supabase.from("products").insert(payload);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

export const deleteProduct = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .validator((input: { id: string }) => input)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("products").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ─── Programmes ──────────────────────────────────────────

export const getProgrammes = createServerFn({ method: "GET" })
  .middleware([requireAdmin])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("programmes")
      .select("*")
      .order("sort_order", { ascending: true });
    if (error) throw new Error(error.message);
    return data;
  });

export const upsertProgramme = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .validator(
    (input: {
      id?: string;
      name: string;
      type: string;
      summary: string;
      features: string[];
      published: boolean;
      sort_order: number;
    }) => input,
  )
  .handler(async ({ data, context }) => {
    const { id, ...payload } = data;
    if (id) {
      const { error } = await context.supabase.from("programmes").update(payload).eq("id", id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await context.supabase.from("programmes").insert(payload);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

export const deleteProgramme = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .validator((input: { id: string }) => input)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("programmes").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ─── Schools ─────────────────────────────────────────────

export const getSchools = createServerFn({ method: "GET" })
  .middleware([requireAdmin])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("schools")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data;
  });

export const upsertSchool = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .validator(
    (input: {
      id?: string;
      name: string;
      city: string;
      contact_person: string;
      email: string;
      phone: string;
      model: string;
      status: "prospect" | "active" | "inactive";
    }) => input,
  )
  .handler(async ({ data, context }) => {
    const { id, ...payload } = data;
    if (id) {
      const { error } = await context.supabase.from("schools").update(payload).eq("id", id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await context.supabase.from("schools").insert(payload);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

export const deleteSchool = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .validator((input: { id: string }) => input)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("schools").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ─── Teachers ────────────────────────────────────────────

export const getTeachers = createServerFn({ method: "GET" })
  .middleware([requireAdmin])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("teachers")
      .select("*, schools(name)")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data;
  });

export const upsertTeacher = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .validator(
    (input: {
      id?: string;
      name: string;
      email: string;
      phone: string;
      school_id: string | null;
      specialization: string;
      status: "active" | "inactive";
    }) => input,
  )
  .handler(async ({ data, context }) => {
    const { id, ...payload } = data;
    if (id) {
      const { error } = await context.supabase.from("teachers").update(payload).eq("id", id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await context.supabase.from("teachers").insert(payload);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

export const deleteTeacher = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .validator((input: { id: string }) => input)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("teachers").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ─── Users (admin only) ──────────────────────────────────

export type AdminUser = {
  id: string;
  email: string;
  full_name: string;
  roles: string[];
  created_at: string;
};

export const getUsers = createServerFn({ method: "GET" })
  .middleware([requireAdmin])
  .handler(async ({ context }) => {
    const { data: isAuth } = await context.supabase
      .rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (!isAuth) throw new Error("Forbidden: admin only");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const {
      data: { users },
      error: uErr,
    } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 100 });
    if (uErr) throw new Error(uErr.message);

    const { data: roles } = await supabaseAdmin.from("user_roles").select("*");
    const { data: profiles } = await supabaseAdmin.from("profiles").select("*");

    const roleMap = new Map<string, string[]>();
    for (const r of roles ?? []) {
      const arr = roleMap.get(r.user_id) ?? [];
      arr.push(r.role);
      roleMap.set(r.user_id, arr);
    }
    const profileMap = new Map<string, string>();
    for (const p of profiles ?? []) profileMap.set(p.id, p.full_name);

    const result: AdminUser[] = (users ?? []).map((u) => ({
      id: u.id,
      email: u.email ?? "",
      full_name: profileMap.get(u.id) ?? "",
      roles: roleMap.get(u.id) ?? [],
      created_at: u.created_at ?? "",
    }));

    return result;
  });

export const setUserRole = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .validator((input: { user_id: string; role: "admin" | "editor"; action: "grant" | "revoke" }) => input)
  .handler(async ({ data, context }) => {
    const { data: isAuth } = await context.supabase
      .rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (!isAuth) throw new Error("Forbidden: admin only");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    if (data.action === "grant") {
      const { error } = await supabaseAdmin
        .from("user_roles")
        .insert({ user_id: data.user_id, role: data.role as "admin" | "editor" });
      if (error && error.code !== "23505") throw new Error(error.message);
    } else {
      const { error } = await supabaseAdmin
        .from("user_roles")
        .delete()
        .eq("user_id", data.user_id)
        .eq("role", data.role);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

// ─── Dashboard stats ─────────────────────────────────────

export const getDashboardStats = createServerFn({ method: "GET" })
  .middleware([requireAdmin])
  .handler(async ({ context }) => {
    const [leads, products, schools, teachers] = await Promise.all([
      context.supabase.from("leads").select("id, status"),
      context.supabase.from("products").select("id"),
      context.supabase.from("schools").select("id, status"),
      context.supabase.from("teachers").select("id, status"),
    ]);

    return {
      leads: leads.data?.length ?? 0,
      newLeads: leads.data?.filter((l) => l.status === "new").length ?? 0,
      products: products.data?.length ?? 0,
      activeSchools: schools.data?.filter((s) => s.status === "active").length ?? 0,
      schools: schools.data?.length ?? 0,
      activeTeachers: teachers.data?.filter((t) => t.status === "active").length ?? 0,
      teachers: teachers.data?.length ?? 0,
    };
  });
