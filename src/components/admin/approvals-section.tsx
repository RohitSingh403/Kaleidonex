import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Check, X, RotateCcw, ArrowUpCircle, History, Ban, ShieldCheck } from "lucide-react";
import {
  listApprovals,
  getApprovalHistory,
  actOnApproval,
  getApprovalRules,
  saveApprovalRule,
  type ApprovalRequestRow,
} from "@/lib/approvals.functions";
import { Kpi, Panel } from "@/components/admin/workforce-ui";

const KIND_LABEL: Record<string, string> = {
  leave: "Leave",
  expense: "Expense",
  attendance_correction: "Attendance",
  employee_request: "Request",
  hr_escalation: "Escalation",
};

const OPEN = ["SUBMITTED", "PENDING_HR", "PENDING_CEO", "CHANGES_REQUESTED"];

function stateTone(state: string) {
  if (state === "HR_APPROVED" || state === "CEO_APPROVED") return "bg-emerald-100 text-emerald-700";
  if (state === "REJECTED" || state === "CANCELLED") return "bg-red-100 text-red-700";
  if (state === "CHANGES_REQUESTED") return "bg-amber-100 text-amber-700";
  return "bg-sky-100 text-sky-700";
}

export function ApprovalsSection({ isSuper = false }: { isSuper?: boolean }) {
  const qc = useQueryClient();
  const [view, setView] = useState<"inbox" | "mine" | "all" | "rules">("inbox");
  const [openHistory, setOpenHistory] = useState<string | null>(null);
  const [comment, setComment] = useState<Record<string, string>>({});

  const fetchList = useServerFn(listApprovals);
  const list = useQuery({ queryKey: ["approvals"], queryFn: () => fetchList({}) });

  const act = useServerFn(actOnApproval);
  const mutate = useMutation({
    mutationFn: (v: { id: string; action: "approve" | "reject" | "request_changes" | "escalate" | "cancel"; comment: string }) =>
      act({ data: v }),
    onSuccess: (result) => {
      if (result.ok) {
        toast.success("Decision recorded");
      } else {
        toast.info(result.message);
      }
      void qc.invalidateQueries({ queryKey: ["approvals"] });
      if (openHistory) {
        void qc.invalidateQueries({ queryKey: ["approval-history", openHistory] });
      }
    },
    onError: (e: Error) => {
      toast.error(e.message || "Could not complete that action");
      void qc.invalidateQueries({ queryKey: ["approvals"] });
    },

  });

  const rows = (list.data ?? []) as ApprovalRequestRow[];
  const inbox = useMemo(() => rows.filter((r) => r.canAct && OPEN.includes(r.state)), [rows]);
  const mine = useMemo(() => rows.filter((r) => r.isMine), [rows]);
  const shown = view === "inbox" ? inbox : view === "mine" ? mine : rows;

  const pendingCeo = rows.filter((r) => r.state === "PENDING_CEO").length;
  const decided = rows.filter((r) => !OPEN.includes(r.state)).length;

  function run(id: string, action: "approve" | "reject" | "request_changes" | "escalate" | "cancel") {
    mutate.mutate({ id, action, comment: comment[id] ?? "" });
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Awaiting my decision" value={inbox.length} icon={ShieldCheck} tone="warn" />
        <Kpi label="My requests" value={mine.length} />
        <Kpi label="Pending executive" value={pendingCeo} tone={pendingCeo ? "warn" : "default"} />
        <Kpi label="Closed" value={decided} tone="good" />
      </div>

      <div className="flex flex-wrap gap-2">
        {(["inbox", "mine", "all", ...(isSuper ? (["rules"] as const) : [])] as const).map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`rounded-full px-4 py-1.5 text-sm capitalize transition-colors ${
              view === v ? "bg-primary text-primary-foreground" : "border border-border bg-card hover:bg-secondary"
            }`}
          >
            {v === "mine" ? "My requests" : v === "all" ? "All visible" : v === "rules" ? "Approval rules" : "Inbox"}
          </button>
        ))}
      </div>

      {view === "rules" ? (
        <RulesEditor />
      ) : (
        <Panel title="Approval requests" description="Every decision is recorded in an immutable trail.">
          {list.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : shown.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nothing here right now.</p>
          ) : (
            <div className="space-y-3">
              {shown.map((r) => (
                <div key={r.id} className="rounded-lg border border-border p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded bg-secondary px-2 py-0.5 text-[11px] font-semibold uppercase text-primary">
                          {KIND_LABEL[r.kind] ?? r.kind}
                        </span>
                        <span className={`rounded px-2 py-0.5 text-[11px] font-semibold ${stateTone(r.state)}`}>
                          {r.state_label}
                        </span>
                        {r.requires_ceo ? (
                          <span className="rounded bg-violet-100 px-2 py-0.5 text-[11px] font-semibold text-violet-700">
                            Needs CEO
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-2 truncate text-sm font-semibold">{r.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {r.requester_name || "Team member"} · {new Date(r.created_at).toLocaleDateString()}
                        {r.amount ? ` · ${r.amount}` : ""}
                      </p>
                      {r.summary ? <p className="mt-1 text-xs text-muted-foreground">{r.summary}</p> : null}
                    </div>
                    <button
                      onClick={() => setOpenHistory(openHistory === r.id ? null : r.id)}
                      className="flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-xs hover:bg-secondary"
                    >
                      <History className="h-3.5 w-3.5" /> History
                    </button>
                  </div>

                  {(r.canAct || r.isMine) && OPEN.includes(r.state) ? (
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <input
                        value={comment[r.id] ?? ""}
                        onChange={(e) => setComment((c) => ({ ...c, [r.id]: e.target.value }))}
                        placeholder="Comment (recorded in the trail)"
                        className="min-w-[12rem] flex-1 rounded-md border border-input bg-background px-3 py-1.5 text-sm"
                      />
                      {r.canAct ? (
                        r.state === "PENDING_CEO" && !isSuper ? (
                          <span className="text-xs text-destructive">
                            Awaiting executive approval — only the CEO can decide this request.
                          </span>
                        ) : (
                          <>
                            <ActBtn disabled={mutate.isPending} onClick={() => run(r.id, "approve")} icon={Check} label="Approve" tone="good" />
                            <ActBtn disabled={mutate.isPending} onClick={() => run(r.id, "reject")} icon={X} label="Reject" tone="bad" />
                            <ActBtn disabled={mutate.isPending} onClick={() => run(r.id, "request_changes")} icon={RotateCcw} label="Changes" />
                            <ActBtn disabled={mutate.isPending} onClick={() => run(r.id, "escalate")} icon={ArrowUpCircle} label="Escalate" />
                          </>
                        )
                      ) : null}

                      {r.isMine ? <ActBtn disabled={mutate.isPending} onClick={() => run(r.id, "cancel")} icon={Ban} label="Cancel" /> : null}

                    </div>
                  ) : null}

                  {openHistory === r.id ? <HistoryTrail requestId={r.id} /> : null}
                </div>
              ))}
            </div>
          )}
        </Panel>
      )}
    </div>
  );
}

