import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Users, ShieldCheck, UserPlus, CheckCircle2, XCircle, IndianRupee, Trash2 } from "lucide-react";
import { deleteStaffAccount } from "@/lib/org.functions";
import {
  getTeamMembers,
  getManagers,
  getPendingApprovals,
  getOrgStats,
  createStaffAccount,
  assignManager,
  setStaffRole,
  decideApproval,
  CLAIM_ESCALATION_LIMIT,
  type MyAccess,
} from "@/lib/team.functions";

type TeamTab = "team" | "approvals" | "create";

const inputCls =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-accent";

function Stat({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-soft">
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export function TeamSection({ access }: { access: MyAccess }) {
  const [tab, setTab] = useState<TeamTab>("team");
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const qc = useQueryClient();

  const fetchTeam = useServerFn(getTeamMembers);
  const fetchManagers = useServerFn(getManagers);
  const fetchApprovals = useServerFn(getPendingApprovals);
  const fetchStats = useServerFn(getOrgStats);
  const createAccount = useServerFn(createStaffAccount);
  const setManager = useServerFn(assignManager);
  const changeRole = useServerFn(setStaffRole);
  const decide = useServerFn(decideApproval);
  const removeStaff = useServerFn(deleteStaffAccount);

  const [pendingDelete, setPendingDelete] = useState<
    { user_id: string; name: string; email: string; roles: string[] } | null
  >(null);
  const [confirmName, setConfirmName] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const team = useQuery({ queryKey: ["team-members"], queryFn: () => fetchTeam({}) });
  const managers = useQuery({ queryKey: ["team-managers"], queryFn: () => fetchManagers({}) });
  const approvals = useQuery({ queryKey: ["team-approvals"], queryFn: () => fetchApprovals({}) });
  const stats = useQuery({ queryKey: ["team-stats"], queryFn: () => fetchStats({}) });

  const [form, setForm] = useState({
    email: "",
    password: "",
    full_name: "",
    role: "employee" as "ceo" | "hr" | "employee",
    designation: "",
    department: "",
    manager_id: "",
  });

  const rows = useMemo(
    () => (team.data ?? []).filter((m) => m.user_id !== access.userId),
    [team.data, access.userId],
  );

  function refresh() {
    void qc.invalidateQueries({ queryKey: ["team-members"] });
    void qc.invalidateQueries({ queryKey: ["team-approvals"] });
    void qc.invalidateQueries({ queryKey: ["team-stats"] });
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    try {
      await createAccount({
        data: {
          email: form.email.trim(),
          password: form.password,
          full_name: form.full_name.trim(),
          role: access.isSuper ? form.role : "employee",
          designation: form.designation.trim(),
          department: form.department.trim(),
          manager_id: form.manager_id || null,
        },
      });
      setMsg({ kind: "ok", text: `Account created for ${form.email}` });
      setForm({
        email: "",
        password: "",
        full_name: "",
        role: "employee",
        designation: "",
        department: "",
        manager_id: "",
      });
      refresh();
      setTab("team");
    } catch (err) {
      setMsg({ kind: "err", text: err instanceof Error ? err.message : "Could not create account" });
    }
  }

  async function handleDecide(
    kind: "leave" | "claim" | "request",
    id: string,
    decision: "approved" | "rejected",
  ) {
    setMsg(null);
    try {
      await decide({ data: { kind, id, decision, note: "" } });
      setMsg({ kind: "ok", text: `Request ${decision}.` });
      refresh();
    } catch (err) {
      setMsg({ kind: "err", text: err instanceof Error ? err.message : "Could not update" });
    }
  }

  const tabs: { id: TeamTab; label: string }[] = [
    { id: "team", label: access.isSuper ? "Company" : "My Team" },
    { id: "approvals", label: `Approvals${approvals.data?.length ? ` (${approvals.data.length})` : ""}` },
    { id: "create", label: "Add Account" },
  ];

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Headcount" value={stats.data?.headcount ?? 0} hint={access.isSuper ? "Whole company" : "Reporting to you"} />
        <Stat label="Present today" value={stats.data?.presentToday ?? 0} hint={`${stats.data?.onLeaveToday ?? 0} on leave`} />
        <Stat label="Pending leaves" value={stats.data?.pendingLeaves ?? 0} />
        <Stat
          label="Pending claims"
          value={stats.data?.pendingClaims ?? 0}
          hint={`₹${(stats.data?.pendingClaimValue ?? 0).toLocaleString("en-IN")} awaiting`}
        />
      </div>

      {msg ? (
        <div
          className={`rounded-md border px-4 py-3 text-sm ${
            msg.kind === "ok"
              ? "border-accent/40 bg-accent/10 text-foreground"
              : "border-destructive/40 bg-destructive/10 text-destructive"
          }`}
        >
          {msg.text}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`rounded-md px-4 py-2 text-sm transition-colors ${
              tab === t.id
                ? "bg-primary font-semibold text-primary-foreground"
                : "border border-border bg-card hover:bg-secondary"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "team" ? (
        <section className="overflow-hidden rounded-xl border border-border bg-card shadow-soft">
          <div className="flex items-center gap-2 border-b border-border px-5 py-3">
            <Users className="h-4 w-4 text-accent" />
            <h2 className="text-sm font-semibold uppercase tracking-wide text-primary">
              {access.isSuper ? "All staff" : "My reports"}
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="bg-secondary/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Designation</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Reporting to</th>
                  {access.isSuper ? <th className="px-4 py-3">Manage</th> : null}
                </tr>
              </thead>
              <tbody>
                {team.isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">
                      Loading…
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">
                      No team members yet. Use “Add Account” to create one.
                    </td>
                  </tr>
                ) : (
                  rows.map((m) => (
                    <tr key={m.user_id} className="border-t border-border">
                      <td className="px-4 py-3 font-medium">{m.full_name || "—"}</td>
                      <td className="px-4 py-3 text-muted-foreground">{m.email || "—"}</td>
                      <td className="px-4 py-3">
                        {m.designation || "—"}
                        {m.department ? (
                          <span className="text-muted-foreground"> · {m.department}</span>
                        ) : null}
                      </td>
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-semibold text-primary">
                          {m.roles.join(", ") || "employee"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{m.manager_name || "—"}</td>
                      {access.isSuper ? (
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <select
                              className="rounded-md border border-input bg-background px-2 py-1 text-xs"
                              value={m.manager_id ?? ""}
                              onChange={async (e) => {
                                await setManager({
                                  data: { user_id: m.user_id, manager_id: e.target.value || null },
                                });
                                refresh();
                              }}
                            >
                              <option value="">No manager</option>
                              {(managers.data ?? [])
                                .filter((mg) => mg.id !== m.user_id)
                                .map((mg) => (
                                  <option key={mg.id} value={mg.id}>
                                    {mg.name || mg.id.slice(0, 8)} ({mg.role})
                                  </option>
                                ))}
                            </select>
                            <button
                              onClick={async () => {
                                await changeRole({
                                  data: {
                                    user_id: m.user_id,
                                    role: "hr",
                                    action: m.roles.includes("hr") ? "revoke" : "grant",
                                  },
                                });
                                refresh();
                              }}
                              className="rounded-md border border-border px-2 py-1 text-xs hover:bg-secondary"
                            >
                              {m.roles.includes("hr") ? "Remove HR" : "Make HR"}
                            </button>
                            <button
                              onClick={() => {
                                setDeleteError(null);
                                setConfirmName("");
                                setPendingDelete({
                                  user_id: m.user_id,
                                  name: m.full_name || "",
                                  email: m.email || "",
                                  roles: m.roles,
                                });
                              }}
                              className="inline-flex items-center gap-1 rounded-md border border-destructive/40 px-2 py-1 text-xs font-semibold text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              Delete
                            </button>
                          </div>
                        </td>
                      ) : null}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {tab === "approvals" ? (
        <section className="rounded-xl border border-border bg-card shadow-soft">
          <div className="flex items-center gap-2 border-b border-border px-5 py-3">
            <ShieldCheck className="h-4 w-4 text-accent" />
            <h2 className="text-sm font-semibold uppercase tracking-wide text-primary">
              Pending approvals
            </h2>
          </div>
          <div className="divide-y divide-border">
            {approvals.isLoading ? (
              <p className="px-5 py-6 text-sm text-muted-foreground">Loading…</p>
            ) : (approvals.data ?? []).length === 0 ? (
              <p className="px-5 py-6 text-sm text-muted-foreground">Nothing waiting on you.</p>
            ) : (
              (approvals.data ?? []).map((a) => {
                const blocked = a.needs_ceo && !access.isSuper;
                return (
                  <div
                    key={`${a.kind}-${a.id}`}
                    className="flex flex-wrap items-start justify-between gap-3 px-5 py-4"
                  >
                    <div className="min-w-0">
                      <p className="flex flex-wrap items-center gap-2 text-sm font-semibold">
                        {a.title}
                        <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] uppercase text-primary">
                          {a.kind}
                        </span>
                        {a.amount !== null ? (
                          <span className="flex items-center text-accent">
                            <IndianRupee className="h-3 w-3" />
                            {a.amount.toLocaleString("en-IN")}
                          </span>
                        ) : null}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">{a.detail}</p>
                      {blocked ? (
                        <p className="mt-1 text-xs text-destructive">
                          Above ₹{CLAIM_ESCALATION_LIMIT.toLocaleString("en-IN")} — CEO approval required.
                        </p>
                      ) : null}
                    </div>
                    <div className="flex gap-2">
                      <button
                        disabled={blocked}
                        onClick={() => handleDecide(a.kind, a.id, "approved")}
                        className="flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground disabled:opacity-40"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" /> Approve
                      </button>
                      <button
                        disabled={blocked}
                        onClick={() => handleDecide(a.kind, a.id, "rejected")}
                        className="flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-xs font-semibold hover:bg-secondary disabled:opacity-40"
                      >
                        <XCircle className="h-3.5 w-3.5" /> Reject
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      ) : null}

      {tab === "create" ? (
        <section className="rounded-xl border border-border bg-card shadow-soft">
          <div className="flex items-center gap-2 border-b border-border px-5 py-3">
            <UserPlus className="h-4 w-4 text-accent" />
            <h2 className="text-sm font-semibold uppercase tracking-wide text-primary">
              Create staff login
            </h2>
          </div>
          <form onSubmit={handleCreate} className="grid gap-4 p-5 sm:grid-cols-2">
            <label className="space-y-1 text-sm">
              <span className="font-medium">Full name</span>
              <input
                required
                className={inputCls}
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="font-medium">Work email</span>
              <input
                required
                type="email"
                className={inputCls}
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="font-medium">Temporary password</span>
              <input
                required
                minLength={6}
                className={inputCls}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="font-medium">Access level</span>
              <select
                className={inputCls}
                value={access.isSuper ? form.role : "employee"}
                disabled={!access.isSuper}
                onChange={(e) => setForm({ ...form, role: e.target.value as typeof form.role })}
              >
                <option value="employee">Employee</option>
                {access.isSuper ? <option value="hr">HR</option> : null}
                {access.isSuper ? <option value="ceo">CEO</option> : null}
              </select>
            </label>
            <label className="space-y-1 text-sm">
              <span className="font-medium">Designation</span>
              <input
                className={inputCls}
                value={form.designation}
                onChange={(e) => setForm({ ...form, designation: e.target.value })}
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="font-medium">Department</span>
              <input
                className={inputCls}
                value={form.department}
                onChange={(e) => setForm({ ...form, department: e.target.value })}
              />
            </label>
            {access.isSuper ? (
              <label className="space-y-1 text-sm sm:col-span-2">
                <span className="font-medium">Reporting manager (HR)</span>
                <select
                  className={inputCls}
                  value={form.manager_id}
                  onChange={(e) => setForm({ ...form, manager_id: e.target.value })}
                >
                  <option value="">No manager</option>
                  {(managers.data ?? []).map((mg) => (
                    <option key={mg.id} value={mg.id}>
                      {mg.name || mg.id.slice(0, 8)} ({mg.role})
                    </option>
                  ))}
                </select>
              </label>
            ) : (
              <p className="text-sm text-muted-foreground sm:col-span-2">
                New employees are automatically assigned to report to you.
              </p>
            )}
            <div className="sm:col-span-2">
              <button
                type="submit"
                className="rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90"
              >
                Create account
              </button>
            </div>
          </form>
        </section>
      ) : null}

      {pendingDelete ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-5 shadow-lg">
            <h3 className="text-base font-bold text-destructive">Delete staff account</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              This permanently removes{" "}
              <span className="font-semibold text-foreground">
                {pendingDelete.name || pendingDelete.email}
              </span>{" "}
              ({pendingDelete.roles.join(", ") || "employee"}) and all of their attendance, leave,
              claims, tasks, documents and login access. This cannot be undone.
            </p>
            {pendingDelete.name ? (
              <label className="mt-4 block text-sm">
                <span className="text-muted-foreground">
                  Type <span className="font-semibold text-foreground">{pendingDelete.name}</span> to
                  confirm
                </span>
                <input
                  autoFocus
                  className={inputCls + " mt-1"}
                  value={confirmName}
                  onChange={(e) => setConfirmName(e.target.value)}
                />
              </label>
            ) : null}
            {deleteError ? (
              <p className="mt-3 text-sm font-medium text-destructive">{deleteError}</p>
            ) : null}
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setPendingDelete(null)}
                className="rounded-md border border-border px-4 py-2 text-sm hover:bg-secondary"
              >
                Cancel
              </button>
              <button
                disabled={deleting}
                onClick={async () => {
                  setDeleting(true);
                  setDeleteError(null);
                  try {
                    await removeStaff({
                      data: { user_id: pendingDelete.user_id, confirm_name: confirmName },
                    });
                    setPendingDelete(null);
                    setMsg({
                      kind: "ok",
                      text: `${pendingDelete.name || pendingDelete.email} was permanently deleted.`,
                    });
                    refresh();
                  } catch (err) {
                    setDeleteError(err instanceof Error ? err.message : "Could not delete account");
                  } finally {
                    setDeleting(false);
                  }
                }}
                className="rounded-md bg-destructive px-4 py-2 text-sm font-semibold text-destructive-foreground hover:opacity-90 disabled:opacity-60"
              >
                {deleting ? "Deleting…" : "Delete permanently"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
