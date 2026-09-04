import { createServerFn } from "@tanstack/react-start";
import { requireStaff, requireSuperAdmin } from "@/lib/require-admin";
import { logAudit } from "@/lib/workforce.server";

// ─── Organisation settings ───────────────────────────────

export type WorkingDays = {
  days: string[];
  start: string;
  end: string;
  late_after: string;
};
export type LeaveType = { name: string; annual: number };
export type NotificationSettings = { email_enabled: boolean; webhook_url: string };

export type OrgSettings = {
  working_days: WorkingDays;
  leave_types: { types: LeaveType[] };
  notifications: NotificationSettings;
};

const DEFAULTS: OrgSettings = {
  working_days: { days: ["mon", "tue", "wed", "thu", "fri"], start: "09:00", end: "18:00", late_after: "09:15" },
  leave_types: { types: [{ name: "Casual Leave", annual: 12 }] },
  notifications: { email_enabled: true, webhook_url: "" },
};

export const getOrgSettings = createServerFn({ method: "GET" })
  .middleware([requireStaff])
  .handler(async ({ context }): Promise<OrgSettings> => {
    const { data, error } = await context.supabase.from("org_settings").select("key, value");
    if (error) throw new Error(error.message);
    const out = { ...DEFAULTS };
    for (const row of data ?? []) {
      if (row.key === "working_days") out.working_days = { ...DEFAULTS.working_days, ...(row.value as object) };
      if (row.key === "leave_types") out.leave_types = { ...DEFAULTS.leave_types, ...(row.value as object) };
      if (row.key === "notifications") out.notifications = { ...DEFAULTS.notifications, ...(row.value as object) };
    }
    return out;
  });

export const saveOrgSetting = createServerFn({ method: "POST" })
  .middleware([requireSuperAdmin])
  .validator((input: { key: "working_days" | "leave_types" | "notifications"; value: unknown }) => input)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("org_settings")
      .upsert(
        { key: data.key, value: data.value as never, updated_by: context.userId },
        { onConflict: "key" },
      );
    if (error) throw new Error(error.message);
    await logAudit(context, { action: "org_settings.update", target_type: "settings", target_name: data.key });
    return { ok: true };
  });

// ─── Department budgets ──────────────────────────────────

export const saveDepartmentBudget = createServerFn({ method: "POST" })
  .middleware([requireSuperAdmin])
  .validator((input: { id: string; cost_center: string; budget: number; spent: number }) => input)
  .handler(async ({ data, context }) => {
    if (data.budget < 0 || data.spent < 0) throw new Error("Budget values cannot be negative");
    const { error } = await context.supabase
      .from("departments")
      .update({ cost_center: data.cost_center, budget: data.budget, spent: data.spent })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    await logAudit(context, {
      action: "department.budget.update",
      target_type: "department",
      target_id: data.id,
      details: `Budget ₹${data.budget} · spent ₹${data.spent}`,
    });
    return { ok: true };
  });

// ─── Executive analytics ─────────────────────────────────

export type ExecAnalytics = {
  payrollMonthly: number;
  claimsApproved: number;
  claimsPending: number;
  budgets: { id: string; name: string; cost_center: string; budget: number; spent: number; usedPct: number }[];
  spendTrend: { label: string; claims: number; payroll: number }[];
  approvalThroughput: { label: string; raised: number; closed: number }[];
  slaHours: number;
  openApprovals: number;
  headcountTrend: { label: string; headcount: number; joiners: number; leavers: number }[];
  attrition: { rate: number; leavers12m: number; avgHeadcount: number; risk: "low" | "moderate" | "high" };
  deptCosts: {
    id: string;
    name: string;
    headcount: number;
    payroll: number;
    claims: number;
    total: number;
    perHead: number;
  }[];
};

