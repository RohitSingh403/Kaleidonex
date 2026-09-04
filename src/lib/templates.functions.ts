import { createServerFn } from "@tanstack/react-start";
import { requireAdmin } from "@/lib/require-admin";

export type TemplateRow = {
  id: string;
  user_id: string;
  title: string;
  board: string;
  template_type: string;
  grade: string;
  subject: string;
  is_draft: boolean;
  is_published: boolean;
  created_at: string;
  updated_at: string;
};

export const getTemplates = createServerFn({ method: "GET" })
  .middleware([requireAdmin])
  .handler(async ({ context }) => {
    const [{ data, error }, roles] = await Promise.all([
      context.supabase.from("templates").select("*").order("updated_at", { ascending: false }),
      context.supabase.from("user_roles").select("role").eq("user_id", context.userId),
    ]);
    if (error) throw new Error(error.message);
    const roleList = (roles.data ?? []).map((r) => r.role as string);
    return {
      templates: (data ?? []) as TemplateRow[],
      canCreate: roleList.includes("admin") || roleList.includes("editor"),
      role: roleList.includes("admin")
        ? "Admin"
        : roleList.includes("editor")
          ? "Editor"
          : "Employee",
    };
  });

export const upsertTemplate = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .validator(
    (input: {
      id?: string;
      title: string;
      board: string;
      template_type: string;
      grade: string;
      subject: string;
      is_draft: boolean;
      is_published: boolean;
    }) => input,
  )
  .handler(async ({ data, context }) => {
    const payload = {
      title: data.title,
      board: data.board,
      template_type: data.template_type,
      grade: data.grade,
      subject: data.subject,
      is_draft: data.is_draft,
      is_published: data.is_published,
    };
    const { error } = data.id
      ? await context.supabase.from("templates").update(payload).eq("id", data.id)
      : await context.supabase
          .from("templates")
          .insert({ ...payload, user_id: context.userId });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const duplicateTemplate = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .validator((input: { id: string }) => input)
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("templates")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) throw new Error("Template not found");
    const { error: insertError } = await context.supabase.from("templates").insert({
      user_id: context.userId,
      title: `${row.title} (Copy)`,
      board: row.board,
      template_type: row.template_type,
      grade: row.grade,
      subject: row.subject,
      is_draft: true,
      is_published: false,
    });
    if (insertError) throw new Error(insertError.message);
    return { ok: true };
  });

export const deleteTemplate = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .validator((input: { id: string }) => input)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("templates").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
