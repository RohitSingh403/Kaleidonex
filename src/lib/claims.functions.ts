import { createServerFn } from "@tanstack/react-start";
import { requireAdmin, requireManager } from "@/lib/require-admin";
import { CLAIM_ESCALATION_LIMIT } from "@/lib/claim-limits";
import { openRequestSafe, appendAction, notify } from "@/lib/approvals.server";
import { logAudit } from "@/lib/workforce.server";


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
    const { data: inserted, error } = await context.supabase
      .from("expense_claims")
      .insert({
        user_id: context.userId,
        expense_date: data.expense_date,
        category: data.category,
        purpose: data.purpose,
        amount: data.amount,
        proof_urls: data.proof_urls,
      })
      .select("id")
      .maybeSingle();
    if (error) throw new Error(error.message);
    await openRequestSafe(
      context.supabase,
      { userId: context.userId, isHr: context.isHr, role: context.roles[0] ?? "employee" },
      {
        kind: "expense",
        resource_table: "expense_claims",
        resource_id: (inserted?.id as string) ?? null,
        title: `${data.category} expense — ₹${Number(data.amount).toLocaleString("en-IN")}`,
        summary: data.purpose,
        amount: Number(data.amount),
      },
    );
    return { ok: true };
  });


/** Only a manager (HR of the claimant) or the CEO may decide a claim — never the claimant. */
export const updateClaimStatus = createServerFn({ method: "POST" })
  .middleware([requireManager])
  .inputValidator((input: { id: string; status: "pending" | "approved" | "paid" | "rejected" }) => input)
  .handler(async ({ data, context }) => {
    const { data: claim, error: loadError } = await context.supabase
      .from("expense_claims")
      .select("id, user_id, amount")
      .eq("id", data.id)
      .maybeSingle();
    if (loadError) throw new Error(loadError.message);
    if (!claim) throw new Error("Claim not found");

    if (claim.user_id === context.userId && !context.isSuper) {
      throw new Error("You cannot decide your own expense claim.");
    }
    if (!context.isSuper) {
      const { data: allowed } = await context.supabase.rpc("can_approve_user", {
        _viewer_id: context.userId,
        _target_id: claim.user_id,
      });
      if (!allowed) throw new Error("This claim belongs to someone outside your team.");
      if (Number(claim.amount) > CLAIM_ESCALATION_LIMIT) {
        throw new Error("Claims above the escalation limit require CEO sign-off.");
      }
    }

    const approvalState =
      data.status === "approved" || data.status === "paid"
        ? context.isSuper
          ? "CEO_APPROVED"
          : "HR_APPROVED"
        : data.status === "rejected"
          ? "REJECTED"
          : "PENDING_HR";
    const decidedAt = data.status === "pending" ? null : new Date().toISOString();

    const { error } = await context.supabase
      .from("expense_claims")
      .update({
        status: data.status,
        approval_state: approvalState,
        decided_by: data.status === "pending" ? null : context.userId,
        decided_at: decidedAt,
      })
      .eq("id", data.id);
    if (error) throw new Error(error.message);

    // Keep the central approval trail in step so the claimant sees the decision.
    try {
      const { data: reqRow } = await context.supabase
        .from("approval_requests")
        .select("id, state")
        .eq("resource_table", "expense_claims")
        .eq("resource_id", data.id)
        .maybeSingle();
      if (reqRow?.id) {
        await context.supabase
          .from("approval_requests")
          .update({
            state: approvalState,
            current_approver_id: null,
            decided_at: decidedAt,
          })
          .eq("id", reqRow.id);
        await appendAction(context.supabase, {
          request_id: reqRow.id as string,
          actor_id: context.userId,
          actor_name: String(context.claims?.email ?? ""),
          actor_role: context.isSuper ? "ceo" : "hr",
          action: data.status === "rejected" ? "reject" : "approve",
          previous_state: (reqRow.state as never) ?? null,
          new_state: approvalState as never,
          comment: `Claim marked ${data.status}`,
        });
      }
      await notify(context.supabase, [
        {
          user_id: claim.user_id as string,
          title: `Expense claim ${data.status}`,
          body: `Your expense claim of ₹${Number(claim.amount).toLocaleString("en-IN")} was ${data.status}.`,
          kind: "approval",
        },
      ]);
    } catch {
      /* the claim decision itself must not fail on trail/notification issues */
    }

    await logAudit(context, {
      action: `claim.status.${data.status}`,
      target_type: "expense_claim",
      target_id: data.id,
    });

    return { ok: true };
  });

/** The claimant may withdraw a pending claim; managers may remove claims in their scope. */
export const deleteExpenseClaim = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((input: { id: string }) => input)
  .handler(async ({ data, context }) => {
    const { data: claim } = await context.supabase
      .from("expense_claims")
      .select("id, user_id, status")
      .eq("id", data.id)
      .maybeSingle();
    if (!claim) throw new Error("Claim not found");

    const isOwner = claim.user_id === context.userId;
    if (isOwner && !context.isSuper && !context.isHr && claim.status !== "pending") {
      throw new Error("Only pending claims can be withdrawn.");
    }
    if (!isOwner && !context.isSuper && !context.isHr) {
      throw new Error("You can only remove your own claims.");
    }

    const { error } = await context.supabase.from("expense_claims").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