export const getExecAnalytics = createServerFn({ method: "GET" })
  .middleware([requireSuperAdmin])
  .handler(async ({ context }): Promise<ExecAnalytics> => {
    const [deptRes, claimsRes, salaryRes, reqRes, profileRes] = await Promise.all([
      context.supabase.from("departments").select("id, name, cost_center, budget, spent").order("name"),
      context.supabase.from("expense_claims").select("amount, status, created_at, user_id"),
      context.supabase.from("salary_records").select("net_pay, period_month, period_year, status"),
      context.supabase.from("approval_requests").select("state, created_at, decided_at"),
      context.supabase
        .from("employee_profile")
        .select("user_id, salary, status, department_id, joining_date, updated_at"),
    ]);


    const claims = claimsRes.data ?? [];
    const requests = reqRes.data ?? [];

    const payrollMonthly = (profileRes.data ?? [])
      .filter((p) => (p.status ?? "active").toLowerCase() !== "inactive")
      .reduce((s, p) => s + Number(p.salary || 0), 0);

    const budgets = (deptRes.data ?? []).map((d) => {
      const budget = Number(d.budget || 0);
      const spent = Number(d.spent || 0);
      return {
        id: d.id,
        name: d.name,
        cost_center: d.cost_center ?? "",
        budget,
        spent,
        usedPct: budget <= 0 ? 0 : Math.round((spent / budget) * 100),
      };
    });

    const spendTrend: { label: string; claims: number; payroll: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i, 1);
      const key = d.toISOString().slice(0, 7);
      spendTrend.push({
        label: d.toLocaleString("en-IN", { month: "short" }),
        claims: claims
          .filter((c) => (c.created_at ?? "").slice(0, 7) === key && c.status !== "rejected")
          .reduce((s, c) => s + Number(c.amount || 0), 0),
        payroll: (salaryRes.data ?? [])
          .filter((r) => `${r.period_year}-${String(r.period_month).padStart(2, "0")}` === key)
          .reduce((s, r) => s + Number(r.net_pay || 0), 0),
      });
    }

    const approvalThroughput: { label: string; raised: number; closed: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i, 1);
      const key = d.toISOString().slice(0, 7);
      approvalThroughput.push({
        label: d.toLocaleString("en-IN", { month: "short" }),
        raised: requests.filter((r) => (r.created_at ?? "").slice(0, 7) === key).length,
        closed: requests.filter((r) => (r.decided_at ?? "").slice(0, 7) === key).length,
      });
    }

    const decided = requests.filter((r) => r.decided_at);
    const slaHours = decided.length
      ? Math.round(
          decided.reduce(
            (s, r) => s + (new Date(r.decided_at as string).getTime() - new Date(r.created_at).getTime()) / 3600000,
            0,
          ) / decided.length,
        )
      : 0;
    // ── Workforce trend, attrition and per-department cost ──
    const people = profileRes.data ?? [];
    const isLeaver = (p: (typeof people)[number]) => (p.status ?? "active").toLowerCase() === "inactive";

    const headcountTrend: { label: string; headcount: number; joiners: number; leavers: number }[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i, 1);
      const key = d.toISOString().slice(0, 7);
      const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().slice(0, 10);
      headcountTrend.push({
        label: d.toLocaleString("en-IN", { month: "short" }),
        headcount: people.filter(
          (p) =>
            (p.joining_date ?? "") !== "" &&
            String(p.joining_date) <= monthEnd &&
            !(isLeaver(p) && String(p.updated_at ?? "").slice(0, 7) <= key),
        ).length,
        joiners: people.filter((p) => String(p.joining_date ?? "").slice(0, 7) === key).length,
        leavers: people.filter((p) => isLeaver(p) && String(p.updated_at ?? "").slice(0, 7) === key).length,
      });
    }

    const leavers12m = headcountTrend.reduce((s, m) => s + m.leavers, 0);
    const avgHeadcount = Math.max(
      1,
      Math.round(headcountTrend.reduce((s, m) => s + m.headcount, 0) / Math.max(1, headcountTrend.length)),
    );
    const rate = Math.round((leavers12m / avgHeadcount) * 1000) / 10;

    const claimsByUser = new Map<string, number>();
    for (const c of claims) {
      if (c.status === "rejected") continue;
      const uid = String((c as { user_id?: string }).user_id ?? "");
      if (!uid) continue;
      claimsByUser.set(uid, (claimsByUser.get(uid) ?? 0) + Number(c.amount || 0));
    }

    const deptCosts = [
      ...(deptRes.data ?? []).map((d) => ({ id: d.id as string, name: d.name as string })),
      { id: "", name: "Unassigned" },
    ]
      .map((d) => {
        const members = people.filter((p) => String(p.department_id ?? "") === d.id && !isLeaver(p));
        const payroll = members.reduce((s, p) => s + Number(p.salary || 0), 0);
        const claimTotal = members.reduce((s, p) => s + (claimsByUser.get(String(p.user_id)) ?? 0), 0);
        const total = payroll + claimTotal;
        return {
          id: d.id,
          name: d.name,
          headcount: members.length,
          payroll,
          claims: claimTotal,
          total,
          perHead: members.length ? Math.round(total / members.length) : 0,
        };
      })
      .filter((d) => d.headcount > 0)
      .sort((a, b) => b.total - a.total);

    return {
      payrollMonthly,
      claimsApproved: claims
        .filter((c) => c.status === "approved" || c.status === "paid")
        .reduce((s, c) => s + Number(c.amount || 0), 0),
      claimsPending: claims.filter((c) => c.status === "pending").reduce((s, c) => s + Number(c.amount || 0), 0),
      budgets,
      spendTrend,
      approvalThroughput,
      slaHours,
      openApprovals: requests.filter((r) => !["REJECTED", "CANCELLED", "HR_APPROVED", "CEO_APPROVED"].includes(r.state))
        .length,
      headcountTrend,
      attrition: {
        rate,
        leavers12m,
        avgHeadcount,
        risk: rate >= 20 ? "high" : rate >= 10 ? "moderate" : "low",
      },
      deptCosts,
    };

  });

// ─── Account removal (CEO / super admin only) ────────────

