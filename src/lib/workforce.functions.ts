import { createServerFn } from "@tanstack/react-start";
import { requireStaff, requireManager, requireSuperAdmin } from "@/lib/require-admin";
import { LATE_AFTER, pct } from "@/lib/workforce.constants";
import { logAudit } from "@/lib/workforce.server";
import { openRequestSafe } from "@/lib/approvals.server";


export type WorkforceRow = {
  user_id: string;
  full_name: string;
  employee_code: string;
  department: string;
  designation: string;
  status: string;
  manager_id: string | null;
  manager_name: string;
  joining_date: string | null;
  roles: string[];
  presentDays: number;
  lateDays: number;
  absentDays: number;
  leaveDays: number;
  attendancePct: number;
  todayStatus: string;
  tasksTotal: number;
  tasksDone: number;
  tasksOverdue: number;
  tasksBlocked: number;
  completionPct: number;
  onTimePct: number;
  currentProject: string;
  pendingLeaves: number;
  managerRating: number;
};

export type WorkforceSnapshot = {
  scope: "ceo" | "hr" | "employee";
  today: string;
  rows: WorkforceRow[];
  kpi: {
    employees: number;
    active: number;
    presentToday: number;
    absentToday: number;
    onLeaveToday: number;
    lateToday: number;
    pendingLeaves: number;
    pendingApprovals: number;
    openTasks: number;
    overdueTasks: number;
    departments: number;
    hrCount: number;
  };
  attendanceMix: { present: number; late: number; absent: number; leave: number };
  departmentBreakdown: { name: string; employees: number; active: number; onLeave: number; completionPct: number }[];
  trend: { label: string; employees: number; attendancePct: number }[];
};

/**
 * Scoped workforce snapshot. Row-level security limits what each caller can read:
 * an employee sees only themselves, HR sees their assigned employees, leadership
 * sees the whole organisation.
 */
