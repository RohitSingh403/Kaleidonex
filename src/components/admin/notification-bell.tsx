import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Bell, BellRing } from "lucide-react";
import { getNotifications, markNotificationsRead } from "@/lib/workforce.functions";
import { getSupabase } from "@/lib/supabase-optional";

type PushPermission = "unsupported" | NotificationPermission;

function readPermission(): PushPermission {
  if (typeof window === "undefined" || !("Notification" in window)) return "unsupported";
  return Notification.permission;
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [permission, setPermission] = useState<PushPermission>("unsupported");
  const qc = useQueryClient();
  const fetchNotifications = useServerFn(getNotifications);
  const markRead = useServerFn(markNotificationsRead);
  const seenIds = useRef<Set<string>>(new Set());
  const primed = useRef(false);

  useEffect(() => {
    setPermission(readPermission());
  }, []);

  const notifications = useQuery({
    queryKey: ["notifications"],
    queryFn: () => fetchNotifications({}),
    refetchInterval: 20_000,
    refetchOnWindowFocus: true,
  });

  const items = notifications.data ?? [];
  const unread = items.filter((n) => !n.is_read).length;

  // Live updates: refresh the badge the moment a notification row lands.
  useEffect(() => {
    const client = getSupabase();
    if (!client) return;
    let channel: ReturnType<typeof client.channel> | null = null;
    let cancelled = false;

    (async () => {
      const { data } = await client.auth.getUser();
      const uid = data.user?.id;
      if (!uid || cancelled) return;
      channel = client
        .channel(`notifications:${uid}`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${uid}` },
          () => {
            void qc.invalidateQueries({ queryKey: ["notifications"] });
          },
        )
        .subscribe();
    })();

    return () => {
      cancelled = true;
      if (channel) void client.removeChannel(channel);
    };
  }, [qc]);

  // Browser push for newly arrived unread notifications.
  useEffect(() => {
    if (items.length === 0) return;
    const unreadItems = items.filter((n) => !n.is_read);
    if (!primed.current) {
      primed.current = true;
      for (const n of items) seenIds.current.add(n.id);
      return;
    }
    const fresh = unreadItems.filter((n) => !seenIds.current.has(n.id));
    for (const n of items) seenIds.current.add(n.id);
    if (fresh.length === 0) return;
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (Notification.permission !== "granted") return;
    if (typeof document !== "undefined" && document.visibilityState === "visible" && open) return;
    for (const n of fresh.slice(0, 3)) {
      try {
        new Notification(n.title, { body: n.body, tag: n.id });
      } catch {
        /* push is best effort */
      }
    }
  }, [items, open]);

  async function enablePush() {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
    } catch {
      /* ignore */
    }
  }

  async function toggle() {
    const next = !open;
    setOpen(next);
    if (next && unread > 0) {
      try {
        await markRead({ data: { ids: items.filter((n) => !n.is_read).map((n) => n.id) } });
        await qc.invalidateQueries({ queryKey: ["notifications"] });
      } catch {
        /* non-blocking */
      }
    }
  }

  return (
    <div className="relative">
      <button
        onClick={toggle}
        aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`}
        className="relative grid h-9 w-9 place-items-center rounded-full border border-border bg-background transition-colors hover:bg-secondary"
      >
        {unread > 0 ? (
          <BellRing className="h-4 w-4 text-accent" />
        ) : (
          <Bell className="h-4 w-4 text-muted-foreground" />
        )}
        {unread > 0 ? (
          <>
            <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-accent px-1 text-[10px] font-bold text-accent-foreground">
              {unread > 9 ? "9+" : unread}
            </span>
            <span className="pointer-events-none absolute -right-0.5 -top-0.5 h-4 w-4 animate-ping rounded-full bg-accent/50 motion-reduce:hidden" />
          </>
        ) : null}
      </button>

      {open ? (
        <>
          <button aria-hidden tabIndex={-1} onClick={() => setOpen(false)} className="fixed inset-0 z-30 cursor-default" />
          <div className="absolute right-0 top-full z-40 mt-2 w-80 max-w-[85vw] overflow-hidden rounded-lg border border-border bg-card shadow-lift">
            <p className="border-b border-border px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Notifications
            </p>
            {permission === "default" ? (
              <div className="flex items-center justify-between gap-2 border-b border-border bg-secondary/50 px-4 py-2.5">
                <p className="text-xs text-muted-foreground">Get alerts on this device</p>
                <button
                  onClick={enablePush}
                  className="rounded-md bg-primary px-2.5 py-1 text-[11px] font-semibold text-primary-foreground"
                >
                  Enable
                </button>
              </div>
            ) : null}
            {items.length === 0 ? (
              <p className="px-4 py-6 text-sm text-muted-foreground">You're all caught up.</p>
            ) : (
              <ul className="max-h-80 overflow-y-auto">
                {items.slice(0, 15).map((n) => (
                  <li key={n.id} className="border-b border-border px-4 py-3 last:border-0">
                    <p className="text-sm font-medium">{n.title}</p>
                    <p className="text-xs text-muted-foreground">{n.body}</p>
                    <p className="mt-1 text-[10px] uppercase tracking-wide text-muted-foreground">
                      {new Date(n.created_at).toLocaleString()}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}
