import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Clock, ListTodo, CalendarOff, Megaphone, Bell, Gauge, LogIn, LogOut } from "lucide-react";
import { getAttendance, markAttendance, getLeaves } from "@/lib/employee.functions";
import { getTasks } from "@/lib/tasks.functions";
import {
  getWorkforceSnapshot,
  getAnnouncements,
  getNotifications,
  requestAttendanceCorrection,
  getAttendanceCorrections,
} from "@/lib/workforce.functions";
import { ATTENDANCE_LABEL, TASK_STATUS_LABEL, LATE_AFTER } from "@/lib/workforce.constants";
import {
  Kpi,
  Panel,
  DataTable,
  StatusPill,
  PercentBar,
  Field,
  inputClass,
  btnPrimary,
  btnGhost,
} from "@/components/admin/workforce-ui";

const LEAVE_ALLOWANCE = 24;

export function EmployeeHome({ onNavigate }: { onNavigate: (tab: string) => void }) {
  const [msg, setMsg] = useState("");
  const qc = useQueryClient();

  const fetchAttendance = useServerFn(getAttendance);
  const fetchTasks = useServerFn(getTasks);
  const fetchLeaves = useServerFn(getLeaves);
  const fetchSnap = useServerFn(getWorkforceSnapshot);
  const fetchAnnouncements = useServerFn(getAnnouncements);
  const fetchNotifications = useServerFn(getNotifications);
  const fetchCorrections = useServerFn(getAttendanceCorrections);
  const mark = useServerFn(markAttendance);
  const requestCorrection = useServerFn(requestAttendanceCorrection);

  const attendance = useQuery({ queryKey: ["attendance"], queryFn: () => fetchAttendance({}) });
  const tasks = useQuery({ queryKey: ["tasks"], queryFn: () => fetchTasks({}) });
  const leaves = useQuery({ queryKey: ["leaves"], queryFn: () => fetchLeaves({}) });
  const snap = useQuery({ queryKey: ["workforce-snapshot"], queryFn: () => fetchSnap({}) });
  const announcements = useQuery({ queryKey: ["announcements"], queryFn: () => fetchAnnouncements({}) });
  const notifications = useQuery({ queryKey: ["notifications"], queryFn: () => fetchNotifications({}) });
  const corrections = useQuery({ queryKey: ["attendance-corrections"], queryFn: () => fetchCorrections({}) });

  const today = new Date().toISOString().slice(0, 10);
  const todayRow = (attendance.data ?? []).find((a) => a.work_date === today);
  const me = (snap.data?.rows ?? []).find((r) => r.user_id === snap.data?.rows[0]?.user_id);
  const myRow = (snap.data?.rows ?? []).length === 1 ? snap.data?.rows[0] : me;

  const openTasks = (tasks.data ?? []).filter((t) => t.status !== "completed");
  const upcoming = openTasks
    .filter((t) => t.due_date)
    .sort((a, b) => (a.due_date! < b.due_date! ? -1 : 1))
    .slice(0, 5);
  const approvedLeaveDays = (leaves.data ?? [])
    .filter((l) => l.status === "approved")
    .reduce((s, l) => s + l.days, 0);

  function hoursToday() {
    if (!todayRow?.check_in || !todayRow?.check_out) return "—";
    const [h1, m1] = todayRow.check_in.split(":").map(Number);
    const [h2, m2] = todayRow.check_out.split(":").map(Number);
    const mins = (h2! * 60 + m2!) - (h1! * 60 + m1!);
    return `${Math.floor(mins / 60)}h ${mins % 60}m`;
  }

  async function punch(kind: "in" | "out") {
    const now = new Date().toTimeString().slice(0, 8);
    try {
      await mark({
        data: {
          work_date: today,
          status: "present",
          check_in: kind === "in" ? (todayRow?.check_in ?? now) : (todayRow?.check_in ?? null),
          check_out: kind === "out" ? now : (todayRow?.check_out ?? null),
          daily_update: todayRow?.daily_update ?? "",
        },
      });
      setMsg(kind === "in" ? `Checked in at ${now}` : `Checked out at ${now}`);
      await qc.invalidateQueries();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Could not record attendance");
    }
  }

  async function submitCorrection(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    try {
      await requestCorrection({
        data: {
          work_date: String(f.get("date") ?? today),
          requested_status: String(f.get("status") ?? "present") as "present",
          requested_check_in: (String(f.get("in") ?? "") || null) as string | null,
          requested_check_out: (String(f.get("out") ?? "") || null) as string | null,
          reason: String(f.get("reason") ?? ""),
        },
      });
      form.reset();
      setMsg("Correction requested — your HR has been notified.");
      await qc.invalidateQueries({ queryKey: ["attendance-corrections"] });
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Could not send request");
    }
  }

  const unread = (notifications.data ?? []).filter((n) => !n.is_read).length;

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-border bg-gradient-to-r from-primary/10 via-card to-card p-5 shadow-soft">
        <p className="text-[11px] uppercase tracking-wide text-accent">My workspace</p>
        <h1 className="mt-1 text-xl font-bold sm:text-2xl">Today at a glance</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Your attendance, work and requests — everything you need for the day.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi
          label="Today's attendance"
          value={ATTENDANCE_LABEL[todayRow?.status ?? "not_marked"] ?? "Not marked"}
          hint={todayRow?.check_in ? `In ${todayRow.check_in}${todayRow.check_out ? ` · Out ${todayRow.check_out}` : ""}` : "No check-in yet"}
          icon={Clock}
          tone={todayRow?.check_in && todayRow.check_in > LATE_AFTER ? "warn" : "good"}
        />
        <Kpi label="Working hours" value={hoursToday()} icon={Gauge} />
        <Kpi label="Pending tasks" value={openTasks.length} hint={`${upcoming.length} with deadlines`} icon={ListTodo} />
        <Kpi
          label="Leave balance"
          value={`${Math.max(0, LEAVE_ALLOWANCE - approvedLeaveDays)} / ${LEAVE_ALLOWANCE}`}
          hint={`${approvedLeaveDays} days used`}
          icon={CalendarOff}
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button className={btnPrimary} onClick={() => punch("in")} disabled={!!todayRow?.check_in}>
          <LogIn className="h-4 w-4" /> Check in
        </button>
        <button className={btnPrimary} onClick={() => punch("out")} disabled={!todayRow?.check_in || !!todayRow?.check_out}>
          <LogOut className="h-4 w-4" /> Check out
        </button>
        <button className={btnGhost} onClick={() => onNavigate("myattendance")}>
          Attendance history
        </button>
        <button className={btnGhost} onClick={() => onNavigate("myleave")}>
          Apply for leave
        </button>
        {msg ? <span className="text-xs text-muted-foreground">{msg}</span> : null}
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Panel
          title="Current work"
          action={
            <button className={btnGhost} onClick={() => onNavigate("tasks")}>
              Open task board
            </button>
          }
        >
          <DataTable headers={["Task", "Priority", "Due", "Progress", "Status"]} isEmpty={openTasks.length === 0} empty="No open tasks.">
            {openTasks.slice(0, 6).map((t) => (
              <tr key={t.id}>
                <td className="py-2 pr-4 font-medium">{t.title}</td>
                <td className="py-2 pr-4">{t.priority}</td>
                <td className="py-2 pr-4">{t.due_date ?? "—"}</td>
                <td className="py-2 pr-4">{"progress" in t ? `${(t as { progress?: number }).progress ?? 0}%` : "0%"}</td>
                <td className="py-2 pr-4">
                  <StatusPill value={TASK_STATUS_LABEL[t.status] ?? t.status} />
                </td>
              </tr>
            ))}
          </DataTable>
        </Panel>

        <Panel title="Performance snapshot">
          <div className="space-y-3">
            <PercentBar label="Task completion" pctValue={myRow?.completionPct ?? 0} />
            <PercentBar label="On-time delivery" pctValue={myRow?.onTimePct ?? 0} />
            <PercentBar label="Attendance" pctValue={myRow?.attendancePct ?? 0} tone="bg-emerald-500" />
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            Based on your own attendance and task records over the last six months.
          </p>
        </Panel>

        <Panel title="Announcements" description="From HR and leadership">
          {(announcements.data ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">No announcements yet.</p>
          ) : (
            <ul className="space-y-3">
              {(announcements.data ?? []).slice(0, 5).map((a) => (
                <li key={a.id} className="border-b border-border pb-2 last:border-0">
                  <p className="flex items-center gap-2 text-sm font-medium">
                    <Megaphone className="h-3.5 w-3.5 text-accent" /> {a.title}
                  </p>
                  <p className="text-xs text-muted-foreground">{a.body}</p>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title={`Notifications${unread ? ` (${unread} new)` : ""}`}>
          {(notifications.data ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">Nothing new.</p>
          ) : (
            <ul className="space-y-3">
              {(notifications.data ?? []).slice(0, 6).map((n) => (
                <li key={n.id} className="flex items-start gap-2 border-b border-border pb-2 last:border-0">
                  <Bell className={`mt-0.5 h-3.5 w-3.5 ${n.is_read ? "text-muted-foreground" : "text-accent"}`} />
                  <div>
                    <p className="text-sm font-medium">{n.title}</p>
                    <p className="text-xs text-muted-foreground">{n.body}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <Panel title="Upcoming deadlines">
        <DataTable headers={["Task", "Due", "Status"]} isEmpty={upcoming.length === 0} empty="No upcoming deadlines.">
          {upcoming.map((t) => (
            <tr key={t.id}>
              <td className="py-2 pr-4 font-medium">{t.title}</td>
              <td className="py-2 pr-4">{t.due_date}</td>
              <td className="py-2 pr-4">
                <StatusPill value={t.due_date! < today ? "overdue" : (TASK_STATUS_LABEL[t.status] ?? t.status)} />
              </td>
            </tr>
          ))}
        </DataTable>
      </Panel>

      <Panel title="Attendance correction" description="Ask your HR to fix a day that was recorded incorrectly">
        <form onSubmit={submitCorrection} className="grid gap-3 sm:grid-cols-5">
          <Field label="Date">
            <input name="date" type="date" required defaultValue={today} className={inputClass} />
          </Field>
          <Field label="Should be">
            <select name="status" className={inputClass}>
              <option value="present">Present</option>
              <option value="half_day">Half day</option>
              <option value="leave">Leave</option>
              <option value="paid_leave">Paid leave</option>
              <option value="holiday">Holiday</option>
            </select>
          </Field>
          <Field label="Check in">
            <input name="in" type="time" className={inputClass} />
          </Field>
          <Field label="Check out">
            <input name="out" type="time" className={inputClass} />
          </Field>
          <Field label="Reason">
            <input name="reason" required className={inputClass} placeholder="Forgot to punch out" />
          </Field>
          <div className="sm:col-span-5">
            <button className={btnPrimary}>Send request</button>
          </div>
        </form>

        <div className="mt-5">
          <DataTable headers={["Date", "Requested", "Reason", "Status"]} isEmpty={(corrections.data ?? []).length === 0} empty="No correction requests yet.">
            {(corrections.data ?? []).map((c) => (
              <tr key={c.id}>
                <td className="py-2 pr-4">{c.work_date}</td>
                <td className="py-2 pr-4">{ATTENDANCE_LABEL[c.requested_status] ?? c.requested_status}</td>
                <td className="py-2 pr-4 text-muted-foreground">{c.reason}</td>
                <td className="py-2 pr-4">
                  <StatusPill value={c.status} />
                </td>
              </tr>
            ))}
          </DataTable>
        </div>
      </Panel>
    </div>
  );
}
