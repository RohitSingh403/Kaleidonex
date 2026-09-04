import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  Users,
  UserCheck,
  UserX,
  CalendarOff,
  Clock,
  Inbox,
  ListTodo,
  AlertTriangle,
  BellRing,
  Download,
  Megaphone,
  MoreHorizontal,
  Eye,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CustomSelect } from "@/components/ui/custom-select";
import {
  getWorkforceSnapshot,
  getAttendanceCorrections,
  decideAttendanceCorrection,
  getAnnouncements,
  publishAnnouncement,
  deleteAnnouncement,
  sendAttendanceReminders,
} from "@/lib/workforce.functions";

import { getPendingApprovals, decideApproval } from "@/lib/team.functions";
import { ATTENDANCE_LABEL, TASK_STATUS_LABEL, downloadCsv, pct } from "@/lib/workforce.constants";
import {
  Kpi,
  Panel,
  DataTable,
  StatusPill,
  PercentBar,
  TabBar,
  Field,
  Btn,
  inputClass,
  btnPrimary,
  btnGhost,
} from "@/components/admin/workforce-ui";

import { Employee360 } from "@/components/admin/employee-360";
import { CLAIM_ESCALATION_LIMIT } from "@/lib/claim-limits";

export type HrTab =
  | "dashboard"
  | "employees"
  | "attendance"
  | "leave"
  | "tasks"
  | "performance"
  | "announcements"
  | "reports";

const TABS: { id: HrTab; label: string }[] = [
  { id: "dashboard", label: "Dashboard" },
  { id: "employees", label: "Employees" },
  { id: "attendance", label: "Attendance" },
  { id: "leave", label: "Leave" },
  { id: "tasks", label: "Tasks" },
  { id: "performance", label: "Performance" },
  { id: "announcements", label: "Announcements" },
  { id: "reports", label: "Reports" },
];

