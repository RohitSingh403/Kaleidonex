import { createServerFn } from "@tanstack/react-start";
import { requireStaff, requireManager } from "@/lib/require-admin";
import { logAudit } from "@/lib/workforce.server";
import { pct } from "@/lib/workforce.constants";

// ─── Bulk attendance upload ──────────────────────────────

export type BulkAttendanceResult = {
  applied: number;
  skipped: { line: number; reason: string }[];
};

/**
 * Accepts CSV rows of `employee code | date | status | check in | check out`
 * and upserts attendance for every employee the caller is allowed to manage.
 */
export const bulkUploadAttendance = createServerFn({ method: "POST" })
  .middleware([requireManager])
  .validator((input: { csv: string }) => input)
  .handler(async ({ data, context }): Promise<BulkAttendanceResult> => {
    const allowedStatus = ["present", "absent", "half_day", "leave", "paid_leave", "holiday"];
    const lines = data.csv
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);

    const { data: profiles } = await context.supabase
      .from("employee_profile")
      .select("user_id, full_name, employee_code");

    const byCode = new Map<string, string>();
    for (const p of profiles ?? []) {
      if (p.employee_code) byCode.set(String(p.employee_code).toLowerCase(), p.user_id);
      if (p.full_name) byCode.set(String(p.full_name).toLowerCase(), p.user_id);
      byCode.set(String(p.user_id).toLowerCase(), p.user_id);
    }

    const skipped: { line: number; reason: string }[] = [];
    const rows: Record<string, unknown>[] = [];

    lines.forEach((line, i) => {
      const n = i + 1;
      const cells = line.split(",").map((c) => c.trim());
      const first = (cells[0] ?? "").toLowerCase();
      if (first === "employee" || first === "employee_code" || first === "code") return;
      const [who, date, status, checkIn, checkOut] = cells;
      if (!who || !date || !status) {
        skipped.push({ line: n, reason: "Needs employee, date and status" });
        return;
      }
      const userId = byCode.get(who.toLowerCase());
      if (!userId) {
        skipped.push({ line: n, reason: `Unknown employee "${who}"` });
        return;
      }
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        skipped.push({ line: n, reason: `Date must be YYYY-MM-DD, got "${date}"` });
        return;
      }
      const st = status.toLowerCase().replace(/[ -]/g, "_");
      if (!allowedStatus.includes(st)) {
        skipped.push({ line: n, reason: `Unknown status "${status}"` });
        return;
      }
      rows.push({
        user_id: userId,
        work_date: date,
        status: st,
        check_in: checkIn || null,
        check_out: checkOut || null,
        daily_update: "Bulk upload",
      });
    });

    let applied = 0;
    if (rows.length > 0) {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

      // Only keep employees this manager may act on.
      const permitted: Record<string, unknown>[] = [];
      for (const r of rows) {
        const target = r["user_id"] as string;
        if (target === context.userId || context.isSuper) {
          permitted.push(r);
          continue;
        }
        const { data: ok } = await context.supabase.rpc("can_approve_user", {
          _viewer_id: context.userId,
          _target_id: target,
        });
        if (ok) permitted.push(r);
        else skipped.push({ line: 0, reason: "Employee outside your team was skipped" });
      }

      if (permitted.length > 0) {
        const { error } = await supabaseAdmin
          .from("attendance")
          .upsert(permitted as never, { onConflict: "user_id,work_date" });
        if (error) throw new Error(error.message);
        applied = permitted.length;
      }
    }

    await logAudit(context, {
      action: "attendance.bulk_upload",
      target_type: "attendance",
      details: `${applied} rows applied, ${skipped.length} skipped`,
    });

    return { applied, skipped };
  });

// ─── Onboarding checklist ────────────────────────────────

export const getOnboardingTasks = createServerFn({ method: "GET" })
  .middleware([requireStaff])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("onboarding_tasks")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

const DEFAULT_CHECKLIST = [
  { title: "Signed offer letter received", category: "paperwork" },
  { title: "ID & address proof uploaded", category: "paperwork" },
  { title: "Bank and PAN details submitted", category: "payroll" },
  { title: "Work email and tools access", category: "it" },
  { title: "Laptop / hardware handover", category: "it" },
  { title: "Company policy walkthrough", category: "orientation" },
  { title: "Team and manager introduction", category: "orientation" },
  { title: "First 30-day goals agreed", category: "goals" },
];

