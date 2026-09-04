import { createServerFn } from "@tanstack/react-start";
import { requireAdmin } from "@/lib/require-admin";

// ─── Sections ────────────────────────────────────────────

export const getSections = createServerFn({ method: "GET" })
  .middleware([requireAdmin])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("sections")
      .select("*")
      .order("grade", { ascending: true })
      .order("name", { ascending: true });
    if (error) throw new Error(error.message);
    return data;
  });

export const createSection = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .validator((input: { grade: string; name: string }) => input)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("sections").insert({
      grade: data.grade.trim(),
      name: data.name.trim().toUpperCase(),
    });
    if (error) {
      if (error.code === "23505") {
        throw new Error(
          `Section ${data.grade.trim()} · ${data.name.trim().toUpperCase()} already exists.`,
        );
      }
      throw new Error(error.message);
    }
    return { ok: true };
  });

export const deleteSection = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .validator((input: { id: string }) => input)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("sections").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ─── Students ────────────────────────────────────────────

export const getStudents = createServerFn({ method: "GET" })
  .middleware([requireAdmin])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("students")
      .select("*, sections(grade, name)")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data;
  });

export const upsertStudent = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .validator(
    (input: {
      id?: string;
      name: string;
      email: string;
      phone: string;
      grade: string;
      section_id: string | null;
      roll_no: string;
      status: "verified" | "pending" | "rejected";
    }) => input,
  )
  .handler(async ({ data, context }) => {
    const { id, ...payload } = data;
    if (id) {
      const { error } = await context.supabase.from("students").update(payload).eq("id", id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await context.supabase.from("students").insert(payload);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

export const bulkCreateStudents = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .validator((input: { rows: { name: string; email: string; grade: string; roll_no: string }[] }) => input)
  .handler(async ({ data, context }) => {
    if (data.rows.length === 0) return { ok: true, count: 0 };
    const { error } = await context.supabase.from("students").insert(data.rows);
    if (error) throw new Error(error.message);
    return { ok: true, count: data.rows.length };
  });

export const deleteStudent = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .validator((input: { id: string }) => input)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("students").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ─── Exams ───────────────────────────────────────────────

export const getExams = createServerFn({ method: "GET" })
  .middleware([requireAdmin])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("exams")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data;
  });

export const upsertExam = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .validator(
    (input: {
      id?: string;
      title: string;
      subject: string;
      grade: string;
      status: "draft" | "published";
      starts_at: string | null;
      ends_at: string | null;
      total_marks: number;
    }) => input,
  )
  .handler(async ({ data, context }) => {
    const { id, ...payload } = data;
    if (id) {
      const { error } = await context.supabase.from("exams").update(payload).eq("id", id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await context.supabase.from("exams").insert(payload);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

export const deleteExam = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .validator((input: { id: string }) => input)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("exams").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
