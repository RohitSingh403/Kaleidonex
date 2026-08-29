import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { GripVertical, Trash2 } from "lucide-react";
import {
  getTasks,
  updateTaskStatus,
  deleteTask,
  type TaskRow,
  type TaskStatus,
} from "@/lib/tasks.functions";

const COLUMNS: { id: TaskStatus; label: string; tone: string }[] = [
  { id: "todo", label: "To do", tone: "bg-slate-400" },
  { id: "in_progress", label: "In progress", tone: "bg-sky-500" },
  { id: "review", label: "In review", tone: "bg-amber-500" },
  { id: "blocked", label: "Blocked", tone: "bg-destructive" },
  { id: "completed", label: "Completed", tone: "bg-emerald-500" },
];

/** Legacy rows saved as `pending` belong in the To do column. */
function columnOf(t: TaskRow): TaskStatus {
  return t.status === "pending" ? "todo" : t.status;
}

const PRIORITY_TONE: Record<string, string> = {
  High: "bg-destructive/10 text-destructive",
  Medium: "bg-amber-500/10 text-amber-700",
  Low: "bg-emerald-500/10 text-emerald-700",
};

export function TaskBoardKanban() {
  const qc = useQueryClient();
  const fetchTasks = useServerFn(getTasks);
  const statusFn = useServerFn(updateTaskStatus);
  const delFn = useServerFn(deleteTask);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overCol, setOverCol] = useState<TaskStatus | null>(null);

  const { data: tasks = [], isLoading } = useQuery({ queryKey: ["tasks"], queryFn: () => fetchTasks({}) });
  const invalidate = () => qc.invalidateQueries({ queryKey: ["tasks"] });

  const move = useMutation({
    mutationFn: (v: { id: string; status: TaskStatus }) => statusFn({ data: v }),
    onSuccess: invalidate,
    onError: (e: Error) => toast.error(e.message || "Could not move that task"),
  });
  const remove = useMutation({
    mutationFn: (v: { id: string }) => delFn({ data: v }),
    onSuccess: invalidate,
  });

  const grouped = useMemo(() => {
    const map = new Map<TaskStatus, TaskRow[]>(COLUMNS.map((c) => [c.id, [] as TaskRow[]]));
    for (const t of tasks) map.get(columnOf(t))?.push(t);
    return map;
  }, [tasks]);

  function drop(status: TaskStatus) {
    setOverCol(null);
    const id = dragId;
    setDragId(null);
    if (!id) return;
    const task = tasks.find((t) => t.id === id);
    if (!task || columnOf(task) === status) return;
    move.mutate({ id, status });
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Drag a card between columns to update its status, or use the dropdown on touch devices.
      </p>
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading board…</p>
      ) : (
        <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-5">
          {COLUMNS.map((col) => {
            const items = grouped.get(col.id) ?? [];
            return (
              <div
                key={col.id}
                onDragOver={(e) => {
                  e.preventDefault();
                  setOverCol(col.id);
                }}
                onDragLeave={() => setOverCol((c) => (c === col.id ? null : c))}
                onDrop={() => drop(col.id)}
                className={`flex min-h-[12rem] flex-col rounded-xl border bg-card p-3 transition-colors ${
                  overCol === col.id ? "border-accent bg-accent/5" : "border-border"
                }`}
              >
                <div className="mb-3 flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${col.tone}`} />
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {col.label}
                  </h3>
                  <span className="ml-auto rounded-full bg-secondary px-2 text-[11px] font-semibold text-primary">
                    {items.length}
                  </span>
                </div>

                <div className="space-y-2">
                  {items.map((t) => (
                    <article
                      key={t.id}
                      draggable
                      onDragStart={() => setDragId(t.id)}
                      onDragEnd={() => setDragId(null)}
                      className={`cursor-grab rounded-lg border border-border bg-background p-3 shadow-soft active:cursor-grabbing ${
                        dragId === t.id ? "opacity-50" : ""
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <GripVertical className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        <p className="min-w-0 flex-1 text-sm font-medium">{t.title}</p>
                        <button
                          onClick={() => remove.mutate({ id: t.id })}
                          aria-label={`Delete ${t.title}`}
                          className="text-muted-foreground transition-colors hover:text-destructive"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      {t.description ? (
                        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{t.description}</p>
                      ) : null}
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px]">
                        {t.priority ? (
                          <span
                            className={`rounded px-1.5 py-0.5 font-semibold ${
                              PRIORITY_TONE[t.priority] ?? "bg-secondary text-primary"
                            }`}
                          >
                            {t.priority}
                          </span>
                        ) : null}
                        {t.due_date ? (
                          <span className="text-muted-foreground">Due {t.due_date}</span>
                        ) : null}
                      </div>
                      <label className="mt-2 block">
                        <span className="sr-only">Move {t.title}</span>
                        <select
                          value={columnOf(t)}
                          onChange={(e) => move.mutate({ id: t.id, status: e.target.value as TaskStatus })}
                          className="w-full rounded-md border border-input bg-background px-2 py-1 text-xs"
                        >
                          {COLUMNS.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.label}
                            </option>
                          ))}
                        </select>
                      </label>
                    </article>
                  ))}
                  {items.length === 0 ? (
                    <p className="rounded-lg border border-dashed border-border px-3 py-6 text-center text-xs text-muted-foreground">
                      Drop here
                    </p>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
