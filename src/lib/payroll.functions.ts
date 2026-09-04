import { createServerFn } from "@tanstack/react-start";
import { requireManager } from "@/lib/require-admin";
import { logAudit } from "@/lib/workforce.server";

export type PayrollEmployeeItem = {
  user_id: string;
  full_name: string;
  employee_code: string;
  department: string;
  designation: string;
  base_salary: number;
  status: string;
  // Live attendance metrics for the selected month
  total_days: number;
  present_days: number;
  paid_leave_days: number;
  holiday_days: number;
  half_days: number;
  absent_days: number;
  unpaid_leave_days: number;
  payable_days: number;
  unpaid_days: number;
  // Computed financial figures
  suggested_deduction: number;
  suggested_net_pay: number;
  // Existing salary record if generated
  record_id?: string | null | undefined;
  record_status?: "pending" | "paid" | null | undefined;
  recorded_net_pay?: number | null | undefined;
  recorded_basic_salary?: number | null | undefined;
  recorded_deductions?: number | null | undefined;
  recorded_earnings?: number | null | undefined;
  paid_on?: string | null | undefined;
};

export type PayrollWorkspaceData = {
  month: number;
  year: number;
  days_in_month: number;
  employees: PayrollEmployeeItem[];
  totals: {
    total_payroll: number;
    total_base: number;
    total_deductions: number;
    paid_count: number;
    pending_count: number;
  };
};

