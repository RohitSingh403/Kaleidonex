import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getEmployee360, savePerformanceReview } from "@/lib/workforce.functions";
import { ATTENDANCE_LABEL, TASK_STATUS_LABEL, pct } from "@/lib/workforce.constants";
import {
  Drawer,
  DataTable,
  StatusPill,
  PercentBar,
  Field,
  inputClass,
  btnPrimary,
  Panel,
} from "@/components/admin/workforce-ui";

type Tab =
  | "overview"
  | "personal"
  | "employment"
  | "attendance"
  | "leave"
  | "tasks"
  | "performance"
  | "documents"
  | "activity";

const TABS: { id: Tab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "personal", label: "Personal" },
  { id: "employment", label: "Employment" },
  { id: "attendance", label: "Attendance" },
  { id: "leave", label: "Leave" },
  { id: "tasks", label: "Tasks" },
  { id: "performance", label: "Performance" },
  { id: "documents", label: "Documents" },
  { id: "activity", label: "Activity" },
];

function Row({ label, value }: { label: string; value: string | number | null | undefined }) {
  return (
    <div className="flex justify-between gap-4 border-b border-border py-1.5 text-sm last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value || "—"}</span>
    </div>
  );
}

export function Employee360({
  userId,
  name,
  canReview,
  onClose,
}: {
  userId: string;
  name: string;
  canReview: boolean;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<Tab>("overview");
  const [msg, setMsg] = useState("");
  const qc = useQueryClient();
  const fetch360 = useServerFn(getEmployee360);
  const saveReview = useServerFn(savePerformanceReview);

  const q = useQuery({
    queryKey: ["employee-360", userId],
    queryFn: () => fetch360({ data: { user_id: userId } }),
  });

  const d = q.data;
  const attendance = d?.attendance ?? [];
  const tasks = d?.tasks ?? [];
  const done = tasks.filter((t) => t.status === "completed");
  const present = attendance.filter((a) => a.status === "present" || a.status === "half_day").length;

  async function submitReview(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    try {
      await saveReview({
        data: {
          user_id: userId,
          period_label: String(f.get("period") ?? ""),
          goals_total: Number(f.get("goals_total") ?? 0),
          goals_met: Number(f.get("goals_met") ?? 0),
          manager_rating: Number(f.get("rating") ?? 0),
          feedback: String(f.get("feedback") ?? ""),
        },
      });
      setMsg("Review saved.");
      e.currentTarget.reset();
      await qc.invalidateQueries({ queryKey: ["employee-360", userId] });
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Could not save review");
    }
  }

  return (
    <Drawer open onClose={onClose} title={name || "Employee"} subtitle={d?.profile?.designation ?? ""}>
      <div className="flex flex-wrap gap-1 rounded-lg border border-border bg-card p-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              tab === t.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {q.isLoading ? <p className="text-sm text-muted-foreground">Loading employee record…</p> : null}

      {tab === "overview" && d ? (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-border bg-card p-3">
              <p className="text-xs text-muted-foreground">Attendance</p>
              <p className="text-xl font-bold">{pct(present, attendance.length)}%</p>
            </div>
            <div className="rounded-lg border border-border bg-card p-3">
              <p className="text-xs text-muted-foreground">Task completion</p>
              <p className="text-xl font-bold">{pct(done.length, tasks.length)}%</p>
            </div>
            <div className="rounded-lg border border-border bg-card p-3">
              <p className="text-xs text-muted-foreground">Manager rating</p>
              <p className="text-xl font-bold">
                {d.reviews[0] ? `${Number(d.reviews[0].manager_rating).toFixed(1)} / 5` : "—"}
              </p>
            </div>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <Row label="Employee code" value={d.profile?.employee_code} />
            <Row label="Department" value={d.profile?.department} />
            <Row label="Designation" value={d.profile?.designation} />
            <Row label="Reporting to" value={d.profile?.manager_name} />
            <Row label="Joining date" value={d.profile?.joining_date} />
            <Row label="Status" value={d.profile?.status} />
          </div>
        </div>
      ) : null}

      {tab === "personal" && d ? (
        <div className="rounded-lg border border-border bg-card p-4">
          {d.sensitiveMasked ? (
            <p className="mb-3 rounded-md bg-secondary px-3 py-2 text-xs text-muted-foreground">
              Bank, PAN and Aadhaar details are hidden at your permission level.
            </p>
          ) : null}
          <Row label="Contact" value={d.personal?.contact_number} />
          <Row label="Personal email" value={d.personal?.personal_email} />
          <Row label="Date of birth" value={d.personal?.date_of_birth} />
          <Row label="Blood group" value={d.personal?.blood_group} />
          <Row label="Emergency contact" value={`${d.personal?.emergency_name ?? ""} ${d.personal?.emergency_number ?? ""}`} />
          <Row label="Current city" value={d.personal?.cur_city} />
          <Row label="Bank account" value={d.personal?.bank_account_number} />
          <Row label="PAN" value={d.personal?.pan_no} />
        </div>
      ) : null}

      {tab === "employment" && d ? (
        <div className="rounded-lg border border-border bg-card p-4">
          <Row label="Employment type" value={d.profile?.employment_type} />
          <Row label="Work mode" value={d.profile?.work_mode} />
          <Row label="Work location" value={d.profile?.work_location} />
          <Row label="Organisation" value={d.profile?.working_organisation} />
          <Row label="Verified" value={d.profile?.is_verified ? "Yes" : "No"} />
        </div>
      ) : null}

      {tab === "attendance" ? (
        <DataTable
          headers={["Date", "Status", "In", "Out", "Update"]}
          isEmpty={attendance.length === 0}
          empty="No attendance recorded."
        >
          {attendance.slice(0, 40).map((a) => (
            <tr key={a.id}>
              <td className="py-2 pr-4">{a.work_date}</td>
              <td className="py-2 pr-4">
                <StatusPill value={ATTENDANCE_LABEL[a.status] ?? a.status} />
              </td>
              <td className="py-2 pr-4">{a.check_in ?? "—"}</td>
              <td className="py-2 pr-4">{a.check_out ?? "—"}</td>
              <td className="py-2 pr-4 text-muted-foreground">{a.daily_update}</td>
            </tr>
          ))}
        </DataTable>
      ) : null}

      {tab === "leave" ? (
        <DataTable headers={["Type", "From", "To", "Days", "Status"]} isEmpty={(d?.leaves ?? []).length === 0}>
          {(d?.leaves ?? []).map((l) => (
            <tr key={l.id}>
              <td className="py-2 pr-4">{l.leave_type}</td>
              <td className="py-2 pr-4">{l.start_date}</td>
              <td className="py-2 pr-4">{l.end_date}</td>
              <td className="py-2 pr-4">{l.days}</td>
              <td className="py-2 pr-4">
                <StatusPill value={l.status} />
              </td>
            </tr>
          ))}
        </DataTable>
      ) : null}

      {tab === "tasks" ? (
        <DataTable headers={["Task", "Priority", "Due", "Progress", "Status"]} isEmpty={tasks.length === 0}>
          {tasks.map((t) => (
            <tr key={t.id}>
              <td className="py-2 pr-4 font-medium">{t.title}</td>
              <td className="py-2 pr-4">{t.priority}</td>
              <td className="py-2 pr-4">{t.due_date ?? "—"}</td>
              <td className="py-2 pr-4">{t.progress}%</td>
              <td className="py-2 pr-4">
                <StatusPill value={TASK_STATUS_LABEL[t.status] ?? t.status} />
              </td>
            </tr>
          ))}
        </DataTable>
      ) : null}

      {tab === "performance" && d ? (
        <div className="space-y-4">
          <div className="space-y-3 rounded-lg border border-border bg-card p-4">
            <PercentBar label="Task completion" pctValue={pct(done.length, tasks.length)} />
            <PercentBar
              label="On-time delivery"
              pctValue={pct(done.filter((t) => !t.due_date || t.updated_at.slice(0, 10) <= t.due_date).length, done.length)}
            />
            <PercentBar label="Attendance" pctValue={pct(present, attendance.length)} tone="bg-emerald-500" />
          </div>

          <DataTable headers={["Period", "Goals", "Rating", "Feedback"]} isEmpty={d.reviews.length === 0} empty="No reviews yet.">
            {d.reviews.map((r) => (
              <tr key={r.id}>
                <td className="py-2 pr-4">{r.period_label}</td>
                <td className="py-2 pr-4">
                  {r.goals_met} / {r.goals_total}
                </td>
                <td className="py-2 pr-4">{Number(r.manager_rating).toFixed(1)}</td>
                <td className="py-2 pr-4 text-muted-foreground">{r.feedback}</td>
              </tr>
            ))}
          </DataTable>

          {canReview ? (
            <Panel title="Add review">
              <form onSubmit={submitReview} className="grid gap-3 sm:grid-cols-2">
                <Field label="Period">
                  <input name="period" required className={inputClass} placeholder="Q3 2026" />
                </Field>
                <Field label="Manager rating (0-5)">
                  <input name="rating" type="number" step="0.1" min="0" max="5" className={inputClass} defaultValue="4" />
                </Field>
                <Field label="Goals set">
                  <input name="goals_total" type="number" min="0" className={inputClass} defaultValue="5" />
                </Field>
                <Field label="Goals met">
                  <input name="goals_met" type="number" min="0" className={inputClass} defaultValue="4" />
                </Field>
                <div className="sm:col-span-2">
                  <Field label="Feedback">
                    <textarea name="feedback" rows={3} className={inputClass} />
                  </Field>
                </div>
                <div className="sm:col-span-2 flex items-center gap-3">
                  <button className={btnPrimary}>Save review</button>
                  {msg ? <span className="text-xs text-muted-foreground">{msg}</span> : null}
                </div>
              </form>
            </Panel>
          ) : null}
        </div>
      ) : null}

      {tab === "documents" ? (
        <DataTable headers={["Document", "File", "Status", "Uploaded"]} isEmpty={(d?.documents ?? []).length === 0}>
          {(d?.documents ?? []).map((doc) => (
            <tr key={doc.id}>
              <td className="py-2 pr-4">{doc.doc_type}</td>
              <td className="py-2 pr-4 text-muted-foreground">{doc.file_name}</td>
              <td className="py-2 pr-4">
                <StatusPill value={doc.status} />
              </td>
              <td className="py-2 pr-4">{doc.created_at.slice(0, 10)}</td>
            </tr>
          ))}
        </DataTable>
      ) : null}

      {tab === "activity" && d ? (
        <ul className="space-y-2 text-sm">
          {[
            ...d.leaves.map((l) => ({ when: l.created_at, what: `Leave ${l.status}: ${l.leave_type}` })),
            ...d.corrections.map((c) => ({ when: c.created_at, what: `Attendance correction ${c.status} for ${c.work_date}` })),
            ...d.reviews.map((r) => ({ when: r.created_at, what: `Performance review ${r.period_label}` })),
            ...tasks.slice(0, 10).map((t) => ({ when: t.created_at, what: `Task: ${t.title}` })),
          ]
            .sort((a, b) => (a.when < b.when ? 1 : -1))
            .slice(0, 25)
            .map((item, i) => (
              <li key={i} className="flex justify-between gap-4 border-b border-border pb-1.5">
                <span>{item.what}</span>
                <span className="shrink-0 text-xs text-muted-foreground">{item.when.slice(0, 10)}</span>
              </li>
            ))}
        </ul>
      ) : null}
    </Drawer>
  );
}
