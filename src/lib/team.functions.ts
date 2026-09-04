import { createServerFn } from "@tanstack/react-start";
import { requireStaff, requireManager, requireSuperAdmin } from "@/lib/require-admin";
import { logAudit } from "@/lib/workforce.server";

/** Claims above this value can only be decided by the CEO. */
export const CLAIM_ESCALATION_LIMIT = 25000;

export type TeamMember = {
  user_id: string;
  full_name: string;
  email: string;
  designation: string;
  department: string;
  status: string;
  manager_id: string | null;
  manager_name: string;
  roles: string[];
};

export type MyAccess = {
  userId: string;
  roles: string[];
  isSuper: boolean;
  isHr: boolean;
  scope: "ceo" | "hr" | "employee";
};

export const getMyAccess = createServerFn({ method: "GET" })
  .middleware([requireStaff])
  .handler(async ({ context }): Promise<MyAccess> => ({
    userId: context.userId,
    roles: context.roles,
    isSuper: context.isSuper,
    isHr: context.isHr,
    scope: context.isSuper ? "ceo" : context.isHr ? "hr" : "employee",
  }));

/** Everyone the caller can see: CEO -> whole company, HR -> their reports, employee -> themselves. */
export const getTeamMembers = createServerFn({ method: "GET" })
  .middleware([requireStaff])
  .handler(async ({ context }): Promise<TeamMember[]> => {
    const [profilesRes, employmentRes, rolesRes] = await Promise.all([
      context.supabase.from("profiles").select("id, full_name"),
      context.supabase
        .from("employee_profile")
        .select(
          "user_id, full_name, designation, department, status, manager_id, manager_name",
        ),
      context.supabase.from("user_roles").select("user_id, role"),
    ]);

    const nameById = new Map<string, string>();
    for (const p of profilesRes.data ?? []) nameById.set(p.id, p.full_name);

    const roleMap = new Map<string, string[]>();
    for (const r of rolesRes.data ?? []) {
      const arr = roleMap.get(r.user_id) ?? [];
      arr.push(r.role);
      roleMap.set(r.user_id, arr);
    }

    const employment = new Map<string, Record<string, unknown>>();
    for (const e of employmentRes.data ?? []) employment.set(e.user_id, e);

    const ids = new Set<string>([
      context.userId,
      ...employment.keys(),
      ...(context.isSuper ? nameById.keys() : []),
    ]);

    const emailById = new Map<string, string>();
    if (context.isSuper || context.isHr) {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 });
      for (const u of data?.users ?? []) emailById.set(u.id, u.email ?? "");
    }

    return [...ids].map((id) => {
      const e = employment.get(id) ?? {};
      const managerId = (e["manager_id"] as string | null) ?? null;
      return {
        user_id: id,
        full_name: (e["full_name"] as string) || nameById.get(id) || "",
        email: emailById.get(id) ?? "",
        designation: (e["designation"] as string) ?? "",
        department: (e["department"] as string) ?? "",
        status: (e["status"] as string) || "active",
        manager_id: managerId,
        manager_name:
          (e["manager_name"] as string) ||
          (managerId ? (nameById.get(managerId) ?? "") : ""),
        roles: roleMap.get(id) ?? [],
      };
    });
  });

/** HR / CEO accounts available as reporting managers. */
export const getManagers = createServerFn({ method: "GET" })
  .middleware([requireManager])
  .handler(async ({ context }) => {
    const { data: roles } = await context.supabase
      .from("user_roles")
      .select("user_id, role")
      .in("role", ["hr", "ceo", "admin"]);
    const { data: profiles } = await context.supabase.from("profiles").select("id, full_name");
    const nameById = new Map((profiles ?? []).map((p) => [p.id, p.full_name]));
    const seen = new Set<string>();
    const out: { id: string; name: string; role: string }[] = [];
    for (const r of roles ?? []) {
      if (seen.has(r.user_id)) continue;
      seen.add(r.user_id);
      out.push({ id: r.user_id, name: nameById.get(r.user_id) ?? "", role: r.role });
    }
    return out;
  });

