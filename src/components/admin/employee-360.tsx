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
import {
  CalendarCheck,
  ListTodo,
  Star,
  IndianRupee,
  Briefcase,
  Building2,
  User,
  Mail,
  Phone,
  ShieldCheck,
  MapPin,
  Calendar,
  CreditCard,
  FileText,
  Activity as ActivityIcon,
  CheckCircle2,
} from "lucide-react";

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

const TABS: { id: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "overview", label: "Overview", icon: User },
  { id: "personal", label: "Personal", icon: FileText },
  { id: "employment", label: "Employment", icon: Briefcase },
  { id: "attendance", label: "Attendance", icon: CalendarCheck },
  { id: "leave", label: "Leave", icon: Calendar },
  { id: "tasks", label: "Tasks", icon: ListTodo },
  { id: "performance", label: "Performance", icon: Star },
  { id: "documents", label: "Documents", icon: FileText },
  { id: "activity", label: "Activity", icon: ActivityIcon },
];

function InfoCard({ label, value, icon: Icon, tone }: { label: string; value: React.ReactNode; icon?: React.ComponentType<{ className?: string }>; tone?: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card/60 p-3.5 transition-colors hover:bg-card">
      <div className="flex items-center gap-2.5 min-w-0">
        {Icon ? (
          <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${tone ?? "bg-primary/10 text-primary"}`}>
            <Icon className="h-4 w-4" />
          </span>
        ) : null}
        <span className="truncate text-xs font-medium text-muted-foreground">{label}</span>
      </div>
      <span className="shrink-0 text-right text-xs font-semibold text-foreground">{value || "—"}</span>
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
    <Drawer open onClose={onClose} title={name || "Employee Profile"} subtitle={d?.profile?.designation ?? "Employee 360 View"}>
      {/* Horizontally scrolling tab navigation */}
      <div className="no-scrollbar flex items-center gap-1.5 overflow-x-auto rounded-xl border border-border bg-muted/40 p-1.5 shadow-xs">
        {TABS.map((t) => {
          const Icon = t.icon;
          const isActive = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                isActive
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:bg-card hover:text-foreground"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {q.isLoading ? (
        <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
          Loading comprehensive employee 360 record…
        </div>
      ) : null}

      {tab === "overview" && d ? (
        <div className="space-y-4">
          {/* Top Metric Cards */}
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-3">
            <div className="rounded-xl border border-border bg-card p-4 shadow-soft">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">Attendance</span>
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-500/15 text-emerald-600">
                  <CalendarCheck className="h-4 w-4" />
                </span>
              </div>
              <p className="mt-2 text-2xl font-bold font-display">{pct(present, attendance.length)}%</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{present} active days recorded</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4 shadow-soft">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">Task Completion</span>
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-sky-500/15 text-sky-600">
                  <ListTodo className="h-4 w-4" />
                </span>
              </div>
              <p className="mt-2 text-2xl font-bold font-display">{pct(done.length, tasks.length)}%</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{done.length} of {tasks.length} tasks completed</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4 shadow-soft">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">Manager Rating</span>
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-amber-500/15 text-amber-600">
                  <Star className="h-4 w-4" />
                </span>
              </div>
              <p className="mt-2 text-2xl font-bold font-display">
                {d.reviews[0] ? `${Number(d.reviews[0].manager_rating).toFixed(1)} / 5` : "—"}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">{d.reviews.length} performance reviews</p>
            </div>
          </div>

          {/* Detailed Info Grid */}
          <div className="rounded-xl border border-border bg-card p-4 shadow-soft">
            <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Core Employment Profile
            </h4>
            <div className="grid gap-3 sm:grid-cols-2">
              <InfoCard label="Employee Code" value={d.profile?.employee_code} icon={Building2} />
              <InfoCard label="Department" value={d.profile?.department} icon={Briefcase} />
              <InfoCard label="Designation" value={d.profile?.designation} icon={User} />
              <InfoCard
                label="Monthly Base Salary"
                value={
                  <span className="rounded-md bg-emerald-500/10 px-2 py-0.5 font-bold text-emerald-600 dark:text-emerald-400">
                    {d.profile?.salary ? `₹${Number(d.profile.salary).toLocaleString("en-IN")}` : "₹0"}
                  </span>
                }
                icon={IndianRupee}
                tone="bg-emerald-500/15 text-emerald-600"
              />
              <InfoCard label="Reporting To" value={d.profile?.manager_name} icon={User} />
              <InfoCard label="Joining Date" value={d.profile?.joining_date} icon={Calendar} />
              <InfoCard
                label="Status"
                value={<StatusPill value={d.profile?.status ?? "active"} />}
                icon={CheckCircle2}
              />
              <InfoCard label="Work Location" value={d.profile?.work_location} icon={MapPin} />
            </div>
          </div>
        </div>
      ) : null}

      {tab === "personal" && d ? (
        <div className="rounded-xl border border-border bg-card p-4 shadow-soft space-y-4">
          {d.sensitiveMasked ? (
            <p className="rounded-md bg-secondary/80 px-3 py-2 text-xs text-muted-foreground">
              Bank, PAN and Aadhaar details are hidden at your permission level.
            </p>
          ) : null}
          <div className="grid gap-3 sm:grid-cols-2">
            <InfoCard label="Contact Number" value={d.personal?.contact_number} icon={Phone} />
            <InfoCard label="Personal Email" value={d.personal?.personal_email} icon={Mail} />
            <InfoCard label="Date of Birth" value={d.personal?.date_of_birth} icon={Calendar} />
            <InfoCard label="Blood Group" value={d.personal?.blood_group} icon={ActivityIcon} />
            <InfoCard
              label="Emergency Contact"
              value={`${d.personal?.emergency_name ?? ""} ${d.personal?.emergency_number ? `(${d.personal.emergency_number})` : ""}`}
              icon={Phone}
            />
            <InfoCard label="Current City" value={d.personal?.cur_city} icon={MapPin} />
            <InfoCard label="Bank Account" value={d.personal?.bank_account_number} icon={CreditCard} />
            <InfoCard label="PAN No." value={d.personal?.pan_no} icon={ShieldCheck} />
          </div>
        </div>
      ) : null}

      {tab === "employment" && d ? (
        <div className="rounded-xl border border-border bg-card p-4 shadow-soft space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <InfoCard label="Employment Type" value={d.profile?.employment_type} icon={Briefcase} />
            <InfoCard
              label="Monthly Base Salary"
              value={
                <span className="rounded-md bg-emerald-500/10 px-2 py-0.5 font-bold text-emerald-600 dark:text-emerald-400">
                  {d.profile?.salary ? `₹${Number(d.profile.salary).toLocaleString("en-IN")}` : "₹0"}
                </span>
              }
              icon={IndianRupee}
              tone="bg-emerald-500/15 text-emerald-600"
            />
            <InfoCard label="Work Mode" value={d.profile?.work_mode} icon={Briefcase} />
            <InfoCard label="Work Location" value={d.profile?.work_location} icon={MapPin} />
            <InfoCard label="Working Organisation" value={d.profile?.working_organisation} icon={Building2} />
            <InfoCard label="Profile Verified" value={d.profile?.is_verified ? "Yes" : "No"} icon={ShieldCheck} />
          </div>
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
          <div className="space-y-3 rounded-xl border border-border bg-card p-4 shadow-soft">
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