export const getPayrollWorkspace = createServerFn({ method: "GET" })
  .middleware([requireManager])
  .validator((input: { month?: number; year?: number }) => {
    const now = new Date();
    return {
      month: input.month ?? now.getMonth() + 1,
      year: input.year ?? now.getFullYear(),
    };
  })
  .handler(async ({ data, context }): Promise<PayrollWorkspaceData> => {
    const { month, year } = data;
    const daysInMonth = new Date(year, month, 0).getDate();
    const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
    const endDate = `${year}-${String(month).padStart(2, "0")}-${String(daysInMonth).padStart(2, "0")}`;

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // 1. Fetch profiles, employee_profile, user_roles
    const [profilesRes, empProfRes, rolesRes, salaryRecordsRes, attendanceRes] = await Promise.all([
      supabaseAdmin.from("profiles").select("id, full_name"),
      supabaseAdmin
        .from("employee_profile")
        .select("user_id, full_name, employee_code, department, designation, salary, status"),
      supabaseAdmin.from("user_roles").select("user_id, role"),
      supabaseAdmin
        .from("salary_records")
        .select("*")
        .eq("period_month", month)
        .eq("period_year", year),
      supabaseAdmin
        .from("attendance")
        .select("user_id, status, work_date")
        .gte("work_date", startDate)
        .lte("work_date", endDate),
    ]);

    const nameById = new Map<string, string>();
    for (const p of profilesRes.data ?? []) nameById.set(p.id, p.full_name);

    const empProfMap = new Map<string, Record<string, unknown>>();
    for (const e of empProfRes.data ?? []) empProfMap.set(e.user_id, e);

    const allUserIds = new Set<string>();
    for (const r of rolesRes.data ?? []) allUserIds.add(r.user_id);
    for (const e of empProfRes.data ?? []) allUserIds.add(e.user_id);

    const salaryRecords = salaryRecordsRes.data ?? [];
    const salaryMap = new Map(salaryRecords.map((r) => [r.user_id, r]));

    // Group attendance by user_id
    const attMap = new Map<string, { status: string }[]>();
    for (const a of attendanceRes.data ?? []) {
      const list = attMap.get(a.user_id) ?? [];
      list.push(a);
      attMap.set(a.user_id, list);
    }

    const employees: PayrollEmployeeItem[] = [...allUserIds].map((userId) => {
      const empProf = empProfMap.get(userId) ?? {};
      const baseSalary = Number(empProf["salary"] || 0);
      const userAtt = attMap.get(userId) ?? [];

      const presentDays = userAtt.filter((a) => a.status === "present").length;
      const paidLeaveDays = userAtt.filter((a) => a.status === "paid_leave").length;
      const holidayDays = userAtt.filter((a) => a.status === "holiday").length;
      const halfDays = userAtt.filter((a) => a.status === "half_day").length;
      const absentDays = userAtt.filter((a) => a.status === "absent").length;
      const unpaidLeaveDays = userAtt.filter((a) => a.status === "leave").length;

      // Paid leaves and holidays count as fully paid days with zero deduction
      const payableDays = presentDays + paidLeaveDays + holidayDays + halfDays * 0.5;
      const unpaidDays = Math.max(0, daysInMonth - payableDays);

      const perDayRate = daysInMonth > 0 ? baseSalary / daysInMonth : 0;
      const suggestedNetPay = Math.round(payableDays * perDayRate);
      const suggestedDeduction = Math.max(0, Math.round(baseSalary - suggestedNetPay));

      const existingRecord = salaryMap.get(userId);
      const fullName = (empProf["full_name"] as string) || nameById.get(userId) || "Employee";

      // If recorded slip has old/outdated base_salary, prioritize live calculated values
      const hasOutdatedRecord =
        existingRecord &&
        typeof existingRecord.basic_salary === "number" &&
        existingRecord.basic_salary !== baseSalary;

      const recordedNet = hasOutdatedRecord ? undefined : existingRecord?.net_pay;
      const recordedDeductions = hasOutdatedRecord ? undefined : existingRecord?.deductions;
      const recordedBasic = hasOutdatedRecord ? baseSalary : existingRecord?.basic_salary;

      return {
        user_id: userId,
        full_name: fullName,
        employee_code: (empProf["employee_code"] as string) || "—",
        department: (empProf["department"] as string) || "General",
        designation: (empProf["designation"] as string) || "Staff",
        base_salary: baseSalary,
        status: (empProf["status"] as string) || "Active",
        total_days: daysInMonth,
        present_days: presentDays,
        paid_leave_days: paidLeaveDays,
        holiday_days: holidayDays,
        half_days: halfDays,
        absent_days: absentDays,
        unpaid_leave_days: unpaidLeaveDays,
        payable_days: payableDays,
        unpaid_days: unpaidDays,
        suggested_deduction: suggestedDeduction,
        suggested_net_pay: suggestedNetPay,
        record_id: existingRecord?.id,
        record_status: existingRecord?.status,
        recorded_net_pay: recordedNet,
        recorded_basic_salary: recordedBasic,
        recorded_deductions: recordedDeductions,
        recorded_earnings: existingRecord?.earnings,
        paid_on: existingRecord?.paid_on,
      };
    });

    const totalBase = employees.reduce((acc, e) => acc + e.base_salary, 0);
    const totalDeductions = employees.reduce((acc, e) => acc + (e.recorded_deductions ?? e.suggested_deduction), 0);
    const totalPayroll = employees.reduce((acc, e) => acc + (e.recorded_net_pay ?? e.suggested_net_pay), 0);
    const paidCount = employees.filter((e) => e.record_status === "paid").length;
    const pendingCount = employees.filter((e) => e.record_status === "pending" || !e.record_id).length;

    return {
      month,
      year,
      days_in_month: daysInMonth,
      employees,
      totals: {
        total_payroll: totalPayroll,
        total_base: totalBase,
        total_deductions: totalDeductions,
        paid_count: paidCount,
        pending_count: pendingCount,
      },
    };
  });

