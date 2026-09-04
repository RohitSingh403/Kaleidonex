import { createServerFn } from "@tanstack/react-start";
import { requireStaff, requireSuperAdmin } from "@/lib/require-admin";
import {
  appendAction,
  findExecutiveId,
  legacyStatus,
  notify,
  nextState,
  OPEN_STATES,
  openRequest,
  stateLabel,
  WorkflowError,
  type ApprovalAct,
  type ApprovalKind,
  type ApprovalState,
} from "@/lib/approvals.server";

import { logAudit } from "@/lib/workforce.server";

export type ApprovalRequestRow = {
  id: string;
  kind: ApprovalKind;
  requester_id: string;
  requester_name: string;
  resource_table: string;
  resource_id: string | null;
  title: string;
  summary: string;
  amount: number;
  state: ApprovalState;
  state_label: string;
  current_approver_id: string | null;
  requires_ceo: boolean;
  hr_id: string | null;
  decided_at: string | null;
  created_at: string;
  canAct: boolean;
  isMine: boolean;
};

/** Submits a request into the approval pipeline and routes it to the right approver. */
export const submitApproval = createServerFn({ method: "POST" })
  .middleware([requireStaff])
  .validator(
    (input: {
      kind: ApprovalKind;
      resource_table?: string;
      resource_id?: string | null;
      title: string;
      summary?: string;
      amount?: number;
      rule_key?: string;
    }) => input,
  )
  .handler(async ({ data, context }) => {
    const res = await openRequest(
      context.supabase,
      { userId: context.userId, isHr: context.isHr, role: context.roles[0] ?? "employee" },
      data,
    );
    return { ok: true, id: res.id, state: res.state };
  });


/** Requests visible to the caller: their own plus anything awaiting their decision. */
export const listApprovals = createServerFn({ method: "GET" })
  .middleware([requireStaff])
  .handler(async ({ context }): Promise<ApprovalRequestRow[]> => {
    const [reqRes, profilesRes] = await Promise.all([
      context.supabase
        .from("approval_requests")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(300),
      context.supabase.from("profiles").select("id, full_name"),
    ]);
    if (reqRes.error) throw new Error(reqRes.error.message);

    const names = new Map((profilesRes.data ?? []).map((p) => [p.id, p.full_name as string]));

    return (reqRes.data ?? []).map((r) => {
      const state = r.state as ApprovalState;
      const isMine = r.requester_id === context.userId;
      const awaitingCeo = state === "PENDING_CEO";
      const canAct =
        !isMine &&
        (awaitingCeo
          ? context.isSuper
          : ["SUBMITTED", "PENDING_HR", "CHANGES_REQUESTED"].includes(state) &&
            (context.isSuper || r.current_approver_id === context.userId));

      return {
        id: r.id as string,
        kind: r.kind as ApprovalKind,
        requester_id: r.requester_id as string,
        requester_name: names.get(r.requester_id as string) ?? "",
        resource_table: r.resource_table as string,
        resource_id: (r.resource_id as string | null) ?? null,
        title: r.title as string,
        summary: r.summary as string,
        amount: Number(r.amount),
        state,
        state_label: stateLabel(state),
        current_approver_id: (r.current_approver_id as string | null) ?? null,
        requires_ceo: !!r.requires_ceo,
        hr_id: (r.hr_id as string | null) ?? null,
        decided_at: (r.decided_at as string | null) ?? null,
        created_at: r.created_at as string,
        canAct,
        isMine,
      };
    });
  });

/** Immutable action trail for one request. */
export const getApprovalHistory = createServerFn({ method: "GET" })
  .middleware([requireStaff])
  .validator((input: { request_id: string }) => input)
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("approval_actions")
      .select("*")
      .eq("request_id", data.request_id)
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    return (rows ?? []).map((r) => ({
      ...r,
      state_label: stateLabel(r.new_state as ApprovalState),
    }));
  });