function ActBtn({
  onClick,
  icon: Icon,
  label,
  tone,
  disabled,
}: {
  onClick: () => void;
  icon: typeof Check;
  label: string;
  tone?: "good" | "bad";
  disabled?: boolean;
}) {
  const cls =
    tone === "good"
      ? "bg-emerald-600 text-white hover:bg-emerald-700"
      : tone === "bad"
        ? "bg-destructive text-destructive-foreground hover:opacity-90"
        : "border border-border bg-card hover:bg-secondary";
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-medium disabled:opacity-50 ${cls}`}
    >
      <Icon className="h-3.5 w-3.5" /> {label}
    </button>
  );
}


function HistoryTrail({ requestId }: { requestId: string }) {
  const fetchHistory = useServerFn(getApprovalHistory);
  const history = useQuery({
    queryKey: ["approval-history", requestId],
    queryFn: () => fetchHistory({ data: { request_id: requestId } }),
  });
  const rows = (history.data ?? []) as {
    id: string;
    actor_name: string;
    actor_role: string;
    action: string;
    comment: string;
    state_label: string;
    created_at: string;
  }[];

  return (
    <div className="mt-3 space-y-2 rounded-md bg-muted/50 p-3">
      {history.isLoading ? (
        <p className="text-xs text-muted-foreground">Loading trail…</p>
      ) : rows.length === 0 ? (
        <p className="text-xs text-muted-foreground">No entries yet.</p>
      ) : (
        rows.map((h) => (
          <div key={h.id} className="text-xs">
            <span className="font-semibold capitalize">{h.action.replace(/_/g, " ")}</span>
            <span className="text-muted-foreground">
              {" "}
              → {h.state_label} · {h.actor_name || h.actor_role} · {new Date(h.created_at).toLocaleString()}
            </span>
            {h.comment ? <p className="text-muted-foreground">“{h.comment}”</p> : null}
          </div>
        ))
      )}
    </div>
  );
}

type RuleRow = {
  rule_key: string;
  label: string;
  kind: string;
  threshold_amount: number;
  requires_ceo: boolean;
  enabled: boolean;
};

function RulesEditor() {
  const qc = useQueryClient();
  const fetchRules = useServerFn(getApprovalRules);
  const rules = useQuery({ queryKey: ["approval-rules"], queryFn: () => fetchRules({}) });
  const save = useServerFn(saveApprovalRule);
  const mutate = useMutation({
    mutationFn: (r: RuleRow) =>
      save({
        data: {
          rule_key: r.rule_key,
          label: r.label,
          kind: r.kind as "leave" | "expense" | "attendance_correction" | "employee_request" | "hr_escalation",
          threshold_amount: Number(r.threshold_amount),
          requires_ceo: r.requires_ceo,
          enabled: r.enabled,
        },
      }),
    onSuccess: () => {
      toast.success("Rule saved");
      qc.invalidateQueries({ queryKey: ["approval-rules"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const rows = (rules.data ?? []) as RuleRow[];

  return (
    <Panel title="Approval rules" description="Thresholds that decide when a request must reach the executive desk.">
      {rules.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">No rules configured.</p>
      ) : (
        <div className="space-y-3">
          {rows.map((r) => (
            <RuleRowEditor key={r.rule_key} rule={r} onSave={(v) => mutate.mutate(v)} />
          ))}
        </div>
      )}
    </Panel>
  );
}

function RuleRowEditor({ rule, onSave }: { rule: RuleRow; onSave: (r: RuleRow) => void }) {
  const [draft, setDraft] = useState<RuleRow>(rule);
  return (
    <div className="flex flex-wrap items-end gap-3 rounded-lg border border-border p-3">
      <div className="min-w-[10rem] flex-1">
        <p className="text-sm font-semibold">{rule.label || rule.rule_key}</p>
        <p className="text-xs uppercase text-muted-foreground">{rule.kind}</p>
      </div>
      <label className="text-xs">
        <span className="mb-1 block text-muted-foreground">Threshold</span>
        <input
          type="number"
          value={draft.threshold_amount}
          onChange={(e) => setDraft({ ...draft, threshold_amount: Number(e.target.value) })}
          className="w-32 rounded-md border border-input bg-background px-3 py-1.5 text-sm"
        />
      </label>
      <label className="flex items-center gap-2 text-xs">
        <input
          type="checkbox"
          checked={draft.requires_ceo}
          onChange={(e) => setDraft({ ...draft, requires_ceo: e.target.checked })}
        />
        Requires CEO
      </label>
      <label className="flex items-center gap-2 text-xs">
        <input
          type="checkbox"
          checked={draft.enabled}
          onChange={(e) => setDraft({ ...draft, enabled: e.target.checked })}
        />
        Enabled
      </label>
      <button
        onClick={() => onSave(draft)}
        className="rounded-md bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90"
      >
        Save
      </button>
    </div>
  );
}