export const getWorkforceSnapshot = createServerFn({ method: "GET" })
  .middleware([requireStaff])
  .handler(async ({ context }): Promise<WorkforceSnapshot> => {
    const today = new Date().toISOString().slice(0, 10);
    const since = new Date(Date.now() - 180 * 86400000).toISOString().slice(0, 10);

    const [profilesRes, employmentRes, rolesRes, attendanceRes, tasksRes, leavesRes, claimsRes, reqRes, projectsRes, reviewsRes, deptRes] =
      await Promise.all([
        context.supabase.from("profiles").select("id, full_name"),
        context.supabase.from("employee_profile").select("*"),
        context.supabase.from("user_roles").select("user_id, role"),
        context.supabase.from("attendance").select("user_id, work_date, status, check_in, check_out").gte("work_date", since),
        context.supabase.from("tasks").select("id, user_id, title, status, due_date, progress, project_id, updated_at"),
        context.supabase.from("leave_applications").select("id, user_id, status, days, start_date, end_date, leave_type"),
        context.supabase.from("expense_claims").select("id, user_id, status, amount"),
        context.supabase.from("employee_requests").select("id, user_id, status"),
        context.supabase.from("projects").select("id, name"),
        context.supabase.from("performance_reviews").select("user_id, manager_rating, created_at"),
        context.supabase.from("departments").select("id, name"),
      ]);

    const nameById = new Map((profilesRes.data ?? []).map((p) => [p.id, p.full_name]));
    const projectName = new Map((projectsRes.data ?? []).map((p) => [p.id, p.name]));

    const roleMap = new Map<string, string[]>();
    for (const r of rolesRes.data ?? []) {
      const arr = roleMap.get(r.user_id) ?? [];
      arr.push(r.role);
      roleMap.set(r.user_id, arr);
    }

    const employment = new Map<string, Record<string, unknown>>();
    for (const e of employmentRes.data ?? []) employment.set(e.user_id, e as Record<string, unknown>);

    const ids = new Set<string>([context.userId, ...employment.keys()]);
    if (context.isSuper) for (const id of nameById.keys()) ids.add(id);

    const rows: WorkforceRow[] = [];
    for (const id of ids) {
      const e = employment.get(id) ?? {};
      const att = (attendanceRes.data ?? []).filter((a) => a.user_id === id);
      const presentDays = att.filter((a) => a.status === "present" || a.status === "half_day").length;
      const absentDays = att.filter((a) => a.status === "absent").length;
      const leaveDays = att.filter((a) => a.status === "leave" || a.status === "paid_leave").length;
      const lateDays = att.filter((a) => a.status === "present" && (a.check_in ?? "") > LATE_AFTER).length;
      const todayRow = att.find((a) => a.work_date === today);

      const myTasks = (tasksRes.data ?? []).filter((t) => t.user_id === id);
      const done = myTasks.filter((t) => t.status === "completed");
      const onTime = done.filter((t) => !t.due_date || (t.updated_at ?? "").slice(0, 10) <= t.due_date);
      const overdue = myTasks.filter(
        (t) => t.status !== "completed" && t.due_date && t.due_date < today,
      );
      const active = myTasks.find((t) => t.status === "in_progress") ?? myTasks[0];
      const reviews = (reviewsRes.data ?? []).filter((r) => r.user_id === id);
      const rating = reviews.length ? Number(reviews[0]!.manager_rating) : 0;

      rows.push({
        user_id: id,
        full_name: ((e["full_name"] as string) || nameById.get(id) || "").trim(),
        employee_code: (e["employee_code"] as string) ?? "",
        department: (e["department"] as string) ?? "",
        designation: (e["designation"] as string) ?? "",
        status: ((e["status"] as string) || "active").toLowerCase(),
        manager_id: (e["manager_id"] as string | null) ?? null,
        manager_name: (e["manager_name"] as string) ?? "",
        joining_date: (e["joining_date"] as string | null) ?? null,
        roles: roleMap.get(id) ?? [],
        presentDays,
        lateDays,
        absentDays,
        leaveDays,
        attendancePct: pct(presentDays, att.length),
        todayStatus: todayRow?.status ?? "not_marked",
        tasksTotal: myTasks.length,
        tasksDone: done.length,
        tasksOverdue: overdue.length,
        tasksBlocked: myTasks.filter((t) => t.status === "blocked").length,
        completionPct: pct(done.length, myTasks.length),
        onTimePct: pct(onTime.length, done.length),
        currentProject: active?.project_id ? (projectName.get(active.project_id) ?? "") : (active?.title ?? ""),
        pendingLeaves: (leavesRes.data ?? []).filter((l) => l.user_id === id && l.status === "pending").length,
        managerRating: rating,
      });
    }

    rows.sort((a, b) => a.full_name.localeCompare(b.full_name));

    const others = rows.filter((r) => r.user_id !== context.userId);
    const pool = context.isSuper || context.isHr ? others : rows;

    const presentToday = pool.filter((r) => r.todayStatus === "present" || r.todayStatus === "half_day").length;
    const absentToday = pool.filter((r) => r.todayStatus === "absent").length;
    const onLeaveToday = pool.filter((r) => r.todayStatus === "leave" || r.todayStatus === "paid_leave").length;
    const lateToday = pool.filter((r) => {
      const a = (attendanceRes.data ?? []).find((x) => x.user_id === r.user_id && x.work_date === today);
      return !!a && a.status === "present" && (a.check_in ?? "") > LATE_AFTER;
    }).length;

    const scopedIds = new Set(pool.map((r) => r.user_id));
    const pendingLeaves = (leavesRes.data ?? []).filter((l) => l.status === "pending" && scopedIds.has(l.user_id)).length;
    const pendingClaims = (claimsRes.data ?? []).filter((c) => c.status === "pending" && scopedIds.has(c.user_id)).length;
    const pendingRequests = (reqRes.data ?? []).filter((r) => r.status === "pending" && scopedIds.has(r.user_id)).length;
    const openTasks = (tasksRes.data ?? []).filter((t) => t.status !== "completed" && scopedIds.has(t.user_id)).length;
    const overdueTasks = (tasksRes.data ?? []).filter(
      (t) => t.status !== "completed" && t.due_date && t.due_date < today && scopedIds.has(t.user_id),
    ).length;

    const attTotal = pool.reduce((s, r) => s + r.presentDays + r.absentDays + r.leaveDays, 0);
    const attendanceMix = {
      present: pct(pool.reduce((s, r) => s + r.presentDays - r.lateDays, 0), attTotal),
      late: pct(pool.reduce((s, r) => s + r.lateDays, 0), attTotal),
      absent: pct(pool.reduce((s, r) => s + r.absentDays, 0), attTotal),
      leave: pct(pool.reduce((s, r) => s + r.leaveDays, 0), attTotal),
    };

    const deptMap = new Map<string, WorkforceRow[]>();
    for (const r of pool) {
      const key = r.department?.trim() || "Unassigned";
      deptMap.set(key, [...(deptMap.get(key) ?? []), r]);
    }
    const departmentBreakdown = [...deptMap.entries()]
      .map(([name, list]) => ({
        name,
        employees: list.length,
        active: list.filter((r) => r.status !== "inactive").length,
        onLeave: list.filter((r) => r.todayStatus === "leave" || r.todayStatus === "paid_leave").length,
        completionPct: pct(
          list.reduce((s, r) => s + r.tasksDone, 0),
          list.reduce((s, r) => s + r.tasksTotal, 0),
        ),
      }))
      .sort((a, b) => b.employees - a.employees);

    // 6-month workforce + attendance trend from real rows
    const trend: { label: string; employees: number; attendancePct: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i, 1);
      const key = d.toISOString().slice(0, 7);
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().slice(0, 10);
      const employees = pool.filter((r) => !r.joining_date || r.joining_date <= end).length;
      const monthAtt = (attendanceRes.data ?? []).filter(
        (a) => a.work_date.slice(0, 7) === key && scopedIds.has(a.user_id),
      );
      trend.push({
        label: d.toLocaleString("en-IN", { month: "short" }),
        employees,
        attendancePct: pct(monthAtt.filter((a) => a.status === "present" || a.status === "half_day").length, monthAtt.length),
      });
    }

    return {
      scope: context.isSuper ? "ceo" : context.isHr ? "hr" : "employee",
      today,
      rows,
      kpi: {
        employees: pool.length,
        active: pool.filter((r) => r.status !== "inactive").length,
        presentToday,
        absentToday,
        onLeaveToday,
        lateToday,
        pendingLeaves,
        pendingApprovals: pendingLeaves + pendingClaims + pendingRequests,
        openTasks,
        overdueTasks,
        departments: (deptRes.data ?? []).length || deptMap.size,
        hrCount: pool.filter((r) => r.roles.includes("hr")).length,
      },
      attendanceMix,
      departmentBreakdown,
      trend,
    };
  });

