import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Download, Eye, Printer, X, CheckCircle2, Clock, Building2, FileText, IndianRupee } from "lucide-react";
import { getSalaryRecords } from "@/lib/employee.functions";
import { type SalaryRow, inr, months } from "./types";
import { Card, StatCard, Pill, Th, Td, downloadCsv } from "./ui";
import { CustomSelect } from "@/components/ui/custom-select";

export function SalaryTab() {
  const fetchSalary = useServerFn(getSalaryRecords);
  const { data } = useQuery({ queryKey: ["emp-salary"], queryFn: () => fetchSalary() });
  const rows = (data ?? []) as unknown as SalaryRow[];

  const [month, setMonth] = useState<"all" | number>("all");
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [selectedSlip, setSelectedSlip] = useState<SalaryRow | null>(null);

  const shown = rows.filter((r) => (month === "all" || r.period_month === month) && r.period_year === year);
  const totalEarned = rows.reduce((a, r) => a + Number(r.net_pay || r.net_salary || 0), 0);
  const avg = rows.length ? totalEarned / rows.length : 0;
  const deductions = rows.reduce((a, r) => a + Number(r.deductions || 0), 0);
  const pending = rows.filter((r) => r.status === "pending").reduce((a, r) => a + Number(r.net_pay || r.net_salary || 0), 0);
  const paid = rows.filter((r) => r.status === "paid").reduce((a, r) => a + Number(r.net_pay || r.net_salary || 0), 0);

  function handleDownloadSlip(r: SalaryRow) {
    const periodName = `${months[(r.period_month || 1) - 1]}_${r.period_year || year}`;
    const content = `=====================================================
KALEIDONEX TECHNOLOGIES - SALARY PAYSLIP
=====================================================
Pay Period: ${months[(r.period_month || 1) - 1]} ${r.period_year || year}
Days in Month: ${r.days || 30}
Payment Status: ${(r.status || "pending").toUpperCase()}
Disbursement Date: ${r.paid_on || "Pending"}
-----------------------------------------------------
EARNINGS BREAKDOWN:
Basic / Base Salary:  ${inr(r.basic_salary || 0)}
Other Earnings:       ${inr(r.earnings || 0)}
-----------------------------------------------------
DEDUCTIONS BREAKDOWN:
Attendance/Unpaid:    -${inr(r.deductions || 0)}
-----------------------------------------------------
NET SALARY PAYABLE:   ${inr(r.net_pay || 0)}
=====================================================
Generated electronically by Kaleidonex Platform.
`;
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `payslip-${periodName}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handlePrintModal() {
    window.print();
  }

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
                  r.basic_salary || 0,
                  r.earnings || 0,
                  r.deductions || 0,
                  r.net_pay || 0,
                  r.status,
                  r.paid_on ?? "",
                ]),
              )
            }
            className="rounded-md border border-primary px-4 py-1.5 text-xs font-semibold text-primary hover:bg-primary/10 transition-colors"
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
            <CustomSelect
              value={month}
              onValueChange={(val) => setMonth(val === "all" ? "all" : Number(val))}
              options={[
                { value: "all", label: "All Months" },
                ...months.map((m, i) => ({ value: i + 1, label: m })),
              ]}
            />
            <CustomSelect
              value={year}
              onValueChange={(val) => setYear(Number(val))}
              options={[year - 1, year, year + 1].map((y) => ({ value: y, label: String(y) }))}
            />
            <button
              onClick={() => {
                setMonth("all");
                setYear(new Date().getFullYear());
              }}
              className="rounded-md border border-input px-3 py-1.5 text-sm hover:bg-secondary cursor-pointer"
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
                <tr key={r.id} className="border-b border-border/60 hover:bg-secondary/30 transition-colors">
                  <Td>
                    <p className="font-medium">
                      {months[(r.period_month || 1) - 1]} {r.period_year || year}
                    </p>
                    <p className="text-xs text-muted-foreground">Days: {r.days || 30}</p>
                  </Td>
                  <Td>{inr(r.basic_salary || 0)}</Td>
                  <Td><span className="text-emerald-600 font-semibold">{inr(r.earnings || 0)}</span></Td>
                  <Td>
                    {r.deductions > 0 ? (
                      <span className="text-destructive font-medium">-{inr(r.deductions)}</span>
                    ) : (
                      <span className="text-xs text-emerald-600">₹0</span>
                    )}
                  </Td>
                  <Td>
                    <span className="font-bold text-foreground">{inr(r.net_pay || 0)}</span>
                  </Td>
                  <Td>
                    <Pill status={r.status} />
                    {r.paid_on && (
                      <p className="mt-0.5 text-[11px] text-muted-foreground">Paid: {r.paid_on}</p>
                    )}
                  </Td>
                  <Td>
                    <div className="flex items-center gap-1.5 text-primary">
                      <button
                        onClick={() => handleDownloadSlip(r)}
                        className="rounded-md border border-input p-1.5 hover:bg-primary/10 hover:border-primary transition-colors"
                        title="Download Payslip"
                        type="button"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setSelectedSlip(r)}
                        className="rounded-md border border-input p-1.5 hover:bg-primary/10 hover:border-primary transition-colors"
                        title="View Full Payslip"
                        type="button"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Salary Payslip View Modal */}
      {selectedSlip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="relative w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-lift animate-in fade-in zoom-in-95">
            <button
              onClick={() => setSelectedSlip(null)}
              className="absolute right-4 top-4 rounded-full p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-3 border-b border-border pb-4">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
                <Building2 className="h-5 w-5" />
              </span>
              <div>
                <h3 className="font-bold text-lg leading-tight">Kaleidonex Technologies</h3>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">
                  Salary Payslip · {months[(selectedSlip.period_month || 1) - 1]} {selectedSlip.period_year || year}
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-4">
              <div className="flex items-center justify-between rounded-xl bg-muted/50 p-3 text-xs">
                <div>
                  <span className="text-muted-foreground">Status: </span>
                  <span className={`font-bold capitalize ${selectedSlip.status === "paid" ? "text-emerald-600" : "text-amber-600"}`}>
                    {selectedSlip.status}
                  </span>
                </div>
                {selectedSlip.paid_on && (
                  <div>
                    <span className="text-muted-foreground">Paid on: </span>
                    <span className="font-semibold text-foreground">{selectedSlip.paid_on}</span>
                  </div>
                )}
              </div>

              <div className="divide-y divide-border/60 rounded-xl border border-border bg-background p-4 text-sm space-y-2">
                <div className="flex justify-between py-1 text-muted-foreground">
                  <span>Basic Base Salary</span>
                  <span className="font-semibold text-foreground">{inr(selectedSlip.basic_salary || 0)}</span>
                </div>
                <div className="flex justify-between py-1 text-muted-foreground">
                  <span>Total Earnings (Credited)</span>
                  <span className="font-semibold text-emerald-600">{inr(selectedSlip.earnings || 0)}</span>
                </div>
                <div className="flex justify-between py-1 text-muted-foreground">
                  <span>Attendance &amp; Leave Deductions</span>
                  <span className="font-semibold text-destructive">-{inr(selectedSlip.deductions || 0)}</span>
                </div>
                <div className="flex justify-between pt-2 text-base font-bold text-foreground">
                  <span>Net Salary Payable</span>
                  <span className="text-primary font-display text-lg">{inr(selectedSlip.net_pay || 0)}</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                <button
                  onClick={handlePrintModal}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg border border-input bg-background py-2 text-sm font-semibold hover:bg-secondary transition-colors"
                >
                  <Printer className="h-4 w-4" />
                  Print
                </button>
                <button
                  onClick={() => handleDownloadSlip(selectedSlip)}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-primary py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors shadow-soft"
                >
                  <Download className="h-4 w-4" />
                  Download
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
