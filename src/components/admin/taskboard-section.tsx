import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowRight, Trash2, CheckCircle2, Play, RotateCcw, Plus } from "lucide-react";
import { getTasks, createTask, updateTaskStatus, deleteTask } from "@/lib/tasks.functions";

function Panel({
  title,
  action,
  children,
}: {
  title?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-primary/25 bg-card p-4 md:p-5">
      {(title || action) && (
        <div className="mb-4 flex items-center justify-between gap-3">
          {title && (
            <h3 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              {title}
            </h3>
          )}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

function Ring({ label, pct, caption }: { label: string; pct: number; caption: string }) {
  const r = 34;
  const c = 2 * Math.PI * r;
  return (
    <div className="rounded-xl border border-primary/25 bg-card p-5 text-center">
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <div className="relative mx-auto mt-4 h-24 w-24">
        <svg viewBox="0 0 80 80" className="h-24 w-24 -rotate-90">
          <circle cx="40" cy="40" r={r} className="fill-none stroke-border" strokeWidth="6" />
          <circle
            cx="40"
            cy="40"
            r={r}
            className="fill-none stroke-primary"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={c - (c * pct) / 100}
          />
        </svg>
        <span className="absolute inset-0 grid place-items-center text-sm font-bold">
          {Math.round(pct)}%
        </span>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">{caption}</p>
    </div>
  );
}

const inputClass = "w-full rounded-md border border-input bg-background px-3 py-2 text-sm";

const STATUS_LABEL: Record<string, string> = {
  pending: "Pending",
  in_progress: "In Progress",
  completed: "Completed",
};

export function TaskBoardSection() {
  const [view, setView] = useState<"dashboard" | "mytask">("dashboard");
  const fetchTasks = useServerFn(getTasks);
  const createFn = useServerFn(createTask);
  const statusFn = useServerFn(updateTaskStatus);
  const delFn = useServerFn(deleteTask);
  const qc = useQueryClient();

  const { data: tasks = [], isLoading } = useQuery({ queryKey: ["tasks"], queryFn: () => fetchTasks() });
  const invalidate = () => qc.invalidateQueries({ queryKey: ["tasks"] });
  const add = useMutation({ mutationFn: createFn, onSuccess: invalidate });
  const setStatus = useMutation({ mutationFn: statusFn, onSuccess: invalidate });
  const remove = useMutation({ mutationFn: delFn, onSuccess: invalidate });

  const stats = useMemo(() => {
    const total = tasks.length;
    const by = (s: string) => tasks.filter((t) => t.status === s).length;
    const pct = (n: number) => (total ? (n / total) * 100 : 0);
    return {
      total,
      pending: by("pending"),
      progress: by("in_progress"),
      done: by("completed"),
      pct,
    };
  }, [tasks]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-end gap-6 border-b border-border pb-2 text-sm">
        {(["dashboard", "mytask"] as const).map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`pb-2 ${view === v ? "border-b-2 border-primary font-medium text-primary" : "text-muted-foreground"}`}
          >
            {v === "dashboard" ? "Dashboard" : "My Task"}
          </button>
        ))}
      </div>

      {view === "dashboard" ? (
        <div className="space-y-5 rounded-xl border border-primary/25 bg-card p-4 md:p-5">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Ring label="Total Tasks" pct={stats.total ? 100 : 0} caption={`${stats.total} Total`} />
            <Ring
              label="Pending"
              pct={stats.pct(stats.pending)}
              caption={`${stats.pending} Tasks (${Math.round(stats.pct(stats.pending))}%)`}
            />
            <Ring
              label="In Progress"
              pct={stats.pct(stats.progress)}
              caption={`${stats.progress} Tasks (${Math.round(stats.pct(stats.progress))}%)`}
            />
            <Ring
              label="Completed"
              pct={stats.pct(stats.done)}
              caption={`${stats.done} Tasks (${Math.round(stats.pct(stats.done))}%)`}
            />
          </div>

          <Panel
            title="Recent Tasks"
            action={
              <button
                onClick={() => setView("mytask")}
                className="flex items-center gap-2 rounded-md bg-foreground px-3 py-2 text-xs font-medium text-background"
              >
                See All <ArrowRight className="h-3.5 w-3.5" />
              </button>
            }
          >
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px] text-sm">
                <thead>
                  <tr className="text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                    <th className="py-2 pr-3">#</th>
                    <th className="py-2 pr-3">Task</th>
                    <th className="py-2 pr-3">Duration</th>
                    <th className="py-2 pr-3">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.slice(0, 5).map((t, i) => (
                    <tr key={t.id} className="border-t border-border/60">
                      <td className="py-3 pr-3">{i + 1}</td>
                      <td className="py-3 pr-3 font-medium">{t.title}</td>
                      <td className="py-3 pr-3 text-muted-foreground">{t.duration || "—"}</td>
                      <td className="py-3 pr-3">{STATUS_LABEL[t.status]}</td>
                    </tr>
                  ))}
                  {!isLoading && tasks.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-muted-foreground">
                        No tasks yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Panel>
        </div>
      ) : (
        <div className="space-y-5">
          <Panel title="Add Task">
            <form
              className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.currentTarget;
                const f = new FormData(form);
                add.mutate(
                  {
                    data: {
                      title: String(f.get("title") ?? ""),
                      description: String(f.get("description") ?? ""),
                      duration: String(f.get("duration") ?? ""),
                      priority: String(f.get("priority") ?? "Medium"),
                      due_date: String(f.get("due_date") ?? "") || null,
                    },
                  },
                  { onSuccess: () => form.reset() },
                );
              }}
            >
              <label className="space-y-1 text-sm">
                <span className="text-xs text-muted-foreground">Task title</span>
                <input name="title" required placeholder="Task title" className={inputClass} />
              </label>
              <label className="space-y-1 text-sm">
                <span className="text-xs text-muted-foreground">Description</span>
                <input name="description" placeholder="Description" className={inputClass} />
              </label>
              <label className="space-y-1 text-sm">
                <span className="text-xs text-muted-foreground">Duration</span>
                <input name="duration" placeholder="e.g. 2h" className={inputClass} />
              </label>
              <label className="space-y-1 text-sm">
                <span className="text-xs text-muted-foreground">Priority</span>
                <select name="priority" className={inputClass} defaultValue="Medium">
                  <option>Low</option>
                  <option>Medium</option>
                  <option>High</option>
                </select>
              </label>
              <label className="space-y-1 text-sm">
                <span className="text-xs text-muted-foreground">Due date</span>
                <input name="due_date" type="date" className={inputClass} />
              </label>
              <div className="flex justify-end sm:col-span-2 lg:col-span-3">
                <button
                  type="submit"
                  disabled={add.isPending}
                  className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-60 sm:w-auto"
                >
                  <Plus className="h-4 w-4" />
                  {add.isPending ? "Adding…" : "Add Task"}
                </button>
              </div>

            </form>

          </Panel>

          <Panel title="My Tasks">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                    <th className="py-2 pr-3">#</th>
                    <th className="py-2 pr-3">Task</th>
                    <th className="py-2 pr-3">Priority</th>
                    <th className="py-2 pr-3">Duration</th>
                    <th className="py-2 pr-3">Due</th>
                    <th className="py-2 pr-3">Status</th>
                    <th className="py-2 pr-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.map((t, i) => (
                    <tr key={t.id} className="border-b border-border/60">
                      <td className="py-3 pr-3">{i + 1}</td>
                      <td className="py-3 pr-3">
                        <span className="block font-medium">{t.title}</span>
                        {t.description && (
                          <span className="text-xs text-muted-foreground">{t.description}</span>
                        )}
                      </td>
                      <td className="py-3 pr-3">{t.priority}</td>
                      <td className="py-3 pr-3">{t.duration || "—"}</td>
                      <td className="py-3 pr-3">{t.due_date ?? "—"}</td>
                      <td className="py-3 pr-3">
                        <span className="rounded bg-secondary px-2 py-0.5 text-[11px] font-medium">
                          {STATUS_LABEL[t.status]}
                        </span>
                      </td>
                      <td className="py-3 pr-3">
                        <span className="flex items-center gap-2">
                          <button
                            title="Start"
                            onClick={() => setStatus.mutate({ data: { id: t.id, status: "in_progress" } })}
                            className="text-primary"
                          >
                            <Play className="h-4 w-4" />
                          </button>
                          <button
                            title="Complete"
                            onClick={() => setStatus.mutate({ data: { id: t.id, status: "completed" } })}
                            className="text-emerald-600"
                          >
                            <CheckCircle2 className="h-4 w-4" />
                          </button>
                          <button
                            title="Reset"
                            onClick={() => setStatus.mutate({ data: { id: t.id, status: "pending" } })}
                            className="text-muted-foreground"
                          >
                            <RotateCcw className="h-4 w-4" />
                          </button>
                          <button
                            title="Delete"
                            onClick={() => remove.mutate({ data: { id: t.id } })}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </span>
                      </td>
                    </tr>
                  ))}
                  {!isLoading && tasks.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-muted-foreground">
                        No tasks yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Panel>
        </div>
      )}
    </div>
  );
}
