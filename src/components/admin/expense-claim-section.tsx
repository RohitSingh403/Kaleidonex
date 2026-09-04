import { useState, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  getExpenseClaims,
  createExpenseClaim,
  updateClaimStatus,
  deleteExpenseClaim,
} from "@/lib/claims.functions";
import { getMyAccess } from "@/lib/team.functions";
import { CustomSelect } from "@/components/ui/custom-select";

type SubTab = "dashboard" | "mine" | "apply";

const subTabs: { id: SubTab; label: string }[] = [
  { id: "dashboard", label: "Dashboard" },
  { id: "mine", label: "My Claims" },
  { id: "apply", label: "Apply Claim" },
];

const categories = ["Travel", "Food", "Office", "Equipment", "Training", "Other"];

export type Claim = {
  id: string;
  claim_no: string;
  user_id: string;
  expense_date: string;
  category: string;
  purpose: string;
  amount: number;
  status: "pending" | "approved" | "paid" | "rejected";
  proof_urls: string[];
  created_at: string;
};

const inr = (n: number) =>
  `₹${Number(n).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

export function ExpenseClaimSection() {
  const [sub, setSub] = useState<SubTab>("dashboard");

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-1 border-b border-border">
        {subTabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setSub(t.id)}
            className={`-mb-px border-b-2 px-3 py-2 text-sm transition-colors ${
              sub === t.id
                ? "border-primary font-semibold text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {sub === "dashboard" && <ClaimDashboard onNew={() => setSub("apply")} onViewAll={() => setSub("mine")} />}
      {sub === "mine" && <MyClaims onNew={() => setSub("apply")} />}
      {sub === "apply" && <ApplyClaim onDone={() => setSub("mine")} />}
    </div>
  );
}

function Card({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-border bg-card shadow-soft">
      <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-primary">{title}</h2>
        {action}
      </div>
      <div className="px-5 pb-5">{children}</div>
    </section>
  );
}

function Th({ children }: { children: ReactNode }) {
  return <th className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{children}</th>;
}
function Td({ children }: { children: ReactNode }) {
  return <td className="px-3 py-2 align-middle">{children}</td>;
}

function StatusPill({ status }: { status: Claim["status"] }) {
  const tone =
    status === "paid"
      ? "bg-teal-500/15 text-teal-700"
      : status === "approved"
        ? "bg-emerald-500/15 text-emerald-700"
        : status === "rejected"
          ? "bg-destructive/10 text-destructive"
          : "bg-accent/15 text-accent";
  return <span className={`rounded px-2 py-0.5 text-[11px] font-semibold capitalize ${tone}`}>{status}</span>;
}

const dotTones: Record<string, string> = {
  total: "bg-primary",
  pending: "bg-accent",
  approved: "bg-emerald-500",
  paid: "bg-teal-500",
};

function CountCard({ label, value, tone }: { label: string; value: string | number; tone: string }) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 shadow-soft">
      <span className={`h-10 w-10 shrink-0 rounded-full ${dotTones[tone]}`} />
      <div className="min-w-0">
        <p className="truncate text-sm text-muted-foreground">{label}</p>
        <p className="font-display text-2xl font-bold leading-tight">{value}</p>
      </div>
    </div>
  );
}

function AmountCard({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-border bg-card p-4 shadow-soft">
      <div className="min-w-0">
        <p className="truncate text-sm text-muted-foreground">{label}</p>
        <p className="font-display text-2xl font-bold leading-tight text-primary">{value}</p>
      </div>
      <span className={`h-9 w-9 shrink-0 rounded-full ${dotTones[tone]}`} />
    </div>
  );
}

// ─── Dashboard ───────────────────────────────────────────

