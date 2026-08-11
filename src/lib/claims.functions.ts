import { createServerFn } from "@tanstack/react-start";
import { requireAdmin } from "@/lib/require-admin";

export const getExpenseClaims = createServerFn({ method: "GET" })
  .middleware([requireAdmin])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("expense_claims")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data;
  });

export const createExpenseClaim = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator(
    (input: {
      expense_date: string;
      category: string;
      purpose: string;
      amount: number;
      proof_urls: string[];
    }) => input,
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("expense_claims").insert({
      user_id: context.userId,
      expense_date: data.expense_date,
      category: data.category,
      purpose: data.purpose,
      amount: data.amount,
      proof_urls: data.proof_urls,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const updateClaimStatus = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((input: { id: string; status: "pending" | "approved" | "paid" | "rejected" }) => input)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("expense_claims")
      .update({ status: data.status })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteExpenseClaim = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((input: { id: string }) => input)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("expense_claims").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
