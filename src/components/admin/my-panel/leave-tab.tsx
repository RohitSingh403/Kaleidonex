import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CalendarDays } from "lucide-react";
import { getLeaves, applyLeave } from "@/lib/employee.functions";
import { type LeaveRow, months } from "./types";
import { Card, StatCard, Pill, Th, Td, downloadCsv } from "./ui";
import { CustomSelect } from "@/components/ui/custom-select";

export function LeaveTab() {
  const queryClient = useQueryClient();
  const fetchLeaves = useServerFn(getLeaves);
  const submitLeave = useServerFn(applyLeave);
  const { data } = useQuery({ queryKey: ["emp-leaves"], queryFn: () => fetchLeaves() });
  const leaves = (data ?? []) as LeaveRow[];

  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<"all" | LeaveRow["status"]>("all");
  const [month, setMonth] = useState<"all" | number>("all");
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [form, setForm] = useState({ leave_type: "Casual", start_date: "", end_date: "", reason: "" });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const shown = leaves.filter((l) => {
    const d = new Date(l.start_date);
    if (filter !== "all" && l.status !== filter) return false;
    if (month !== "all" && d.getMonth() + 1 !== month) return false;
    return d.getFullYear() === year;
  });
  const totalDays = leaves.filter((l) => l.status === "approved").reduce((a, l) => a + l.days, 0);

  async function submit() {
    if (!form.start_date || !form.end_date || !form.reason.trim()) {
      setError("Please fill start date, end date and reason.");
      return;
    }
    const days = Math.max(
      1,
      Math.round((new Date(form.end_date).getTime() - new Date(form.start_date).getTime()) / 86400000) + 1,
    );
    setError("");
    setSaving(true);
    try {
      await submitLeave({ data: { ...form, reason: form.reason.trim(), days } });
      await queryClient.invalidateQueries({ queryKey: ["emp-leaves"] });
      setForm({ leave_type: "Casual", start_date: "", end_date: "", reason: "" });
      setOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not apply for leave.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      <Card
        title="My leaves"
        action={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setOpen((v) => !v)}
              className="rounded-md bg-ink px-4 py-1.5 text-xs font-semibold text-ink-foreground"
            >
              {open ? "Close" : "Apply for Leave"}
            </button>
            <button
              onClick={() =>
                downloadCsv(
                  "leave-report.csv",
                  ["Type", "From", "To", "Days", "Reason", "Status"],
                  shown.map((l) => [l.leave_type, l.start_date, l.end_date, l.days, l.reason, l.status]),
                )
              }
              className="rounded-md border border-primary px-4 py-1.5 text-xs font-semibold text-primary"
            >
              Download Report
            </button>
          </div>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Total Days" value={totalDays} tone="bg-sky-500" />
          <StatCard label="Pending" value={leaves.filter((l) => l.status === "pending").length} tone="bg-amber-400" />
          <StatCard label="Approved" value={leaves.filter((l) => l.status === "approved").length} tone="bg-emerald-500" />
          <StatCard label="Rejected" value={leaves.filter((l) => l.status === "rejected").length} tone="bg-destructive" />
        </div>
      </Card>

      {open && (
        <Card title="Apply for leave">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Leave Type</label>
              <CustomSelect
                value={form.leave_type}
                onValueChange={(val) => setForm({ ...form, leave_type: val })}
                triggerClassName="mt-1 w-full"
                options={["Casual", "Sick", "Earned", "Unpaid"].map((t) => ({ value: t, label: t }))}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Start Date</label>
              <input
                type="date"
                value={form.start_date}
                onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">End Date</label>
              <input
                type="date"
                value={form.end_date}
                onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Reason</label>
              <input
                value={form.reason}
                placeholder="Reason for leave"
                onChange={(e) => setForm({ ...form, reason: e.target.value })}
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
              {saving ? "Submitting…" : "Submit Leave"}
            </button>
          </div>
        </Card>
      )}

      <Card title="Filters">
        <div className="flex flex-wrap items-center gap-3">
          <CustomSelect
            value={month}
            onValueChange={(val) => setMonth(val === "all" ? "all" : Number(val))}
            options={[
              { value: "all", label: "All Months" },
              ...months.map((m, i) => ({ value: i + 1, label: m })),
            ]}
          />
          <CustomSelect
            value={year}
            onValueChange={(val) => setYear(Number(val))}
            options={[year - 1, year, year + 1].map((y) => ({ value: y, label: String(y) }))}
          />
          <CustomSelect
            value={filter}
            onValueChange={(val) => setFilter(val as typeof filter)}
            options={[
              { value: "all", label: "All Status" },
              { value: "pending", label: "Pending" },
              { value: "approved", label: "Approved" },
              { value: "rejected", label: "Rejected" },
            ]}
          />
          <button
            onClick={() => {
              setMonth("all");
              setYear(new Date().getFullYear());
              setFilter("all");
            }}
            className="rounded-md border border-input px-3 py-2 text-sm"
          >
            Clear Filters
          </button>
        </div>
      </Card>

      <Card
        title="Leave applications"
        action={
          <span className="text-[11px] font-semibold text-primary">
            Showing {shown.length} of {leaves.length} Applications
          </span>
        }
      >
        {shown.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-10">
            <CalendarDays className="h-6 w-6 text-muted-foreground" />
            <p className="text-sm font-medium">No leaves found</p>
            <p className="text-xs text-muted-foreground">Try changing your filters or apply for a new leave.</p>
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
                  <Th>Reason</Th>
                  <Th>Status</Th>
                </tr>
              </thead>
              <tbody>
                {shown.map((l) => (
                  <tr key={l.id} className="border-b border-border/60">
                    <Td>{l.leave_type}</Td>
                    <Td>{l.start_date}</Td>
                    <Td>{l.end_date}</Td>
                    <Td>{l.days}</Td>
                    <Td>
                      <span className="line-clamp-1 max-w-[16rem] text-muted-foreground">{l.reason}</span>
                    </Td>
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
    </div>
  );
}