export const deleteStaffAccount = createServerFn({ method: "POST" })
  .middleware([requireSuperAdmin])
  .validator((input: { user_id: string; confirm_name: string }) => input)
  .handler(async ({ data, context }) => {
    if (data.user_id === context.userId) throw new Error("You cannot delete your own account");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: profile } = await supabaseAdmin
      .from("employee_profile")
      .select("full_name")
      .eq("user_id", data.user_id)
      .maybeSingle();
    const { data: base } = await supabaseAdmin
      .from("profiles")
      .select("full_name")
      .eq("id", data.user_id)
      .maybeSingle();
    const name = (profile?.full_name || base?.full_name || "").trim();

    if (name && data.confirm_name.trim().toLowerCase() !== name.toLowerCase()) {
      throw new Error(`Type the full name "${name}" to confirm deletion`);
    }

    // Clear references that would otherwise block the auth deletion.
    await supabaseAdmin.from("employee_profile").update({ manager_id: null }).eq("manager_id", data.user_id);
    await supabaseAdmin.from("approval_requests").update({ current_approver_id: null }).eq("current_approver_id", data.user_id);
    await supabaseAdmin.from("approval_requests").update({ hr_id: null }).eq("hr_id", data.user_id);

    const owned = [
      "onboarding_tasks",
      "one_on_one_notes",
      "notifications",
      "attendance",
      "attendance_corrections",
      "leave_applications",
      "salary_records",
      "performance_reviews",
      "tasks",
      "templates",
      "employee_requests",
      "employee_documents",
      "expense_receipts",
      "expense_claims",
      "employee_personal",
      "employee_profile",
      "user_roles",
    ] as const;

    const admin = supabaseAdmin as unknown as {
      from: (t: string) => { delete: () => { eq: (c: string, v: string) => Promise<unknown> } };
    };
    for (const table of owned) {
      const column = table === "one_on_one_notes" ? "employee_id" : "user_id";
      await admin.from(table).delete().eq(column, data.user_id);
    }

    await supabaseAdmin.from("approval_requests").delete().eq("requester_id", data.user_id);
    await supabaseAdmin.from("profiles").delete().eq("id", data.user_id);

    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.user_id);
    if (error) throw new Error(error.message);

    await logAudit(context, {
      action: "staff.delete",
      target_type: "user",
      target_id: data.user_id,
      target_name: name,
      details: "Account and all workforce records permanently removed",
    });

    return { ok: true };
  });

// ─── Global announcements / policy broadcasting ──────────

export type Broadcast = {
  id: string;
  title: string;
  body: string;
  category: string;
  audience: string;
  published: boolean;
  created_at: string;
};

export const getBroadcasts = createServerFn({ method: "GET" })
  .middleware([requireStaff])
  .handler(async ({ context }): Promise<Broadcast[]> => {
    const { data, error } = await context.supabase
      .from("announcements")
      .select("id, title, body, category, audience, published, created_at")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw new Error(error.message);
    return (data ?? []) as Broadcast[];
  });

export const publishBroadcast = createServerFn({ method: "POST" })
  .middleware([requireSuperAdmin])
  .validator(
    (input: { title: string; body: string; category: string; notify: boolean }) => {
      const title = input.title.trim();
      const body = input.body.trim();
      if (!title) throw new Error("Title is required");
      if (!body) throw new Error("Message is required");
      return { title, body, category: input.category || "Policy", notify: !!input.notify };
    },
  )
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("announcements")
      .insert({
        author_id: context.userId,
        title: data.title,
        body: data.body,
        category: data.category,
        audience: "all",
        published: true,
        department_id: null,
        manager_id: null,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);

    let recipients = 0;
    if (data.notify) {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data: roles } = await supabaseAdmin.from("user_roles").select("user_id");
      const ids = Array.from(new Set((roles ?? []).map((r) => r.user_id))).filter(
        (id) => id !== context.userId,
      );
      if (ids.length > 0) {
        await supabaseAdmin.from("notifications").insert(
          ids.map((user_id) => ({
            user_id,
            title: `${data.category}: ${data.title}`,
            body: data.body.slice(0, 240),
            kind: "announcement",
            link: "overview",
          })),
        );
        recipients = ids.length;
      }
    }

    await logAudit(context, {
      action: "broadcast.publish",
      target_type: "announcement",
      target_id: row?.id ?? "",
      target_name: data.title,
      details: `Company-wide broadcast, ${recipients} notified`,
    });
    return { ok: true, recipients };
  });

export const setBroadcastPublished = createServerFn({ method: "POST" })
  .middleware([requireSuperAdmin])
  .validator((input: { id: string; published: boolean }) => input)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("announcements")
      .update({ published: data.published })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteBroadcast = createServerFn({ method: "POST" })
  .middleware([requireSuperAdmin])
  .validator((input: { id: string }) => input)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("announcements").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    await logAudit(context, { action: "broadcast.delete", target_type: "announcement", target_id: data.id });
    return { ok: true };
  });
