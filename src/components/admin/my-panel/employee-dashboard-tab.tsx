import { useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, RefreshCw } from "lucide-react";
import {
  getAttendance,
  getLeaves,
  getSalaryRecords,
  getEmployeeRequests,
  type AttendanceStatus,
} from "@/lib/employee.functions";
import {
  type SubTab,
  type AttendanceRow,
  type LeaveRow,
  type SalaryRow,
  type RequestRow,
  inr,
  months,
  statusLabels,
  statusDotColors,
} from "./types";
import { Card, StatCard, Pill, Th, Td } from "./ui";

export function EmployeeDashboard({ go }: { go: (t: SubTab) => void }) {
  const queryClient = useQueryClient();
  const fetchAttendance = useServerFn(getAttendance);
  const fetchLeaves = useServerFn(getLeaves);
  const fetchSalary = useServerFn(getSalaryRecords);
  const fetchRequests = useServerFn(getEmployeeRequests);

  const attendance = (useQuery({ queryKey: ["attendance"], queryFn: () => fetchAttendance() }).data ?? []) as unknown as AttendanceRow[];
  const leaves = (useQuery({ queryKey: ["emp-leaves"], queryFn: () => fetchLeaves() }).data ?? []) as unknown as LeaveRow[];
  const salary = (useQuery({ queryKey: ["emp-salary"], queryFn: () => fetchSalary() }).data ?? []) as unknown as SalaryRow[];
  const requests = (useQuery({ queryKey: ["emp-requests"], queryFn: () => fetchRequests() }).data ?? []) as unknown as RequestRow[];

  const now = new Date();
  const monthRows = attendance.filter((a) => {
    const d = new Date(a.work_date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const present = monthRows.filter((a) => a.status === "present").length;
  const pct = daysInMonth ? Math.round((present / daysInMonth) * 100) : 0;
  const pendingLeaves = leaves.filter((l) => l.status === "pending").length;
  const netSalary = salary[0]?.net_pay ?? salary[0]?.net_salary ?? 0;
  const requestsLeft = Math.max(0, 5 - requests.length);

  const counts: Record<AttendanceStatus, number> = {
    present,
    absent: monthRows.filter((a) => a.status === "absent").length,
    leave: monthRows.filter((a) => a.status === "leave").length,
    half_day: monthRows.filter((a) => a.status === "half_day").length,
    paid_leave: monthRows.filter((a) => a.status === "paid_leave").length,
    holiday: monthRows.filter((a) => a.status === "holiday").length,
  };

  return (
    <div className="space-y-5">
      <Card
        title="Employee dashboard"
        action={
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground">
              Today {now.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
            </span>
            <button onClick={() => go("mark")} className="rounded-md bg-ink px-3 py-1.5 text-xs font-semibold text-ink-foreground">
              Mark Attendance
            </button>
            <button onClick={() => go("leave")} className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white">
              Apply Leave
            </button>
            <button onClick={() => go("salary")} className="rounded-md bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white">
              View Salary
            </button>
            <button onClick={() => go("requests")} className="rounded-md bg-accent px-3 py-1.5 text-xs font-semibold text-accent-foreground">
              View Request
            </button>
            <button
              onClick={() => queryClient.invalidateQueries()}
              className="flex items-center gap-1 rounded-md border border-input px-3 py-1.5 text-xs"
            >
              <RefreshCw className="h-3 w-3" /> refresh
            </button>
          </div>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Attendance" value={`${present}/${daysInMonth}`} sub={`${pct}%`} tone="bg-sky-500" />
          <StatCard label="Pending Leaves" value={pendingLeaves} sub="Approval Pending" tone="bg-amber-400" />
          <StatCard label="Net Salary" value={inr(netSalary)} sub="This Month" tone="bg-emerald-500" />
          <StatCard label="Requests Left" value={requestsLeft} sub="Out of 5" tone="bg-teal-500" />
        </div>
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card title="Attendance distribution">
          {monthRows.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">No attendance marked this month yet.</p>
          ) : (
            <div className="space-y-3">
              {(Object.keys(counts) as AttendanceStatus[]).map((k) => {
                const total = monthRows.length || 1;
                return (
                  <div key={k} className="flex items-center gap-3">
                    <span className="w-24 shrink-0 text-xs text-muted-foreground">{statusLabels[k]}</span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-secondary">
                      <div className={`h-full ${statusDotColors[k]}`} style={{ width: `${(counts[k] / total) * 100}%` }} />
                    </div>
                    <span className="w-8 text-right text-xs font-semibold">{counts[k]}</span>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        <Card title="Monthly attendance trend">
          <MonthlyTrend rows={attendance} />
        </Card>
      </div>

      <Card title="Pending leave requests">
        {pendingLeaves === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8">
            <CheckCircle2 className="h-6 w-6 text-emerald-600" />
            <p className="text-sm text-muted-foreground">No pending leave requests</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border text-left">
                <tr>
                  <Th>Type</Th>
                  <Th>From</Th>
                  <Th>To</Th>
                  <Th>Days</Th>
                  <Th>Status</Th>
                </tr>
              </thead>
              <tbody>
                {leaves
                  .filter((l) => l.status === "pending")
                  .map((l) => (
                    <tr key={l.id} className="border-b border-border/60">
                      <Td>{l.leave_type}</Td>
                      <Td>{l.start_date}</Td>
                      <Td>{l.end_date}</Td>
                      <Td>{l.days}</Td>
                      <Td>
                        <Pill status={l.status} />
                      </Td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card title="Need help?">
        <p className="text-center text-sm text-muted-foreground">Contact HR for any assistance</p>
        <p className="mt-1 text-center text-sm">
          <a href="mailto:hr@kaleidonex.com" className="text-primary hover:underline">
            hr@kaleidonex.com
          </a>
        </p>
      </Card>
    </div>
  );
}

export function MonthlyTrend({ rows }: { rows: AttendanceRow[] }) {
  const buckets = useMemo(() => {
    const map = new Map<string, { present: number; absent: number; leave: number }>();
    for (const r of rows) {
      const d = new Date(r.work_date);
      const key = `${months[d.getMonth()]!.slice(0, 3)} ${d.getFullYear()}`;
      const b = map.get(key) ?? { present: 0, absent: 0, leave: 0 };
      if (r.status === "present") b.present += 1;
      else if (r.status === "absent") b.absent += 1;
      else if (r.status === "leave" || r.status === "paid_leave") b.leave += 1;
      map.set(key, b);
    }
    return [...map.entries()].slice(-6);
  }, [rows]);

  if (buckets.length === 0) return <p className="py-10 text-center text-sm text-muted-foreground">No records yet.</p>;
  const max = Math.max(...buckets.map(([, b]) => Math.max(b.present, b.absent, b.leave)), 1);

  return (
    <div>
      <div className="mb-3 flex gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1"><span className="h-2 w-4 rounded bg-emerald-500" /> Present</span>
        <span className="flex items-center gap-1"><span className="h-2 w-4 rounded bg-destructive" /> Absent</span>
        <span className="flex items-center gap-1"><span className="h-2 w-4 rounded bg-sky-500" /> Leave</span>
      </div>
      <div className="flex h-40 items-end gap-4">
        {buckets.map(([key, b]) => (
          <div key={key} className="flex flex-1 flex-col items-center gap-2">
            <div className="flex h-32 w-full items-end justify-center gap-1">
              <div className="w-3 rounded-t bg-emerald-500" style={{ height: `${(b.present / max) * 100}%` }} />
              <div className="w-3 rounded-t bg-destructive" style={{ height: `${(b.absent / max) * 100}%` }} />
              <div className="w-3 rounded-t bg-sky-500" style={{ height: `${(b.leave / max) * 100}%` }} />
            </div>
            <span className="text-[10px] text-muted-foreground">{key}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