function ClaimDashboard({ onNew, onViewAll }: { onNew: () => void; onViewAll: () => void }) {
  const fetchClaims = useServerFn(getExpenseClaims);
  const { data, isLoading } = useQuery({ queryKey: ["expense-claims"], queryFn: () => fetchClaims() });
  const claims = (data ?? []) as Claim[];

  const sum = (f: (c: Claim) => boolean) => claims.filter(f).reduce((a, c) => a + Number(c.amount), 0);
  const count = (s: Claim["status"]) => claims.filter((c) => c.status === s).length;

  return (
    <div className="space-y-5">
      <Card
        title="Employee dashboard"
        action={
          <button onClick={onNew} className="rounded-md bg-ink px-4 py-1.5 text-xs font-semibold text-ink-foreground">
            Create New
          </button>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <CountCard label="Total Claims" value={claims.length} tone="total" />
          <CountCard label="Pending" value={count("pending")} tone="pending" />
          <CountCard label="Approved" value={count("approved")} tone="approved" />
          <CountCard label="Paid" value={count("paid")} tone="paid" />
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <AmountCard label="Total Amount" value={inr(sum(() => true))} tone="total" />
          <AmountCard label="Pending Amount" value={inr(sum((c) => c.status === "pending"))} tone="pending" />
          <AmountCard label="Approved Amount" value={inr(sum((c) => c.status === "approved"))} tone="approved" />
          <AmountCard label="Paid Amount" value={inr(sum((c) => c.status === "paid"))} tone="paid" />
        </div>
      </Card>

      <Card
        title="Recent claims"
        action={
          <button onClick={onViewAll} className="text-xs font-medium text-primary hover:underline">
            View All Claims
          </button>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left">
              <tr>
                <Th>Claim #</Th>
                <Th>Purpose</Th>
                <Th>Amount</Th>
                <Th>Status</Th>
                <Th>Date</Th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-3 py-10 text-center text-muted-foreground">
                    Loading…
                  </td>
                </tr>
              ) : claims.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-3 py-10 text-center text-muted-foreground">
                    No claims yet
                  </td>
                </tr>
              ) : (
                claims.slice(0, 5).map((c) => (
                  <tr key={c.id} className="border-t border-border">
                    <Td>{c.claim_no}</Td>
                    <Td>
                      <span className="block max-w-xs truncate">{c.purpose}</span>
                    </Td>
                    <Td>
                      <span className="font-medium text-primary">{inr(c.amount)}</span>
                    </Td>
                    <Td>
                      <StatusPill status={c.status} />
                    </Td>
                    <Td>
                      <span className="text-xs text-muted-foreground">
                        {new Date(c.expense_date).toLocaleDateString("en-GB")}
                      </span>
                    </Td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

// ─── My claims ───────────────────────────────────────────

function MyClaims({ onNew }: { onNew: () => void }) {
  const fetchClaims = useServerFn(getExpenseClaims);
  const fetchAccess = useServerFn(getMyAccess);
  const statusFn = useServerFn(updateClaimStatus);
  const removeFn = useServerFn(deleteExpenseClaim);
  const queryClient = useQueryClient();

  const [status, setStatus] = useState("");
  const [open, setOpen] = useState<Claim | null>(null);

  const { data, isLoading } = useQuery({ queryKey: ["expense-claims"], queryFn: () => fetchClaims() });
  const { data: access } = useQuery({ queryKey: ["my-access"], queryFn: () => fetchAccess() });
  const rows = ((data ?? []) as Claim[]).filter((c) => !status || c.status === status);

  const isApprover = Boolean(access?.isHr || access?.isSuper);
  /** Employees never decide claims; approvers never decide their own. */
  const canDecide = (c: Claim) =>
    isApprover && (access?.isSuper ? true : c.user_id !== access?.userId);

  async function change(id: string, next: Claim["status"]) {
    try {
      await statusFn({ data: { id, status: next } });
      queryClient.invalidateQueries({ queryKey: ["expense-claims"] });
    } catch (err) {
      alert(err instanceof Error ? err.message : "Could not update this claim.");
    }
  }
  async function remove(id: string) {
    if (!confirm("Delete this claim?")) return;
    try {
      await removeFn({ data: { id } });
      queryClient.invalidateQueries({ queryKey: ["expense-claims"] });
    } catch (err) {
      alert(err instanceof Error ? err.message : "Could not delete this claim.");
    }
  }


  return (
    <Card
      title="My expense claims"
      action={
        <div className="flex items-center gap-2">
          <CustomSelect
            value={status}
            onValueChange={setStatus}
            options={[
              { value: "", label: "All Status" },
              { value: "pending", label: "Pending" },
              { value: "approved", label: "Approved" },
              { value: "paid", label: "Paid" },
              { value: "rejected", label: "Rejected" },
            ]}
          />
          <button onClick={onNew} className="rounded-md bg-ink px-4 py-2 text-xs font-semibold text-ink-foreground hover:opacity-90 cursor-pointer">
            New Claim
          </button>
        </div>
      }
    >
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-secondary/50 text-left">
            <tr>
              <Th># Claim</Th>
              <Th>Date</Th>
              <Th>Purpose</Th>
              <Th>Category</Th>
              <Th>Amount</Th>
              <Th>Status</Th>
              <Th>Actions</Th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={7} className="px-3 py-10 text-center text-muted-foreground">
                  Loading…
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-3 py-10 text-center text-muted-foreground">
                  No claims found
                </td>
              </tr>
            ) : (
              rows.map((c) => (
                <tr key={c.id} className="border-t border-border">
                  <Td>{c.claim_no}</Td>
                  <Td>
                    <span className="text-xs text-muted-foreground">
                      {new Date(c.expense_date).toLocaleDateString("en-GB")}
                    </span>
                  </Td>
                  <Td>
                    <span className="block max-w-xs truncate">{c.purpose}</span>
                  </Td>
                  <Td>
                    <span className="rounded bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                      {c.category}
                    </span>
                  </Td>
                  <Td>
                    <span className="font-medium text-primary">{inr(c.amount)}</span>
                  </Td>
                  <Td>
                    <StatusPill status={c.status} />
                  </Td>
                  <Td>
                    <div className="flex flex-wrap gap-2 text-xs">
                      <button onClick={() => setOpen(c)} className="rounded border border-primary px-2 py-0.5 text-primary">
                        View
                      </button>
                      {canDecide(c) && c.status === "pending" && (
                        <button onClick={() => change(c.id, "approved")} className="text-emerald-600 hover:underline">
                          Approve
                        </button>
                      )}
                      {canDecide(c) && c.status === "approved" && (
                        <button onClick={() => change(c.id, "paid")} className="text-teal-600 hover:underline">
                          Mark paid
                        </button>
                      )}
                      {canDecide(c) && c.status !== "rejected" && c.status !== "paid" && (
                        <button onClick={() => change(c.id, "rejected")} className="text-muted-foreground hover:underline">
                          Reject
                        </button>
                      )}
                      {!canDecide(c) && c.status === "pending" && (
                        <span className="text-muted-foreground">Awaiting HR approval</span>
                      )}
                      {(canDecide(c) || c.status === "pending") && (
                        <button onClick={() => remove(c.id)} className="text-destructive hover:underline">
                          {canDecide(c) ? "Delete" : "Withdraw"}
                        </button>
                      )}
                    </div>
                  </Td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {open ? (
        <div className="mt-4 rounded-lg border border-border p-4 text-sm">
          <div className="flex items-center justify-between">
            <p className="font-semibold">{open.claim_no}</p>
            <button onClick={() => setOpen(null)} className="text-xs text-muted-foreground hover:underline">
              Close
            </button>
          </div>
          <dl className="mt-3 grid gap-2 sm:grid-cols-2">
            <div>
              <dt className="text-xs text-muted-foreground">Expense date</dt>
              <dd>{new Date(open.expense_date).toLocaleDateString("en-GB")}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Category</dt>
              <dd>{open.category}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Amount</dt>
              <dd>{inr(open.amount)}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Status</dt>
              <dd>
                <StatusPill status={open.status} />
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-xs text-muted-foreground">Purpose</dt>
              <dd>{open.purpose}</dd>
            </div>
            {open.proof_urls.length > 0 ? (
              <div className="sm:col-span-2">
                <dt className="text-xs text-muted-foreground">Proofs</dt>
                <dd className="flex flex-wrap gap-2">
                  {open.proof_urls.map((u) => (
                    <a key={u} href={u} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                      {u}
                    </a>
                  ))}
                </dd>
              </div>
            ) : null}
          </dl>
        </div>
      ) : null}
    </Card>
  );
}

// ─── Apply claim ─────────────────────────────────────────

function ApplyClaim({ onDone }: { onDone: () => void }) {
  const createFn = useServerFn(createExpenseClaim);
  const queryClient = useQueryClient();

  const [form, setForm] = useState({
    expense_date: "",
    category: "Travel",
    purpose: "",
    amount: "",
    proofs: "",
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const inputClass =
    "w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary";

  async function submit() {
    setError("");
    if (!form.expense_date || !form.purpose.trim() || !form.amount) {
      setError("Expense date, purpose and amount are required.");
      return;
    }
    setSaving(true);
    try {
      await createFn({
        data: {
          expense_date: form.expense_date,
          category: form.category,
          purpose: form.purpose.trim(),
          amount: Number(form.amount),
          proof_urls: form.proofs
            .split(/[\n,]/)
            .map((p) => p.trim())
            .filter(Boolean),
        },
      });
      queryClient.invalidateQueries({ queryKey: ["expense-claims"] });
      onDone();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not create claim");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card title="Create new expense claim">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <label className="block text-sm">
          <span className="mb-1 block font-medium">
            Expense Date <span className="text-destructive">*</span>
          </span>
          <input
            type="date"
            className={inputClass}
            value={form.expense_date}
            onChange={(e) => setForm({ ...form, expense_date: e.target.value })}
          />
        </label>
        <div className="block text-sm">
          <span className="mb-1 block font-medium">
            Category <span className="text-destructive">*</span>
          </span>
          <CustomSelect
            value={form.category}
            onValueChange={(val) => setForm({ ...form, category: val })}
            options={categories.map((c) => ({ value: c, label: c }))}
            triggerClassName="w-full"
          />
        </div>
        <label className="block text-sm">
          <span className="mb-1 block font-medium">
            Purpose <span className="text-destructive">*</span>
          </span>
          <input
            className={inputClass}
            placeholder="Enter expense purpose"
            value={form.purpose}
            onChange={(e) => setForm({ ...form, purpose: e.target.value })}
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium">
            Amount (₹) <span className="text-destructive">*</span>
          </span>
          <input
            type="number"
            min="0"
            className={inputClass}
            placeholder="Enter amount"
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
          />
        </label>
        <label className="block text-sm lg:col-span-4">
          <span className="mb-1 block font-medium">Upload Proofs</span>
          <textarea
            rows={3}
            className={inputClass}
            placeholder="Paste links to bills or receipts, one per line"
            value={form.proofs}
            onChange={(e) => setForm({ ...form, proofs: e.target.value })}
          />
          <span className="mt-1 block text-[11px] text-muted-foreground">
            Add bill, receipt or other proof links (one per line).
          </span>
        </label>
      </div>

      {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}

      <div className="mt-4 flex justify-end">
        <button
          onClick={submit}
          disabled={saving}
          className="rounded-md bg-ink px-5 py-2 text-sm font-semibold text-ink-foreground disabled:opacity-60"
        >
          {saving ? "Creating…" : "Create Claim"}
        </button>
      </div>
    </Card>
  );
}
