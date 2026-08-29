import { createServerFn } from "@tanstack/react-start";
import { requireStaff } from "@/lib/require-admin";
import { stateLabel, type ApprovalState } from "@/lib/approvals.server";

export type MyRequestRow = {
  id: string;
  kind: "leave" | "expense" | "attendance_correction" | "employee_request";
  title: string;
  summary: string;
  amount: number;
  status: string;
  state: ApprovalState | null;
  state_label: string;
  created_at: string;
  decided_at: string | null;
  decision_note: string;
  approval_id: string | null;
};

/** Unified history of everything the signed-in member has submitted. */
export const getMyRequestHistory = createServerFn({ method: "GET" })
  .middleware([requireStaff])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    const [leaves, claims, corrections, requests, approvals] = await Promise.all([
      supabase
        .from("leave_applications")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false }),
      supabase
        .from("expense_claims")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false }),
      supabase
        .from("attendance_corrections")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false }),
      supabase
        .from("employee_requests")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false }),
      supabase
        .from("approval_requests")
        .select("id, resource_id, state, decided_at")
        .eq("requester_id", userId),
    ]);

    const linked = new Map<string, { id: string; state: ApprovalState; decided_at: string | null }>();
    for (const a of approvals.data ?? []) {
      if (a.resource_id) {
        linked.set(a.resource_id, {
          id: a.id as string,
          state: a.state as ApprovalState,
          decided_at: (a.decided_at as string | null) ?? null,
        });
      }
    }

    const decorate = (
      row: {
        id: string;
        created_at: string;
        status: string;
        decided_at?: string | null;
        decision_note?: string | null;
      },
      kind: MyRequestRow["kind"],
      title: string,
      summary: string,
      amount: number,
    ): MyRequestRow => {
      const link = linked.get(row.id);
      return {
        id: row.id,
        kind,
        title,
        summary,
        amount,
        status: row.status,
        state: link?.state ?? null,
        state_label: link ? stateLabel(link.state) : row.status.replace(/_/g, " "),
        created_at: row.created_at,
        decided_at: row.decided_at ?? link?.decided_at ?? null,
        decision_note: row.decision_note ?? "",
        approval_id: link?.id ?? null,
      };
    };

    const rows: MyRequestRow[] = [
      ...(leaves.data ?? []).map((r) =>
        decorate(
          r as never,
          "leave",
          `${r.leave_type} leave · ${r.start_date} → ${r.end_date}`,
          r.reason ?? "",
          r.days ?? 0,
        ),
      ),
      ...(claims.data ?? []).map((r) =>
        decorate(r as never, "expense", `${r.category} claim · ${r.claim_no}`, r.purpose ?? "", Number(r.amount ?? 0)),
      ),
      ...(corrections.data ?? []).map((r) =>
        decorate(
          r as never,
          "attendance_correction",
          `Attendance correction · ${r.work_date}`,
          r.reason ?? "",
          0,
        ),
      ),
      ...(requests.data ?? []).map((r) =>
        decorate(r as never, "employee_request", r.request_type, r.details || r.note || "", 0),
      ),
    ];

    rows.sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
    return rows;
  });