export const createStaffAccount = createServerFn({ method: "POST" })
  .middleware([requireManager])
  .validator(
    (input: {
      email: string;
      password: string;
      full_name: string;
      role: "hr" | "employee" | "ceo";
      designation: string;
      department: string;
      manager_id: string | null;
    }) => input,
  )
  .handler(async ({ data, context }) => {
    if (!context.isSuper && data.role !== "employee") {
      throw new Error("HR accounts can only create employee logins");
    }
    if (!data.email.includes("@") || data.password.length < 6) {
      throw new Error("Enter a valid email and a password of at least 6 characters");
    }

    const managerId = context.isSuper ? data.manager_id : context.userId;

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: { full_name: data.full_name },
    });
    if (createErr || !created.user) throw new Error(createErr?.message ?? "Could not create account");

    const newId = created.user.id;

    await supabaseAdmin
      .from("profiles")
      .upsert({ id: newId, full_name: data.full_name }, { onConflict: "id" });

    const { error: roleErr } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: newId, role: data.role });
    if (roleErr && roleErr.code !== "23505") throw new Error(roleErr.message);

    let managerName = "";
    if (managerId) {
      const { data: mp } = await supabaseAdmin
        .from("profiles")
        .select("full_name")
        .eq("id", managerId)
        .maybeSingle();
      managerName = mp?.full_name ?? "";
    }

    const { error: profErr } = await supabaseAdmin.from("employee_profile").upsert(
      {
        user_id: newId,
        full_name: data.full_name,
        designation: data.designation,
        department: data.department,
        manager_id: managerId,
        manager_name: managerName,
      },
      { onConflict: "user_id" },
    );
    if (profErr) throw new Error(profErr.message);

    await logAudit(context, {
      action: "staff.create",
      target_type: "user",
      target_id: newId,
      target_name: data.full_name,
      details: `Created ${data.role} account (${data.email})`,
    });

    return { ok: true, user_id: newId };
  });

export const assignManager = createServerFn({ method: "POST" })
  .middleware([requireSuperAdmin])
  .validator((input: { user_id: string; manager_id: string | null }) => input)
  .handler(async ({ data, context }) => {
    let managerName = "";
    if (data.manager_id) {
      const { data: mp } = await context.supabase
        .from("profiles")
        .select("full_name")
        .eq("id", data.manager_id)
        .maybeSingle();
      managerName = mp?.full_name ?? "";
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("employee_profile")
      .upsert(
        {
          user_id: data.user_id,
          manager_id: data.manager_id,
          manager_name: managerName,
        },
        { onConflict: "user_id" },
      );
    if (error) throw new Error(error.message);
    await logAudit(context, {
      action: "staff.assign_manager",
      target_type: "user",
      target_id: data.user_id,
      target_name: managerName,
      details: data.manager_id ? `Reporting manager set to ${managerName}` : "Reporting manager cleared",
    });
    return { ok: true };
  });

export const setStaffRole = createServerFn({ method: "POST" })
  .middleware([requireSuperAdmin])
  .validator(
    (input: { user_id: string; role: "ceo" | "hr" | "employee"; action: "grant" | "revoke" }) =>
      input,
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (data.action === "grant") {
      const { error } = await supabaseAdmin
        .from("user_roles")
        .insert({ user_id: data.user_id, role: data.role });
      if (error && error.code !== "23505") throw new Error(error.message);
    } else {
      const { error } = await supabaseAdmin
        .from("user_roles")
        .delete()
        .eq("user_id", data.user_id)
        .eq("role", data.role);
      if (error) throw new Error(error.message);
    }
    await logAudit(context, {
      action: `role.${data.action}`,
      target_type: "user",
      target_id: data.user_id,
      details: `${data.action === "grant" ? "Granted" : "Revoked"} ${data.role}`,
    });
    return { ok: true };
  });

// ─── Approvals ───────────────────────────────────────────

export type ApprovalItem = {
  kind: "leave" | "claim" | "request";
  id: string;
  user_id: string;
  title: string;
  detail: string;
  amount: number | null;
  created_at: string;
  status: string;
  needs_ceo: boolean;
};

export const getPendingApprovals = createServerFn({ method: "GET" })
  .middleware([requireManager])
  .handler(async ({ context }): Promise<ApprovalItem[]> => {
    const [leaves, claims, requests, profiles] = await Promise.all([
      context.supabase
        .from("leave_applications")
        .select("id, user_id, leave_type, start_date, end_date, days, reason, status, created_at")
        .eq("status", "pending"),
      context.supabase
        .from("expense_claims")
        .select("id, user_id, claim_no, category, purpose, amount, status, created_at")
        .eq("status", "pending"),
      context.supabase
        .from("employee_requests")
        .select("id, user_id, request_type, details, note, status, created_at")
        .eq("status", "pending"),
      context.supabase.from("profiles").select("id, full_name"),
    ]);

    const nameById = new Map((profiles.data ?? []).map((p) => [p.id, p.full_name]));
    const label = (id: string) => nameById.get(id) || "Employee";

    const items: ApprovalItem[] = [];

    for (const l of leaves.data ?? []) {
      if (l.user_id === context.userId) continue;
      items.push({
        kind: "leave",
        id: l.id,
        user_id: l.user_id,
        title: `${label(l.user_id)} — ${l.leave_type}`,
        detail: `${l.start_date} → ${l.end_date} (${l.days} day${l.days === 1 ? "" : "s"}) · ${l.reason}`,
        amount: null,
        created_at: l.created_at,
        status: l.status,
        needs_ceo: false,
      });
    }

    for (const c of claims.data ?? []) {
      if (c.user_id === context.userId) continue;
      items.push({
        kind: "claim",
        id: c.id,
        user_id: c.user_id,
        title: `${label(c.user_id)} — ${c.claim_no}`,
        detail: `${c.category} · ${c.purpose}`,
        amount: Number(c.amount),
        created_at: c.created_at,
        status: c.status,
        needs_ceo: Number(c.amount) > CLAIM_ESCALATION_LIMIT,
      });
    }

    for (const r of requests.data ?? []) {
      if (r.user_id === context.userId) continue;
      items.push({
        kind: "request",
        id: r.id,
        user_id: r.user_id,
        title: `${label(r.user_id)} — ${r.request_type}`,
        detail: `${r.details} ${r.note}`.trim(),
        amount: null,
        created_at: r.created_at,
        status: r.status,
        needs_ceo: false,
      });
    }

    return items.sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
  });

