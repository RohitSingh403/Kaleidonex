/* eslint-disable @typescript-eslint/no-explicit-any */

export type ApprovalState =
  | "DRAFT"
  | "SUBMITTED"
  | "PENDING_HR"
  | "HR_APPROVED"
  | "PENDING_CEO"
  | "CEO_APPROVED"
  | "REJECTED"
  | "CHANGES_REQUESTED"
  | "CANCELLED";

export type ApprovalKind = "leave" | "expense" | "attendance_correction" | "employee_request" | "hr_escalation";
export type ApprovalAct = "submit" | "approve" | "reject" | "request_changes" | "escalate" | "cancel";

export const OPEN_STATES: ApprovalState[] = ["SUBMITTED", "PENDING_HR", "PENDING_CEO", "CHANGES_REQUESTED"];
export const FINAL_STATES: ApprovalState[] = ["HR_APPROVED", "CEO_APPROVED", "REJECTED", "CANCELLED"];

export class WorkflowError extends Error {
  status: number;
  constructor(message: string, status = 409) {
    super(message);
    this.status = status;
  }
}

/**
 * Pure state machine. Returns the next state for a valid transition, or throws
 * with an explicit reason. The caller has already been authorised.
 */
export function nextState(
  current: ApprovalState,
  action: ApprovalAct,
  opts: { requiresCeo: boolean; actorIsSuper: boolean; actorIsRequester: boolean },
): ApprovalState {
  if (action === "cancel") {
    if (!opts.actorIsRequester && !opts.actorIsSuper) {
      throw new WorkflowError("Only the requester can cancel this request", 403);
    }
    if (!OPEN_STATES.includes(current)) throw new WorkflowError("This request is already closed");
    return "CANCELLED";
  }

  if (opts.actorIsRequester && !opts.actorIsSuper) {
    throw new WorkflowError("You cannot decide your own request", 403);
  }

  switch (current) {
    case "SUBMITTED":
    case "CHANGES_REQUESTED":
    case "PENDING_HR": {
      if (action === "approve") return opts.requiresCeo ? "PENDING_CEO" : "HR_APPROVED";
      if (action === "reject") return "REJECTED";
      if (action === "request_changes") return "CHANGES_REQUESTED";
      if (action === "escalate") return "PENDING_CEO";
      break;
    }
    case "PENDING_CEO": {
      if (!opts.actorIsSuper) throw new WorkflowError("This request awaits executive approval", 403);
      if (action === "approve") return "CEO_APPROVED";
      if (action === "reject") return "REJECTED";
      if (action === "request_changes") return "CHANGES_REQUESTED";
      break;
    }
    default:
      throw new WorkflowError("This request is already closed");
  }
  throw new WorkflowError("That action is not allowed from the current state");
}

/** Human label for a state, used in notifications and the UI. */
export function stateLabel(state: ApprovalState): string {
  const map: Record<ApprovalState, string> = {
    DRAFT: "Draft",
    SUBMITTED: "Submitted",
    PENDING_HR: "Pending HR",
    HR_APPROVED: "Approved by HR",
    PENDING_CEO: "Pending CEO",
    CEO_APPROVED: "Approved by CEO",
    REJECTED: "Rejected",
    CHANGES_REQUESTED: "Changes requested",
    CANCELLED: "Cancelled",
  };
  return map[state];
}

/** Maps an approval state onto the legacy per-record status columns. */
export function legacyStatus(state: ApprovalState): "pending" | "approved" | "rejected" | null {
  if (state === "HR_APPROVED" || state === "CEO_APPROVED") return "approved";
  if (state === "REJECTED" || state === "CANCELLED") return "rejected";
  if (OPEN_STATES.includes(state)) return "pending";
  return null;
}

/** Resolves whether a request needs executive sign-off, from CEO-configured rules. */
export async function resolveRequiresCeo(
  supabase: any,
  kind: ApprovalKind,
  amount: number,
  ruleKey?: string,
): Promise<boolean> {
  const { data } = await supabase.from("approval_rules").select("*").eq("enabled", true);
  const rules = (data ?? []) as {
    rule_key: string;
    kind: string;
    threshold_amount: number;
    requires_ceo: boolean;
  }[];

  if (ruleKey) {
    const exact = rules.find((r) => r.rule_key === ruleKey);
    if (exact) return exact.requires_ceo;
  }

  return rules.some(
    (r) => r.kind === kind && r.requires_ceo && Number(amount) >= Number(r.threshold_amount) && Number(r.threshold_amount) > 0,
  );
}