/** Approve / reject / request changes / escalate / cancel, with server-side authority checks. */
export const actOnApproval = createServerFn({ method: "POST" })
  .middleware([requireStaff])
  .validator((input: { id: string; action: ApprovalAct; comment?: string }) => input)
  .handler(async ({ data, context }) => {
    const { data: row, error: readErr } = await context.supabase
      .from("approval_requests")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (readErr) throw new Error(readErr.message);
    if (!row) throw new Error("Request not found or outside your scope");

    const current = row.state as ApprovalState;
    const isRequester = row.requester_id === context.userId;

    // A delayed refresh or double-click can submit an action after another
    // actor has already completed the request. Treat that as an idempotent
    // conflict instead of throwing across the server-function boundary.
    if (!OPEN_STATES.includes(current)) {
      return {
        ok: false as const,
        state: current,
        message: "This request was already closed. The latest status has been loaded.",
      };
    }

    if (data.action !== "cancel" && !isRequester) {
      const allowed = context.isSuper || row.current_approver_id === context.userId || context.isHr;
      if (!allowed) throw new Error("You are not an approver for this request");
    }

    let target: ApprovalState;
    try {
      target = nextState(current, data.action, {
        requiresCeo: !!row.requires_ceo,
        actorIsSuper: context.isSuper,
        actorIsRequester: isRequester,
      });
    } catch (e) {
      throw new Error(e instanceof WorkflowError ? e.message : "Invalid action");
    }

    const execId = target === "PENDING_CEO" ? await findExecutiveId(context.supabase) : null;
    const nextApprover =
      target === "PENDING_CEO"
        ? execId
        : target === "CHANGES_REQUESTED"
          ? (row.requester_id as string)
          : null;

    const { data: updated, error: updErr } = await context.supabase
      .from("approval_requests")
      .update({
        state: target,
        current_approver_id: nextApprover,
        decided_at: ["HR_APPROVED", "CEO_APPROVED", "REJECTED", "CANCELLED"].includes(target)
          ? new Date().toISOString()
          : null,
      })
      .eq("id", data.id)
      .eq("state", current)
      .eq("updated_at", row.updated_at)
      .select("state")
      .maybeSingle();
    if (updErr) throw new Error(updErr.message);

    // Compare-and-set protection: if another action changed this request
    // after our read, do not append a second action or overwrite its result.
    if (!updated) {
      const { data: latest } = await context.supabase
        .from("approval_requests")
        .select("state")
        .eq("id", data.id)
        .maybeSingle();
      return {
        ok: false as const,
        state: ((latest?.state as ApprovalState | undefined) ?? current),
        message: "This request was updated by someone else. The latest status has been loaded.",
      };
    }

    await appendAction(context.supabase, {
      request_id: data.id,
      actor_id: context.userId,
      actor_name: String(context.claims?.email ?? ""),
      actor_role: context.isSuper ? "ceo" : context.isHr ? "hr" : "employee",
      action: data.action,
      previous_state: current,
      new_state: target,
      comment: data.comment ?? "",
    });

    // Keep the originating record in step with the workflow.
    const legacy = legacyStatus(target);
    const table = row.resource_table as string;
    const resourceId = row.resource_id as string | null;
    if (legacy && resourceId) {
      const decidedAt = new Date().toISOString();
      const note = data.comment ?? "";
      if (table === "leave_applications") {
        await context.supabase
          .from("leave_applications")
          .update({ status: legacy, decided_by: context.userId, decided_at: decidedAt, decision_note: note })
          .eq("id", resourceId);
      } else if (table === "employee_requests") {
        await context.supabase
          .from("employee_requests")
          .update({ status: legacy, decided_by: context.userId, decided_at: decidedAt, decision_note: note })
          .eq("id", resourceId);
      } else if (table === "expense_claims") {
        await context.supabase
          .from("expense_claims")
          .update({
            status: legacy,
            approval_state: target,
            decided_by: context.userId,
            decided_at: decidedAt,
            decision_note: note,
          })
          .eq("id", resourceId);

      } else if (table === "attendance_corrections") {
        await context.supabase
          .from("attendance_corrections")
          .update({ status: legacy, decided_at: decidedAt, decision_note: note })
          .eq("id", resourceId);
      }
    }


    await Promise.all([
      notify(context.supabase, [
        {
          user_id: row.requester_id as string,
          title: `${row.title} — ${stateLabel(target)}`,
          body: data.comment || `Your request is now ${stateLabel(target).toLowerCase()}.`,
          kind: "approval",
        },
        ...(target === "PENDING_CEO" && execId
          ? [
              {
                user_id: execId,
                title: "Request awaiting executive approval",
                body: row.title as string,
                kind: "approval",
              },
            ]
          : []),
      ]),
      logAudit(context, {
        action: `approval.${data.action}`,
        target_type: "approval_request",
        target_id: data.id,
        target_name: row.title as string,
        details: `${current} → ${target}`,
      }),
    ]);

    return { ok: true as const, state: target };
  });

/** CEO-configurable approval thresholds. */
export const getApprovalRules = createServerFn({ method: "GET" })
  .middleware([requireStaff])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.from("approval_rules").select("*").order("kind");
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const saveApprovalRule = createServerFn({ method: "POST" })
  .middleware([requireSuperAdmin])
  .validator(
    (input: {
      rule_key: string;
      label: string;
      kind: ApprovalKind;
      threshold_amount: number;
      requires_ceo: boolean;
      enabled: boolean;
    }) => input,
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("approval_rules")
      .upsert(
        {
          rule_key: data.rule_key,
          label: data.label,
          kind: data.kind,
          threshold_amount: data.threshold_amount,
          requires_ceo: data.requires_ceo,
          enabled: data.enabled,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "rule_key" },
      );
    if (error) throw new Error(error.message);
    await logAudit(context, {
      action: "approval.rule.save",
      target_type: "approval_rule",
      target_name: data.label || data.rule_key,
    });
    return { ok: true };
  });
