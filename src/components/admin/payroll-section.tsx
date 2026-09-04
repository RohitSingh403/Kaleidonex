import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  Banknote,
  CheckCircle2,
  Clock,
  Download,
  Edit2,
  FileSpreadsheet,
  IndianRupee,
  RefreshCw,
  Sparkles,
  Users,
} from "lucide-react";
import {
  getPayrollWorkspace,
  updateEmployeeBaseSalary,
  generateEmployeePayroll,
  markSalaryPaid,
  type PayrollEmployeeItem,
} from "@/lib/payroll.functions";
import { months, inr } from "./my-panel/types";
import { CustomSelect } from "@/components/ui/custom-select";

export function PayrollSection() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editSalaryValue, setEditSalaryValue] = useState<number>(0);

  const queryClient = useQueryClient();
  const fetchPayroll = useServerFn(getPayrollWorkspace);
  const saveSalary = useServerFn(updateEmployeeBaseSalary);
  const generateSlip = useServerFn(generateEmployeePayroll);
  const markPaid = useServerFn(markSalaryPaid);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["payroll-workspace", month, year],
    queryFn: () => fetchPayroll({ data: { month, year } }),
  });

  const updateSalaryMutation = useMutation({
    mutationFn: (vars: { user_id: string; salary: number }) => saveSalary({ data: vars }),
    onSuccess: () => {
      toast.success("Employee base salary updated.");
      setEditingUserId(null);
      queryClient.invalidateQueries({ queryKey: ["payroll-workspace"] });
      queryClient.invalidateQueries({ queryKey: ["team-members"] });
    },
    onError: (err: Error) => toast.error(err.message || "Failed to update salary"),
  });

  const generateSlipMutation = useMutation({
    mutationFn: (emp: PayrollEmployeeItem) =>
      generateSlip({
        data: {
          user_id: emp.user_id,
          period_month: month,
          period_year: year,
          basic_salary: emp.base_salary,
          deductions: emp.suggested_deduction,
          net_pay: emp.suggested_net_pay,
          days: emp.total_days,
          status: emp.record_status ?? "pending",
        },
      }),
    onSuccess: () => {
      toast.success("Salary slip generated with paid leaves credited.");
      queryClient.invalidateQueries({ queryKey: ["payroll-workspace"] });
    },
    onError: (err: Error) => toast.error(err.message || "Failed to generate slip"),
  });

  const markPaidMutation = useMutation({
    mutationFn: (record_id: string) => markPaid({ data: { record_id } }),
    onSuccess: () => {
      toast.success("Salary marked as paid.");
      queryClient.invalidateQueries({ queryKey: ["payroll-workspace"] });
    },
    onError: (err: Error) => toast.error(err.message || "Failed to update status"),
  });

  async function handleGenerateAll() {
    if (!data?.employees?.length) return;
    try {
      for (const emp of data.employees) {
        await generateSlip({
          data: {
            user_id: emp.user_id,
            period_month: month,
            period_year: year,
            basic_salary: emp.base_salary,
            deductions: emp.suggested_deduction,
            net_pay: emp.suggested_net_pay,
            days: emp.total_days,
            status: emp.record_status ?? "pending",
          },
        });
      }
      toast.success("All monthly salary records calculated and synchronized.");
      queryClient.invalidateQueries({ queryKey: ["payroll-workspace"] });
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to batch generate slips");
    }
  }

  function exportPayrollCsv() {
    if (!data?.employees) return;
    const headers = [
      "Employee Name",
      "Employee Code",
      "Department",
      "Designation",
      "Base Salary",
      "Total Days",
      "Present Days",
      "Paid Leaves",
      "Holidays",
      "Half Days",
      "Absent Days",
      "Deductions",
      "Net Payable",
      "Status",
      "Paid On",
    ];

    const rows = data.employees.map((e) => [
      e.full_name,
      e.employee_code,
      e.department,
      e.designation,
      e.base_salary,
      e.total_days,
      e.present_days,
      e.paid_leave_days,
      e.holiday_days,
      e.half_days,
      e.absent_days + e.unpaid_leave_days,
      e.recorded_deductions ?? e.suggested_deduction,
      e.recorded_net_pay ?? e.suggested_net_pay,
      e.record_status ?? "pending",
      e.paid_on ?? "",
    ]);

    const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
    const csv = [headers.map(esc).join(","), ...rows.map((r) => r.map(esc).join(","))].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `payroll-${months[month - 1]}-${year}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary">
              <Banknote className="h-4 w-4" />
            </span>
            <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Payroll &amp; Salary Calculation</h1>
          </div>
          <p className="mt-1 text-sm text-muted-foreground max-w-2xl">
            Configure employee base salaries and compute payouts based on attendance, with paid leaves automatically credited.
          </p>
        </div>

        {/* Compact Single-Row Toolbar on Desktop */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="w-[140px]">
            <CustomSelect
              value={month}
              onValueChange={(val) => setMonth(Number(val))}
              options={months.map((m, idx) => ({ value: idx + 1, label: m }))}
              triggerClassName="w-full bg-card h-9"
            />
          </div>
          <div className="w-[105px]">
            <CustomSelect
              value={year}
              onValueChange={(val) => setYear(Number(val))}
              options={[year - 1, year, year + 1].map((y) => ({ value: y, label: String(y) }))}
              triggerClassName="w-full bg-card h-9"
            />
          </div>

          <button
            onClick={() => queryClient.invalidateQueries({ queryKey: ["payroll-workspace"] })}
            disabled={isFetching}
            className="flex h-9 items-center gap-1.5 rounded-lg border border-border bg-card px-3 text-xs font-semibold hover:bg-muted transition-colors shadow-2xs cursor-pointer"
            title="Refresh Data"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin text-primary" : ""}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={exportPayrollCsv}
            className="flex h-9 items-center gap-1.5 rounded-lg border border-border bg-card px-3 text-xs font-semibold text-foreground hover:bg-muted transition-colors shadow-2xs cursor-pointer"
          >
            <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handleGenerateAll}
            className="flex h-9 items-center gap-1.5 rounded-lg bg-primary px-3.5 text-xs font-semibold text-primary-foreground shadow-xs hover:bg-primary/90 transition-all cursor-pointer"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Calculate &amp; Sync All</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-5 shadow-soft">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Payroll</span>
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-emerald-500/15 text-emerald-600">
              <IndianRupee className="h-5 w-5" />
            </span>
          </div>
          <p className="mt-3 font-display text-2xl font-bold">{inr(data?.totals.total_payroll ?? 0)}</p>
          <p className="mt-1 text-xs text-muted-foreground">For {months[month - 1]} {year}</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-soft">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Base Salary Pool</span>
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-sky-500/15 text-sky-600">
              <Banknote className="h-5 w-5" />
            </span>
          </div>
          <p className="mt-3 font-display text-2xl font-bold">{inr(data?.totals.total_base ?? 0)}</p>
          <p className="mt-1 text-xs text-muted-foreground">{data?.employees.length ?? 0} Staff Members</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-soft">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Deductions</span>
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-destructive/15 text-destructive">
              <Clock className="h-5 w-5" />
            </span>
          </div>
          <p className="mt-3 font-display text-2xl font-bold text-destructive">
            -{inr(data?.totals.total_deductions ?? 0)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">Unpaid absences &amp; leaves</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-soft">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Payout Status</span>
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-accent/15 text-accent">
              <CheckCircle2 className="h-5 w-5" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-display text-2xl font-bold text-emerald-600">{data?.totals.paid_count ?? 0}</span>
            <span className="text-xs font-medium text-muted-foreground">Paid</span>
            <span className="text-muted-foreground">/</span>
            <span className="font-display text-2xl font-bold text-amber-600">{data?.totals.pending_count ?? 0}</span>
            <span className="text-xs font-medium text-muted-foreground">Pending</span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Slips generated</p>
        </div>
      </div>

      {/* Main Employee Salary & Calculation Table */}
      <div className="rounded-xl border border-border bg-card shadow-soft overflow-hidden">
        <div className="border-b border-border bg-muted/40 px-5 py-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-primary">
            Employee Salary Roster ({months[month - 1]} {year})
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Paid leaves and holidays count as 100% payable days with 0 deduction. Unpaid leaves and absences deduct daily rate.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-secondary/50 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Employee</th>
                <th className="px-4 py-3">Base Salary</th>
                <th className="px-4 py-3">Attendance Breakdown</th>
                <th className="px-4 py-3">Payable / Total</th>
                <th className="px-4 py-3">Deductions</th>
                <th className="px-4 py-3">Net Payout</th>
                <th className="px-4 py-3">Slip Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-sm text-muted-foreground">
                    Loading employee payroll data…
                  </td>
                </tr>
              ) : !data?.employees?.length ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-sm text-muted-foreground">
                    No active employees found. Add staff in Employee Management.
                  </td>
                </tr>
              ) : (
                data.employees.map((emp) => {
                  const isEditing = editingUserId === emp.user_id;
                  const finalNet = emp.recorded_net_pay ?? emp.suggested_net_pay;
                  const finalDeductions = emp.recorded_deductions ?? emp.suggested_deduction;
                  const isPaid = emp.record_status === "paid";

                  return (
                    <tr key={emp.user_id} className="hover:bg-secondary/30 transition-colors">
                      {/* Name & Role */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                            {(emp.full_name || "E").slice(0, 1).toUpperCase()}
                          </span>
                          <div className="min-w-0">
                            <p className="font-semibold text-foreground truncate">{emp.full_name}</p>
                            <p className="text-xs text-muted-foreground">
                              {emp.employee_code} · {emp.department}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Base Salary (Editable & Assignable) */}
                      <td className="px-4 py-3">
                        {isEditing ? (
                          <div className="flex items-center gap-1.5 bg-background p-1.5 rounded-lg border border-primary shadow-xs">
                            <span className="text-xs font-bold text-muted-foreground">₹</span>
                            <input
                              type="number"
                              min="0"
                              step="500"
                              placeholder="Amount"
                              value={editSalaryValue || ""}
                              onChange={(e) => setEditSalaryValue(Number(e.target.value))}
                              className="w-24 rounded border border-input bg-card px-2 py-1 text-xs font-bold focus:border-primary focus:outline-none"
                              autoFocus
                            />
                            <button
                              onClick={() =>
                                updateSalaryMutation.mutate({
                                  user_id: emp.user_id,
                                  salary: editSalaryValue,
                                })
                              }
                              disabled={updateSalaryMutation.isPending}
                              className="rounded bg-primary px-2.5 py-1 text-[11px] font-bold text-primary-foreground hover:bg-primary/90 transition-colors shadow-2xs"
                            >
                              {updateSalaryMutation.isPending ? "Saving…" : "Save"}
                            </button>
                            <button
                              onClick={() => setEditingUserId(null)}
                              className="rounded border border-input px-2 py-1 text-[11px] font-medium text-muted-foreground hover:bg-secondary transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : emp.base_salary <= 0 ? (
                          <button
                            onClick={() => {
                              setEditingUserId(emp.user_id);
                              setEditSalaryValue(0);
                            }}
                            className="inline-flex items-center gap-1.5 rounded-md border border-amber-500/40 bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-600 hover:bg-amber-500/20 transition-colors shadow-2xs"
                          >
                            <IndianRupee className="h-3 w-3" />
                            + Assign Salary
                          </button>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-foreground text-sm">{inr(emp.base_salary)}</span>
                            <button
                              onClick={() => {
                                setEditingUserId(emp.user_id);
                                setEditSalaryValue(emp.base_salary);
                              }}
                              className="inline-flex items-center gap-1 rounded border border-border bg-secondary/80 hover:bg-secondary px-2 py-0.5 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors"
                              title="Click to edit base salary"
                            >
                              <Edit2 className="h-3 w-3 text-muted-foreground" />
                              <span>Edit</span>
                            </button>
                          </div>
                        )}
                      </td>

                      {/* Attendance Breakdown (Highlighting Paid Leaves) */}
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                          <span className="rounded bg-emerald-500/15 px-1.5 py-0.5 font-semibold text-emerald-700">
                            {emp.present_days} Present
                          </span>
                          {emp.paid_leave_days > 0 && (
                            <span className="rounded bg-teal-500/20 px-1.5 py-0.5 font-bold text-teal-800" title="100% Paid leave">
                              +{emp.paid_leave_days} Paid Leave
                            </span>
                          )}
                          {emp.holiday_days > 0 && (
                            <span className="rounded bg-violet-500/20 px-1.5 py-0.5 font-bold text-violet-800" title="Holiday Paid">
                              +{emp.holiday_days} Holiday
                            </span>
                          )}
                          {emp.half_days > 0 && (
                            <span className="rounded bg-amber-500/15 px-1.5 py-0.5 font-semibold text-amber-700">
                              {emp.half_days} Half-day
                            </span>
                          )}
                          {(emp.absent_days > 0 || emp.unpaid_leave_days > 0) && (
                            <span className="rounded bg-destructive/10 px-1.5 py-0.5 font-semibold text-destructive">
                              {emp.absent_days + emp.unpaid_leave_days} Absent
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Payable Days */}
                      <td className="px-4 py-3">
                        <span className="font-semibold text-foreground">{emp.payable_days}</span>
                        <span className="text-xs text-muted-foreground"> / {emp.total_days} days</span>
                      </td>

                      {/* Deductions */}
                      <td className="px-4 py-3">
                        {finalDeductions > 0 ? (
                          <span className="font-semibold text-destructive">-{inr(finalDeductions)}</span>
                        ) : (
                          <span className="text-xs text-emerald-600 font-semibold">₹0 (Full Pay)</span>
                        )}
                      </td>

                      {/* Net Payout */}
                      <td className="px-4 py-3">
                        <span className="font-display font-bold text-base text-foreground">
                          {inr(finalNet)}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        {isPaid ? (
                          <div>
                            <span className="inline-flex items-center gap-1 rounded bg-emerald-500/15 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
                              <CheckCircle2 className="h-3 w-3" /> Paid
                            </span>
                            {emp.paid_on && (
                              <p className="mt-0.5 text-[10px] text-muted-foreground">{emp.paid_on}</p>
                            )}
                          </div>
                        ) : emp.record_id ? (
                          <span className="rounded bg-amber-500/15 px-2 py-0.5 text-[11px] font-bold text-amber-700">
                            Slip Ready
                          </span>
                        ) : (
                          <span className="rounded bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                            Draft (Auto)
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => generateSlipMutation.mutate(emp)}
                            disabled={generateSlipMutation.isPending}
                            className="rounded-md border border-input px-2.5 py-1 text-xs font-medium hover:bg-secondary transition-colors"
                            title="Generate / update salary record"
                          >
                            Recalculate
                          </button>
                          {emp.record_id && !isPaid && (
                            <button
                              onClick={() => markPaidMutation.mutate(emp.record_id!)}
                              disabled={markPaidMutation.isPending}
                              className="rounded-md bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-emerald-700 shadow-xs transition-colors"
                            >
                              Mark Paid
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