export function HrDashboard({ initialTab = "dashboard", showTabBar = false }: { initialTab?: HrTab; showTabBar?: boolean }) {
  const [tab, setTab] = useState<HrTab>(initialTab);
  const [open, setOpen] = useState<{ id: string; name: string } | null>(null);
  const [search, setSearch] = useState("");
  const [dept, setDept] = useState("all");
  const [msg, setMsg] = useState("");
  const [remindBusy, setRemindBusy] = useState(false);
  const remind = useServerFn(sendAttendanceReminders);
  const qc = useQueryClient();


  const fetchSnap = useServerFn(getWorkforceSnapshot);
  const fetchApprovals = useServerFn(getPendingApprovals);
  const fetchCorrections = useServerFn(getAttendanceCorrections);
  const fetchAnnouncements = useServerFn(getAnnouncements);
  const decide = useServerFn(decideApproval);
  const decideCorrection = useServerFn(decideAttendanceCorrection);
  const publish = useServerFn(publishAnnouncement);
  const removeAnnouncement = useServerFn(deleteAnnouncement);

  const snap = useQuery({ queryKey: ["workforce-snapshot"], queryFn: () => fetchSnap({}) });
  const approvals = useQuery({ queryKey: ["team-approvals"], queryFn: () => fetchApprovals({}) });
  const corrections = useQuery({ queryKey: ["attendance-corrections"], queryFn: () => fetchCorrections({}) });
  const announcements = useQuery({ queryKey: ["announcements"], queryFn: () => fetchAnnouncements({}) });

  const rows = useMemo(() => {
    const all = (snap.data?.rows ?? []).filter((r) => r.roles.includes("employee") || !r.roles.includes("hr"));
    return all.filter(
      (r) =>
        (dept === "all" || (r.department || "Unassigned") === dept) &&
        (search.trim() === "" ||
          `${r.full_name} ${r.employee_code} ${r.designation}`.toLowerCase().includes(search.toLowerCase())),
    );
  }, [snap.data, dept, search]);

  const departments = useMemo(
    () => [...new Set((snap.data?.rows ?? []).map((r) => r.department?.trim() || "Unassigned"))],
    [snap.data],
  );

  const kpi = snap.data?.kpi;
  const mix = snap.data?.attendanceMix;
  const leaveItems = (approvals.data ?? []).filter((a) => a.kind === "leave");

  async function act(kind: "leave" | "claim" | "request", id: string, decision: "approved" | "rejected") {
    try {
      await decide({ data: { kind, id, decision, note: "" } });
      setMsg(`Request ${decision}.`);
      await qc.invalidateQueries();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Could not update request");
    }
  }

  async function actCorrection(id: string, decision: "approved" | "rejected") {
    try {
      await decideCorrection({ data: { id, decision, note: "" } });
      setMsg(`Correction ${decision}.`);
      await qc.invalidateQueries();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Could not update correction");
    }
  }

  async function submitAnnouncement(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    try {
      await publish({
        data: {
          title: String(f.get("title") ?? ""),
          body: String(f.get("body") ?? ""),
          category: String(f.get("category") ?? "notice"),
          audience: (String(f.get("audience") ?? "all") as "all" | "department" | "team"),
          department_id: null,
        },
      });
      form.reset();
      setMsg("Announcement published.");
      await qc.invalidateQueries({ queryKey: ["announcements"] });
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Could not publish");
    }
  }

  return (
    <div className="space-y-5">
      {tab === "dashboard" && (
        <div className="rounded-xl border border-border bg-gradient-to-r from-primary/10 via-card to-card p-5 shadow-soft">
          <p className="text-[11px] uppercase tracking-wide text-accent">People operations</p>
          <h1 className="mt-1 text-xl font-bold sm:text-2xl">What is happening with your employees</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Attendance, leave, tasks and performance for everyone assigned to you.
          </p>
        </div>
      )}

      {showTabBar && <TabBar tabs={TABS} value={tab} onChange={setTab} />}
      {msg ? <p className="text-xs text-muted-foreground">{msg}</p> : null}

      {tab === "dashboard" ? (
        <div className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Kpi label="Employees" value={kpi?.employees ?? 0} hint={`${kpi?.active ?? 0} active`} icon={Users} />
            <Kpi label="Present today" value={kpi?.presentToday ?? 0} icon={UserCheck} tone="good" />
            <Kpi label="Absent today" value={kpi?.absentToday ?? 0} icon={UserX} tone="bad" />
            <Kpi label="On leave" value={kpi?.onLeaveToday ?? 0} icon={CalendarOff} />
            <Kpi label="Late today" value={kpi?.lateToday ?? 0} icon={Clock} tone="warn" />
            <Kpi label="Pending leaves" value={kpi?.pendingLeaves ?? 0} icon={Inbox} />
            <Kpi label="Pending approvals" value={kpi?.pendingApprovals ?? 0} icon={Inbox} />
            <Kpi label="Open tasks" value={kpi?.openTasks ?? 0} hint={`${kpi?.overdueTasks ?? 0} overdue`} icon={ListTodo} />
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <Panel title="Attendance overview" description="Last 6 months across your team">
              <div className="space-y-3">
                <PercentBar label="Present" pctValue={mix?.present ?? 0} tone="bg-emerald-500" />
                <PercentBar label="Late" pctValue={mix?.late ?? 0} tone="bg-amber-500" />
                <PercentBar label="Absent" pctValue={mix?.absent ?? 0} tone="bg-destructive" />
                <PercentBar label="Leave" pctValue={mix?.leave ?? 0} />
              </div>
            </Panel>

            <Panel title="Approval queue">
              {(approvals.data ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground">Nothing waiting on you.</p>
              ) : (
                <ul className="space-y-3">
                  {(approvals.data ?? []).slice(0, 6).map((a) => (
                    <li key={`${a.kind}-${a.id}`} className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{a.title}</p>
                        <p className="truncate text-xs text-muted-foreground">{a.detail}</p>
                        {a.needs_ceo ? (
                          <p className="text-xs text-destructive">
                            Escalated — above ₹{CLAIM_ESCALATION_LIMIT.toLocaleString("en-IN")}, CEO decision required.
                          </p>
                        ) : null}
                      </div>
                      <div className="flex shrink-0 gap-1">
                        <button
                          className={btnGhost}
                          disabled={a.needs_ceo}
                          onClick={() => act(a.kind, a.id, "approved")}
                        >
                          Approve
                        </button>
                        <button
                          className={btnGhost}
                          disabled={a.needs_ceo}
                          onClick={() => act(a.kind, a.id, "rejected")}
                        >
                          Reject
                        </button>
                      </div>
                    </li>
                  ))}

                </ul>
              )}
            </Panel>
          </div>
        </div>
      ) : null}

      {tab === "employees" ? (
        <Panel
          title="Employee management"
          description="Employees assigned to you"
          action={
            <div className="flex flex-wrap gap-2">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search employee…"
                className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm"
              />
              <CustomSelect
                value={dept}
                onValueChange={setDept}
                options={[
                  { value: "all", label: "All departments" },
                  ...departments.map((d) => ({ value: d, label: d })),
                ]}
              />
            </div>
          }
        >
          <DataTable
            headers={["Employee", "ID", "Department", "Designation", "Base Salary", "Status", "Attendance", "Project", "Performance", "Joined", ""]}
            isEmpty={rows.length === 0}
            empty="No employees assigned to you yet."
          >
            {rows.map((r) => (
              <tr key={r.user_id} className="hover:bg-muted/30 transition-colors">
                <td className="py-2.5 pr-4 font-medium whitespace-nowrap">{r.full_name || "—"}</td>
                <td className="py-2.5 pr-4 text-muted-foreground whitespace-nowrap">{r.employee_code || "—"}</td>
                <td className="py-2.5 pr-4 text-muted-foreground whitespace-nowrap">{r.department || "—"}</td>
                <td className="py-2.5 pr-4 text-muted-foreground whitespace-nowrap">{r.designation || "—"}</td>
                <td className="py-2.5 pr-4 font-semibold text-foreground whitespace-nowrap">
                  ₹{Number(r.salary || 0).toLocaleString("en-IN")}
                </td>
                <td className="py-2.5 pr-4 whitespace-nowrap">
                  <StatusPill value={r.status} />
                </td>
                <td className="py-2.5 pr-4 whitespace-nowrap">{r.attendancePct}%</td>
                <td className="py-2.5 pr-4 text-muted-foreground whitespace-nowrap">{r.currentProject || "—"}</td>
                <td className="py-2.5 pr-4 whitespace-nowrap">{r.completionPct}%</td>
                <td className="py-2.5 pr-4 whitespace-nowrap">{r.joining_date ?? "—"}</td>
                <td className="py-2.5 pr-4 whitespace-nowrap">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-background hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Actions</span>
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44 bg-card border border-border shadow-md rounded-lg p-1 z-50">
                      <DropdownMenuItem
                        onClick={() => setOpen({ id: r.user_id, name: r.full_name })}
                        className="flex items-center gap-2 px-3 py-2 text-xs rounded cursor-pointer hover:bg-secondary transition-colors"
                      >
                        <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>View 360 Profile</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
          </DataTable>
        </Panel>
      ) : null}

      {tab === "attendance" ? (
        <div className="space-y-5">
          <Panel
            title="Attendance management"
            action={
              <button
                className={btnGhost}
                onClick={() =>
                  downloadCsv(
                    "attendance-report.csv",
                    rows.map((r) => ({
                      Employee: r.full_name,
                      Present: r.presentDays,
                      Late: r.lateDays,
                      Absent: r.absentDays,
                      Leave: r.leaveDays,
                      Attendance: `${r.attendancePct}%`,
                    })),
                  )
                }
              >
                <Download className="h-3.5 w-3.5" /> Export CSV
              </button>
            }
          >
            <DataTable headers={["Employee", "Today", "Present", "Late", "Absent", "Leave", "Rate"]} isEmpty={rows.length === 0}>
              {rows.map((r) => (
                <tr key={r.user_id}>
                  <td className="py-2 pr-4 font-medium">{r.full_name}</td>
                  <td className="py-2 pr-4">
                    <StatusPill value={ATTENDANCE_LABEL[r.todayStatus] ?? r.todayStatus} />
                  </td>
                  <td className="py-2 pr-4">{r.presentDays}</td>
                  <td className="py-2 pr-4">{r.lateDays}</td>
                  <td className="py-2 pr-4">{r.absentDays}</td>
                  <td className="py-2 pr-4">{r.leaveDays}</td>
                  <td className="py-2 pr-4">{r.attendancePct}%</td>
                </tr>
              ))}
            </DataTable>
          </Panel>

          <Panel title="Correction requests">
            <DataTable
              headers={["Employee date", "Requested", "Reason", "Status", ""]}
              isEmpty={(corrections.data ?? []).length === 0}
              empty="No correction requests."
            >
              {(corrections.data ?? []).map((c) => (
                <tr key={c.id}>
                  <td className="py-2 pr-4">{c.work_date}</td>
                  <td className="py-2 pr-4">
                    {ATTENDANCE_LABEL[c.requested_status] ?? c.requested_status} · {c.requested_check_in ?? "—"} →{" "}
                    {c.requested_check_out ?? "—"}
                  </td>
                  <td className="py-2 pr-4 text-muted-foreground">{c.reason}</td>
                  <td className="py-2 pr-4">
                    <StatusPill value={c.status} />
                  </td>
                  <td className="py-2 pr-4">
                    {c.status === "pending" ? (
                      <div className="flex gap-1">
                        <button className={btnGhost} onClick={() => actCorrection(c.id, "approved")}>
                          Approve
                        </button>
                        <button className={btnGhost} onClick={() => actCorrection(c.id, "rejected")}>
                          Reject
                        </button>
                      </div>
                    ) : null}
                  </td>
                </tr>
              ))}
            </DataTable>
          </Panel>
        </div>
      ) : null}

      {tab === "leave" ? (
        <Panel title="Leave management" description="Employee → request → review → decision → notification">
          <DataTable headers={["Request", "Detail", "Raised", ""]} isEmpty={leaveItems.length === 0} empty="No pending leave requests.">
            {leaveItems.map((l) => (
              <tr key={l.id}>
                <td className="py-2 pr-4 font-medium">{l.title}</td>
                <td className="py-2 pr-4 text-muted-foreground">{l.detail}</td>
                <td className="py-2 pr-4">{l.created_at.slice(0, 10)}</td>
                <td className="py-2 pr-4">
                  <div className="flex gap-1">
                    <button className={btnGhost} onClick={() => act("leave", l.id, "approved")}>
                      Approve
                    </button>
                    <button className={btnGhost} onClick={() => act("leave", l.id, "rejected")}>
                      Reject
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </DataTable>
        </Panel>
      ) : null}

      {tab === "tasks" ? (
        <div className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-3">
            <Kpi label="Open tasks" value={kpi?.openTasks ?? 0} icon={ListTodo} />
            <Kpi label="Overdue" value={kpi?.overdueTasks ?? 0} icon={AlertTriangle} tone="bad" />
            <Kpi label="Blocked employees" value={rows.filter((r) => r.tasksBlocked > 0).length} tone="warn" />
          </div>
          <Panel title="Workload & delivery">
            <DataTable headers={["Employee", "Tasks", "Completed", "Overdue", "Blocked", "Completion", "On-time"]} isEmpty={rows.length === 0}>
              {rows.map((r) => (
                <tr key={r.user_id}>
                  <td className="py-2 pr-4 font-medium">{r.full_name}</td>
                  <td className="py-2 pr-4">{r.tasksTotal}</td>
                  <td className="py-2 pr-4">{r.tasksDone}</td>
                  <td className="py-2 pr-4">{r.tasksOverdue}</td>
                  <td className="py-2 pr-4">{r.tasksBlocked}</td>
                  <td className="py-2 pr-4">{r.completionPct}%</td>
                  <td className="py-2 pr-4">{r.onTimePct}%</td>
                </tr>
              ))}
            </DataTable>
          </Panel>
        </div>
      ) : null}

      {tab === "performance" ? (
        <Panel title="Performance" description="Computed from real attendance and task records">
          <DataTable
            headers={["Employee", "Task completion", "On-time", "Attendance", "Manager rating", ""]}
            isEmpty={rows.length === 0}
          >
            {rows.map((r) => (
              <tr key={r.user_id}>
                <td className="py-2 pr-4 font-medium">{r.full_name}</td>
                <td className="py-2 pr-4">{r.completionPct}%</td>
                <td className="py-2 pr-4">{r.onTimePct}%</td>
                <td className="py-2 pr-4">{r.attendancePct}%</td>
                <td className="py-2 pr-4">{r.managerRating ? `${r.managerRating.toFixed(1)} / 5` : "—"}</td>
                <td className="py-2 pr-4">
                  <button className={btnGhost} onClick={() => setOpen({ id: r.user_id, name: r.full_name })}>
                    Review
                  </button>
                </td>
              </tr>
            ))}
          </DataTable>
        </Panel>
      ) : null}

      {tab === "announcements" ? (
        <div className="space-y-5">
          <Panel
            title="Attendance reminders"
            description="Alert everyone who has not marked attendance today (in-app + email)."
          >
            <Btn
              icon={BellRing}
              loading={remindBusy}
              onClick={async () => {
                setRemindBusy(true);
                try {
                  const res = await remind({ data: {} });
                  toast.success(`${res.sent} reminder${res.sent === 1 ? "" : "s"} sent`);
                } catch (e) {
                  toast.error((e as Error).message);
                } finally {
                  setRemindBusy(false);
                }
              }}
            >
              Send attendance reminders
            </Btn>
          </Panel>

          <Panel title="Publish announcement">

            <form onSubmit={submitAnnouncement} className="grid gap-3 sm:grid-cols-2">
              <Field label="Title">
                <input name="title" required className={inputClass} />
              </Field>
              <Field label="Category">
                <select name="category" className={inputClass}>
                  <option value="notice">Notice</option>
                  <option value="holiday">Holiday</option>
                  <option value="policy">HR policy</option>
                  <option value="event">Event</option>
                </select>
              </Field>
              <Field label="Audience">
                <select name="audience" className={inputClass}>
                  <option value="all">All employees</option>
                  <option value="team">My team</option>
                  <option value="department">Department</option>
                </select>
              </Field>
              <div className="sm:col-span-2">
                <Field label="Message">
                  <textarea name="body" rows={3} className={inputClass} />
                </Field>
              </div>
              <div className="sm:col-span-2">
                <button className={btnPrimary}>
                  <Megaphone className="h-4 w-4" /> Publish
                </button>
              </div>
            </form>
          </Panel>

          <Panel title="Published">
            <DataTable headers={["Title", "Category", "Audience", "Date", ""]} isEmpty={(announcements.data ?? []).length === 0}>
              {(announcements.data ?? []).map((a) => (
                <tr key={a.id}>
                  <td className="py-2 pr-4 font-medium">{a.title}</td>
                  <td className="py-2 pr-4">{a.category}</td>
                  <td className="py-2 pr-4">{a.audience}</td>
                  <td className="py-2 pr-4">{a.created_at.slice(0, 10)}</td>
                  <td className="py-2 pr-4">
                    <button
                      className={btnGhost}
                      onClick={async () => {
                        await removeAnnouncement({ data: { id: a.id } });
                        await qc.invalidateQueries({ queryKey: ["announcements"] });
                      }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </DataTable>
          </Panel>
        </div>
      ) : null}

      {tab === "reports" ? (
        <div className="grid gap-5 lg:grid-cols-2">
          <Panel
            title="Attendance report"
            action={
              <button
                className={btnGhost}
                onClick={() =>
                  downloadCsv(
                    "attendance-report.csv",
                    rows.map((r) => ({
                      Employee: r.full_name,
                      Present: r.presentDays,
                      Absent: r.absentDays,
                      Late: r.lateDays,
                      Leave: r.leaveDays,
                    })),
                  )
                }
              >
                <Download className="h-3.5 w-3.5" /> CSV
              </button>
            }
          >
            <DataTable headers={["Employee", "Present", "Absent", "Late", "Leave"]} isEmpty={rows.length === 0}>
              {rows.map((r) => (
                <tr key={r.user_id}>
                  <td className="py-2 pr-4">{r.full_name}</td>
                  <td className="py-2 pr-4">{r.presentDays}</td>
                  <td className="py-2 pr-4">{r.absentDays}</td>
                  <td className="py-2 pr-4">{r.lateDays}</td>
                  <td className="py-2 pr-4">{r.leaveDays}</td>
                </tr>
              ))}
            </DataTable>
          </Panel>

          <Panel
            title="Performance report"
            action={
              <button
                className={btnGhost}
                onClick={() =>
                  downloadCsv(
                    "performance-report.csv",
                    rows.map((r) => ({
                      Employee: r.full_name,
                      Tasks: r.tasksTotal,
                      Completion: `${r.completionPct}%`,
                      Attendance: `${r.attendancePct}%`,
                      Rating: r.managerRating,
                    })),
                  )
                }
              >
                <Download className="h-3.5 w-3.5" /> CSV
              </button>
            }
          >
            <DataTable headers={["Employee", "Tasks", "Completion", "Attendance", "Rating"]} isEmpty={rows.length === 0}>
              {rows.map((r) => (
                <tr key={r.user_id}>
                  <td className="py-2 pr-4">{r.full_name}</td>
                  <td className="py-2 pr-4">{r.tasksTotal}</td>
                  <td className="py-2 pr-4">{r.completionPct}%</td>
                  <td className="py-2 pr-4">{r.attendancePct}%</td>
                  <td className="py-2 pr-4">{r.managerRating || "—"}</td>
                </tr>
              ))}
            </DataTable>
          </Panel>

          <Panel title="Workforce report">
            <DataTable headers={["Department", "Employees", "Active", "On leave", "Completion"]} isEmpty={(snap.data?.departmentBreakdown ?? []).length === 0}>
              {(snap.data?.departmentBreakdown ?? []).map((d) => (
                <tr key={d.name}>
                  <td className="py-2 pr-4">{d.name}</td>
                  <td className="py-2 pr-4">{d.employees}</td>
                  <td className="py-2 pr-4">{d.active}</td>
                  <td className="py-2 pr-4">{d.onLeave}</td>
                  <td className="py-2 pr-4">{d.completionPct}%</td>
                </tr>
              ))}
            </DataTable>
          </Panel>

          <Panel title="Leave report">
            <DataTable headers={["Employee", "Pending", "Leave days"]} isEmpty={rows.length === 0}>
              {rows.map((r) => (
                <tr key={r.user_id}>
                  <td className="py-2 pr-4">{r.full_name}</td>
                  <td className="py-2 pr-4">{r.pendingLeaves}</td>
                  <td className="py-2 pr-4">{r.leaveDays}</td>
                </tr>
              ))}
            </DataTable>
            <p className="mt-3 text-xs text-muted-foreground">
              Utilisation: {pct(rows.reduce((s, r) => s + r.leaveDays, 0), rows.length * 24)}% of a 24-day annual allowance.
            </p>
          </Panel>
        </div>
      ) : null}

      {open ? <Employee360 userId={open.id} name={open.name} canReview onClose={() => setOpen(null)} /> : null}
    </div>
  );
}

export { TASK_STATUS_LABEL };
