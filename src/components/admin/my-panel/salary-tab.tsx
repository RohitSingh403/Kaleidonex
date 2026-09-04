import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Download, Eye } from "lucide-react";
import { getSalaryRecords } from "@/lib/employee.functions";
import { type SalaryRow, inr, months } from "./types";
import { Card, StatCard, Pill, Th, Td, downloadCsv } from "./ui";

export function SalaryTab() {
  const fetchSalary = useServerFn(getSalaryRecords);
  const { data } = useQuery({ queryKey: ["emp-salary"], queryFn: () => fetchSalary() });
  const rows = (data ?? []) as unknown as SalaryRow[];

  const [month, setMonth] = useState<"all" | number>("all");
  const [year, setYear] = useState<number>(new Date().getFullYear());

  const shown = rows.filter((r) => (month === "all" || r.period_month === month) && r.period_year === year);
  const totalEarned = rows.reduce((a, r) => a + Number(r.net_pay || r.net_salary || 0), 0);
  const avg = rows.length ? totalEarned / rows.length : 0;
  const deductions = rows.reduce((a, r) => a + Number(r.deductions || 0), 0);
  const pending = rows.filter((r) => r.status === "pending").reduce((a, r) => a + Number(r.net_pay || r.net_salary || 0), 0);
  const paid = rows.filter((r) => r.status === "paid").reduce((a, r) => a + Number(r.net_pay || r.net_salary || 0), 0);

  return (
    <div className="space-y-5">
      <Card
        title="My salary"
        action={
          <button
            onClick={() =>
              downloadCsv(
                "salary-report.csv",
                ["Period", "Days", "Basic", "Earnings", "Deductions", "Net Pay", "Status", "Paid On"],
                shown.map((r) => [
                  `${months[(r.period_month || 1) - 1]} ${r.period_year || year}`,
                  r.days || 30,
                  r.basic_salary || r.base_salary || 0,
                  r.earnings || 0,
                  r.deductions || 0,
                  r.net_pay || r.net_salary || 0,
                  r.status,
                  r.paid_on ?? r.payment_date ?? "",
                ]),
              )
            }
            className="rounded-md border border-primary px-4 py-1.5 text-xs font-semibold text-primary"
          >
            Download Report
          </button>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <StatCard label="Total Earned" value={inr(totalEarned)} tone="bg-sky-500" />
          <StatCard label="Average Salary" value={inr(avg)} tone="bg-emerald-500" />
          <StatCard label="Total Deductions" value={inr(deductions)} tone="bg-destructive" />
          <StatCard label="Pending Payments" value={inr(pending)} tone="bg-amber-400" />
          <StatCard label="Paid Payments" value={inr(paid)} tone="bg-teal-500" />
        </div>
      </Card>

      <Card
        title="Filter salary records"
        action={
          <div className="flex items-center gap-2">
            <select
              value={month}
              onChange={(e) => setMonth(e.target.value === "all" ? "all" : Number(e.target.value))}
              className="rounded-md border border-input bg-background px-2 py-1 text-sm"
            >
              <option value="all">All Months</option>
              {months.map((m, i) => (
                <option key={m} value={i + 1}>
                  {m}
                </option>
              ))}
            </select>
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="rounded-md border border-input bg-background px-2 py-1 text-sm"
            >
              {[year - 1, year, year + 1].map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
            <button
              onClick={() => {
                setMonth("all");
                setYear(new Date().getFullYear());
              }}
              className="rounded-md border border-input px-3 py-1 text-sm"
            >
              Clear Filters
            </button>
          </div>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border text-left">
              <tr>
                <Th>Period</Th>
                <Th>Basic Salary</Th>
                <Th>Earnings</Th>
                <Th>Deductions</Th>
                <Th>Net Pay</Th>
                <Th>Status</Th>
                <Th>Actions</Th>
              </tr>
            </thead>
            <tbody>
              {shown.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-3 py-8 text-center text-sm text-muted-foreground">
                    No salary records yet.
                  </td>
                </tr>
              )}
              {shown.map((r) => (
                <tr key={r.id} className="border-b border-border/60">
                  <Td>
                    <p className="font-medium">
                      {months[(r.period_month || 1) - 1]} {r.period_year || year}
                    </p>
                    <p className="text-xs text-muted-foreground">Days: {r.days || 30}</p>
                  </Td>
                  <Td>{inr(r.basic_salary || r.base_salary || 0)}</Td>
                  <Td><span className="text-emerald-600">{inr(r.earnings || 0)}</span></Td>
                  <Td>{inr(r.deductions || 0)}</Td>
                  <Td>{inr(r.net_pay || r.net_salary || 0)}</Td>
                  <Td>
                    <Pill status={r.status} />
                    {(r.paid_on || r.payment_date) && (
                      <p className="mt-0.5 text-[11px] text-muted-foreground">Paid: {r.paid_on || r.payment_date}</p>
                    )}
                  </Td>
                  <Td>
                    <div className="flex gap-1 text-primary">
                      <span className="rounded border border-input p-1 cursor-pointer hover:bg-secondary"><Download className="h-3.5 w-3.5" /></span>
                      <span className="rounded border border-input p-1 cursor-pointer hover:bg-secondary"><Eye className="h-3.5 w-3.5" /></span>
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