export const updateEmployeeBaseSalary = createServerFn({ method: "POST" })
  .middleware([requireManager])
  .validator((input: { user_id: string; salary: number }) => input)
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // 1. Upsert into employee_profile
    const { data: prof } = await supabaseAdmin
      .from("profiles")
      .select("full_name")
      .eq("id", data.user_id)
      .maybeSingle();

    await (supabaseAdmin as any).from("employee_profile").upsert(
      {
        user_id: data.user_id,
        full_name: prof?.full_name || undefined,
        salary: data.salary,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );

    // 3. Update active month salary record so slip is immediately accurate
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
    const startDate = `${currentYear}-${String(currentMonth).padStart(2, "0")}-01`;
    const endDate = `${currentYear}-${String(currentMonth).padStart(2, "0")}-${String(daysInMonth).padStart(2, "0")}`;

    const { data: userAtt } = await supabaseAdmin
      .from("attendance")
      .select("status")
      .eq("user_id", data.user_id)
      .gte("work_date", startDate)
      .lte("work_date", endDate);

    const attList = userAtt ?? [];
    const presentDays = attList.filter((a) => a.status === "present").length;
    const paidLeaveDays = attList.filter((a) => a.status === "paid_leave").length;
    const holidayDays = attList.filter((a) => a.status === "holiday").length;
    const halfDays = attList.filter((a) => a.status === "half_day").length;
    const payableDays = presentDays + paidLeaveDays + holidayDays + halfDays * 0.5;

    const perDayRate = daysInMonth > 0 ? data.salary / daysInMonth : 0;
    const newNetPay = Math.round(payableDays * perDayRate);
    const newDeductions = Math.max(0, Math.round(data.salary - newNetPay));

    await supabaseAdmin
      .from("salary_records")
      .update({
        basic_salary: data.salary,
        deductions: newDeductions,
        net_pay: newNetPay,
        days: daysInMonth,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", data.user_id)
      .eq("period_month", currentMonth)
      .eq("period_year", currentYear);

    await logAudit(context, {
      action: "payroll.update_salary",
      target_type: "user",
      target_id: data.user_id,
      target_name: prof?.full_name || data.user_id,
      details: `Updated base salary to ₹${data.salary}`,
    });

    return { ok: true };
  });

export const generateEmployeePayroll = createServerFn({ method: "POST" })
  .middleware([requireManager])
  .validator(
    (input: {
      user_id: string;
      period_month: number;
      period_year: number;
      basic_salary: number;
      earnings?: number;
      deductions: number;
      net_pay: number;
      days: number;
      status?: "pending" | "paid";
    }) => input,
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Check if record already exists
    const { data: existing } = await supabaseAdmin
      .from("salary_records")
      .select("id")
      .eq("user_id", data.user_id)
      .eq("period_month", data.period_month)
      .eq("period_year", data.period_year)
      .maybeSingle();

    const payload = {
      user_id: data.user_id,
      period_month: data.period_month,
      period_year: data.period_year,
      basic_salary: data.basic_salary,
      earnings: data.earnings ?? 0,
      deductions: data.deductions,
      net_pay: data.net_pay,
      days: data.days,
      status: data.status ?? "pending",
      updated_at: new Date().toISOString(),
      ...(data.status === "paid" ? { paid_on: new Date().toISOString().slice(0, 10) } : {}),
    };

    if (existing?.id) {
      const { error } = await supabaseAdmin
        .from("salary_records")
        .update(payload)
        .eq("id", existing.id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabaseAdmin.from("salary_records").insert(payload);
      if (error) throw new Error(error.message);
    }

    await logAudit(context, {
      action: "payroll.generate_slip",
      target_type: "salary_record",
      target_id: data.user_id,
      details: `Generated salary for month ${data.period_month}/${data.period_year}: Net ₹${data.net_pay}`,
    });

    return { ok: true };
  });

export const markSalaryPaid = createServerFn({ method: "POST" })
  .middleware([requireManager])
  .validator((input: { record_id: string }) => input)
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { error } = await supabaseAdmin
      .from("salary_records")
      .update({
        status: "paid",
        paid_on: new Date().toISOString().slice(0, 10),
        updated_at: new Date().toISOString(),
      })
      .eq("id", data.record_id);

    if (error) throw new Error(error.message);

    await logAudit(context, {
      action: "payroll.mark_paid",
      target_type: "salary_record",
      target_id: data.record_id,
      details: `Marked salary slip ${data.record_id} as paid`,
    });

    return { ok: true };
  });