// ─── Employee 360 ────────────────────────────────────────

export const getEmployee360 = createServerFn({ method: "GET" })
  .middleware([requireStaff])
  .inputValidator((input: { user_id: string }) => input)
  .handler(async ({ data, context }) => {
    const id = data.user_id;
    const [profile, personal, attendance, leaves, tasks, docs, reviews, salary, corrections] = await Promise.all([
      context.supabase.from("employee_profile").select("*").eq("user_id", id).maybeSingle(),
      context.supabase.from("employee_personal").select("*").eq("user_id", id).maybeSingle(),
      context.supabase.from("attendance").select("*").eq("user_id", id).order("work_date", { ascending: false }).limit(120),
      context.supabase.from("leave_applications").select("*").eq("user_id", id).order("start_date", { ascending: false }),
      context.supabase.from("tasks").select("*").eq("user_id", id).order("created_at", { ascending: false }),
      context.supabase.from("employee_documents").select("id, doc_type, file_name, status, created_at").eq("user_id", id),
      context.supabase.from("performance_reviews").select("*").eq("user_id", id).order("created_at", { ascending: false }),
      context.supabase.from("salary_records").select("*").eq("user_id", id).order("period_year", { ascending: false }),
      context.supabase.from("attendance_corrections").select("*").eq("user_id", id).order("created_at", { ascending: false }),
    ]);

    if (!profile.data && id !== context.userId) {
      throw new Error("Employee not found or outside your scope");
    }

    // Sensitive personal fields are only exposed to the person themselves or leadership.
    const canSeeSensitive = id === context.userId || context.isSuper;
    const personalRow = personal.data ? { ...personal.data } : null;
    if (personalRow && !canSeeSensitive) {
      personalRow.bank_account_number = "••••";
      personalRow.bank_ifsc = "••••";
      personalRow.pan_no = "••••";
      personalRow.aadhaar_no = "••••";
    }

    return {
      profile: profile.data,
      personal: personalRow,
      sensitiveMasked: !canSeeSensitive,
      attendance: attendance.data ?? [],
      leaves: leaves.data ?? [],
      tasks: tasks.data ?? [],
      documents: docs.data ?? [],
      reviews: reviews.data ?? [],
      salary: salary.data ?? [],
      corrections: corrections.data ?? [],
    };
  });

