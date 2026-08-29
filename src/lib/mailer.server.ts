/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Outbound alerting for approval decisions and escalations.
 *
 * Email is sent through Resend when a `RESEND_API_KEY` secret is configured;
 * otherwise the call is a no-op so the in-app notification still works.
 * An optional Slack / Teams incoming webhook can be set in Organisation
 * settings (`notifications.webhook_url`).
 */

export type OutboundMessage = {
  user_id: string;
  title: string;
  body: string;
};

async function loadSettings(supabase: any): Promise<{ email: boolean; webhook: string }> {
  try {
    const { data } = await supabase.from("org_settings").select("value").eq("key", "notifications").maybeSingle();
    const v = (data?.value ?? {}) as Record<string, unknown>;
    return {
      email: v["email_enabled"] !== false,
      webhook: String(v["webhook_url"] ?? ""),
    };
  } catch {
    return { email: true, webhook: "" };
  }
}

async function emailsFor(ids: string[]): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 });
    for (const u of data?.users ?? []) {
      if (ids.includes(u.id) && u.email) out.set(u.id, u.email);
    }
  } catch {
    /* admin lookup unavailable */
  }
  return out;
}

async function sendEmail(to: string, subject: string, text: string) {
  const key = process.env["RESEND_API_KEY"];
  if (!key) return;
  const from = process.env["NOTIFY_FROM_EMAIL"] || "Kaleidonex <onboarding@resend.dev>";
  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({ from, to: [to], subject, text }),
    });
  } catch {
    /* delivery failures must never break the workflow */
  }
}

async function postWebhook(url: string, text: string) {
  if (!url) return;
  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
  } catch {
    /* ignore */
  }
}

/** Fire-and-forget email + webhook fan-out. Never throws. */
export async function dispatchExternal(supabase: any, rows: OutboundMessage[]) {
  if (rows.length === 0) return;
  try {
    const settings = await loadSettings(supabase);
    const map = settings.email ? await emailsFor(rows.map((r) => r.user_id)) : new Map<string, string>();
    await Promise.all([
      ...rows.map(async (r) => {
        const to = map.get(r.user_id);
        if (to) await sendEmail(to, r.title, r.body);
      }),
      postWebhook(settings.webhook, rows.map((r) => `*${r.title}* — ${r.body}`).join("\n")),
    ]);
  } catch {
    /* ignore */
  }
}
