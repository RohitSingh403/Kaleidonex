import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Bell, BellRing, CheckCheck, Inbox } from "lucide-react";
import { getNotifications, markNotificationsRead } from "@/lib/workforce.functions";
import { Kpi, Panel } from "@/components/admin/workforce-ui";

const KIND_TONE: Record<string, string> = {
  approval: "bg-sky-500/10 text-sky-700",
  approved: "bg-emerald-500/10 text-emerald-700",
  rejected: "bg-destructive/10 text-destructive",
  info: "bg-secondary text-primary",
};

export function NotificationsSection({ onNavigate }: { onNavigate?: (tab: string) => void }) {
  const qc = useQueryClient();
  const fetchNotifications = useServerFn(getNotifications);
  const markRead = useServerFn(markNotificationsRead);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const query = useQuery({
    queryKey: ["notifications"],
    queryFn: () => fetchNotifications({}),
    refetchInterval: 60_000,
  });
  const items = query.data ?? [];
  const unread = items.filter((n) => !n.is_read);

  const mark = useMutation({
    mutationFn: (ids: string[]) => markRead({ data: { ids } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
    onError: () => toast.error("Could not update those notifications"),
  });

  const shown = useMemo(
    () => (filter === "unread" ? unread : items),
    [filter, items, unread],
  );

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-3">
        <Kpi label="All notifications" value={items.length} icon={Inbox} />
        <Kpi label="Unread" value={unread.length} icon={BellRing} tone={unread.length ? "warn" : "good"} />
        <Kpi
          label="Latest"
          value={items[0] ? new Date(items[0].created_at).toLocaleDateString() : "—"}
          icon={Bell}
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {(["all", "unread"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-4 py-1.5 text-sm capitalize transition-colors ${
              filter === f ? "bg-primary text-primary-foreground" : "border border-border bg-card hover:bg-secondary"
            }`}
          >
            {f}
          </button>
        ))}
        <button
          onClick={() => mark.mutate(unread.map((n) => n.id))}
          disabled={unread.length === 0 || mark.isPending}
          className="ml-auto flex items-center gap-2 rounded-md border border-border px-3 py-1.5 text-xs hover:bg-secondary disabled:opacity-50"
        >
          <CheckCheck className="h-3.5 w-3.5" /> Mark all read
        </button>
      </div>

      <Panel title="Notification centre" description="Approval decisions and workspace updates.">
        {query.isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : shown.length === 0 ? (
          <p className="text-sm text-muted-foreground">You're all caught up.</p>
        ) : (
          <ul className="space-y-2">
            {shown.map((n) => (
              <li
                key={n.id}
                className={`rounded-lg border p-4 ${n.is_read ? "border-border" : "border-accent/40 bg-accent/5"}`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded px-2 py-0.5 text-[11px] font-semibold uppercase ${
                          KIND_TONE[n.kind] ?? "bg-secondary text-primary"
                        }`}
                      >
                        {n.kind || "info"}
                      </span>
                      {!n.is_read ? (
                        <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold text-accent-foreground">
                          New
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-2 text-sm font-semibold">{n.title}</p>
                    <p className="text-xs text-muted-foreground">{n.body}</p>
                    <p className="mt-1 text-[11px] uppercase tracking-wide text-muted-foreground">
                      {new Date(n.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {onNavigate ? (
                      <button
                        onClick={() => onNavigate(n.link?.includes("claim") ? "claims" : "approvals")}
                        className="rounded-md border border-border px-3 py-1.5 text-xs hover:bg-secondary"
                      >
                        Open
                      </button>
                    ) : null}
                    {!n.is_read ? (
                      <button
                        onClick={() => mark.mutate([n.id])}
                        className="rounded-md border border-border px-3 py-1.5 text-xs hover:bg-secondary"
                      >
                        Mark read
                      </button>
                    ) : null}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
