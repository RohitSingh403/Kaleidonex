import { createServerFn } from "@tanstack/react-start";
import { requireAdmin } from "@/lib/require-admin";
import { openRequestSafe } from "@/lib/approvals.server";


export type AttendanceStatus = "present" | "absent" | "half_day" | "leave" | "paid_leave" | "holiday";

export const getAttendance = createServerFn({ method: "GET" })
  .middleware([requireAdmin])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("attendance")
      .select("*")
      .eq("user_id", context.userId)
      .order("work_date", { ascending: true });
    if (error) throw new Error(error.message);
    return data;
  });

export const markAttendance = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .validator(
    (input: {
      work_date: string;
      status: AttendanceStatus;
      check_in: string | null;
      check_out: string | null;
      daily_update: string;
    }) => input,
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("attendance")
      .upsert({ ...data, user_id: context.userId }, { onConflict: "user_id,work_date" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getLeaves = createServerFn({ method: "GET" })
  .middleware([requireAdmin])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("leave_applications")
      .select("*")
      .eq("user_id", context.userId)
      .order("start_date", { ascending: false });
    if (error) throw new Error(error.message);
    return data;
  });

export const applyLeave = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .validator(
    (input: {
      leave_type: string;
      start_date: string;
      end_date: string;
      days: number;
      reason: string;
    }) => input,
  )
  .handler(async ({ data, context }) => {
    const { data: inserted, error } = await context.supabase
      .from("leave_applications")
      .insert({ ...data, user_id: context.userId })
      .select("id")
      .maybeSingle();
    if (error) throw new Error(error.message);
    await openRequestSafe(
      context.supabase,
      { userId: context.userId, isHr: context.isHr, role: context.roles[0] ?? "employee" },
      {
        kind: "leave",
        resource_table: "leave_applications",
        resource_id: (inserted?.id as string) ?? null,
        title: `${data.leave_type} leave — ${data.start_date} to ${data.end_date}`,
        summary: data.reason,
        amount: data.days,
      },
    );
    return { ok: true };
  });


export const getSalaryRecords = createServerFn({ method: "GET" })
  .middleware([requireAdmin])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("salary_records")
      .select("*")
      .eq("user_id", context.userId)
      .order("period_year", { ascending: false })
      .order("period_month", { ascending: false });
    if (error) throw new Error(error.message);
    return data;
  });

export const getEmployeeRequests = createServerFn({ method: "GET" })
  .middleware([requireAdmin])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("employee_requests")
      .select("*")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data;
  });

export const createEmployeeRequest = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .validator((input: { request_type: string; details: string; note: string }) => input)
  .handler(async ({ data, context }) => {
    const { data: inserted, error } = await context.supabase
      .from("employee_requests")
      .insert({ ...data, user_id: context.userId })
      .select("id")
      .maybeSingle();
    if (error) throw new Error(error.message);
    await openRequestSafe(
      context.supabase,
      { userId: context.userId, isHr: context.isHr, role: context.roles[0] ?? "employee" },
      {
        kind: "employee_request",
        resource_table: "employee_requests",
        resource_id: (inserted?.id as string) ?? null,
        title: data.request_type,
        summary: data.details || data.note,
      },
    );

    return { ok: true };
  });