// ─── Attendance corrections ──────────────────────────────

export const getAttendanceCorrections = createServerFn({ method: "GET" })
  .middleware([requireStaff])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("attendance_corrections")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const requestAttendanceCorrection = createServerFn({ method: "POST" })
  .middleware([requireStaff])
  .inputValidator(
    (input: {
      work_date: string;
      requested_status: "present" | "absent" | "half_day" | "leave" | "paid_leave" | "holiday";
      requested_check_in: string | null;
      requested_check_out: string | null;
      reason: string;
    }) => input,
  )
  .handler(async ({ data, context }) => {
    const { data: inserted, error } = await context.supabase
      .from("attendance_corrections")
      .insert({
        user_id: context.userId,
        work_date: data.work_date,
        requested_status: data.requested_status,
        requested_check_in: data.requested_check_in,
        requested_check_out: data.requested_check_out,
        reason: data.reason,
      })
      .select("id")
      .maybeSingle();
    if (error) throw new Error(error.message);

    await openRequestSafe(
      context.supabase,
      { userId: context.userId, isHr: context.isHr, role: context.roles[0] ?? "employee" },
      {
        kind: "attendance_correction",
        resource_table: "attendance_corrections",
        resource_id: (inserted?.id as string) ?? null,
        title: `Attendance correction — ${data.work_date}`,
        summary: data.reason,
      },
    );
    return { ok: true };
  });


export const decideAttendanceCorrection = createServerFn({ method: "POST" })
  .middleware([requireManager])
  .inputValidator((input: { id: string; decision: "approved" | "rejected"; note: string }) => input)
  .handler(async ({ data, context }) => {
    const { data: row, error: readErr } = await context.supabase
      .from("attendance_corrections")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (readErr) throw new Error(readErr.message);
    if (!row) throw new Error("Request not found or outside your team");
    if (row.user_id === context.userId) throw new Error("You cannot decide your own request");

    const { error } = await context.supabase
      .from("attendance_corrections")
      .update({
        status: data.decision,
        decided_by: context.userId,
        decided_at: new Date().toISOString(),
        decision_note: data.note,
      })
      .eq("id", data.id);
    if (error) throw new Error(error.message);

    if (data.decision === "approved") {
      await context.supabase.from("attendance").upsert(
        {
          user_id: row.user_id,
          work_date: row.work_date,
          status: row.requested_status,
          check_in: row.requested_check_in,
          check_out: row.requested_check_out,
          daily_update: `Corrected: ${row.reason}`,
        },
        { onConflict: "user_id,work_date" },
      );
    }

    await Promise.all([
      context.supabase.from("notifications").insert({
        user_id: row.user_id,
        title: `Attendance correction ${data.decision}`,
        body: `${row.work_date} — ${data.note || "No note"}`,
        kind: "correction",
      }),
      logAudit(context, {
        action: `attendance.correction.${data.decision}`,
        target_type: "attendance_correction",
        target_id: data.id,
        details: `${row.work_date} → ${row.requested_status}`,
      }),
    ]);

    return { ok: true };
  });

// ─── Audit ───────────────────────────────────────────────

export const recordAuditEvent = createServerFn({ method: "POST" })
  .middleware([requireStaff])
  .inputValidator(
    (input: { action: string; target_type?: string; target_id?: string; target_name?: string; details?: string }) => input,
  )
  .handler(async ({ data, context }) => {
    await logAudit(context, data);
    return { ok: true };
  });

