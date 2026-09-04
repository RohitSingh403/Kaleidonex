import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { XCircle } from "lucide-react";
import { getEmployeeRequests, createEmployeeRequest } from "@/lib/employee.functions";
import type { RequestRow } from "./types";
import { Card, Pill, Th, Td } from "./ui";
import { CustomSelect } from "@/components/ui/custom-select";

export function RequestsTab() {
  const queryClient = useQueryClient();
  const fetchRequests = useServerFn(getEmployeeRequests);
  const create = useServerFn(createEmployeeRequest);
  const { data } = useQuery({ queryKey: ["emp-requests"], queryFn: () => fetchRequests() });
  const rows = (data ?? []) as unknown as RequestRow[];

  const [type, setType] = useState("all");
  const [status, setStatus] = useState("all");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ request_type: "Salary Query", details: "", note: "" });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const shown = rows.filter(
    (r) => (type === "all" || r.request_type === type) && (status === "all" || r.status === status),
  );

  async function submit() {
    if (!form.details.trim()) {
      setError("Please describe your request");
      return;
    }
    setError("");
    setSaving(true);
    try {
      await create({ data: form });
      setForm({ request_type: "Salary Query", details: "", note: "" });
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: ["emp-requests"] });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to submit request");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      <Card
        title="My requests"
        action={
          <div className="flex gap-2">
            <button
              onClick={() => setOpen((v) => !v)}
              className="rounded-md bg-ink px-3 py-1.5 text-xs font-semibold text-ink-foreground hover:opacity-90 cursor-pointer"
            >
              {open ? "Close" : "+ New Request"}
            </button>
            <button
              onClick={() => queryClient.invalidateQueries({ queryKey: ["emp-requests"] })}
              className="rounded-md border border-input px-3 py-1.5 text-xs hover:bg-secondary cursor-pointer"
            >
              Refresh
            </button>
          </div>
        }
      >
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Request Type</label>
            <CustomSelect
              value={type}
              onValueChange={setType}
              triggerClassName="mt-1"
              options={[
                { value: "all", label: "All Types" },
                ...["Salary Query", "Attendance", "Document", "Other"].map((t) => ({ value: t, label: t })),
              ]}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Status</label>
            <CustomSelect
              value={status}
              onValueChange={setStatus}
              triggerClassName="mt-1"
              options={[
                { value: "all", label: "All Status" },
                { value: "pending", label: "Pending" },
                { value: "approved", label: "Approved" },
                { value: "rejected", label: "Rejected" },
              ]}
            />
          </div>
          <button
            onClick={() => {
              setType("all");
              setStatus("all");
            }}
            className="rounded-md border border-input px-4 py-2 text-sm hover:bg-secondary cursor-pointer"
          >
            Reset
          </button>
        </div>
      </Card>

      {open && (
        <Card title="New request">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Type</label>
              <CustomSelect
                value={form.request_type}
                onValueChange={(val) => setForm({ ...form, request_type: val })}
                triggerClassName="mt-1 w-full"
                options={["Salary Query", "Attendance", "Document", "Other"].map((t) => ({ value: t, label: t }))}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Details</label>
              <input
                value={form.details}
                placeholder="Details of request"
                onChange={(e) => setForm({ ...form, details: e.target.value })}
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Note (Optional)</label>
              <input
                value={form.note}
                placeholder="Additional note"
                onChange={(e) => setForm({ ...form, note: e.target.value })}
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
          </div>
          {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
          <div className="mt-4 flex justify-end">
            <button
              onClick={submit}
              disabled={saving}
              className="rounded-md bg-ink px-4 py-2 text-sm font-semibold text-ink-foreground disabled:opacity-60 cursor-pointer hover:opacity-90"
            >
              {saving ? "Submitting…" : "Submit Request"}
            </button>
          </div>
        </Card>
      )}

      <Card title="Requests list">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border text-left">
              <tr>
                <Th>Type</Th>
                <Th>Details</Th>
                <Th>Status</Th>
                <Th>Date</Th>
              </tr>
            </thead>
            <tbody>
              {shown.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-3 py-8 text-center text-sm text-muted-foreground">
                    No requests found.
                  </td>
                </tr>
              )}
              {shown.map((r) => (
                <tr key={r.id} className="border-b border-border/60">
                  <Td>
                    <span className="rounded bg-secondary px-2 py-0.5 text-[11px] font-semibold text-primary">
                      {r.request_type}
                    </span>
                  </Td>
                  <Td>
                    <p className="font-medium">{r.details || r.subject || r.description}</p>
                    {r.note && <p className="line-clamp-1 max-w-[18rem] text-xs text-muted-foreground">{r.note}</p>}
                  </Td>
                  <Td>
                    <Pill status={r.status} />
                  </Td>
                  <Td>
                    {r.created_at
                      ? new Date(r.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
                      : "—"}
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className="text-muted-foreground">Showing {shown.length} request(s)</span>
          <div className="flex gap-2">
            <span className="rounded bg-accent/15 px-2 py-0.5 font-semibold text-accent">
              Pending: {rows.filter((r) => r.status === "pending").length}
            </span>
            <span className="rounded bg-emerald-500/15 px-2 py-0.5 font-semibold text-emerald-700">
              Approved: {rows.filter((r) => r.status === "approved").length}
            </span>
            <span className="flex items-center gap-1 rounded bg-destructive/10 px-2 py-0.5 font-semibold text-destructive">
              <XCircle className="h-3 w-3" /> Rejected: {rows.filter((r) => r.status === "rejected").length}
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
}