export const seedOnboardingChecklist = createServerFn({ method: "POST" })
  .middleware([requireManager])
  .validator((input: { user_id: string }) => input)
  .handler(async ({ data, context }) => {
    const rows = DEFAULT_CHECKLIST.map((t) => ({
      user_id: data.user_id,
      title: t.title,
      category: t.category,
      assigned_by: context.userId,
    }));
    const { error } = await context.supabase.from("onboarding_tasks").insert(rows);
    if (error) throw new Error(error.message);
    await logAudit(context, {
      action: "onboarding.seed",
      target_type: "employee",
      target_id: data.user_id,
      details: `${rows.length} checklist items created`,
    });
    return { ok: true, created: rows.length };
  });

export const addOnboardingTask = createServerFn({ method: "POST" })
  .middleware([requireManager])
  .validator((input: { user_id: string; title: string; category: string; due_date: string | null }) => input)
  .handler(async ({ data, context }) => {
    if (!data.title.trim()) throw new Error("Enter a task title");
    const { error } = await context.supabase.from("onboarding_tasks").insert({
      user_id: data.user_id,
      title: data.title.trim(),
      category: data.category || "general",
      due_date: data.due_date || null,
      assigned_by: context.userId,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const toggleOnboardingTask = createServerFn({ method: "POST" })
  .middleware([requireStaff])
  .validator((input: { id: string; is_done: boolean }) => input)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("onboarding_tasks")
      .update({ is_done: data.is_done, completed_at: data.is_done ? new Date().toISOString() : null })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteOnboardingTask = createServerFn({ method: "POST" })
  .middleware([requireManager])
  .validator((input: { id: string }) => input)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("onboarding_tasks").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ─── Review cycles & 1:1 notes ───────────────────────────

export const getReviewCycles = createServerFn({ method: "GET" })
  .middleware([requireStaff])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("review_cycles")
      .select("*")
      .order("period_start", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const saveReviewCycle = createServerFn({ method: "POST" })
  .middleware([requireManager])
  .validator(
    (input: { id?: string; name: string; period_start: string; period_end: string; status: string }) => input,
  )
  .handler(async ({ data, context }) => {
    if (!data.name.trim()) throw new Error("Enter a cycle name");
    if (!data.period_start || !data.period_end) throw new Error("Choose a start and end date");
    if (data.period_end < data.period_start) throw new Error("End date must be after the start date");
    const payload = {
      name: data.name.trim(),
      period_start: data.period_start,
      period_end: data.period_end,
      status: data.status,
      created_by: context.userId,
    };
    const { error } = data.id
      ? await context.supabase.from("review_cycles").update(payload).eq("id", data.id)
      : await context.supabase.from("review_cycles").insert(payload);
    if (error) throw new Error(error.message);
    await logAudit(context, {
      action: data.id ? "review_cycle.update" : "review_cycle.create",
      target_type: "review_cycle",
      target_name: data.name,
    });
    return { ok: true };
  });

export const deleteReviewCycle = createServerFn({ method: "POST" })
  .middleware([requireManager])
  .validator((input: { id: string }) => input)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("review_cycles").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getOneOnOneNotes = createServerFn({ method: "GET" })
  .middleware([requireStaff])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("one_on_one_notes")
      .select("*")
      .order("meeting_date", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const saveOneOnOneNote = createServerFn({ method: "POST" })
  .middleware([requireManager])
  .validator(
    (input: {
      employee_id: string;
      meeting_date: string;
      agenda: string;
      notes: string;
      action_items: string;
    }) => input,
  )
  .handler(async ({ data, context }) => {
    if (!data.employee_id) throw new Error("Choose an employee");
    const { error } = await context.supabase.from("one_on_one_notes").insert({
      employee_id: data.employee_id,
      manager_id: context.userId,
      meeting_date: data.meeting_date || new Date().toISOString().slice(0, 10),
      agenda: data.agenda,
      notes: data.notes,
      action_items: data.action_items,
    });
    if (error) throw new Error(error.message);
    await context.supabase.from("notifications").insert({
      user_id: data.employee_id,
      title: "New 1:1 note added",
      body: data.agenda || "Your manager logged notes from your recent 1:1.",
      kind: "performance",
    });
    return { ok: true };
  });

export const deleteOneOnOneNote = createServerFn({ method: "POST" })
  .middleware([requireManager])
  .validator((input: { id: string }) => input)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("one_on_one_notes").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ─── People analytics ────────────────────────────────────

export type PeopleAnalytics = {
  headcount: { total: number; active: number; inactive: number; hr: number };
  byDepartment: { name: string; count: number }[];
  hiring: { label: string; joined: number; exits: number }[];
  attritionPct: number;
  tenure: { under1: number; oneToThree: number; overThree: number };
  leaveBalances: {
    user_id: string;
    name: string;
    taken: number;
    entitled: number;
    remaining: number;
    pending: number;
  }[];
  leaveTypeMix: { type: string; days: number }[];
};

export const getPeopleAnalytics = createServerFn({ method: "GET" })
  .middleware([requireManager])
  .handler(async ({ context }): Promise<PeopleAnalytics> => {
    const year = new Date().getFullYear();
    const [profilesRes, rolesRes, leavesRes, settingsRes] = await Promise.all([
      context.supabase
        .from("employee_profile")
        .select("user_id, full_name, department, status, joining_date, updated_at"),
      context.supabase.from("user_roles").select("user_id, role"),
      context.supabase.from("leave_applications").select("user_id, days, status, leave_type, start_date"),
      context.supabase.from("org_settings").select("value").eq("key", "leave_types").maybeSingle(),
    ]);

    const people = profilesRes.data ?? [];
    const roles = rolesRes.data ?? [];
    const leaves = leavesRes.data ?? [];

    const entitled = (((settingsRes.data?.value ?? {}) as Record<string, unknown>)["types"] as
      | { name: string; annual: number }[]
      | undefined)?.reduce((s, t) => s + Number(t.annual || 0), 0) ?? 0;

    const active = people.filter((p) => (p.status ?? "active").toLowerCase() !== "inactive");
    const inactive = people.length - active.length;

    const deptMap = new Map<string, number>();
    for (const p of active) {
      const key = (p.department || "").trim() || "Unassigned";
      deptMap.set(key, (deptMap.get(key) ?? 0) + 1);
    }

    const hiring: { label: string; joined: number; exits: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i, 1);
      const key = d.toISOString().slice(0, 7);
      hiring.push({
        label: d.toLocaleString("en-IN", { month: "short" }),
        joined: people.filter((p) => (p.joining_date ?? "").slice(0, 7) === key).length,
        exits: people.filter(
          (p) => (p.status ?? "").toLowerCase() === "inactive" && (p.updated_at ?? "").slice(0, 7) === key,
        ).length,
      });
    }

    const now = Date.now();
    const years = (d: string | null) => (d ? (now - new Date(d).getTime()) / (365 * 86400000) : 0);
    const tenure = {
      under1: active.filter((p) => years(p.joining_date) < 1).length,
      oneToThree: active.filter((p) => years(p.joining_date) >= 1 && years(p.joining_date) < 3).length,
      overThree: active.filter((p) => years(p.joining_date) >= 3).length,
    };

    const leaveBalances = people.map((p) => {
      const mine = leaves.filter((l) => l.user_id === p.user_id && (l.start_date ?? "").startsWith(String(year)));
      const taken = mine.filter((l) => l.status === "approved").reduce((s, l) => s + Number(l.days || 0), 0);
      const pending = mine.filter((l) => l.status === "pending").reduce((s, l) => s + Number(l.days || 0), 0);
      return {
        user_id: p.user_id,
        name: p.full_name || "",
        taken,
        entitled,
        remaining: Math.max(0, entitled - taken),
        pending,
      };
    });

    const typeMap = new Map<string, number>();
    for (const l of leaves) {
      if (l.status !== "approved") continue;
      const key = l.leave_type || "Other";
      typeMap.set(key, (typeMap.get(key) ?? 0) + Number(l.days || 0));
    }

    return {
      headcount: {
        total: people.length,
        active: active.length,
        inactive,
        hr: new Set(roles.filter((r) => r.role === "hr").map((r) => r.user_id)).size,
      },
      byDepartment: [...deptMap.entries()]
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count),
      hiring,
      attritionPct: pct(inactive, people.length),
      tenure,
      leaveBalances: leaveBalances.sort((a, b) => b.taken - a.taken),
      leaveTypeMix: [...typeMap.entries()]
        .map(([type, days]) => ({ type, days }))
        .sort((a, b) => b.days - a.days),
    };
  });
