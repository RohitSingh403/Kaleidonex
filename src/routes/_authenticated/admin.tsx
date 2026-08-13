import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import {
  LayoutDashboard,
  Inbox,
  Package,
  BookOpen,
  School as SchoolIcon,
  Users,
  GraduationCap,
  Receipt,
  UserCircle,
  Flag,
  CreditCard,
  CalendarCheck,
  ShieldCheck,
  Menu,
  Folder,
  Share2,
  Settings,
  LogOut,
  ChevronUp,
  LayoutTemplate,
  Sparkles,
  ListTodo,
  type LucideIcon,
  Megaphone,
  MapPinned,
} from "lucide-react";

import {
  getDashboardStats,
  getLeads,
  updateLeadStatus,
  deleteLead,
  getProducts,
  upsertProduct,
  deleteProduct,
  getProgrammes,
  upsertProgramme,
  deleteProgramme,
  getSchools,
  upsertSchool,
  deleteSchool,
  getTeachers,
  upsertTeacher,
  deleteTeacher,
  getUsers,
  setUserRole,
  type AdminUser,
} from "@/lib/admin.functions";
import { StudentsSection } from "@/components/admin/students-section";
import { ExpenseClaimSection } from "@/components/admin/expense-claim-section";
import { MyPanelSection } from "@/components/admin/my-panel-section";
import { TemplatesSection } from "@/components/admin/templates-section";
import { AiSection } from "@/components/admin/ai-section";
import { TaskBoardSection } from "@/components/admin/taskboard-section";
import { SocialMediaSection } from "@/components/admin/social-media-section";
import { OurCentresSection } from "@/components/admin/our-centres-section";


export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Admin Dashboard — KaleidoNex" },
      { name: "description", content: "Manage leads, content, schools, teachers and users." },
    ],
  }),
  component: AdminDashboard,
});

type Tab =
  | "overview"
  | "students"
  | "claims"
  | "mypanel"
  | "myleave"
  | "mysalary"
  | "myattendance"
  | "templates"
  | "ai"
  | "tasks"
  | "social"
  | "centres";


const tabs: { id: Tab; label: string; icon: LucideIcon }[] = [
  { id: "overview", label: "Dashboard", icon: LayoutDashboard },
  { id: "students", label: "Students", icon: GraduationCap },
  { id: "claims", label: "Expense Claim", icon: Receipt },
  { id: "mypanel", label: "My Panel", icon: UserCircle },
  { id: "myleave", label: "My Leave", icon: Flag },
  { id: "mysalary", label: "My Salary", icon: CreditCard },
  { id: "myattendance", label: "My Attendance", icon: CalendarCheck },
  { id: "templates", label: "Templates", icon: LayoutTemplate },
  { id: "ai", label: "Ai", icon: Sparkles },
  { id: "tasks", label: "My Task", icon: ListTodo },
  { id: "social", label: "Social Media", icon: Megaphone },
  { id: "centres", label: "Our Centres", icon: MapPinned },
];

