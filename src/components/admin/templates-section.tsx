import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Search,
  Lock,
  Pencil,
  Copy,
  FileDown,
  Trash2,
  List,
  LayoutTemplate,
  FileText,
  User,
  Building2,
} from "lucide-react";
import {
  getTemplates,
  upsertTemplate,
  duplicateTemplate,
  deleteTemplate,
} from "@/lib/templates.functions";

const TYPES = ["Lesson Plan", "Quiz", "Project"];
const GRADES = ["Grade 5", "Grade 6", "Grade 7", "Grade 8", "Grade 9", "Grade 10"];
const SUBJECTS = ["Science", "Maths", "Robotics", "Coding", "AI", "STEM"];

function Panel({
  title,
  action,
  children,
}: {
  title?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-primary/25 bg-card p-4 md:p-5">
      {(title || action) && (
        <div className="mb-4 flex items-center justify-between gap-3">
          {title && (
            <h3 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              {title}
            </h3>
          )}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

const selectClass =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm";

export function TemplatesSection() {
  const [view, setView] = useState<"list" | "templates">("list");
  const [search, setSearch] = useState("");
  const [type, setType] = useState("");
  const [grade, setGrade] = useState("");
  const [subject, setSubject] = useState("");
  const [creating, setCreating] = useState(false);

  const fetchTemplates = useServerFn(getTemplates);
  const saveFn = useServerFn(upsertTemplate);
  const dupFn = useServerFn(duplicateTemplate);
  const delFn = useServerFn(deleteTemplate);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["templates"],
    queryFn: () => fetchTemplates(),
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["templates"] });
  const save = useMutation({ mutationFn: saveFn, onSuccess: () => { invalidate(); setCreating(false); } });
  const dup = useMutation({ mutationFn: dupFn, onSuccess: invalidate });
  const del = useMutation({ mutationFn: delFn, onSuccess: invalidate });

  const rows = useMemo(() => {
    const list = data?.templates ?? [];
    return list.filter(
      (t) =>
        (!search || t.title.toLowerCase().includes(search.toLowerCase())) &&
        (!type || t.template_type === type) &&
        (!grade || t.grade === grade) &&
        (!subject || t.subject === subject),
    );
  }, [data, search, type, grade, subject]);

  const canCreate = data?.canCreate ?? false;

  return (
    <div className="space-y-5">
      {/* View switch */}
      <div className="flex items-center justify-end gap-6 border-b border-border pb-2 text-sm">
        <button
          onClick={() => setView("list")}
          className={`flex items-center gap-2 pb-2 ${view === "list" ? "border-b-2 border-primary font-medium text-primary" : "text-muted-foreground"}`}
        >
          <List className="h-4 w-4" /> List View
        </button>
        <button
          onClick={() => setView("templates")}
          className={`flex items-center gap-2 pb-2 ${view === "templates" ? "border-b-2 border-primary font-medium text-primary" : "text-muted-foreground"}`}
        >
          <LayoutTemplate className="h-4 w-4" /> Templates
        </button>
      </div>

      {view === "list" ? (
        <div className="space-y-5 rounded-xl border border-primary/25 bg-card p-4 md:p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold">My Creations</h2>
              <p className="text-sm text-muted-foreground">
                Manage your lesson plans, quizzes, and projects
              </p>
            </div>
            {canCreate && (
              <button
                onClick={() => setCreating((v) => !v)}
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
              >
                {creating ? "Cancel" : "Create New"}
              </button>
            )}
          </div>

          {creating && canCreate && (
            <Panel title="New Template">
              <form
                className="grid gap-3 md:grid-cols-5"
                onSubmit={(e) => {
                  e.preventDefault();
                  const f = new FormData(e.currentTarget);
                  save.mutate({
                    data: {
                      title: String(f.get("title") ?? ""),
                      board: String(f.get("board") ?? "CBSE"),
                      template_type: String(f.get("template_type") ?? "Lesson Plan"),
                      grade: String(f.get("grade") ?? ""),
                      subject: String(f.get("subject") ?? ""),
                      is_draft: true,
                      is_published: false,
                    },
                  });
                }}
              >
                <input name="title" required placeholder="Title" className={selectClass} />
                <input name="board" defaultValue="CBSE" placeholder="Board" className={selectClass} />
                <select name="template_type" className={selectClass}>
                  {TYPES.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
                <select name="grade" className={selectClass}>
                  {GRADES.map((g) => (
                    <option key={g}>{g}</option>
                  ))}
                </select>
                <div className="flex gap-2">
                  <select name="subject" className={selectClass}>
                    {SUBJECTS.map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                  <button
                    type="submit"
                    disabled={save.isPending}
                    className="rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
                  >
                    Save
                  </button>
                </div>
              </form>
            </Panel>
          )}

          <Panel title="Filters">
            <div className="grid gap-4 md:grid-cols-4">
              <label className="space-y-1 text-sm">
                <span className="text-muted-foreground">Search</span>
                <span className="flex items-center gap-2 rounded-md border border-input bg-background px-3">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search Title..."
                    className="w-full bg-transparent py-2 text-sm outline-none"
                  />
                </span>
              </label>
              <label className="space-y-1 text-sm">
                <span className="text-muted-foreground">Type</span>
                <select value={type} onChange={(e) => setType(e.target.value)} className={selectClass}>
                  <option value="">All Types</option>
                  {TYPES.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </label>
              <label className="space-y-1 text-sm">
                <span className="text-muted-foreground">Grade</span>
                <select value={grade} onChange={(e) => setGrade(e.target.value)} className={selectClass}>
                  <option value="">All Grades</option>
                  {GRADES.map((g) => (
                    <option key={g}>{g}</option>
                  ))}
                </select>
              </label>
              <label className="space-y-1 text-sm">
                <span className="text-muted-foreground">Subject</span>
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className={selectClass}
                >
                  <option value="">All Subjects</option>
                  {SUBJECTS.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </label>
            </div>
          </Panel>

          <Panel title="My Creations">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                    <th className="py-2 pr-3">No.</th>
                    <th className="py-2 pr-3">Title</th>
                    <th className="py-2 pr-3">Type</th>
                    <th className="py-2 pr-3">Grade</th>
                    <th className="py-2 pr-3">Subject</th>
                    <th className="py-2 pr-3">Status</th>
                    <th className="py-2 pr-3">Last Updated</th>
                    <th className="py-2 pr-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading && (
                    <tr>
                      <td colSpan={8} className="py-6 text-center text-muted-foreground">
                        Loading…
                      </td>
                    </tr>
                  )}
                  {!isLoading && rows.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-6 text-center text-muted-foreground">
                        No templates found.
                      </td>
                    </tr>
                  )}
                  {rows.map((t, i) => (
                    <tr key={t.id} className="border-b border-border/60">
                      <td className="py-3 pr-3">{i + 1}</td>
                      <td className="py-3 pr-3">
                        <span className="flex items-start gap-2">
                          <FileText className="mt-0.5 h-4 w-4 text-primary" />
                          <span>
                            <span className="block font-medium">{t.title}</span>
                            <span className="text-xs text-muted-foreground">{t.board}</span>
                          </span>
                        </span>
                      </td>
                      <td className="py-3 pr-3">{t.template_type}</td>
                      <td className="py-3 pr-3">{t.grade}</td>
                      <td className="py-3 pr-3">{t.subject}</td>
                      <td className="py-3 pr-3">
                        <span className="flex flex-wrap gap-1">
                          {t.is_draft && (
                            <span className="rounded bg-foreground/85 px-1.5 py-0.5 text-[10px] font-semibold text-background">
                              Draft
                            </span>
                          )}
                          {t.is_published && (
                            <span className="rounded bg-emerald-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                              Published
                            </span>
                          )}
                        </span>
                      </td>
                      <td className="py-3 pr-3 text-muted-foreground">
                        {new Date(t.updated_at).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </td>
                      <td className="py-3 pr-3">
                        <span className="flex items-center gap-2">
                          <button
                            title="Toggle publish"
                            onClick={() =>
                              save.mutate({
                                data: {
                                  id: t.id,
                                  title: t.title,
                                  board: t.board,
                                  template_type: t.template_type,
                                  grade: t.grade,
                                  subject: t.subject,
                                  is_draft: t.is_draft,
                                  is_published: !t.is_published,
                                },
                              })
                            }
                            className="text-primary"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            title="Duplicate"
                            onClick={() => dup.mutate({ data: { id: t.id } })}
                            className="text-muted-foreground"
                          >
                            <Copy className="h-4 w-4" />
                          </button>
                          <button title="Export" className="text-destructive/80">
                            <FileDown className="h-4 w-4" />
                          </button>
                          <button
                            title="Delete"
                            onClick={() => del.mutate({ data: { id: t.id } })}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </div>
      ) : (
        <TemplateAccess
          count={canCreate ? (data?.templates.length ?? 0) : 0}
          canCreate={canCreate}
          role={data?.role ?? "Employee"}
        />
      )}
    </div>
  );
}

function TemplateAccess({
  count,
  canCreate,
  role,
}: {
  count: number;
  canCreate: boolean;
  role: string;
}) {
  return (
    <div className="space-y-5">
      <Panel>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-base font-bold">Template Access</h3>
            <p className="text-sm text-muted-foreground">
              {canCreate
                ? "You have full template creation access"
                : "Contact administrator to get template creation access"}
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-primary">{count}</div>
            <div className="text-[11px] text-muted-foreground">Accessible Templates</div>
          </div>
        </div>
      </Panel>

      <Panel>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h3 className="text-base font-bold">Welcome back</h3>
            <p className="text-sm">
              Role: <span className="font-medium text-primary">{role}</span>
            </p>
            {!canCreate && (
              <p className="mt-1 flex items-center gap-1 text-sm text-primary">
                <Lock className="h-3.5 w-3.5" /> Template creation restricted
              </p>
            )}
          </div>
          <div className="text-right">
            <div className="text-[11px] text-muted-foreground">Organization</div>
            <div className="font-bold">Kaleidonex</div>
          </div>
        </div>
      </Panel>

      <Panel>
        {canCreate ? (
          <div className="py-10 text-center">
            <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-secondary">
              <LayoutTemplate className="h-7 w-7 text-primary" />
            </span>
            <h3 className="mt-4 text-xl font-bold">Template Creation Enabled</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Switch to List View to create and manage lesson plans, quizzes and projects.
            </p>
          </div>
        ) : (
          <div className="py-10 text-center">
            <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-secondary">
              <Lock className="h-7 w-7 text-primary" />
            </span>
            <h3 className="mt-4 text-xl font-bold">Template Creation Restricted</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              You don't have permission to create templates. Please contact your administrator to
              get access to template creation features.
            </p>
            <div className="mx-auto mt-6 max-w-md rounded-lg border border-primary/25 bg-secondary/40 p-4 text-left text-sm">
              <p className="mb-3 text-center font-semibold">Your Current Permissions</p>
              <p className="flex items-center gap-2">
                <LayoutTemplate className="h-4 w-4 text-muted-foreground" /> Template Creation:{" "}
                <span className="text-primary">Disabled</span>
              </p>
              <p className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" /> Role:{" "}
                <span className="text-primary">{role}</span>
              </p>
              <p className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" /> Organization:{" "}
                <span className="text-primary">Kaleidonex</span>
              </p>
            </div>
          </div>
        )}
      </Panel>
    </div>
  );
}
