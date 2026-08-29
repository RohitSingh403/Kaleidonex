/* eslint-disable @typescript-eslint/no-explicit-any */

export type AuditEntry = {
  action: string;
  target_type?: string;
  target_id?: string;
  target_name?: string;
  details?: string;
};

/** Writes an audit trail row. Auditing must never break the action it records. */
export async function logAudit(
  context: { supabase: any; userId: string; claims?: any },
  entry: AuditEntry,
) {
  try {
    await context.supabase.from("audit_logs").insert({
      actor_id: context.userId,
      actor_name: String(context.claims?.email ?? ""),
      action: entry.action,
      target_type: entry.target_type ?? "",
      target_id: entry.target_id ?? "",
      target_name: entry.target_name ?? "",
      details: entry.details ?? "",
    });
  } catch {
    /* ignore */
  }
}