function AdminDashboard() {
  const [tab, setTab] = useState<Tab>("overview");
  const [menuOpen, setMenuOpen] = useState(false);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { user } = Route.useRouteContext();
  const active = tabs.find((t) => t.id === tab)!;

  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="flex min-h-screen bg-muted/40">
      {/* Dark icon rail */}
      <div className="hidden w-14 shrink-0 flex-col items-center gap-6 bg-ink py-4 text-ink-foreground md:flex">
        <Link
          to="/"
          className="grid h-9 w-9 place-items-center rounded-lg bg-accent font-display text-lg font-bold text-accent-foreground"
        >
          K
        </Link>
        <button
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Toggle menu"
          className="rounded-md p-2 text-ink-foreground/70 transition-colors hover:bg-primary/30 hover:text-ink-foreground"
        >
          <Menu className="h-5 w-5" />
        </button>
        <button
          onClick={() => setTab("templates")}
          aria-label="Content"
          className="rounded-md p-2 text-ink-foreground/70 transition-colors hover:bg-primary/30 hover:text-ink-foreground"
        >
          <Folder className="h-5 w-5" />
        </button>
        <button
          onClick={() => setTab("social")}
          aria-label="Network"
          className="rounded-md p-2 text-ink-foreground/70 transition-colors hover:bg-primary/30 hover:text-ink-foreground"
        >
          <Share2 className="h-5 w-5" />
        </button>
        <button
          onClick={() => setTab("mypanel")}
          aria-label="Settings"
          className="rounded-md p-2 text-ink-foreground/70 transition-colors hover:bg-primary/30 hover:text-ink-foreground"
        >
          <Settings className="h-5 w-5" />
        </button>

      </div>

      {/* Working menu */}
      {!menuOpen && (
        <aside className="hidden w-56 shrink-0 flex-col border-r border-border bg-card md:flex">
          <div className="px-5 py-5">
            <Link to="/" className="font-display text-2xl font-bold tracking-tight">
              <span className="text-accent">K</span>aleido<span className="text-accent">n</span>ex
            </Link>
          </div>
          <div className="px-5">
            <p className="text-sm font-semibold text-accent">Working Menu</p>
            <div className="mt-3 h-px bg-border" />
          </div>
          <nav className="flex-1 space-y-1 p-3">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors ${tab === t.id
                    ? "bg-secondary font-semibold text-primary"
                    : "text-foreground/70 hover:bg-secondary/60 hover:text-foreground"
                  }`}
              >
                <t.icon className={`h-4 w-4 ${tab === t.id ? "text-accent" : "text-accent/70"}`} />
                {t.label}
              </button>
            ))}
          </nav>
          <div className="p-3">
            <button
              onClick={handleSignOut}
              className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm text-muted-foreground transition-colors hover:bg-secondary"
            >
              <LogOut className="h-4 w-4" /> Sign out
            </button>
          </div>
        </aside>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <header className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-card px-3 py-3 sm:px-4">
          <select
            value={tab}
            onChange={(e) => setTab(e.target.value as Tab)}
            className="min-w-0 max-w-[55vw] flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm md:hidden"
          >
            {tabs.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
          <div className="hidden md:block" />
          <div className="flex min-w-0 items-center gap-2">
            <div className="flex min-w-0 items-center gap-2 rounded-full border border-border bg-background px-2 py-1.5 pr-3 sm:pr-4">
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-secondary text-xs font-bold text-primary">
                {(user?.email ?? "A").slice(0, 1).toUpperCase()}
              </span>
              <span className="max-w-[7rem] truncate text-sm font-medium sm:max-w-[12rem]">
                {(user?.user_metadata?.["full_name"] as string) || user?.email || "Admin"}
              </span>
            </div>
            <button
              onClick={handleSignOut}
              aria-label="Sign out"
              className="rounded-md border border-border p-2 text-muted-foreground transition-colors hover:bg-secondary md:hidden"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </header>


        {/* Breadcrumb strip */}
        <div className="border-b border-border bg-card px-3 pb-3 sm:px-4 md:px-6">
          <h1 className="truncate text-base font-bold sm:text-lg">{active.label}</h1>
          <p className="mt-1 text-[11px] uppercase tracking-wide text-muted-foreground">
            KaleidoNex / Admin / {active.label}
          </p>
        </div>


        <main className="min-w-0 flex-1 overflow-x-hidden overflow-y-auto p-3 sm:p-4 md:p-6">
          {tab === "overview" && <OverviewSection onNavigate={setTab} />}
          {tab === "students" && <StudentsSection />}
          {tab === "claims" && <ExpenseClaimSection />}
          {tab === "mypanel" && <MyPanelSection />}
          {tab === "myleave" && <MyPanelSection only="leave" />}
          {tab === "mysalary" && <MyPanelSection only="salary" />}
          {tab === "myattendance" && <MyPanelSection only="attendance" />}
          {tab === "templates" && <TemplatesSection />}
          {tab === "ai" && <AiSection />}
          {tab === "tasks" && <TaskBoardSection />}
          {tab === "social" && <SocialMediaSection />}
          {tab === "centres" && <OurCentresSection />}
        </main>

        <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-border bg-card px-4 py-4 text-xs text-muted-foreground sm:px-6">
          <span>Copyright © {new Date().getFullYear()} KaleidoNex</span>
          <span className="flex gap-4">
            <Link to="/curriculum">Curriculum</Link>
            <Link to="/contact">Support</Link>
          </span>
        </footer>
      </div>
    </div>
  );
}

// ─── Overview ────────────────────────────────────────────

function Panel({ title, children }: { title: string; children: ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <section className="rounded-xl border border-border bg-card shadow-soft">
      <div className="flex items-center justify-between border-b border-border px-5 py-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-primary">{title}</h2>
        <button
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle panel"
          className="text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronUp className={`h-4 w-4 transition-transform ${open ? "" : "rotate-180"}`} />
        </button>
      </div>
      {open ? <div className="p-5">{children}</div> : null}
    </section>
  );
}

function OverviewSection({ onNavigate }: { onNavigate: (t: Tab) => void }) {
  const fetchStats = useServerFn(getDashboardStats);
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: () => fetchStats(),
  });

  if (isLoading) return <Loading />;
  if (!data) return <p className="text-sm text-muted-foreground">No data available.</p>;

  const tiles: { label: string; icon: LucideIcon; badge?: number; tab: Tab }[] = [
    { label: "Students", icon: GraduationCap, tab: "students" },
    { label: "Expense Claim", icon: Receipt, tab: "claims" },
    { label: "My Panel", icon: UserCircle, tab: "mypanel" },
    { label: "Templates", icon: LayoutTemplate, tab: "templates" },
    { label: "My Task", icon: ListTodo, tab: "tasks" },
    { label: "Ai", icon: Sparkles, tab: "ai" },
  ];


  const bars = [
    { label: "Leads", value: data.leads },
    { label: "New leads", value: data.newLeads },
    { label: "Products", value: data.products },
    { label: "Schools", value: data.schools },
    { label: "Teachers", value: data.teachers },
  ];
  const max = Math.max(1, ...bars.map((b) => b.value));

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {tiles.map((t) => (
          <button
            key={t.label}
            onClick={() => onNavigate(t.tab)}
            className="relative grid place-items-center gap-2 rounded-xl border border-border bg-card px-3 py-6 shadow-soft transition-shadow hover:shadow-lift"
          >
            {t.badge ? (
              <span className="absolute -left-1 top-3 rounded-r bg-accent px-1.5 py-0.5 text-[10px] font-bold text-accent-foreground">
                {t.badge}
              </span>
            ) : null}
            <t.icon className="h-6 w-6 text-ink" />
            <span className="text-sm text-muted-foreground">{t.label}</span>
          </button>
        ))}
      </div>

      <Panel title="Platform report">
        <p className="text-xs text-muted-foreground">Live totals across your KaleidoNex workspace.</p>
        <div className="mt-6 flex h-56 items-end gap-6 border-b border-l border-border px-4 pb-0">
          {bars.map((b) => (
            <div key={b.label} className="flex flex-1 flex-col items-center justify-end gap-2">
              <span className="text-xs font-semibold">{b.value}</span>
              <div
                className="w-full max-w-16 rounded-t bg-primary/80"
                style={{ height: `${(b.value / max) * 170}px` }}
              />
            </div>
          ))}
        </div>
        <div className="mt-2 flex gap-6 px-4">
          {bars.map((b) => (
            <span key={b.label} className="flex-1 text-center text-[11px] text-muted-foreground">
              {b.label}
            </span>
          ))}
        </div>
      </Panel>

      <div className="grid gap-5 lg:grid-cols-2">
        <Panel title="Pipeline health">
          <ul className="space-y-4 text-sm">
            {[
              { label: "New leads", value: data.newLeads, total: Math.max(1, data.leads) },
              { label: "Active schools", value: data.activeSchools, total: Math.max(1, data.schools) },
              { label: "Active teachers", value: data.activeTeachers, total: Math.max(1, data.teachers) },
            ].map((row) => (
              <li key={row.label}>
                <div className="flex justify-between">
                  <span>{row.label}</span>
                  <span className="text-muted-foreground">
                    {Math.round((row.value / row.total) * 100)}%
                  </span>
                </div>
                <div className="mt-1.5 h-1.5 rounded-full bg-secondary">
                  <div
                    className="h-1.5 rounded-full bg-accent"
                    style={{ width: `${Math.min(100, (row.value / row.total) * 100)}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Catalogue snapshot">
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-muted-foreground">Products</dt>
              <dd className="text-2xl font-bold">{data.products}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Schools</dt>
              <dd className="text-2xl font-bold">{data.schools}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Teachers</dt>
              <dd className="text-2xl font-bold">{data.teachers}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Total leads</dt>
              <dd className="text-2xl font-bold">{data.leads}</dd>
            </div>
          </dl>
        </Panel>
      </div>
    </div>
  );
}


// ─── Leads ───────────────────────────────────────────────

type Lead = {
  id: string;
  type: "contact" | "demo";
  name: string;
  email: string;
  phone: string | null;
  school: string | null;
  enquiry_type: string | null;
  message: string;
  interests: string[] | null;
  status: "new" | "contacted" | "closed";
  created_at: string;
};

function LeadsSection() {
  const fetchLeads = useServerFn(getLeads);
  const updateStatusFn = useServerFn(updateLeadStatus);
  const deleteFn = useServerFn(deleteLead);
  const queryClient = useQueryClient();

  const { data: leads, isLoading } = useQuery({
    queryKey: ["leads"],
    queryFn: () => fetchLeads(),
  });

  async function changeStatus(id: string, status: "new" | "contacted" | "closed") {
    await updateStatusFn({ data: { id, status } });
    queryClient.invalidateQueries({ queryKey: ["leads"] });
  }

  async function remove(id: string) {
    if (!confirm("Delete this lead?")) return;
    await deleteFn({ data: { id } });
    queryClient.invalidateQueries({ queryKey: ["leads"] });
  }

  if (isLoading) return <Loading />;
  if (!leads || leads.length === 0)
    return <EmptyState title="No leads yet" description="Form submissions will appear here." />;

  return (
    <div>
      <h1 className="text-2xl font-bold">Leads</h1>
      <p className="mt-1 text-sm text-muted-foreground">Contact and demo requests from the website.</p>
      <div className="mt-6 overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-secondary/50 text-left">
            <tr>
              <Th>Name</Th>
              <Th>Type</Th>
              <Th>Contact</Th>
              <Th>Message</Th>
              <Th>Status</Th>
              <Th>Date</Th>
              <Th>Actions</Th>
            </tr>
          </thead>
          <tbody>
            {(leads as Lead[]).map((lead) => (
              <tr key={lead.id} className="border-t border-border">
                <Td>
                  <span className="font-medium">{lead.name}</span>
                  {lead.school ? <span className="block text-xs text-muted-foreground">{lead.school}</span> : null}
                </Td>
                <Td>
                  <span className="rounded-full bg-secondary px-2 py-0.5 text-xs">{lead.type}</span>
                </Td>
                <Td>
                  <div className="text-xs">
                    <div>{lead.email}</div>
                    {lead.phone ? <div className="text-muted-foreground">{lead.phone}</div> : null}
                  </div>
                </Td>
                <Td>
                  <div className="max-w-xs truncate text-xs" title={lead.message}>
                    {lead.message}
                  </div>
                  {lead.interests && lead.interests.length > 0 ? (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {lead.interests.map((i) => (
                        <span key={i} className="rounded bg-secondary px-1.5 py-0.5 text-[10px]">
                          {i}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </Td>
                <Td>
                  <select
                    value={lead.status}
                    onChange={(e) => changeStatus(lead.id, e.target.value as Lead["status"])}
                    className="rounded-md border border-input bg-background px-2 py-1 text-xs"
                  >
                    <option value="new">New</option>
                    <option value="contacted">Contacted</option>
                    <option value="closed">Closed</option>
                  </select>
                </Td>
                <Td>
                  <span className="text-xs text-muted-foreground">
                    {new Date(lead.created_at).toLocaleDateString()}
                  </span>
                </Td>
                <Td>
                  <button
                    onClick={() => remove(lead.id)}
                    className="text-xs text-destructive hover:underline"
                  >
                    Delete
                  </button>
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Products ────────────────────────────────────────────

type Product = {
  id: string;
  name: string;
  category: string;
  price: string;
  stock: string;
  features: string[];
  published: boolean;
  sort_order: number;
};

function ProductsSection() {
  const fetchProducts = useServerFn(getProducts);
  const upsertFn = useServerFn(upsertProduct);
  const deleteFn = useServerFn(deleteProduct);
  const queryClient = useQueryClient();

  const { data: products, isLoading } = useQuery({
    queryKey: ["products-admin"],
    queryFn: () => fetchProducts(),
  });

  const [editing, setEditing] = useState<Product | null>(null);
  const [creating, setCreating] = useState(false);

  async function save(item: Partial<Product>) {
    await upsertFn({
      data: {
        ...(item.id ? { id: item.id } : {}),
        name: item.name ?? "",
        category: item.category ?? "",
        price: item.price ?? "",
        stock: item.stock ?? "In stock",
        features: item.features ?? [],
        published: item.published ?? true,
        sort_order: item.sort_order ?? 0,
      },
    });
    queryClient.invalidateQueries({ queryKey: ["products-admin"] });
    setEditing(null);
    setCreating(false);
  }

  async function remove(id: string) {
    if (!confirm("Delete this product?")) return;
    await deleteFn({ data: { id } });
    queryClient.invalidateQueries({ queryKey: ["products-admin"] });
  }

  if (isLoading) return <Loading />;

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Products</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage the product catalogue.</p>
        </div>
        <button
          onClick={() => setCreating(true)}
          className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
        >
          Add product
        </button>
      </div>

      <div className="mt-6 overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-secondary/50 text-left">
            <tr>
              <Th>Name</Th>
              <Th>Category</Th>
              <Th>Price</Th>
              <Th>Stock</Th>
              <Th>Published</Th>
              <Th>Actions</Th>
            </tr>
          </thead>
          <tbody>
            {(products as Product[] | undefined)?.map((p) => (
              <tr key={p.id} className="border-t border-border">
                <Td>
                  <span className="font-medium">{p.name}</span>
                  {p.features.length > 0 ? (
                    <span className="block text-xs text-muted-foreground">{p.features.join(" · ")}</span>
                  ) : null}
                </Td>
                <Td>{p.category}</Td>
                <Td>{p.price}</Td>
                <Td>{p.stock}</Td>
                <Td>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${p.published ? "bg-green-100 text-green-700" : "bg-secondary text-muted-foreground"
                      }`}
                  >
                    {p.published ? "Published" : "Draft"}
                  </span>
                </Td>
                <Td>
                  <div className="flex gap-2">
                    <button onClick={() => setEditing(p)} className="text-xs text-primary hover:underline">
                      Edit
                    </button>
                    <button onClick={() => remove(p.id)} className="text-xs text-destructive hover:underline">
                      Delete
                    </button>
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {(editing || creating) && (
        <ProductModal
          item={editing}
          onClose={() => {
            setEditing(null);
            setCreating(false);
          }}
          onSave={save}
        />
      )}
    </div>
  );
}

function ProductModal({
  item,
  onClose,
  onSave,
}: {
  item: Product | null;
  onClose: () => void;
  onSave: (item: Partial<Product>) => void;
}) {
  const [form, setForm] = useState({
    name: item?.name ?? "",
    category: item?.category ?? "",
    price: item?.price ?? "",
    stock: item?.stock ?? "In stock",
    features: item?.features.join("\n") ?? "",
    published: item?.published ?? true,
    sort_order: item?.sort_order ?? 0,
  });

  return (
    <Modal title={item ? "Edit product" : "Add product"} onClose={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSave({
            ...(item?.id ? { id: item.id } : {}),
            ...form,
            features: form.features.split("\n").map((f) => f.trim()).filter(Boolean),
          });
        }}
        className="grid gap-4"
      >
        <Input label="Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Category" value={form.category} onChange={(v) => setForm({ ...form, category: v })} />
          <Input label="Price" value={form.price} onChange={(v) => setForm({ ...form, price: v })} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Stock status" value={form.stock} onChange={(v) => setForm({ ...form, stock: v })} />
          <Input
            label="Sort order"
            type="number"
            value={String(form.sort_order)}
            onChange={(v) => setForm({ ...form, sort_order: parseInt(v) || 0 })}
          />
        </div>
        <label className="grid gap-2 text-sm font-medium">
          Features (one per line)
          <textarea
            value={form.features}
            onChange={(e) => setForm({ ...form, features: e.target.value })}
            rows={4}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
        </label>
        <label className="flex items-center gap-2 text-sm font-medium">
          <input
            type="checkbox"
            checked={form.published}
            onChange={(e) => setForm({ ...form, published: e.target.checked })}
            className="accent-primary"
          />
          Published
        </label>
        <div className="flex justify-end gap-3">
          <button type="button" onClick={onClose} className="rounded-md border border-input px-4 py-2 text-sm">
            Cancel
          </button>
          <button type="submit" className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
            Save
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ─── Programmes ──────────────────────────────────────────

type Programme = {
  id: string;
  name: string;
  type: string;
  summary: string;
  features: string[];
  published: boolean;
  sort_order: number;
};

function ProgrammesSection() {
  const fetchData = useServerFn(getProgrammes);
  const upsertFn = useServerFn(upsertProgramme);
  const deleteFn = useServerFn(deleteProgramme);
  const queryClient = useQueryClient();

  const { data: items, isLoading } = useQuery({
    queryKey: ["programmes-admin"],
    queryFn: () => fetchData(),
  });

  const [editing, setEditing] = useState<Programme | null>(null);
  const [creating, setCreating] = useState(false);

  async function save(item: Partial<Programme>) {
    await upsertFn({
      data: {
        ...(item.id ? { id: item.id } : {}),
        name: item.name ?? "",
        type: item.type ?? "solution",
        summary: item.summary ?? "",
        features: item.features ?? [],
        published: item.published ?? true,
        sort_order: item.sort_order ?? 0,
      },
    });
    queryClient.invalidateQueries({ queryKey: ["programmes-admin"] });
    setEditing(null);
    setCreating(false);
  }

  async function remove(id: string) {
    if (!confirm("Delete this programme?")) return;
    await deleteFn({ data: { id } });
    queryClient.invalidateQueries({ queryKey: ["programmes-admin"] });
  }

  if (isLoading) return <Loading />;

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Programmes</h1>
          <p className="mt-1 text-sm text-muted-foreground">Solutions and curriculum entries.</p>
        </div>
        <button
          onClick={() => setCreating(true)}
          className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
        >
          Add programme
        </button>
      </div>

      <div className="mt-6 overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-secondary/50 text-left">
            <tr>
              <Th>Name</Th>
              <Th>Type</Th>
              <Th>Summary</Th>
              <Th>Published</Th>
              <Th>Actions</Th>
            </tr>
          </thead>
          <tbody>
            {(items as Programme[] | undefined)?.map((p) => (
              <tr key={p.id} className="border-t border-border">
                <Td>
                  <span className="font-medium">{p.name}</span>
                  {p.features.length > 0 ? (
                    <span className="block text-xs text-muted-foreground">{p.features.join(" · ")}</span>
                  ) : null}
                </Td>
                <Td>
                  <span className="rounded-full bg-secondary px-2 py-0.5 text-xs">{p.type}</span>
                </Td>
                <Td>
                  <span className="max-w-xs truncate text-xs" title={p.summary}>
                    {p.summary}
                  </span>
                </Td>
                <Td>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${p.published ? "bg-green-100 text-green-700" : "bg-secondary text-muted-foreground"
                      }`}
                  >
                    {p.published ? "Published" : "Draft"}
                  </span>
                </Td>
                <Td>
                  <div className="flex gap-2">
                    <button onClick={() => setEditing(p)} className="text-xs text-primary hover:underline">
                      Edit
                    </button>
                    <button onClick={() => remove(p.id)} className="text-xs text-destructive hover:underline">
                      Delete
                    </button>
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {(editing || creating) && (
        <ProgrammeModal
          item={editing}
          onClose={() => {
            setEditing(null);
            setCreating(false);
          }}
          onSave={save}
        />
      )}
    </div>
  );
}

function ProgrammeModal({
  item,
  onClose,
  onSave,
}: {
  item: Programme | null;
  onClose: () => void;
  onSave: (item: Partial<Programme>) => void;
}) {
  const [form, setForm] = useState({
    name: item?.name ?? "",
    type: item?.type ?? "solution",
    summary: item?.summary ?? "",
    features: item?.features.join("\n") ?? "",
    published: item?.published ?? true,
    sort_order: item?.sort_order ?? 0,
  });

  return (
    <Modal title={item ? "Edit programme" : "Add programme"} onClose={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSave({
            ...(item?.id ? { id: item.id } : {}),
            ...form,
            features: form.features.split("\n").map((f) => f.trim()).filter(Boolean),
          });
        }}
        className="grid gap-4"
      >
        <Input label="Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
        <label className="grid gap-2 text-sm font-medium">
          Type
          <select
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="solution">Solution</option>
            <option value="curriculum">Curriculum</option>
          </select>
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Summary
          <textarea
            value={form.summary}
            onChange={(e) => setForm({ ...form, summary: e.target.value })}
            rows={3}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Features (one per line)
          <textarea
            value={form.features}
            onChange={(e) => setForm({ ...form, features: e.target.value })}
            rows={4}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Sort order"
            type="number"
            value={String(form.sort_order)}
            onChange={(v) => setForm({ ...form, sort_order: parseInt(v) || 0 })}
          />
          <label className="flex items-center gap-2 pt-6 text-sm font-medium">
            <input
              type="checkbox"
              checked={form.published}
              onChange={(e) => setForm({ ...form, published: e.target.checked })}
              className="accent-primary"
            />
            Published
          </label>
        </div>
        <div className="flex justify-end gap-3">
          <button type="button" onClick={onClose} className="rounded-md border border-input px-4 py-2 text-sm">
            Cancel
          </button>
          <button type="submit" className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
            Save
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ─── Schools ─────────────────────────────────────────────

type School = {
  id: string;
  name: string;
  city: string;
  contact_person: string;
  email: string;
  phone: string;
  model: string;
  status: "prospect" | "active" | "inactive";
};

function SchoolsSection() {
  const fetchData = useServerFn(getSchools);
  const upsertFn = useServerFn(upsertSchool);
  const deleteFn = useServerFn(deleteSchool);
  const queryClient = useQueryClient();

  const { data: items, isLoading } = useQuery({
    queryKey: ["schools-admin"],
    queryFn: () => fetchData(),
  });

  const [editing, setEditing] = useState<School | null>(null);
  const [creating, setCreating] = useState(false);

  async function save(item: Partial<School>) {
    await upsertFn({
      data: {
        ...(item.id ? { id: item.id } : {}),
        name: item.name ?? "",
        city: item.city ?? "",
        contact_person: item.contact_person ?? "",
        email: item.email ?? "",
        phone: item.phone ?? "",
        model: item.model ?? "School-funded",
        status: item.status ?? "prospect",
      },
    });
    queryClient.invalidateQueries({ queryKey: ["schools-admin"] });
    setEditing(null);
    setCreating(false);
  }

  async function remove(id: string) {
    if (!confirm("Delete this school?")) return;
    await deleteFn({ data: { id } });
    queryClient.invalidateQueries({ queryKey: ["schools-admin"] });
  }

  if (isLoading) return <Loading />;

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Schools</h1>
          <p className="mt-1 text-sm text-muted-foreground">Partner schools and prospects.</p>
        </div>
        <button
          onClick={() => setCreating(true)}
          className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
        >
          Add school
        </button>
      </div>

      <div className="mt-6 overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-secondary/50 text-left">
            <tr>
              <Th>Name</Th>
              <Th>City</Th>
              <Th>Contact</Th>
              <Th>Model</Th>
              <Th>Status</Th>
              <Th>Actions</Th>
            </tr>
          </thead>
          <tbody>
            {(items as School[] | undefined)?.map((s) => (
              <tr key={s.id} className="border-t border-border">
                <Td>
                  <span className="font-medium">{s.name}</span>
                </Td>
                <Td>{s.city}</Td>
                <Td>
                  <div className="text-xs">
                    <div>{s.contact_person}</div>
                    <div className="text-muted-foreground">{s.email}</div>
                    <div className="text-muted-foreground">{s.phone}</div>
                  </div>
                </Td>
                <Td>{s.model}</Td>
                <Td>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${s.status === "active"
                        ? "bg-green-100 text-green-700"
                        : s.status === "prospect"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-secondary text-muted-foreground"
                      }`}
                  >
                    {s.status}
                  </span>
                </Td>
                <Td>
                  <div className="flex gap-2">
                    <button onClick={() => setEditing(s)} className="text-xs text-primary hover:underline">
                      Edit
                    </button>
                    <button onClick={() => remove(s.id)} className="text-xs text-destructive hover:underline">
                      Delete
                    </button>
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {(editing || creating) && (
        <SchoolModal
          item={editing}
          onClose={() => {
            setEditing(null);
            setCreating(false);
          }}
          onSave={save}
        />
      )}
    </div>
  );
}

function SchoolModal({
  item,
  onClose,
  onSave,
}: {
  item: School | null;
  onClose: () => void;
  onSave: (item: Partial<School>) => void;
}) {
  const [form, setForm] = useState({
    name: item?.name ?? "",
    city: item?.city ?? "",
    contact_person: item?.contact_person ?? "",
    email: item?.email ?? "",
    phone: item?.phone ?? "",
    model: item?.model ?? "School-funded",
    status: item?.status ?? ("prospect" as School["status"]),
  });

  return (
    <Modal title={item ? "Edit school" : "Add school"} onClose={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSave({ ...(item?.id ? { id: item.id } : {}), ...form });
        }}
        className="grid gap-4"
      >
        <Input label="School name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
        <Input label="City" value={form.city} onChange={(v) => setForm({ ...form, city: v })} />
        <Input label="Contact person" value={form.contact_person} onChange={(v) => setForm({ ...form, contact_person: v })} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
          <Input label="Phone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-2 text-sm font-medium">
            Model
            <select
              value={form.model}
              onChange={(e) => setForm({ ...form, model: e.target.value })}
              className="rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option>School-funded</option>
              <option>Parent-funded</option>
              <option>Hybrid</option>
            </select>
          </label>
          <label className="grid gap-2 text-sm font-medium">
            Status
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value as School["status"] })}
              className="rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="prospect">Prospect</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </label>
        </div>
        <div className="flex justify-end gap-3">
          <button type="button" onClick={onClose} className="rounded-md border border-input px-4 py-2 text-sm">
            Cancel
          </button>
          <button type="submit" className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
            Save
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ─── Teachers ────────────────────────────────────────────

type Teacher = {
  id: string;
  name: string;
  email: string;
  phone: string;
  school_id: string | null;
  specialization: string;
  status: "active" | "inactive";
  schools: { name: string } | null;
};

function TeachersSection() {
  const fetchData = useServerFn(getTeachers);
  const upsertFn = useServerFn(upsertTeacher);
  const deleteFn = useServerFn(deleteTeacher);
  const fetchSchoolsFn = useServerFn(getSchools);
  const queryClient = useQueryClient();

  const { data: items, isLoading } = useQuery({
    queryKey: ["teachers-admin"],
    queryFn: () => fetchData(),
  });
  const { data: schools } = useQuery({
    queryKey: ["schools-admin"],
    queryFn: () => fetchSchoolsFn(),
  });

  const [editing, setEditing] = useState<Teacher | null>(null);
  const [creating, setCreating] = useState(false);

  async function save(item: Partial<Teacher>) {
    await upsertFn({
      data: {
        ...(item.id ? { id: item.id } : {}),
        name: item.name ?? "",
        email: item.email ?? "",
        phone: item.phone ?? "",
        school_id: item.school_id ?? null,
        specialization: item.specialization ?? "",
        status: item.status ?? "active",
      },
    });
    queryClient.invalidateQueries({ queryKey: ["teachers-admin"] });
    setEditing(null);
    setCreating(false);
  }

  async function remove(id: string) {
    if (!confirm("Delete this teacher?")) return;
    await deleteFn({ data: { id } });
    queryClient.invalidateQueries({ queryKey: ["teachers-admin"] });
  }

  if (isLoading) return <Loading />;

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Teachers</h1>
          <p className="mt-1 text-sm text-muted-foreground">Certified teaching staff.</p>
        </div>
        <button
          onClick={() => setCreating(true)}
          className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
        >
          Add teacher
        </button>
      </div>

      <div className="mt-6 overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-secondary/50 text-left">
            <tr>
              <Th>Name</Th>
              <Th>Contact</Th>
              <Th>Specialization</Th>
              <Th>School</Th>
              <Th>Status</Th>
              <Th>Actions</Th>
            </tr>
          </thead>
          <tbody>
            {(items as Teacher[] | undefined)?.map((t) => (
              <tr key={t.id} className="border-t border-border">
                <Td>
                  <span className="font-medium">{t.name}</span>
                </Td>
                <Td>
                  <div className="text-xs">
                    <div>{t.email}</div>
                    <div className="text-muted-foreground">{t.phone}</div>
                  </div>
                </Td>
                <Td>{t.specialization}</Td>
                <Td>{t.schools?.name ?? "—"}</Td>
                <Td>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${t.status === "active" ? "bg-green-100 text-green-700" : "bg-secondary text-muted-foreground"
                      }`}
                  >
                    {t.status}
                  </span>
                </Td>
                <Td>
                  <div className="flex gap-2">
                    <button onClick={() => setEditing(t)} className="text-xs text-primary hover:underline">
                      Edit
                    </button>
                    <button onClick={() => remove(t.id)} className="text-xs text-destructive hover:underline">
                      Delete
                    </button>
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {(editing || creating) && (
        <TeacherModal
          item={editing}
          schools={(schools as School[] | undefined) ?? []}
          onClose={() => {
            setEditing(null);
            setCreating(false);
          }}
          onSave={save}
        />
      )}
    </div>
  );
}

function TeacherModal({
  item,
  schools,
  onClose,
  onSave,
}: {
  item: Teacher | null;
  schools: School[];
  onClose: () => void;
  onSave: (item: Partial<Teacher>) => void;
}) {
  const [form, setForm] = useState({
    name: item?.name ?? "",
    email: item?.email ?? "",
    phone: item?.phone ?? "",
    school_id: item?.school_id ?? "",
    specialization: item?.specialization ?? "",
    status: item?.status ?? ("active" as Teacher["status"]),
  });

  return (
    <Modal title={item ? "Edit teacher" : "Add teacher"} onClose={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSave({
            ...(item?.id ? { id: item.id } : {}),
            ...form,
            school_id: form.school_id || null,
          });
        }}
        className="grid gap-4"
      >
        <Input label="Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
          <Input label="Phone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
        </div>
        <Input label="Specialization" value={form.specialization} onChange={(v) => setForm({ ...form, specialization: v })} />
        <label className="grid gap-2 text-sm font-medium">
          School
          <select
            value={form.school_id}
            onChange={(e) => setForm({ ...form, school_id: e.target.value })}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">— None —</option>
            {schools.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Status
          <select
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value as Teacher["status"] })}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </label>
        <div className="flex justify-end gap-3">
          <button type="button" onClick={onClose} className="rounded-md border border-input px-4 py-2 text-sm">
            Cancel
          </button>
          <button type="submit" className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
            Save
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ─── Users ───────────────────────────────────────────────

function UsersSection() {
  const fetchData = useServerFn(getUsers);
  const setRoleFn = useServerFn(setUserRole);
  const queryClient = useQueryClient();

  const { data: users, isLoading, error } = useQuery({
    queryKey: ["users-admin"],
    queryFn: () => fetchData(),
  });

  async function toggleRole(userId: string, role: "admin" | "editor", grant: boolean) {
    try {
      await setRoleFn({ data: { user_id: userId, role, action: grant ? "grant" : "revoke" } });
      queryClient.invalidateQueries({ queryKey: ["users-admin"] });
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update role");
    }
  }

  if (isLoading) return <Loading />;
  if (error)
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6">
        <h1 className="text-lg font-bold text-destructive">Access restricted</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Only admins can manage users. {error.message}
        </p>
      </div>
    );

  return (
    <div>
      <h1 className="text-2xl font-bold">Users</h1>
      <p className="mt-1 text-sm text-muted-foreground">Manage admin and editor access.</p>
      <div className="mt-6 overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-secondary/50 text-left">
            <tr>
              <Th>Name</Th>
              <Th>Email</Th>
              <Th>Roles</Th>
              <Th>Created</Th>
              <Th>Actions</Th>
            </tr>
          </thead>
          <tbody>
            {(users as AdminUser[] | undefined)?.map((u) => (
              <tr key={u.id} className="border-t border-border">
                <Td>
                  <span className="font-medium">{u.full_name || "—"}</span>
                </Td>
                <Td>{u.email}</Td>
                <Td>
                  <div className="flex flex-wrap gap-1">
                    {u.roles.map((r) => (
                      <span key={r} className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                        {r}
                      </span>
                    ))}
                    {u.roles.length === 0 && <span className="text-xs text-muted-foreground">No role</span>}
                  </div>
                </Td>
                <Td>
                  <span className="text-xs text-muted-foreground">
                    {new Date(u.created_at).toLocaleDateString()}
                  </span>
                </Td>
                <Td>
                  <div className="flex gap-2">
                    <button
                      onClick={() => toggleRole(u.id, "admin", !u.roles.includes("admin"))}
                      className={`text-xs hover:underline ${u.roles.includes("admin") ? "text-destructive" : "text-primary"
                        }`}
                    >
                      {u.roles.includes("admin") ? "Revoke admin" : "Make admin"}
                    </button>
                    <button
                      onClick={() => toggleRole(u.id, "editor", !u.roles.includes("editor"))}
                      className={`text-xs hover:underline ${u.roles.includes("editor") ? "text-destructive" : "text-primary"
                        }`}
                    >
                      {u.roles.includes("editor") ? "Revoke editor" : "Make editor"}
                    </button>
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Shared UI ───────────────────────────────────────────

function Loading() {
  return (
    <div className="py-20 text-center">
      <p className="text-sm text-muted-foreground">Loading…</p>
    </div>
  );
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div>
      <h1 className="text-2xl font-bold">{title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

function Th({ children }: { children: ReactNode }) {
  return <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{children}</th>;
}

function Td({ children }: { children: ReactNode }) {
  return <td className="px-4 py-3">{children}</td>;
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-auto rounded-2xl border border-border bg-card p-6 shadow-lift"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">{title}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <label className="grid gap-2 text-sm font-medium">
      {label}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
      />
    </label>
  );
}
