import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Users,
  Building2,
  ShieldCheck,
  ListTodo,
  CalendarCheck,
  Download,
  Network,
  ScrollText,
  UserCog,
  MoreHorizontal,
  Eye,
  Edit2,
  UserCheck,
  UserX,
  X,
} from "lucide-react";
import {
  getWorkforceSnapshot,
  getDepartments,
  upsertDepartment,
  deleteDepartment,
  getAuditLogs,
  setEmployeeStatus,
  updateEmployeeAssignment,
  type WorkforceRow,
} from "@/lib/workforce.functions";
import { getPendingApprovals, decideApproval, assignManager, type TeamMember } from "@/lib/team.functions";
import { downloadCsv, pct } from "@/lib/workforce.constants";
import {
  Kpi,
  Panel,
  DataTable,
  StatusPill,
  PercentBar,
  TabBar,
  Field,
  inputClass,
  btnPrimary,
  btnGhost,
} from "@/components/admin/workforce-ui";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { Employee360 } from "@/components/admin/employee-360";

export type ExecTab =
  | "dashboard"
  | "hr"
  | "employees"
  | "departments"
  | "org"
  | "attendance"
  | "performance"
  | "reports"
  | "audit";

const TABS: { id: ExecTab; label: string }[] = [
  { id: "dashboard", label: "Executive Dashboard" },
  { id: "hr", label: "HR Management" },
  { id: "employees", label: "Employees" },
  { id: "departments", label: "Departments" },
  { id: "org", label: "Organization" },
  { id: "attendance", label: "Attendance" },
  { id: "performance", label: "Performance" },
  { id: "reports", label: "Reports" },
  { id: "audit", label: "Audit Logs" },
];

