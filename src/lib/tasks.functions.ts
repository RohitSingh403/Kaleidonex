import { createServerFn } from "@tanstack/react-start";
import { requireAdmin } from "@/lib/require-admin";

export type TaskStatus =
  | "pending"
  | "todo"
  | "in_progress"
  | "review"
  | "blocked"
  | "completed";

export type TaskRow = {
  id: string;
  user_id: string;
  title: string;
  description: string;
  duration: string;
  priority: string;
  status: TaskStatus;
  progress: number;
  project_id: string | null;
  due_date: string | null;
  created_at: string;
  updated_at: string;
};

export const getTasks = createServerFn({ method: "GET" })
  .middleware([requireAdmin])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("tasks")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as TaskRow[];
  });

export const createTask = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator(
    (input: {
      title: string;
      description: string;
      duration: string;
      priority: string;
      due_date: string | null;
    }) => input,
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("tasks")
      .insert({ ...data, user_id: context.userId, due_date: data.due_date || null });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const updateTaskStatus = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator(
    (input: { id: string; status: TaskStatus; progress?: number }) => input,
  )
  .handler(async ({ data, context }) => {
    const patch: { status: TaskStatus; progress?: number } = { status: data.status };
    if (typeof data.progress === "number") patch.progress = Math.max(0, Math.min(100, data.progress));
    else if (data.status === "completed") patch.progress = 100;
    const { error } = await context.supabase
      .from("tasks")
      .update(patch)
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteTask = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((input: { id: string }) => input)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("tasks").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