/** Finds the first executive account, used when a request must reach the CEO. */
export async function findExecutiveId(supabase: any): Promise<string | null> {
  const { data } = await supabase.from("user_roles").select("user_id, role").in("role", ["ceo", "admin"]);
  const rows = (data ?? []) as { user_id: string; role: string }[];
  return rows.find((r) => r.role === "ceo")?.user_id ?? rows[0]?.user_id ?? null;
}

/** Appends an immutable entry to the approval history. */
export async function appendAction(
  supabase: any,
  entry: {
    request_id: string;
    actor_id: string;
    actor_name: string;
    actor_role: string;
    action: ApprovalAct;
    previous_state: ApprovalState | null;
    new_state: ApprovalState;
    comment: string;
  },
) {
  await supabase.from("approval_actions").insert(entry);
}

/** Fire-and-forget notification helper; never blocks the workflow. */
export async function notify(
  supabase: any,
  rows: { user_id: string | null; title: string; body: string; kind: string; link?: string }[],
) {
  const payload = rows
    .filter((r) => !!r.user_id)
    .map((r) => ({
      user_id: r.user_id as string,
      title: r.title,
      body: r.body,
      kind: r.kind,
      link: r.link ?? "",
    }));
  if (payload.length === 0) return;
  try {
    await supabase.from("notifications").insert(payload);
  } catch {
    /* notifications must never break the workflow */
  }
  try {
    const { dispatchExternal } = await import("@/lib/mailer.server");
    await dispatchExternal(
      supabase,
      payload.map((p) => ({ user_id: p.user_id, title: p.title, body: p.body })),
    );
  } catch {
    /* external delivery is best effort */
  }
}


/**
 * Creates an approval request, routes it to the correct approver, writes the
 * first history entry and notifies. Shared by every module that raises a
 * request (leave, expense, attendance correction, employee request).
 */
export async function openRequest(
  supabase: any,
  actor: { userId: string; isHr?: boolean; role?: string },
  payload: {
    kind: ApprovalKind;
    resource_table?: string;
    resource_id?: string | null;
    title: string;
    summary?: string;
    amount?: number;
    rule_key?: string;
  },
): Promise<{ id: string | null; state: ApprovalState }> {
  const { data: profile } = await supabase
    .from("employee_profile")
    .select("manager_id, full_name")
    .eq("user_id", actor.userId)
    .maybeSingle();

  const amount = Number(payload.amount ?? 0);
  const requiresCeo = await resolveRequiresCeo(supabase, payload.kind, amount, payload.rule_key);

  const hrId = (profile?.manager_id as string | null) ?? null;
  const goesToCeo = payload.kind === "hr_escalation" || !!actor.isHr || !hrId;
  const execId = goesToCeo || requiresCeo ? await findExecutiveId(supabase) : null;
  const state: ApprovalState = goesToCeo ? "PENDING_CEO" : "PENDING_HR";
  const approver = goesToCeo ? execId : hrId;

  const { data: inserted, error } = await supabase
    .from("approval_requests")
    .insert({
      kind: payload.kind,
      requester_id: actor.userId,
      resource_table: payload.resource_table ?? "",
      resource_id: payload.resource_id ?? null,
      title: payload.title,
      summary: payload.summary ?? "",
      amount,
      state,
      current_approver_id: approver,
      requires_ceo: goesToCeo ? false : requiresCeo,
      hr_id: hrId,
    })
    .select("id")
    .maybeSingle();

  if (error) throw new Error(error.message);
  const id = (inserted?.id as string) ?? null;
  if (!id) return { id: null, state };

  await appendAction(supabase, {
    request_id: id,
    actor_id: actor.userId,
    actor_name: (profile?.full_name as string) ?? "",
    actor_role: actor.role ?? (actor.isHr ? "hr" : "employee"),
    action: "submit",
    previous_state: null,
    new_state: state,
    comment: payload.summary ?? "",
  });

  await notify(supabase, [
    {
      user_id: approver,
      title: `New ${payload.kind.replace(/_/g, " ")} request`,
      body: `${profile?.full_name || "A team member"} — ${payload.title}`,
      kind: "approval",
    },
  ]);

  return { id, state };
}

/**
 * Best-effort variant: raising the approval trail must never roll back the
 * underlying record that was already saved.
 */
export async function openRequestSafe(
  supabase: any,
  actor: { userId: string; isHr?: boolean; role?: string },
  payload: Parameters<typeof openRequest>[2],
) {
  try {
    return await openRequest(supabase, actor, payload);
  } catch {
    return { id: null, state: "PENDING_HR" as ApprovalState };
  }
}

