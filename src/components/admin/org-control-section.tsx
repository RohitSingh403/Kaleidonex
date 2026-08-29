import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AlertTriangle, Banknote, Download, Gauge, Settings2, Trash2, Users, Wallet } from "lucide-react";
import {
  Bar,
  Btn,
  DataTable,
  EmptyState,
  Field,
  Kpi,
  KpiSkeleton,
  LoadingBlock,
  Panel,
  PercentBar,
  TabBar,
  btnGhost,
  btnPrimary,
  inputClass,
} from "@/components/admin/workforce-ui";

import {
  deleteStaffAccount,
  getExecAnalytics,
  getOrgSettings,
  saveDepartmentBudget,
  saveOrgSetting,
  type LeaveType,
} from "@/lib/org.functions";
import { getDepartments } from "@/lib/workforce.functions";
import { getTeamMembers } from "@/lib/team.functions";

export type OrgControlTab = "analytics" | "budgets" | "settings" | "accounts";

const TABS: { id: OrgControlTab; label: string }[] = [
  { id: "analytics", label: "Company Analytics" },
  { id: "budgets", label: "Budgets & Cost Centres" },
  { id: "settings", label: "Global Settings" },
  { id: "accounts", label: "Account Removal" },
];

const money = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;

export function OrgControlSection({ initialTab = "analytics" }: { initialTab?: OrgControlTab }) {
  const [tab, setTab] = useState<OrgControlTab>(initialTab);
  return (
    <div className="space-y-4">
      <TabBar tabs={TABS} value={tab} onChange={setTab} />
      {tab === "analytics" ? <AnalyticsTab /> : null}
      {tab === "budgets" ? <BudgetsTab /> : null}
      {tab === "settings" ? <SettingsTab /> : null}
      {tab === "accounts" ? <AccountsTab /> : null}
    </div>
  );
}

// ─── Analytics ───────────────────────────────────────────

