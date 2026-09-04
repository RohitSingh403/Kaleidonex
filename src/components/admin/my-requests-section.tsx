import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CalendarOff, Receipt, CalendarCheck, FileText, History } from "lucide-react";
import { getMyRequestHistory, type MyRequestRow } from "@/lib/requests.functions";
import { getApprovalHistory } from "@/lib/approvals.functions";
import { Kpi, Panel } from "@/components/admin/workforce-ui";
import { CustomSelect } from "@/components/ui/custom-select";

const KIND = {
  leave: { label: "Leave", icon: CalendarOff },
  expense: { label: "Expense", icon: Receipt },
  attendance_correction: { label: "Attendance", icon: CalendarCheck },
  employee_request: { label: "Request", icon: FileText },
} as const;

const OPEN_STATES = ["SUBMITTED", "PENDING_HR", "PENDING_CEO", "CHANGES_REQUESTED"];

function isOpen(r: MyRequestRow) {
  if (r.state) return OPEN_STATES.includes(r.state);
  return r.status === "pending";
}
function isApproved(r: MyRequestRow) {
  if (r.state) return r.state === "HR_APPROVED" || r.state === "CEO_APPROVED";
  return r.status === "approved" || r.status === "paid";
}
function isRejected(r: MyRequestRow) {
  if (r.state) return r.state === "REJECTED" || r.state === "CANCELLED";
  return r.status === "rejected";
}

function tone(r: MyRequestRow) {
  if (isApproved(r)) return "bg-emerald-500/10 text-emerald-700";
  if (isRejected(r)) return "bg-destructive/10 text-destructive";
  return "bg-amber-500/10 text-amber-700";
}

function Timeline({ approvalId }: { approvalId: string }) {
  const fetchHistory = useServerFn(getApprovalHistory);
  const history = useQuery({
    queryKey: ["approval-history", approvalId],
    queryFn: () => fetchHistory({ data: { request_id: approvalId } }),
  });
  const items = history.data ?? [];
  if (history.isLoading) return <p className="mt-3 text-xs text-muted-foreground">Loading trail…</p>;
  if (items.length === 0) return <p className="mt-3 text-xs text-muted-foreground">No activity recorded yet.</p>;
  return (
    <ol className="mt-3 space-y-2 border-l border-border pl-4">
      {items.map((a) => (
        <li key={a.id} className="relative text-xs">
          <span className="absolute -left-[21px] top-1 h-2 w-2 rounded-full bg-accent" />
          <p className="font-medium capitalize">
            {String(a.action).replace(/_/g, " ")} · {a.actor_name || "System"}
          </p>
          <p className="text-muted-foreground">
            {new Date(a.created_at).toLocaleString()}
            {a.comment ? ` — ${a.comment}` : ""}
          </p>
        </li>
      ))}
    </ol>
  );
}

export function MyRequestsSection() {
  const fetchHistory = useServerFn(getMyRequestHistory);
  const [filter, setFilter] = useState<"all" | "open" | "approved" | "rejected">("all");
  const [kind, setKind] = useState<"all" | MyRequestRow["kind"]>("all");
  const [openId, setOpenId] = useState<string | null>(null);

  const query = useQuery({ queryKey: ["my-requests"], queryFn: () => fetchHistory({}) });
  const rows = query.data ?? [];

  const shown = useMemo(
    () =>
      rows.filter((r) => {
        if (kind !== "all" && r.kind !== kind) return false;
        if (filter === "open") return isOpen(r);
        if (filter === "approved") return isApproved(r);
        if (filter === "rejected") return isRejected(r);
        return true;
      }),
    [rows, filter, kind],
  );

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Total submitted" value={rows.length} icon={History} />
        <Kpi label="In progress" value={rows.filter(isOpen).length} tone="warn" />
        <Kpi label="Approved" value={rows.filter(isApproved).length} tone="good" />
        <Kpi label="Rejected" value={rows.filter(isRejected).length} tone="bad" />
      </div>

      <div className="flex flex-wrap gap-2">
        {(["all", "open", "approved", "rejected"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-4 py-1.5 text-sm capitalize transition-colors ${
              filter === f ? "bg-primary text-primary-foreground" : "border border-border bg-card hover:bg-secondary"
            }`}
          >
            {f}
          </button>
        ))}
        <CustomSelect
          value={kind}
          onValueChange={(val) => setKind(val as typeof kind)}
          options={[
            { value: "all", label: "All types" },
            ...Object.entries(KIND).map(([k, v]) => ({ value: k, label: v.label })),
          ]}
        />
      </div>

      <Panel title="My requests" description="Every leave, claim, correction and request you have raised.">
        {query.isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : shown.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nothing matches this filter yet.</p>
        ) : (
          <div className="space-y-3">
            {shown.map((r) => {
              const meta = KIND[r.kind];
              const Icon = meta.icon;
              return (
                <div key={`${r.kind}-${r.id}`} className="rounded-lg border border-border p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="flex items-center gap-1 rounded bg-secondary px-2 py-0.5 text-[11px] font-semibold uppercase text-primary">
                          <Icon className="h-3 w-3" /> {meta.label}
                        </span>
                        <span className={`rounded px-2 py-0.5 text-[11px] font-semibold capitalize ${tone(r)}`}>
                          {r.state_label}
                        </span>
                      </div>
                      <p className="mt-2 text-sm font-semibold">{r.title}</p>
                      <p className="text-xs text-muted-foreground">
                        Raised {new Date(r.created_at).toLocaleDateString()}
                        {r.decided_at ? ` · decided ${new Date(r.decided_at).toLocaleDateString()}` : ""}
                        {r.amount ? ` · ${r.amount}` : ""}
                      </p>
                      {r.summary ? <p className="mt-1 text-xs text-muted-foreground">{r.summary}</p> : null}
                      {r.decision_note ? (
                        <p className="mt-1 text-xs italic text-muted-foreground">Note: {r.decision_note}</p>
                      ) : null}
                    </div>
                    {r.approval_id ? (
                      <button
                        onClick={() => setOpenId(openId === r.approval_id ? null : r.approval_id)}
                        className="flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-xs hover:bg-secondary"
                      >
                        <History className="h-3.5 w-3.5" /> Tracker
                      </button>
                    ) : null}
                  </div>
                  {r.approval_id && openId === r.approval_id ? <Timeline approvalId={r.approval_id} /> : null}
                </div>
              );
            })}
          </div>
        )}
      </Panel>
    </div>
  );
}
