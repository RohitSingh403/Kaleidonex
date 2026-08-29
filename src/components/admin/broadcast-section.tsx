import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Megaphone, Trash2 } from "lucide-react";
import {
  DataTable,
  EmptyState,
  Field,
  LoadingBlock,
  Panel,
  btnGhost,
  btnPrimary,
  inputClass,
} from "@/components/admin/workforce-ui";
import {
  deleteBroadcast,
  getBroadcasts,
  publishBroadcast,
  setBroadcastPublished,
} from "@/lib/org.functions";

const CATEGORIES = ["Policy", "Announcement", "Compliance", "Holiday", "Town hall"];

export function BroadcastSection() {
  const qc = useQueryClient();
  const fetchBroadcasts = useServerFn(getBroadcasts);
  const publish = useServerFn(publishBroadcast);
  const setPublished = useServerFn(setBroadcastPublished);
  const remove = useServerFn(deleteBroadcast);

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]!);
  const [notify, setNotify] = useState(true);
  const [busy, setBusy] = useState(false);

  const q = useQuery({ queryKey: ["broadcasts"], queryFn: () => fetchBroadcasts({}) });

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await publish({ data: { title, body, category, notify } });
      toast.success(
        res.recipients > 0 ? `Published — ${res.recipients} people notified.` : "Published.",
      );
      setTitle("");
      setBody("");
      await qc.invalidateQueries({ queryKey: ["broadcasts"] });
      await qc.invalidateQueries({ queryKey: ["announcements"] });
    } catch (err) {
      toast.error((err as Error).message || "Could not publish");
    } finally {
      setBusy(false);
    }
  }

  const rows = q.data ?? [];

  return (
    <div className="space-y-4">
      <Panel title="Company-wide broadcast" description="Publish a policy or announcement to every member of staff">
        <form onSubmit={submit} className="grid gap-3 md:grid-cols-2">
          <Field label="Title">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="Updated leave policy"
              className={inputClass}
            />
          </Field>
          <Field label="Category">
            <select value={category} onChange={(e) => setCategory(e.target.value)} className={inputClass}>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </Field>
          <div className="md:col-span-2">
            <Field label="Message">
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                required
                rows={5}
                placeholder="Write the policy or announcement details…"
                className={`${inputClass} resize-y`}
              />
            </Field>
          </div>
          <label className="flex items-center gap-2 text-sm text-muted-foreground md:col-span-2">
            <input type="checkbox" checked={notify} onChange={(e) => setNotify(e.target.checked)} />
            Send an in-app notification to all staff
          </label>
          <div className="md:col-span-2">
            <button type="submit" disabled={busy} className={`${btnPrimary} disabled:opacity-60`}>
              <Megaphone className="h-4 w-4" />
              {busy ? "Publishing…" : "Publish broadcast"}
            </button>
          </div>
        </form>
      </Panel>

      <Panel title="Published broadcasts" description="Unpublish to hide from staff dashboards">
        {q.isLoading ? (
          <LoadingBlock rows={4} />
        ) : rows.length === 0 ? (
          <EmptyState icon={Megaphone} title="No broadcasts yet" hint="Your first company-wide message will appear here." />
        ) : (
          <DataTable headers={["Title", "Category", "Audience", "Status", "Date", ""]} isEmpty={false}>
            {rows.map((b) => (
              <tr key={b.id} className="border-b border-border last:border-0">
                <td className="px-3 py-2.5">
                  <p className="font-medium">{b.title}</p>
                  <p className="max-w-md truncate text-xs text-muted-foreground">{b.body}</p>
                </td>
                <td className="px-3 py-2.5 text-sm">{b.category}</td>
                <td className="px-3 py-2.5 text-sm capitalize">{b.audience}</td>
                <td className="px-3 py-2.5 text-sm">{b.published ? "Published" : "Draft"}</td>
                <td className="px-3 py-2.5 text-sm text-muted-foreground">
                  {new Date(b.created_at).toLocaleDateString()}
                </td>
                <td className="px-3 py-2.5">
                  <div className="flex flex-wrap justify-end gap-2">
                    <button
                      className={btnGhost}
                      onClick={async () => {
                        try {
                          await setPublished({ data: { id: b.id, published: !b.published } });
                          await qc.invalidateQueries({ queryKey: ["broadcasts"] });
                        } catch (err) {
                          toast.error((err as Error).message);
                        }
                      }}
                    >
                      {b.published ? "Unpublish" : "Publish"}
                    </button>
                    <button
                      className={`${btnGhost} text-destructive`}
                      onClick={async () => {
                        if (!confirm(`Delete "${b.title}"?`)) return;
                        try {
                          await remove({ data: { id: b.id } });
                          await qc.invalidateQueries({ queryKey: ["broadcasts"] });
                        } catch (err) {
                          toast.error((err as Error).message);
                        }
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </DataTable>
        )}
      </Panel>
    </div>
  );
}