export const getAuditLogs = createServerFn({ method: "GET" })
  .middleware([requireSuperAdmin])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("audit_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(300);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

// ─── Notifications ───────────────────────────────────────

export const getNotifications = createServerFn({ method: "GET" })
  .middleware([requireStaff])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const markNotificationsRead = createServerFn({ method: "POST" })
  .middleware([requireStaff])
  .inputValidator((input: { ids: string[] }) => input)
  .handler(async ({ data, context }) => {
    if (data.ids.length === 0) return { ok: true };
    const { error } = await context.supabase
      .from("notifications")
      .update({ is_read: true })
      .in("id", data.ids);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ─── Announcements ───────────────────────────────────────

export const getAnnouncements = createServerFn({ method: "GET" })
  .middleware([requireStaff])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("announcements")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const publishAnnouncement = createServerFn({ method: "POST" })
  .middleware([requireManager])
  .inputValidator(
    (input: {
      title: string;
      body: string;
      category: string;
      audience: "all" | "department" | "team";
      department_id: string | null;
    }) => input,
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("announcements").insert({
      author_id: context.userId,
      title: data.title,
      body: data.body,
      category: data.category,
      audience: data.audience,
      department_id: data.department_id,
      manager_id: data.audience === "team" ? context.userId : null,
    });
    if (error) throw new Error(error.message);
    await logAudit(context, { action: "announcement.publish", target_type: "announcement", target_name: data.title });
    return { ok: true };
  });

export const deleteAnnouncement = createServerFn({ method: "POST" })
  .middleware([requireManager])
  .inputValidator((input: { id: string }) => input)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("announcements").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ─── Departments ─────────────────────────────────────────

export const getDepartments = createServerFn({ method: "GET" })
  .middleware([requireStaff])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.from("departments").select("*").order("name");
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const upsertDepartment = createServerFn({ method: "POST" })
  .middleware([requireSuperAdmin])
  .inputValidator((input: { id?: string; name: string; parent_id: string | null; head_id: string | null }) => input)
  .handler(async ({ data, context }) => {
    const payload = { name: data.name, parent_id: data.parent_id, head_id: data.head_id };
    const { error } = data.id
      ? await context.supabase.from("departments").update(payload).eq("id", data.id)
      : await context.supabase.from("departments").insert(payload);
    if (error) throw new Error(error.message);
    await logAudit(context, { action: data.id ? "department.update" : "department.create", target_name: data.name });
    return { ok: true };
  });

export const deleteDepartment = createServerFn({ method: "POST" })
  .middleware([requireSuperAdmin])
  .inputValidator((input: { id: string }) => input)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("departments").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    await logAudit(context, { action: "department.delete", target_id: data.id });
    return { ok: true };
  });

// ─── Performance reviews ─────────────────────────────────

export const savePerformanceReview = createServerFn({ method: "POST" })
  .middleware([requireManager])
  .inputValidator(
    (input: {
      user_id: string;
      period_label: string;
      goals_total: number;
      goals_met: number;
      manager_rating: number;
      feedback: string;
    }) => input,
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("performance_reviews").insert({
      user_id: data.user_id,
      reviewer_id: context.userId,
      period_label: data.period_label,
      goals_total: data.goals_total,
      goals_met: data.goals_met,
      manager_rating: data.manager_rating,
      feedback: data.feedback,
    });
    if (error) throw new Error(error.message);
    await Promise.all([
      context.supabase.from("notifications").insert({
        user_id: data.user_id,
        title: "New performance review",
        body: `${data.period_label}: rated ${data.manager_rating}/5`,
        kind: "performance",
      }),
      logAudit(context, { action: "performance.review", target_type: "employee", target_id: data.user_id }),
    ]);
    return { ok: true };
  });

// ─── Employee lifecycle (leadership) ─────────────────────

export const setEmployeeStatus = createServerFn({ method: "POST" })
  .middleware([requireSuperAdmin])
  .inputValidator((input: { user_id: string; status: "active" | "inactive" }) => input)
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("employee_profile")
      .update({ status: data.status })
      .eq("user_id", data.user_id);
    if (error) throw new Error(error.message);
    await logAudit(context, {
      action: "employee.status.change",
      target_type: "employee",
      target_id: data.user_id,
      details: data.status,
    });
    return { ok: true };
  });

export const updateEmployeeAssignment = createServerFn({ method: "POST" })
  .middleware([requireSuperAdmin])
  .inputValidator(
    (input: { user_id: string; department: string; designation: string; department_id: string | null }) => input,
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("employee_profile")
      .update({
        department: data.department,
        designation: data.designation,
        department_id: data.department_id,
      })
      .eq("user_id", data.user_id);
    if (error) throw new Error(error.message);
    await logAudit(context, {
      action: "employee.assignment.update",
      target_type: "employee",
      target_id: data.user_id,
      details: `${data.department} · ${data.designation}`,
    });
    return { ok: true };
  });