export function ExecDashboard({ initialTab = "dashboard", showTabBar = false }: { initialTab?: ExecTab; showTabBar?: boolean }) {
  const [tab, setTab] = useState<ExecTab>(initialTab);
  const [open, setOpen] = useState<{ id: string; name: string } | null>(null);
  const [drill, setDrill] = useState<{ department?: string | undefined; hr?: string | undefined }>({});
  const [msg, setMsg] = useState("");
  const qc = useQueryClient();

  const fetchSnap = useServerFn(getWorkforceSnapshot);
  const fetchApprovals = useServerFn(getPendingApprovals);
  const fetchDepartments = useServerFn(getDepartments);
  const fetchAudit = useServerFn(getAuditLogs);
  const saveDepartment = useServerFn(upsertDepartment);
  const removeDepartment = useServerFn(deleteDepartment);
  const setStatus = useServerFn(setEmployeeStatus);
  const setAssignment = useServerFn(updateEmployeeAssignment);
  const setManager = useServerFn(assignManager);
  const decide = useServerFn(decideApproval);

  const snap = useQuery({ queryKey: ["workforce-snapshot"], queryFn: () => fetchSnap({}) });
  const approvals = useQuery({ queryKey: ["team-approvals"], queryFn: () => fetchApprovals({}) });
  const departments = useQuery({ queryKey: ["departments"], queryFn: () => fetchDepartments({}) });
  const audit = useQuery({ queryKey: ["audit-logs"], queryFn: () => fetchAudit({}), enabled: tab === "audit" });

  const [auditQuery, setAuditQuery] = useState("");
  const [auditAction, setAuditAction] = useState("");
  const [auditFrom, setAuditFrom] = useState("");
  const [auditTo, setAuditTo] = useState("");

  const auditActions = useMemo(
    () => Array.from(new Set((audit.data ?? []).map((l) => l.action).filter(Boolean))).sort(),
    [audit.data],
  );

  const auditRows = useMemo(() => {
    const q = auditQuery.trim().toLowerCase();
    return (audit.data ?? []).filter((l) => {
      if (auditAction && l.action !== auditAction) return false;
      const day = String(l.created_at).slice(0, 10);
      if (auditFrom && day < auditFrom) return false;
      if (auditTo && day > auditTo) return false;
      if (!q) return true;
      return [l.actor_name, l.actor_id, l.action, l.target_name, l.target_type, l.details]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q));
    });
  }, [audit.data, auditQuery, auditAction, auditFrom, auditTo]);


  const [editingEmployee, setEditingEmployee] = useState<WorkforceRow | null>(null);
  const [editForm, setEditForm] = useState<{ department: string; designation: string; salary: string }>({
    department: "",
    designation: "",
    salary: "",
  });
  const [savingEdit, setSavingEdit] = useState(false);

  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingEmployee) return;
    setSavingEdit(true);
    try {
      await setAssignment({
        data: {
          user_id: editingEmployee.user_id,
          department: editForm.department.trim(),
          designation: editForm.designation.trim(),
          department_id: null,
          salary: editForm.salary ? Number(editForm.salary) : 0,
        },
      });
      await qc.invalidateQueries({ queryKey: ["workforce-snapshot"] });
      toast.success(`Updated details for ${editingEmployee.full_name}`);
      setEditingEmployee(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update employee");
    } finally {
      setSavingEdit(false);
    }
  }

  const rows = snap.data?.rows ?? [];
  const kpi = snap.data?.kpi;
  const mix = snap.data?.attendanceMix;
  const hrRows = rows.filter((r) => r.roles.includes("hr"));
  const employeeRows = rows.filter((r) => !r.roles.includes("hr") && !r.roles.includes("ceo") && !r.roles.includes("admin"));

  const drilled = useMemo(
    () =>
      employeeRows.filter(
        (r) =>
          (!drill.department || (r.department?.trim() || "Unassigned") === drill.department) &&
          (!drill.hr || r.manager_id === drill.hr),
      ),
    [employeeRows, drill],
  );

  const maxEmployees = Math.max(1, ...(snap.data?.trend ?? []).map((t) => t.employees));

  async function act(id: string, kind: "leave" | "claim" | "request", decision: "approved" | "rejected") {
    try {
      await decide({ data: { kind, id, decision, note: "" } });
      await qc.invalidateQueries();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Could not decide");
    }
  }

  async function submitDepartment(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    try {
      await saveDepartment({
        data: {
          name: String(f.get("name") ?? ""),
          parent_id: (String(f.get("parent") ?? "") || null) as string | null,
          head_id: (String(f.get("head") ?? "") || null) as string | null,
        },
      });
      form.reset();
      setMsg("Department saved.");
      await qc.invalidateQueries({ queryKey: ["departments"] });
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Could not save department");
    }
  }

  return (
    <div className="space-y-5">
      {tab === "dashboard" && (
        <div className="rounded-xl border border-border bg-gradient-to-r from-primary/10 via-card to-card p-5 shadow-soft">
          <p className="text-[11px] uppercase tracking-wide text-accent">Command center</p>
          <h1 className="mt-1 text-xl font-bold sm:text-2xl">What is happening across the company</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Organisation-wide workforce, attendance, delivery and governance — with drill-down from company to employee.
          </p>
        </div>
      )}

      {showTabBar && <TabBar tabs={TABS} value={tab} onChange={setTab} />}
      {msg ? <p className="text-xs text-muted-foreground">{msg}</p> : null}

      {tab === "dashboard" ? (
        <div className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Kpi label="Total employees" value={kpi?.employees ?? 0} hint={`${kpi?.active ?? 0} active`} icon={Users} />
            <Kpi label="HR managers" value={kpi?.hrCount ?? 0} icon={UserCog} />
            <Kpi label="Departments" value={kpi?.departments ?? 0} icon={Building2} />
            <Kpi label="Attendance today" value={`${pct(kpi?.presentToday ?? 0, Math.max(1, kpi?.employees ?? 1))}%`} icon={CalendarCheck} tone="good" />
            <Kpi label="Open tasks" value={kpi?.openTasks ?? 0} hint={`${kpi?.overdueTasks ?? 0} overdue`} icon={ListTodo} />
            <Kpi label="Leave requests" value={kpi?.pendingLeaves ?? 0} />
            <Kpi label="Pending approvals" value={kpi?.pendingApprovals ?? 0} icon={ShieldCheck} tone="warn" />
            <Kpi label="On leave today" value={kpi?.onLeaveToday ?? 0} />
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <Panel title="Workforce growth" description="Headcount and attendance by month">
              <div className="flex h-44 items-end gap-3">
                {(snap.data?.trend ?? []).map((t) => (
                  <div key={t.label} className="flex flex-1 flex-col items-center gap-2">
                    <div className="flex h-32 w-full items-end justify-center">
                      <div
                        className="w-6 rounded-t bg-accent"
                        style={{ height: `${Math.max(6, (t.employees / maxEmployees) * 100)}%` }}
                        title={`${t.employees} employees`}
                      />
                    </div>
                    <span className="text-[11px] text-muted-foreground">{t.label}</span>
                    <span className="text-[11px] font-medium">{t.attendancePct}%</span>
                  </div>
                ))}
              </div>
            </Panel>

            <Panel title="Company attendance">
              <div className="space-y-3">
                <PercentBar label="Present" pctValue={mix?.present ?? 0} tone="bg-emerald-500" />
                <PercentBar label="Late" pctValue={mix?.late ?? 0} tone="bg-amber-500" />
                <PercentBar label="Absent" pctValue={mix?.absent ?? 0} tone="bg-destructive" />
                <PercentBar label="Leave" pctValue={mix?.leave ?? 0} />
              </div>
            </Panel>
          </div>

          <Panel title="Approvals requiring leadership">
            <DataTable headers={["Item", "Detail", "Raised", ""]} isEmpty={(approvals.data ?? []).length === 0} empty="Nothing pending.">
              {(approvals.data ?? []).slice(0, 8).map((a) => (
                <tr key={`${a.kind}-${a.id}`}>
                  <td className="py-2 pr-4 font-medium">
                    {a.title} {a.needs_ceo ? <span className="ml-2 rounded bg-destructive/10 px-1.5 text-[10px] text-destructive">escalated</span> : null}
                  </td>
                  <td className="py-2 pr-4 text-muted-foreground">{a.detail}</td>
                  <td className="py-2 pr-4">{a.created_at.slice(0, 10)}</td>
                  <td className="py-2 pr-4">
                    <div className="flex gap-1">
                      <button className={btnGhost} onClick={() => act(a.id, a.kind, "approved")}>
                        Approve
                      </button>
                      <button className={btnGhost} onClick={() => act(a.id, a.kind, "rejected")}>
                        Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </DataTable>
          </Panel>
        </div>
      ) : null}

      {tab === "hr" ? (
        <Panel title="HR management" description="Each HR unit, its team and its workload">
          <DataTable headers={["HR", "Employees", "Attendance", "Pending requests", "Completion", ""]} isEmpty={hrRows.length === 0} empty="No HR accounts yet — create one from Team.">
            {hrRows.map((hr) => {
              const team = employeeRows.filter((e) => e.manager_id === hr.user_id);
              return (
                <tr key={hr.user_id}>
                  <td className="py-2 pr-4 font-medium">{hr.full_name}</td>
                  <td className="py-2 pr-4">{team.length}</td>
                  <td className="py-2 pr-4">{pct(team.reduce((s, t) => s + t.attendancePct, 0), team.length * 100)}%</td>
                  <td className="py-2 pr-4">{team.reduce((s, t) => s + t.pendingLeaves, 0)}</td>
                  <td className="py-2 pr-4">{pct(team.reduce((s, t) => s + t.tasksDone, 0), team.reduce((s, t) => s + t.tasksTotal, 0))}%</td>
                  <td className="py-2 pr-4">
                    <button
                      className={btnGhost}
                      onClick={() => {
                        setDrill({ hr: hr.user_id });
                        setTab("employees");
                      }}
                    >
                      View team
                    </button>
                  </td>
                </tr>
              );
            })}
          </DataTable>
        </Panel>
      ) : null}

      {tab === "employees" ? (
        <Panel
          title="Employee management"
          description="Organisation-wide"
          action={
            <div className="flex flex-wrap gap-2">
              <select
                value={drill.hr ?? ""}
                onChange={(e) => setDrill((d) => ({ ...d, hr: e.target.value || undefined }))}
                className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm"
              >
                <option value="">All HR units</option>
                {hrRows.map((h) => (
                  <option key={h.user_id} value={h.user_id}>
                    {h.full_name}
                  </option>
                ))}
              </select>
              <select
                value={drill.department ?? ""}
                onChange={(e) => setDrill((d) => ({ ...d, department: e.target.value || undefined }))}
                className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm"
              >
                <option value="">All departments</option>
                {(snap.data?.departmentBreakdown ?? []).map((d) => (
                  <option key={d.name} value={d.name}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
          }
        >
          <DataTable
            headers={["Employee", "Department", "Designation", "Base Salary", "Reports to", "Status", "Attendance", "Completion", "Actions"]}
            isEmpty={drilled.length === 0}
          >
            {drilled.map((r) => (
              <tr key={r.user_id} className="hover:bg-muted/30 transition-colors">
                <td className="py-2.5 pr-4 font-medium whitespace-nowrap">{r.full_name}</td>
                <td className="py-2.5 pr-4 text-muted-foreground whitespace-nowrap">{r.department || "—"}</td>
                <td className="py-2.5 pr-4 text-muted-foreground whitespace-nowrap">{r.designation || "—"}</td>
                <td className="py-2.5 pr-4 font-semibold text-foreground whitespace-nowrap">
                  ₹{Number(r.salary || 0).toLocaleString("en-IN")}
                </td>
                <td className="py-2.5 pr-4 whitespace-nowrap">
                  <select
                    value={r.manager_id ?? ""}
                    onChange={async (e) => {
                      await setManager({ data: { user_id: r.user_id, manager_id: e.target.value || null } });
                      await qc.invalidateQueries({ queryKey: ["workforce-snapshot"] });
                      toast.success("Reporting manager updated");
                    }}
                    className="rounded border border-border bg-background px-2 py-1 text-xs"
                  >
                    <option value="">Unassigned</option>
                    {hrRows.map((h) => (
                      <option key={h.user_id} value={h.user_id}>
                        {h.full_name}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="py-2.5 pr-4 whitespace-nowrap">
                  <StatusPill value={r.status} />
                </td>
                <td className="py-2.5 pr-4 whitespace-nowrap">{r.attendancePct}%</td>
                <td className="py-2.5 pr-4 whitespace-nowrap">{r.completionPct}%</td>
                <td className="py-2.5 pr-4 whitespace-nowrap">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-background hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Actions</span>
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-52 bg-card border border-border shadow-md rounded-lg p-1 z-50">
                      <DropdownMenuItem
                        onClick={() => setOpen({ id: r.user_id, name: r.full_name })}
                        className="flex items-center gap-2 px-3 py-2 text-xs rounded cursor-pointer hover:bg-secondary transition-colors"
                      >
                        <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>View 360 Profile</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          setEditingEmployee(r);
                          setEditForm({
                            department: r.department || "",
                            designation: r.designation || "",
                            salary: String(r.salary || 0),
                          });
                        }}
                        className="flex items-center gap-2 px-3 py-2 text-xs rounded cursor-pointer hover:bg-secondary transition-colors"
                      >
                        <Edit2 className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>Edit Details & Salary</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={async () => {
                          const nextStatus = r.status === "inactive" ? "active" : "inactive";
                          await setStatus({
                            data: { user_id: r.user_id, status: nextStatus },
                          });
                          await qc.invalidateQueries({ queryKey: ["workforce-snapshot"] });
                          toast.success(`Employee marked as ${nextStatus}`);
                        }}
                        className={`flex items-center gap-2 px-3 py-2 text-xs rounded cursor-pointer hover:bg-secondary transition-colors ${
                          r.status === "inactive" ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"
                        }`}
                      >
                        {r.status === "inactive" ? (
                          <>
                            <UserCheck className="h-3.5 w-3.5" />
                            <span>Activate Employee</span>
                          </>
                        ) : (
                          <>
                            <UserX className="h-3.5 w-3.5" />
                            <span>Deactivate Employee</span>
                          </>
                        )}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
          </DataTable>
        </Panel>
      ) : null}

      {tab === "departments" ? (
        <div className="space-y-5">
          <Panel title="Create department">
            <form onSubmit={submitDepartment} className="grid gap-3 sm:grid-cols-3">
              <Field label="Name">
                <input name="name" required className={inputClass} placeholder="Engineering" />
              </Field>
              <Field label="Parent">
                <select name="parent" className={inputClass}>
                  <option value="">None</option>
                  {(departments.data ?? []).map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Department head">
                <select name="head" className={inputClass}>
                  <option value="">Unassigned</option>
                  {rows.map((r) => (
                    <option key={r.user_id} value={r.user_id}>
                      {r.full_name}
                    </option>
                  ))}
                </select>
              </Field>
              <div className="sm:col-span-3">
                <button className={btnPrimary}>Add department</button>
              </div>
            </form>
          </Panel>

          <Panel title="Structure">
            <DataTable headers={["Department", "Parent", "Head", "Employees", ""]} isEmpty={(departments.data ?? []).length === 0}>
              {(departments.data ?? []).map((d) => (
                <tr key={d.id}>
                  <td className="py-2 pr-4 font-medium">{d.name}</td>
                  <td className="py-2 pr-4">{(departments.data ?? []).find((p) => p.id === d.parent_id)?.name ?? "—"}</td>
                  <td className="py-2 pr-4">{rows.find((r) => r.user_id === d.head_id)?.full_name ?? "—"}</td>
                  <td className="py-2 pr-4">{employeeRows.filter((r) => r.department === d.name).length}</td>
                  <td className="py-2 pr-4">
                    <button
                      className={btnGhost}
                      onClick={async () => {
                        await removeDepartment({ data: { id: d.id } });
                        await qc.invalidateQueries({ queryKey: ["departments"] });
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

      {tab === "org" ? (
        <Panel title="Organization hierarchy" description="Click a node to inspect that part of the company">
          <div className="space-y-4">
            <div className="rounded-lg border border-border bg-card px-4 py-3 text-sm font-semibold">
              <Network className="mr-2 inline h-4 w-4 text-accent" /> CEO / Super Admin
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {hrRows.map((hr) => {
                const team = employeeRows.filter((e) => e.manager_id === hr.user_id);
                return (
                  <div key={hr.user_id} className="rounded-lg border border-border bg-card p-4">
                    <button
                      className="text-sm font-semibold text-primary hover:underline"
                      onClick={() => {
                        setDrill({ hr: hr.user_id });
                        setTab("employees");
                      }}
                    >
                      {hr.full_name || "HR"}
                    </button>
                    <p className="text-xs text-muted-foreground">{team.length} employees</p>
                    <ul className="mt-3 space-y-1">
                      {team.map((e) => (
                        <li key={e.user_id}>
                          <button
                            className="text-sm hover:underline"
                            onClick={() => setOpen({ id: e.user_id, name: e.full_name })}
                          >
                            • {e.full_name || "Employee"}
                          </button>
                        </li>
                      ))}
                      {team.length === 0 ? <li className="text-xs text-muted-foreground">No employees assigned</li> : null}
                    </ul>
                  </div>
                );
              })}
              {employeeRows.some((e) => !e.manager_id) ? (
                <div className="rounded-lg border border-dashed border-border p-4">
                  <p className="text-sm font-semibold">Unassigned</p>
                  <ul className="mt-3 space-y-1">
                    {employeeRows
                      .filter((e) => !e.manager_id)
                      .map((e) => (
                        <li key={e.user_id} className="text-sm">
                          • {e.full_name || "Employee"}
                        </li>
                      ))}
                  </ul>
                </div>
              ) : null}
            </div>
          </div>
        </Panel>
      ) : null}

      {tab === "attendance" ? (
        <Panel
          title="Company attendance"
          description="Drill down company → department → HR → employee"
          action={
            <button
              className={btnGhost}
              onClick={() =>
                downloadCsv(
                  "company-attendance.csv",
                  employeeRows.map((r) => ({
                    Employee: r.full_name,
                    Department: r.department,
                    Present: r.presentDays,
                    Absent: r.absentDays,
                    Late: r.lateDays,
                    Rate: `${r.attendancePct}%`,
                  })),
                )
              }
            >
              <Download className="h-3.5 w-3.5" /> Export
            </button>
          }
        >
          <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {(snap.data?.departmentBreakdown ?? []).map((d) => (
              <button
                key={d.name}
                onClick={() => setDrill({ department: d.name })}
                className={`rounded-lg border p-3 text-left transition-colors ${
                  drill.department === d.name ? "border-accent bg-secondary" : "border-border bg-card hover:bg-secondary"
                }`}
              >
                <p className="text-sm font-semibold">{d.name}</p>
                <p className="text-xs text-muted-foreground">
                  {d.employees} people · {d.onLeave} on leave
                </p>
              </button>
            ))}
          </div>
          <DataTable headers={["Employee", "Department", "Present", "Late", "Absent", "Rate"]} isEmpty={drilled.length === 0}>
            {drilled.map((r) => (
              <tr key={r.user_id}>
                <td className="py-2 pr-4 font-medium">{r.full_name}</td>
                <td className="py-2 pr-4">{r.department || "—"}</td>
                <td className="py-2 pr-4">{r.presentDays}</td>
                <td className="py-2 pr-4">{r.lateDays}</td>
                <td className="py-2 pr-4">{r.absentDays}</td>
                <td className="py-2 pr-4">{r.attendancePct}%</td>
              </tr>
            ))}
          </DataTable>
        </Panel>
      ) : null}

      {tab === "performance" ? (
        <div className="grid gap-5 lg:grid-cols-2">
          <Panel title="Department performance">
            <div className="space-y-3">
              {(snap.data?.departmentBreakdown ?? []).map((d) => (
                <PercentBar key={d.name} label={d.name} pctValue={d.completionPct} />
              ))}
            </div>
          </Panel>
          <Panel title="Task performance">
            <div className="space-y-3">
              <PercentBar
                label="Completed"
                pctValue={pct(rows.reduce((s, r) => s + r.tasksDone, 0), rows.reduce((s, r) => s + r.tasksTotal, 0))}
                tone="bg-emerald-500"
              />
              <PercentBar
                label="Blocked"
                pctValue={pct(rows.reduce((s, r) => s + r.tasksBlocked, 0), rows.reduce((s, r) => s + r.tasksTotal, 0))}
                tone="bg-destructive"
              />
              <PercentBar
                label="Overdue"
                pctValue={pct(rows.reduce((s, r) => s + r.tasksOverdue, 0), rows.reduce((s, r) => s + r.tasksTotal, 0))}
                tone="bg-amber-500"
              />
            </div>
          </Panel>
          <Panel title="Top performing">
            <DataTable headers={["Employee", "Completion", "On-time", "Attendance"]} isEmpty={employeeRows.length === 0}>
              {[...employeeRows]
                .sort((a, b) => b.completionPct - a.completionPct)
                .slice(0, 5)
                .map((r) => (
                  <tr key={r.user_id}>
                    <td className="py-2 pr-4">{r.full_name}</td>
                    <td className="py-2 pr-4">{r.completionPct}%</td>
                    <td className="py-2 pr-4">{r.onTimePct}%</td>
                    <td className="py-2 pr-4">{r.attendancePct}%</td>
                  </tr>
                ))}
            </DataTable>
          </Panel>
          <Panel title="Needs attention">
            <DataTable headers={["Employee", "Overdue", "Blocked", "Attendance"]} isEmpty={employeeRows.length === 0}>
              {[...employeeRows]
                .sort((a, b) => b.tasksOverdue + b.tasksBlocked - (a.tasksOverdue + a.tasksBlocked))
                .slice(0, 5)
                .map((r) => (
                  <tr key={r.user_id}>
                    <td className="py-2 pr-4">{r.full_name}</td>
                    <td className="py-2 pr-4">{r.tasksOverdue}</td>
                    <td className="py-2 pr-4">{r.tasksBlocked}</td>
                    <td className="py-2 pr-4">{r.attendancePct}%</td>
                  </tr>
                ))}
            </DataTable>
          </Panel>
        </div>
      ) : null}

      {tab === "reports" ? (
        <div className="grid gap-5 lg:grid-cols-2">
          <Panel
            title="Workforce analytics"
            action={
              <button
                className={btnGhost}
                onClick={() =>
                  downloadCsv(
                    "workforce-report.csv",
                    (snap.data?.departmentBreakdown ?? []).map((d) => ({
                      Department: d.name,
                      Employees: d.employees,
                      Active: d.active,
                      OnLeave: d.onLeave,
                      Completion: `${d.completionPct}%`,
                    })),
                  )
                }
              >
                <Download className="h-3.5 w-3.5" /> CSV
              </button>
            }
          >
            <DataTable headers={["Department", "Employees", "Active", "On leave"]} isEmpty={(snap.data?.departmentBreakdown ?? []).length === 0}>
              {(snap.data?.departmentBreakdown ?? []).map((d) => (
                <tr key={d.name}>
                  <td className="py-2 pr-4">{d.name}</td>
                  <td className="py-2 pr-4">{d.employees}</td>
                  <td className="py-2 pr-4">{d.active}</td>
                  <td className="py-2 pr-4">{d.onLeave}</td>
                </tr>
              ))}
            </DataTable>
          </Panel>

          <Panel title="Monthly attendance trend">
            <div className="space-y-3">
              {(snap.data?.trend ?? []).map((t) => (
                <PercentBar key={t.label} label={t.label} pctValue={t.attendancePct} />
              ))}
            </div>
          </Panel>

          <Panel
            title="Performance analytics"
            action={
              <button
                className={btnGhost}
                onClick={() =>
                  downloadCsv(
                    "performance-analytics.csv",
                    employeeRows.map((r) => ({
                      Employee: r.full_name,
                      Department: r.department,
                      Completion: `${r.completionPct}%`,
                      OnTime: `${r.onTimePct}%`,
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
            <DataTable headers={["Employee", "Completion", "On-time", "Rating"]} isEmpty={employeeRows.length === 0}>
              {employeeRows.map((r) => (
                <tr key={r.user_id}>
                  <td className="py-2 pr-4">{r.full_name}</td>
                  <td className="py-2 pr-4">{r.completionPct}%</td>
                  <td className="py-2 pr-4">{r.onTimePct}%</td>
                  <td className="py-2 pr-4">{r.managerRating || "—"}</td>
                </tr>
              ))}
            </DataTable>
          </Panel>

          <Panel title="Leave analytics">
            <DataTable headers={["Department", "Leave days", "Pending"]} isEmpty={(snap.data?.departmentBreakdown ?? []).length === 0}>
              {(snap.data?.departmentBreakdown ?? []).map((d) => {
                const list = employeeRows.filter((r) => (r.department?.trim() || "Unassigned") === d.name);
                return (
                  <tr key={d.name}>
                    <td className="py-2 pr-4">{d.name}</td>
                    <td className="py-2 pr-4">{list.reduce((s, r) => s + r.leaveDays, 0)}</td>
                    <td className="py-2 pr-4">{list.reduce((s, r) => s + r.pendingLeaves, 0)}</td>
                  </tr>
                );
              })}
            </DataTable>
          </Panel>
        </div>
      ) : null}

      {tab === "audit" ? (
        <Panel
          title="Audit logs"
          description="Who did what, to whom and when"
          action={
            <button
              className={btnGhost}
              onClick={() =>
                downloadCsv(
                  "audit-logs.csv",
                  auditRows.map((l) => ({
                    When: new Date(l.created_at).toLocaleString("en-IN"),
                    Actor: l.actor_name || l.actor_id || "",
                    Action: l.action,
                    Target: l.target_name || l.target_type || "",
                    Details: l.details ?? "",
                  })),
                )
              }
            >
              <Download className="h-3.5 w-3.5" /> CSV
            </button>
          }
        >
          <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Field label="Search">
              <input
                className={inputClass}
                placeholder="Actor, target or details"
                value={auditQuery}
                onChange={(e) => setAuditQuery(e.target.value)}
              />
            </Field>
            <Field label="Action">
              <select className={inputClass} value={auditAction} onChange={(e) => setAuditAction(e.target.value)}>
                <option value="">All actions</option>
                {auditActions.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="From">
              <input type="date" className={inputClass} value={auditFrom} onChange={(e) => setAuditFrom(e.target.value)} />
            </Field>
            <Field label="To">
              <input type="date" className={inputClass} value={auditTo} onChange={(e) => setAuditTo(e.target.value)} />
            </Field>
          </div>
          <DataTable
            headers={["When", "Actor", "Action", "Target", "Details"]}
            isEmpty={auditRows.length === 0}
            empty="No activity recorded for these filters."
          >
            {auditRows.map((l) => (
              <tr key={l.id}>
                <td className="py-2 pr-4 whitespace-nowrap">{new Date(l.created_at).toLocaleString("en-IN")}</td>
                <td className="py-2 pr-4">{l.actor_name || l.actor_id?.slice(0, 8) || "—"}</td>
                <td className="py-2 pr-4 font-medium">
                  <ScrollText className="mr-1 inline h-3.5 w-3.5 text-accent" />
                  {l.action}
                </td>
                <td className="py-2 pr-4">{l.target_name || l.target_type || "—"}</td>
                <td className="py-2 pr-4 text-muted-foreground">{l.details}</td>
              </tr>
            ))}
          </DataTable>
        </Panel>
      ) : null}


      {open ? <Employee360 userId={open.id} name={open.name} canReview onClose={() => setOpen(null)} /> : null}

      {editingEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h3 className="font-semibold text-lg text-foreground">Edit Employee & Salary</h3>
                <p className="text-xs text-muted-foreground">{editingEmployee.full_name}</p>
              </div>
              <button
                type="button"
                onClick={() => setEditingEmployee(null)}
                className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="mt-4 space-y-4">
              <Field label="Department">
                <input
                  value={editForm.department}
                  onChange={(e) => setEditForm((f) => ({ ...f, department: e.target.value }))}
                  placeholder="e.g. 2D Animation, Tech"
                  className={inputClass}
                />
              </Field>

              <Field label="Designation">
                <input
                  value={editForm.designation}
                  onChange={(e) => setEditForm((f) => ({ ...f, designation: e.target.value }))}
                  placeholder="e.g. Senior Animator"
                  className={inputClass}
                />
              </Field>

              <Field label="Monthly Base Salary (₹ INR)">
                <div className="relative">
                  <span className="absolute left-3 top-2 text-sm text-muted-foreground">₹</span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={editForm.salary}
                    onChange={(e) => setEditForm((f) => ({ ...f, salary: e.target.value }))}
                    placeholder="e.g. 50000"
                    className={`${inputClass} pl-7`}
                  />
                </div>
              </Field>

              <div className="flex justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setEditingEmployee(null)}
                  className={btnGhost}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className={btnPrimary}
                >
                  {savingEdit ? "Saving…" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export type { TeamMember };