export const decideApproval = createServerFn({ method: "POST" })
  .middleware([requireManager])
  .validator(
    (input: {
      kind: "leave" | "claim" | "request";
      id: string;
      decision: "approved" | "rejected";
      note: string;
    }) => input,
  )
  .handler(async ({ data, context }) => {
    const stamp = {
      status: data.decision,
      decided_by: context.userId,
      decided_at: new Date().toISOString(),
      decision_note: data.note,
    };

    if (data.kind === "claim") {
      const { data: claim, error: readErr } = await context.supabase
        .from("expense_claims")
        .select("id, user_id, amount")
        .eq("id", data.id)
        .maybeSingle();
      if (readErr) throw new Error(readErr.message);
      if (!claim) throw new Error("Claim not found or outside your team");
      if (claim.user_id === context.userId) throw new Error("You cannot decide your own claim");
      if (Number(claim.amount) > CLAIM_ESCALATION_LIMIT && !context.isSuper) {
        throw new Error(
          `Claims above ₹${CLAIM_ESCALATION_LIMIT.toLocaleString("en-IN")} must be decided by the CEO`,
        );
      }
      const { error } = await context.supabase.from("expense_claims").update(stamp).eq("id", data.id);
      if (error) throw new Error(error.message);
      await logAudit(context, {
        action: `claim.${data.decision}`,
        target_type: "expense_claim",
        target_id: data.id,
        details: data.note,
      });
      return { ok: true };
    }

    const table = data.kind === "leave" ? "leave_applications" : "employee_requests";
    const { data: row, error: readErr } = await context.supabase
      .from(table)
      .select("id, user_id")
      .eq("id", data.id)
      .maybeSingle();
    if (readErr) throw new Error(readErr.message);
    if (!row) throw new Error("Item not found or outside your team");
    if (row.user_id === context.userId) throw new Error("You cannot decide your own request");

    const { error } = await context.supabase.from(table).update(stamp).eq("id", data.id);
    if (error) throw new Error(error.message);
    await logAudit(context, {
      action: `${data.kind}.${data.decision}`,
      target_type: table,
      target_id: data.id,
      details: data.note,
    });
    return { ok: true };
  });

export const getOrgStats = createServerFn({ method: "GET" })
  .middleware([requireManager])
  .handler(async ({ context }) => {
    const [employment, leaves, claims, attendance] = await Promise.all([
      context.supabase.from("employee_profile").select("user_id, status"),
      context.supabase.from("leave_applications").select("id, user_id, status"),
      context.supabase.from("expense_claims").select("id, user_id, status, amount"),
      context.supabase
        .from("attendance")
        .select("id, user_id, status, work_date")
        .eq("work_date", new Date().toISOString().slice(0, 10)),
    ]);

    const team = (employment.data ?? []).filter((e) => e.user_id !== context.userId);
    const others = <T extends { user_id: string }>(rows: T[] | null) =>
      (rows ?? []).filter((r) => r.user_id !== context.userId);

    const claimRows = others(claims.data);

    return {
      headcount: team.length,
      activeHeadcount: team.filter((e) => e.status !== "inactive").length,
      pendingLeaves: others(leaves.data).filter((l) => l.status === "pending").length,
      pendingClaims: claimRows.filter((c) => c.status === "pending").length,
      pendingClaimValue: claimRows
        .filter((c) => c.status === "pending")
        .reduce((s, c) => s + Number(c.amount), 0),
      presentToday: others(attendance.data).filter((a) => a.status === "present").length,
      onLeaveToday: others(attendance.data).filter(
        (a) => a.status === "leave" || a.status === "paid_leave",
      ).length,
    };
  });