function AnalyticsTab() {
  const fetchAnalytics = useServerFn(getExecAnalytics);
  const q = useQuery({ queryKey: ["exec-analytics"], queryFn: () => fetchAnalytics({}) });

  if (q.isLoading)
    return (
      <div className="space-y-4">
        <KpiSkeleton />
        <LoadingBlock rows={6} />
      </div>
    );
  if (q.error) return <EmptyState title="Could not load analytics" hint={(q.error as Error).message} />;
  const d = q.data!;
  const maxSpend = Math.max(1, ...d.spendTrend.map((s) => s.claims + s.payroll));
  const maxFlow = Math.max(1, ...d.approvalThroughput.map((a) => Math.max(a.raised, a.closed)));
  const maxHead = Math.max(1, ...d.headcountTrend.map((h) => h.headcount));
  const maxDept = Math.max(1, ...d.deptCosts.map((c) => c.total));

  function downloadReport() {
    const rows: string[][] = [
      ["Kaleidonex executive report", new Date().toLocaleString("en-IN")],
      [],
      ["Metric", "Value"],
      ["Monthly payroll", String(d.payrollMonthly)],
      ["Claims approved", String(d.claimsApproved)],
      ["Claims pending", String(d.claimsPending)],
      ["Approval SLA (hours)", String(d.slaHours)],
      ["Open approvals", String(d.openApprovals)],
      ["Attrition rate (%)", String(d.attrition.rate)],
      ["Leavers (12m)", String(d.attrition.leavers12m)],
      ["Average headcount", String(d.attrition.avgHeadcount)],
      [],
      ["Month", "Headcount", "Joiners", "Leavers", "Payroll", "Claims"],
      ...d.headcountTrend.map((h, i) => [
        h.label,
        String(h.headcount),
        String(h.joiners),
        String(h.leavers),
        String(d.spendTrend[i - (d.headcountTrend.length - d.spendTrend.length)]?.payroll ?? ""),
        String(d.spendTrend[i - (d.headcountTrend.length - d.spendTrend.length)]?.claims ?? ""),
      ]),
      [],
      ["Department", "Headcount", "Payroll", "Claims", "Total cost", "Cost per head"],
      ...d.deptCosts.map((c) => [
        c.name,
        String(c.headcount),
        String(c.payroll),
        String(c.claims),
        String(c.total),
        String(c.perHead),
      ]),
      [],
      ["Department", "Cost centre", "Budget", "Spent", "Used %"],
      ...d.budgets.map((b) => [b.name, b.cost_center, String(b.budget), String(b.spent), String(b.usedPct)]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `kaleidonex-executive-report-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Executive report downloaded");
  }


  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">Company-wide workforce, cost and approval performance.</p>
        <Btn variant="ghost" icon={Download} onClick={downloadReport}>
          Download report (CSV)
        </Btn>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">

        <Kpi label="Monthly payroll" value={money(d.payrollMonthly)} icon={Banknote} />
        <Kpi label="Claims approved" value={money(d.claimsApproved)} icon={Wallet} tone="good" />
        <Kpi label="Claims pending" value={money(d.claimsPending)} tone="warn" />
        <Kpi
          label="Approval SLA"
          value={`${d.slaHours}h`}
          icon={Gauge}
          hint={`${d.openApprovals} open requests`}
          tone={d.slaHours > 48 ? "bad" : "good"}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Spend trend" description="Payroll and claims, last 6 months">
          <div className="flex h-48 items-end gap-3">
            {d.spendTrend.map((s) => (
              <div key={s.label} className="flex flex-1 flex-col items-center gap-1">
                <div className="flex h-40 w-full flex-col justify-end">
                  <div
                    className="w-full rounded-t bg-accent"
                    style={{ height: `${(s.claims / maxSpend) * 100}%` }}
                    title={`Claims ${money(s.claims)}`}
                  />
                  <div
                    className="w-full bg-primary/70"
                    style={{ height: `${(s.payroll / maxSpend) * 100}%` }}
                    title={`Payroll ${money(s.payroll)}`}
                  />
                </div>
                <span className="text-[11px] text-muted-foreground">{s.label}</span>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Approval throughput" description="Raised vs closed">
          <div className="flex h-48 items-end gap-3">
            {d.approvalThroughput.map((a) => (
              <div key={a.label} className="flex flex-1 flex-col items-center gap-1">
                <div className="flex h-40 w-full items-end justify-center gap-1">
                  <div className="w-1/3 rounded-t bg-primary/70" style={{ height: `${(a.raised / maxFlow) * 100}%` }} />
                  <div className="w-1/3 rounded-t bg-emerald-500/80" style={{ height: `${(a.closed / maxFlow) * 100}%` }} />
                </div>
                <span className="text-[11px] text-muted-foreground">{a.label}</span>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Workforce growth" description="Headcount, joiners and leavers over 12 months">
          <div className="flex h-48 items-end gap-2">
            {d.headcountTrend.map((h) => (
              <div key={h.label} className="flex flex-1 flex-col items-center gap-1">
                <div className="flex h-40 w-full items-end justify-center gap-[2px]">
                  <div
                    className="w-1/2 rounded-t bg-primary/70"
                    style={{ height: `${(h.headcount / maxHead) * 100}%` }}
                    title={`${h.headcount} employees`}
                  />
                  <div
                    className="w-1/5 rounded-t bg-emerald-500/80"
                    style={{ height: `${(h.joiners / maxHead) * 100}%` }}
                    title={`${h.joiners} joiners`}
                  />
                  <div
                    className="w-1/5 rounded-t bg-destructive/80"
                    style={{ height: `${(h.leavers / maxHead) * 100}%` }}
                    title={`${h.leavers} leavers`}
                  />
                </div>
                <span className="text-[10px] text-muted-foreground">{h.label}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-3 text-[11px] text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <i className="h-2 w-2 rounded-full bg-primary/70" /> Headcount
            </span>
            <span className="inline-flex items-center gap-1">
              <i className="h-2 w-2 rounded-full bg-emerald-500/80" /> Joiners
            </span>
            <span className="inline-flex items-center gap-1">
              <i className="h-2 w-2 rounded-full bg-destructive/80" /> Leavers
            </span>
          </div>
        </Panel>

        <Panel title="Attrition outlook" description="Rolling 12-month attrition and risk signal">
          <div className="grid gap-3 sm:grid-cols-3">
            <Kpi
              label="Attrition rate"
              value={`${d.attrition.rate}%`}
              icon={Users}
              tone={d.attrition.risk === "high" ? "bad" : d.attrition.risk === "moderate" ? "warn" : "good"}
              hint={`${d.attrition.risk} risk`}
            />
            <Kpi label="Leavers (12m)" value={String(d.attrition.leavers12m)} />
            <Kpi label="Avg headcount" value={String(d.attrition.avgHeadcount)} />
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            {d.attrition.risk === "high"
              ? "Attrition is above 20% — prioritise retention reviews and 1:1s with at-risk teams."
              : d.attrition.risk === "moderate"
                ? "Attrition is in the 10–20% band. Watch departments with the highest cost per head."
                : "Attrition is healthy. Keep monitoring joiners vs leavers each month."}
          </p>
        </Panel>
      </div>

      <Panel title="Department cost breakdown" description="Payroll plus claims by department">
        {d.deptCosts.length === 0 ? (
          <EmptyState title="No department costs yet" hint="Assign employees to departments to see the breakdown." />
        ) : (
          <div className="space-y-3">
            {d.deptCosts.map((c) => (
              <div key={c.id || "unassigned"} className="space-y-1">
                <PercentBar
                  label={`${c.name} · ${c.headcount} people — ${money(c.total)}`}
                  pctValue={Math.round((c.total / maxDept) * 100)}
                  tone="bg-primary/70"
                />
                <p className="text-[11px] text-muted-foreground">
                  Payroll {money(c.payroll)} · Claims {money(c.claims)} · Cost per head {money(c.perHead)}
                </p>
              </div>
            ))}
          </div>
        )}
      </Panel>


      <Panel title="Budget utilisation by department">
        {d.budgets.length === 0 ? (
          <EmptyState title="No departments configured" />
        ) : (
          <div className="space-y-3">
            {d.budgets.map((b) => (
              <PercentBar
                key={b.id}
                label={`${b.name}${b.cost_center ? ` · ${b.cost_center}` : ""} — ${money(b.spent)} / ${money(b.budget)}`}
                pctValue={b.usedPct}
                tone={b.usedPct > 90 ? "bg-destructive" : b.usedPct > 70 ? "bg-amber-500" : "bg-accent"}
              />
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}

// ─── Budgets ─────────────────────────────────────────────

function BudgetsTab() {
  const qc = useQueryClient();
  const fetchDepts = useServerFn(getDepartments);
  const save = useServerFn(saveDepartmentBudget);
  const q = useQuery({ queryKey: ["departments"], queryFn: () => fetchDepts({}) });
  const [draft, setDraft] = useState<Record<string, { cost_center: string; budget: string; spent: string }>>({});

  const rows = (q.data ?? []) as {
    id: string;
    name: string;
    cost_center?: string | null;
    budget?: number | null;
    spent?: number | null;
  }[];

  const valueOf = (r: (typeof rows)[number]) =>
    draft[r.id] ?? {
      cost_center: r.cost_center ?? "",
      budget: String(r.budget ?? 0),
      spent: String(r.spent ?? 0),
    };

  async function commit(id: string) {
    const v = draft[id];
    if (!v) return;
    try {
      await save({ data: { id, cost_center: v.cost_center, budget: Number(v.budget), spent: Number(v.spent) } });
      toast.success("Budget updated");
      setDraft((d) => {
        const next = { ...d };
        delete next[id];
        return next;
      });
      qc.invalidateQueries({ queryKey: ["departments"] });
      qc.invalidateQueries({ queryKey: ["exec-analytics"] });
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  return (
    <Panel title="Department budgets" description="Assign a cost centre and track committed spend">
      {q.isLoading ? (
        <LoadingBlock rows={5} />
      ) : rows.length === 0 ? (
        <EmptyState icon={Wallet} title="No departments yet" hint="Create departments from the Organization tab." />
      ) : (
        <DataTable headers={["Department", "Cost centre", "Budget", "Spent", "Utilisation", ""]}>
          {rows.map((r) => {
            const v = valueOf(r);
            const used = Number(v.budget) <= 0 ? 0 : Math.round((Number(v.spent) / Number(v.budget)) * 100);
            return (
              <tr key={r.id}>
                <td className="py-2 pr-4 font-medium">{r.name}</td>
                <td className="py-2 pr-4">
                  <input
                    className={inputClass}
                    value={v.cost_center}
                    onChange={(e) => setDraft({ ...draft, [r.id]: { ...v, cost_center: e.target.value } })}
                  />
                </td>
                <td className="py-2 pr-4">
                  <input
                    type="number"
                    min={0}
                    className={inputClass}
                    value={v.budget}
                    onChange={(e) => setDraft({ ...draft, [r.id]: { ...v, budget: e.target.value } })}
                  />
                </td>
                <td className="py-2 pr-4">
                  <input
                    type="number"
                    min={0}
                    className={inputClass}
                    value={v.spent}
                    onChange={(e) => setDraft({ ...draft, [r.id]: { ...v, spent: e.target.value } })}
                  />
                </td>
                <td className="py-2 pr-4">
                  <Bar label={`${used}%`} value={Number(v.spent)} total={Math.max(1, Number(v.budget))} />
                </td>
                <td className="py-2 pr-4">
                  <button className={btnGhost} disabled={!draft[r.id]} onClick={() => commit(r.id)}>
                    Save
                  </button>
                </td>
              </tr>
            );
          })}
        </DataTable>
      )}
    </Panel>
  );
}

// ─── Global settings ─────────────────────────────────────

const DAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

function SettingsTab() {
  const qc = useQueryClient();
  const fetchSettings = useServerFn(getOrgSettings);
  const save = useServerFn(saveOrgSetting);
  const q = useQuery({ queryKey: ["org-settings"], queryFn: () => fetchSettings({}) });

  const [work, setWork] = useState({ days: ["mon", "tue", "wed", "thu", "fri"], start: "09:00", end: "18:00", late_after: "09:15" });
  const [types, setTypes] = useState<LeaveType[]>([]);
  const [notif, setNotif] = useState({ email_enabled: true, webhook_url: "" });

  useEffect(() => {
    if (!q.data) return;
    setWork(q.data.working_days);
    setTypes(q.data.leave_types.types);
    setNotif(q.data.notifications);
  }, [q.data]);

  const persist = async (key: "working_days" | "leave_types" | "notifications", value: unknown, label: string) => {
    try {
      await save({ data: { key, value } });
      toast.success(`${label} saved`);
      qc.invalidateQueries({ queryKey: ["org-settings"] });
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  if (q.isLoading) return <LoadingBlock rows={8} />;

  return (
    <div className="space-y-4">
      <Panel title="Working days & hours" description="Used for attendance, late marks and leave calculations">
        <div className="flex flex-wrap gap-2">
          {DAY_KEYS.map((d) => {
            const on = work.days.includes(d);
            return (
              <button
                key={d}
                onClick={() => setWork({ ...work, days: on ? work.days.filter((x) => x !== d) : [...work.days, d] })}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold uppercase ${
                  on ? "bg-primary text-primary-foreground" : "border border-border bg-background text-muted-foreground"
                }`}
              >
                {d}
              </button>
            );
          })}
        </div>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          <Field label="Shift start">
            <input type="time" className={inputClass} value={work.start} onChange={(e) => setWork({ ...work, start: e.target.value })} />
          </Field>
          <Field label="Shift end">
            <input type="time" className={inputClass} value={work.end} onChange={(e) => setWork({ ...work, end: e.target.value })} />
          </Field>
          <Field label="Late after">
            <input
              type="time"
              className={inputClass}
              value={work.late_after}
              onChange={(e) => setWork({ ...work, late_after: e.target.value })}
            />
          </Field>
        </div>
        <button className={`${btnPrimary} mt-3`} onClick={() => persist("working_days", work, "Working days")}>
          <Settings2 className="h-4 w-4" /> Save working days
        </button>
      </Panel>

      <Panel
        title="Leave types & entitlements"
        action={
          <button className={btnGhost} onClick={() => setTypes([...types, { name: "", annual: 0 }])}>
            Add type
          </button>
        }
      >
        {types.length === 0 ? (
          <EmptyState title="No leave types defined" hint="Add the leave types your organisation offers." />
        ) : (
          <div className="space-y-2">
            {types.map((t, i) => (
              <div key={i} className="flex flex-wrap items-end gap-3">
                <div className="min-w-[200px] flex-1">
                  <Field label="Name">
                    <input
                      className={inputClass}
                      value={t.name}
                      onChange={(e) =>
                        setTypes(types.map((x, j) => (i === j ? { ...x, name: e.target.value } : x)))
                      }
                    />
                  </Field>
                </div>
                <div className="w-32">
                  <Field label="Annual days">
                    <input
                      type="number"
                      min={0}
                      className={inputClass}
                      value={t.annual}
                      onChange={(e) =>
                        setTypes(types.map((x, j) => (i === j ? { ...x, annual: Number(e.target.value) } : x)))
                      }
                    />
                  </Field>
                </div>
                <button className={btnGhost} onClick={() => setTypes(types.filter((_, j) => j !== i))}>
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
        <button
          className={`${btnPrimary} mt-3`}
          onClick={() =>
            persist("leave_types", { types: types.filter((t) => t.name.trim()) }, "Leave types")
          }
        >
          Save leave types
        </button>
      </Panel>

      <Panel title="Notifications" description="Approval decisions and escalations">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={notif.email_enabled}
            onChange={(e) => setNotif({ ...notif, email_enabled: e.target.checked })}
          />
          Send email alerts for approval decisions and escalations
        </label>
        <div className="mt-3 max-w-xl">
          <Field label="Slack / Teams incoming webhook (optional)">
            <input
              className={inputClass}
              placeholder="https://hooks.slack.com/services/…"
              value={notif.webhook_url}
              onChange={(e) => setNotif({ ...notif, webhook_url: e.target.value })}
            />
          </Field>
        </div>
        <button className={`${btnPrimary} mt-3`} onClick={() => persist("notifications", notif, "Notification settings")}>
          Save notifications
        </button>
      </Panel>
    </div>
  );
}

// ─── Account removal ─────────────────────────────────────

function AccountsTab() {
  const qc = useQueryClient();
  const fetchTeam = useServerFn(getTeamMembers);
  const remove = useServerFn(deleteStaffAccount);
  const q = useQuery({ queryKey: ["team-members"], queryFn: () => fetchTeam({}) });
  const [target, setTarget] = useState<{ user_id: string; full_name: string } | null>(null);
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  const rows = (q.data ?? []).filter((m) => m.full_name || m.email);

  async function doDelete() {
    if (!target) return;
    setBusy(true);
    try {
      await remove({ data: { user_id: target.user_id, confirm_name: confirm } });
      toast.success(`${target.full_name || "Account"} removed permanently`);
      setTarget(null);
      setConfirm("");
      qc.invalidateQueries();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Panel
      title="Remove an employee or HR account"
      description="Permanently deletes the login and every workforce record for that person. This cannot be undone."
    >
      <div className="mb-4 flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
        <span>
          Deletion removes attendance, leave, claims, tasks, documents and role grants. Prefer marking the employee
          inactive if you only want to revoke access.
        </span>
      </div>

      {q.isLoading ? (
        <LoadingBlock rows={5} />
      ) : (
        <DataTable headers={["Name", "Email", "Roles", "Status", ""]} isEmpty={rows.length === 0}>
          {rows.map((m) => (
            <tr key={m.user_id}>
              <td className="py-2 pr-4 font-medium">{m.full_name || "—"}</td>
              <td className="py-2 pr-4 text-muted-foreground">{m.email || "—"}</td>
              <td className="py-2 pr-4 capitalize">{m.roles.join(", ") || "employee"}</td>
              <td className="py-2 pr-4 capitalize">{m.status}</td>
              <td className="py-2 pr-4">
                <button
                  className="inline-flex items-center gap-1 rounded-lg border border-destructive/40 px-3 py-1.5 text-xs font-medium text-destructive transition-colors hover:bg-destructive/10"
                  onClick={() => {
                    setTarget({ user_id: m.user_id, full_name: m.full_name });
                    setConfirm("");
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </button>
              </td>
            </tr>
          ))}
        </DataTable>
      )}

      {target ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4" onClick={() => setTarget(null)}>
          <div className="w-full max-w-md rounded-xl bg-background p-5 shadow-lift" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold">Delete {target.full_name || "this account"}?</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Type the full name <strong>{target.full_name || "(no name on file)"}</strong> to confirm.
            </p>
            <input className={`${inputClass} mt-3`} value={confirm} onChange={(e) => setConfirm(e.target.value)} />
            <div className="mt-4 flex justify-end gap-2">
              <button className={btnGhost} onClick={() => setTarget(null)}>
                Cancel
              </button>
              <button
                disabled={busy}
                onClick={doDelete}
                className="rounded-lg bg-destructive px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                {busy ? "Deleting…" : "Delete permanently"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </Panel>
  );
}
