import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  Receipt,
  UserCircle,
  Flag,
  CreditCard,
  CalendarCheck,
  ShieldCheck,
  Settings,
  LogOut,
  ChevronUp,
  LayoutTemplate,
  Sparkles,
  ListTodo,
  type LucideIcon,
  Megaphone,
  MapPinned,
  BadgeCheck,
  User as UserIcon,
  UserCog,
  Building2,
  Network,
  Gauge,
  BarChart3,
  ScrollText,
  History,
  Bell,
  Upload,
  ClipboardList,
  MessageSquare,
  Wallet,
  Settings2,
  Trash2,
} from "lucide-react";

import { StudentsSection } from "@/components/admin/students-section";
import { ApprovalsSection } from "@/components/admin/approvals-section";
import { ExpenseClaimSection } from "@/components/admin/expense-claim-section";
import { MyPanelSection } from "@/components/admin/my-panel-section";
import { TemplatesSection } from "@/components/admin/templates-section";
import { AiSection } from "@/components/admin/ai-section";
import { TaskBoardSection } from "@/components/admin/taskboard-section";
import { SocialMediaSection } from "@/components/admin/social-media-section";
import { OurCentresSection } from "@/components/admin/our-centres-section";
import { EmploymentDetailsSection } from "@/components/admin/employment-details-section";
import { MyProfileSection, type ProfileTab } from "@/components/admin/my-profile-section";
import { SettingsSection } from "@/components/admin/settings-section";
import { TeamSection } from "@/components/admin/team-section";
import { getMyAccess } from "@/lib/team.functions";
import { ExecDashboard, type ExecTab } from "@/components/admin/exec-dashboard";
import { HrDashboard, type HrTab } from "@/components/admin/hr-dashboard";
import { EmployeeHome } from "@/components/admin/employee-home";
import { NotificationBell } from "@/components/admin/notification-bell";
import { PeopleOpsSection, type PeopleOpsTab } from "@/components/admin/people-ops-section";
import { OrgControlSection, type OrgControlTab } from "@/components/admin/org-control-section";
import { BroadcastSection } from "@/components/admin/broadcast-section";
import { MyRequestsSection } from "@/components/admin/my-requests-section";
import { NotificationsSection } from "@/components/admin/notifications-section";
import { PayrollSection } from "@/components/admin/payroll-section";
import { AdminSidebar } from "@/components/admin/admin-sidebar";

export type AdminSearch = {
  tab?: string | undefined;
};

export const Route = createFileRoute("/_authenticated/admin")({
  validateSearch: (search: Record<string, unknown>): AdminSearch => {
    const rawTab = search["tab"];
    return typeof rawTab === "string" ? { tab: rawTab } : {};
  },
  head: () => ({
    meta: [
      { title: "Workspace & Management — Kaleidonex" },
      { name: "description", content: "Manage workforce, attendance, leave, tasks, and system settings." },
    ],
  }),
  component: AdminDashboard,
});

type Tab =
  | "overview"
  | "console_exec"
  | "console_hr"
  | "console_me"
  | "exec_hr"
  | "exec_employees"
  | "exec_departments"
  | "exec_org"
  | "exec_attendance"
  | "exec_performance"
  | "exec_reports"
  | "exec_audit"
  | "approvals"
  | "payroll"
  | "hr_employees"
  | "hr_attendance"
  | "hr_leave"
  | "hr_tasks"
  | "hr_performance"
  | "hr_announcements"
  | "hr_reports"
  | "hr_analytics"
  | "hr_bulk"
  | "hr_onboarding"
  | "hr_reviews"
  | "ceo_analytics"
  | "ceo_budgets"
  | "ceo_settings"
  | "ceo_accounts"
  | "ceo_broadcast"
  | "team"
  | "students"
  | "claims"
  | "mypanel"
  | "myleave"
  | "mysalary"
  | "myattendance"
  | "templates"
  | "ai"
  | "tasks"
  | "myrequests"
  | "notifications"
  | "social"
  | "centres"
  | "employment"
  | "settings"
  | "profile";

const tabs: { id: Tab; label: string; icon: LucideIcon }[] = [
  { id: "overview", label: "Dashboard", icon: LayoutDashboard },
  { id: "console_exec", label: "CEO Dashboard", icon: Building2 },
  { id: "console_hr", label: "HR Dashboard", icon: UserCog },
  { id: "console_me", label: "Employee Dashboard", icon: UserCircle },
  { id: "exec_hr", label: "HR Management", icon: UserCog },
  { id: "exec_employees", label: "Employees", icon: Users },
  { id: "exec_departments", label: "Departments", icon: Building2 },
  { id: "exec_org", label: "Organization", icon: Network },
  { id: "exec_attendance", label: "Attendance", icon: CalendarCheck },
  { id: "exec_performance", label: "Performance", icon: Gauge },
  { id: "exec_reports", label: "Reports & Analytics", icon: BarChart3 },
  { id: "exec_audit", label: "Audit Logs", icon: ScrollText },
  { id: "approvals", label: "Approvals", icon: ShieldCheck },
  { id: "payroll", label: "Payroll & Salaries", icon: CreditCard },
  { id: "hr_employees", label: "Employees", icon: Users },
  { id: "hr_attendance", label: "Attendance", icon: CalendarCheck },
  { id: "hr_leave", label: "Leave Management", icon: Flag },
  { id: "hr_tasks", label: "Tasks & Projects", icon: ListTodo },
  { id: "hr_performance", label: "Performance", icon: Gauge },
  { id: "hr_announcements", label: "Announcements", icon: Megaphone },
  { id: "hr_reports", label: "HR Reports", icon: BarChart3 },
  { id: "hr_analytics", label: "People Analytics", icon: BarChart3 },
  { id: "hr_bulk", label: "Bulk Attendance", icon: Upload },
  { id: "hr_onboarding", label: "Onboarding", icon: ClipboardList },
  { id: "hr_reviews", label: "Reviews & 1:1", icon: MessageSquare },
  { id: "ceo_analytics", label: "Company Analytics", icon: BarChart3 },
  { id: "ceo_budgets", label: "Budgets & Cost Centres", icon: Wallet },
  { id: "ceo_settings", label: "Global Settings", icon: Settings2 },
  { id: "ceo_broadcast", label: "Company Broadcasts", icon: Megaphone },
  { id: "ceo_accounts", label: "Account Removal", icon: Trash2 },
  { id: "team", label: "Team", icon: Users },
  { id: "students", label: "Students", icon: GraduationCap },
  { id: "claims", label: "Expense Claims", icon: Receipt },
  { id: "mypanel", label: "My Panel", icon: UserCircle },
  { id: "myleave", label: "My Leave", icon: Flag },
  { id: "mysalary", label: "My Salary", icon: CreditCard },
  { id: "myattendance", label: "My Attendance", icon: CalendarCheck },
  { id: "templates", label: "Templates", icon: LayoutTemplate },
  { id: "ai", label: "AI Assistant", icon: Sparkles },
  { id: "tasks", label: "My Tasks", icon: ListTodo },
  { id: "myrequests", label: "My Requests", icon: History },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "social", label: "Social Media", icon: Megaphone },
  { id: "centres", label: "Our Centres", icon: MapPinned },
];

type NavGroup = { title: string; items: Tab[] };

const navGroups: Record<"ceo" | "hr" | "employee", NavGroup[]> = {
  ceo: [
    {
      title: "Executive Command",
      items: ["overview", "exec_org", "exec_departments", "exec_employees"],
    },
    {
      title: "Workforce Governance",
      items: ["approvals", "exec_attendance", "exec_performance", "exec_audit"],
    },
    {
      title: "Finance & Operations",
      items: ["payroll", "ceo_budgets", "ceo_broadcast", "ceo_settings"],
    },
    {
      title: "Academy & Centers",
      items: ["team", "students", "centres"],
    },
    {
      title: "Personal Workspace",
      items: ["mypanel", "myattendance", "myleave", "mysalary", "tasks", "claims"],
    },
  ],
  hr: [
    {
      title: "HR Command",
      items: ["overview", "hr_employees", "hr_onboarding", "hr_reviews"],
    },
    {
      title: "Attendance & Leaves",
      items: ["approvals", "payroll", "hr_attendance", "hr_bulk", "hr_leave"],
    },
    {
      title: "Talent & Reports",
      items: ["hr_performance", "hr_announcements", "hr_reports", "team"],
    },
    {
      title: "Personal Workspace",
      items: ["mypanel", "myattendance", "myleave", "mysalary", "tasks", "claims"],
    },
  ],
  employee: [
    {
      title: "Daily Workspace",
      items: ["overview", "myattendance", "myleave", "mysalary", "myrequests"],
    },
    {
      title: "Tasks & Claims",
      items: ["tasks", "claims", "approvals"],
    },
    {
      title: "Tools & Resources",
      items: ["templates", "ai", "notifications"],
    },
  ],
};

const tabLabelByScope: Partial<Record<"ceo" | "hr" | "employee", Partial<Record<Tab, string>>>> = {
  ceo: {
    overview: "Executive Dashboard",
    team: "Accounts & Roles",
    exec_org: "Organization Structure",
    exec_departments: "Departments",
    exec_employees: "Employee Directory",
    exec_attendance: "Attendance Governance",
    exec_performance: "Performance Reviews",
    exec_audit: "Audit Trail",
    payroll: "Employee Payroll & Salary",
    ceo_budgets: "Budgets & Cost Centres",
    ceo_broadcast: "Company Broadcasts",
    ceo_settings: "Global Settings",
  },
  hr: {
    overview: "HR Dashboard",
    team: "My Team",
    hr_employees: "Staff Directory",
    hr_onboarding: "Staff Onboarding",
    hr_reviews: "Reviews & 1:1",
    payroll: "Payroll & Salary Computation",
    hr_attendance: "Daily Attendance",
    hr_bulk: "Bulk Attendance",
    hr_leave: "Leave Management",
    hr_performance: "Performance",
    hr_announcements: "Announcements",
    hr_reports: "HR Reports",
  },
  employee: {
    overview: "My Overview",
    myattendance: "My Attendance",
    myleave: "My Leaves",
    mysalary: "My Salary & Slips",
    myrequests: "My Queries & Requests",
    tasks: "My Tasks",
    claims: "Expense Claims",
    templates: "Templates Library",
    ai: "AI Assistant",
  },
};

const PEOPLE_OPS_TABS: Partial<Record<Tab, PeopleOpsTab>> = {
  hr_analytics: "analytics",
  hr_bulk: "bulk",
  hr_onboarding: "onboarding",
  hr_reviews: "reviews",
};

const ORG_CONTROL_TABS: Partial<Record<Tab, OrgControlTab>> = {
  ceo_analytics: "analytics",
  ceo_budgets: "budgets",
  ceo_settings: "settings",
  ceo_accounts: "accounts",
};

const portalNameByScope: Record<"ceo" | "hr" | "employee", string> = {
  ceo: "Executive Suite",
  hr: "HR Operations",
  employee: "Employee Portal",
};

function AdminDashboard() {
  const search = Route.useSearch();
  const routeContext = Route.useRouteContext();
  const user = routeContext.user;
  const routeScope = (routeContext as { scope?: "ceo" | "hr" | "employee" }).scope ?? "employee";
  const routeRoles = (routeContext as { roles?: string[] }).roles ?? [];
  const routeIsSuper = (routeContext as { isSuper?: boolean }).isSuper ?? false;
  const routeIsHr = (routeContext as { isHr?: boolean }).isHr ?? false;

  const initialTab = (search.tab as Tab) || "overview";
  const [tab, setTabState] = useState<Tab>(initialTab);
  const [profileOpen, setProfileOpen] = useState(false);
  const [employmentTab, setEmploymentTab] = useState<"status" | "personal" | "documents">("status");
  const [profileTab, setProfileTab] = useState<ProfileTab>("profile");
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const fetchAccess = useServerFn(getMyAccess);
  const access = useQuery({
    queryKey: ["my-access"],
    queryFn: () => fetchAccess({}),
    initialData: {
      userId: user?.id ?? "",
      roles: routeRoles,
      isSuper: routeIsSuper,
      isHr: routeIsHr,
      scope: routeScope,
    },
    staleTime: 60_000,
  });

  const scope = access.data?.scope ?? routeScope ?? "employee";
  const groups = navGroups[scope];
  const labelFor = (t: { id: string; label: string }) =>
    tabLabelByScope[scope]?.[t.id as Tab] ?? t.label;

  useEffect(() => {
    const urlTab = (search.tab as Tab) || "overview";
    if (urlTab !== tab) {
      setTabState(urlTab);
    }
  }, [search.tab]);

  function setTab(newTab: Tab) {
    setTabState(newTab);
    const searchParams: AdminSearch = newTab === "overview" ? {} : { tab: newTab };
    navigate({
      to: "/admin",
      search: searchParams,
      replace: true,
    });
  }
  const visibleTabs = groups
    .flatMap((g) => g.items)
    .map((id) => tabs.find((t) => t.id === id)!)
    .filter(Boolean);
  const activeBase = tabs.find((t) => t.id === tab);
  const active = activeBase
    ? { ...activeBase, label: labelFor(activeBase) }
    : tab === "profile"
      ? { id: "profile" as Tab, label: "My Profile", icon: UserIcon }
      : tab === "settings"
        ? { id: "settings" as Tab, label: "Settings", icon: Settings }
        : { id: "employment" as Tab, label: "Employment Details", icon: BadgeCheck };

  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/", replace: true });
  }

  return (
    <div className="flex h-screen overflow-hidden bg-muted/40">
      <AdminSidebar
        scope={scope}
        currentTab={tab}
        onSelectTab={(id) => setTab(id as Tab)}
        groups={groups}
        tabs={tabs}
        labelFor={labelFor}
      />

      <div className="flex min-w-0 flex-1 flex-col h-screen overflow-hidden">
        {/* Top bar */}
        <header className="z-10 flex flex-wrap items-center justify-between gap-2 border-b border-border bg-card px-4 py-3 sm:px-6 shrink-0">
          <select
            value={tab}
            onChange={(e) => setTab(e.target.value as Tab)}
            className="min-w-0 max-w-[55vw] flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm md:hidden"
          >
            {visibleTabs.map((t) => (
              <option key={t.id} value={t.id}>
                {labelFor(t)}
              </option>
            ))}
          </select>
          <div className="hidden md:block" />
          <div className="relative flex min-w-0 items-center gap-2">
            <NotificationBell />
            <button
              onClick={() => setProfileOpen((v) => !v)}
              aria-haspopup="menu"
              aria-expanded={profileOpen}
              className="flex min-w-0 items-center gap-2 rounded-full border border-border bg-background px-2 py-1.5 pr-3 transition-colors hover:bg-secondary sm:pr-4"
            >
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-secondary text-xs font-bold text-primary">
                {(user?.email ?? "A").slice(0, 1).toUpperCase()}
              </span>
              <span className="max-w-[7rem] truncate text-sm font-medium sm:max-w-[12rem]">
                {(user?.user_metadata?.["full_name"] as string) || user?.email || "Admin"}
              </span>
            </button>

            {profileOpen ? (
              <>
                <button
                  aria-hidden
                  tabIndex={-1}
                  onClick={() => setProfileOpen(false)}
                  className="fixed inset-0 z-30 cursor-default"
                />
                <div
                  role="menu"
                  className="absolute right-0 top-full z-40 mt-2 w-56 overflow-hidden rounded-lg border border-border bg-card py-1 shadow-lift"
                >
                  <button
                    role="menuitem"
                    onClick={() => {
                      setProfileTab("profile");
                      setTab("profile");
                      setProfileOpen(false);
                    }}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm hover:bg-secondary"
                  >
                    <UserIcon className="h-4 w-4 text-muted-foreground" /> Profile
                  </button>
                  <button
                    role="menuitem"
                    onClick={() => {
                      setTab("settings");
                      setProfileOpen(false);
                    }}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm hover:bg-secondary"
                  >
                    <Settings className="h-4 w-4 text-muted-foreground" /> Settings
                  </button>
                  <button
                    role="menuitem"
                    onClick={() => {
                      setEmploymentTab("status");
                      setTab("employment");
                      setProfileOpen(false);
                    }}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm hover:bg-secondary"
                  >
                    <BadgeCheck className="h-4 w-4 text-muted-foreground" /> Employment Details
                  </button>
                  <button
                    role="menuitem"
                    onClick={handleSignOut}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm hover:bg-secondary"
                  >
                    <LogOut className="h-4 w-4 text-muted-foreground" /> Sign out
                  </button>
                </div>
              </>
            ) : null}
          </div>
        </header>

        {/* Breadcrumb strip */}
        <div className="border-b border-border bg-card px-3 pb-3 sm:px-4 md:px-6">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h1 className="truncate text-base font-bold sm:text-lg">{active.label}</h1>
              <p className="mt-1 text-[11px] uppercase tracking-wide text-muted-foreground">
                Kaleidonex / {portalNameByScope[scope]} / {active.label}
              </p>
            </div>
            <div className="hidden sm:flex items-center gap-2 rounded-full border border-border bg-secondary/50 px-3 py-1 text-xs font-medium text-foreground">
              <span className={`h-2 w-2 rounded-full ${scope === "ceo" ? "bg-amber-500" : scope === "hr" ? "bg-blue-500" : "bg-emerald-500"}`} />
              <span>{scope === "ceo" ? "CEO Executive Suite" : scope === "hr" ? "HR Management Portal" : "Employee Portal"}</span>
            </div>
          </div>
        </div>

        <main className="min-w-0 flex-1 overflow-x-hidden overflow-y-auto p-3 sm:p-4 md:p-6">
          {tab === "overview" &&
            (scope === "employee" ? (
              <EmployeeHome onNavigate={(t) => setTab(t as Tab)} />
            ) : scope === "hr" ? (
              <HrDashboard />
            ) : (
              <ExecDashboard />
            ))}

          {tab === "console_exec" && scope === "ceo" ? <ExecDashboard /> : null}
          {tab === "console_hr" && (scope === "ceo" || scope === "hr") ? <HrDashboard /> : null}
          {tab === "console_me" ? <EmployeeHome onNavigate={(t) => setTab(t as Tab)} /> : null}

          {tab.startsWith("exec_") && scope === "ceo" ? (
            <ExecDashboard key={tab} initialTab={tab.replace("exec_", "") as ExecTab} />
          ) : null}

          {PEOPLE_OPS_TABS[tab as keyof typeof PEOPLE_OPS_TABS] && (scope === "hr" || scope === "ceo") ? (
            <PeopleOpsSection key={tab} initialTab={PEOPLE_OPS_TABS[tab as keyof typeof PEOPLE_OPS_TABS]!} />
          ) : null}

          {tab === "ceo_broadcast" && scope === "ceo" ? <BroadcastSection /> : null}

          {ORG_CONTROL_TABS[tab as keyof typeof ORG_CONTROL_TABS] && scope === "ceo" ? (
            <OrgControlSection key={tab} initialTab={ORG_CONTROL_TABS[tab as keyof typeof ORG_CONTROL_TABS]!} />
          ) : null}

          {tab.startsWith("hr_") && !PEOPLE_OPS_TABS[tab as keyof typeof PEOPLE_OPS_TABS] && (scope === "hr" || scope === "ceo") ? (
            <HrDashboard key={tab} initialTab={tab.replace("hr_", "") as HrTab} />
          ) : null}

          {tab === "approvals" && <ApprovalsSection isSuper={scope === "ceo"} />}
          {tab === "payroll" && (scope === "ceo" || scope === "hr") ? <PayrollSection /> : null}
          {tab === "students" && <StudentsSection />}
          {tab === "claims" && <ExpenseClaimSection />}
          {tab === "mypanel" && <MyPanelSection />}
          {tab === "myleave" && <MyPanelSection only="leave" />}
          {tab === "mysalary" && <MyPanelSection only="salary" />}
          {tab === "myattendance" && <MyPanelSection only="attendance" />}
          {tab === "templates" && <TemplatesSection />}
          {tab === "ai" && <AiSection />}
          {tab === "tasks" && <TaskBoardSection />}
          {tab === "myrequests" && <MyRequestsSection />}
          {tab === "notifications" && <NotificationsSection onNavigate={(t) => setTab(t as Tab)} />}
          {tab === "social" && <SocialMediaSection />}
          {tab === "centres" && <OurCentresSection />}
          {tab === "team" && access.data ? <TeamSection access={access.data} /> : null}
          {tab === "employment" && <EmploymentDetailsSection initialTab={employmentTab} />}
          {tab === "settings" && <SettingsSection />}
          {tab === "profile" && (
            <MyProfileSection
              initialTab={profileTab}
              userEmail={user?.email}
              userName={(user?.user_metadata?.["full_name"] as string) || undefined}
            />
          )}
        </main>

        <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-border bg-card px-4 py-4 text-xs text-muted-foreground sm:px-6">
          <span>Copyright © {new Date().getFullYear()} Kaleidonex</span>
          <span className="flex gap-4">
            <Link to="/curriculum">Documentation</Link>
            <Link to="/contact">FAQ</Link>
          </span>
        </footer>
      </div>
    </div>
  );
}

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
  const tiles: { label: string; icon: LucideIcon; tab: Tab }[] = [
    { label: "My Panel", icon: UserCircle, tab: "mypanel" },
    { label: "My Attendance", icon: CalendarCheck, tab: "myattendance" },
    { label: "My Leave", icon: Flag, tab: "myleave" },
    { label: "My Salary", icon: CreditCard, tab: "mysalary" },
    { label: "Expense Claims", icon: Receipt, tab: "claims" },
    { label: "My Tasks", icon: ListTodo, tab: "tasks" },
  ];

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-border bg-gradient-to-r from-primary/10 via-card to-card p-5 shadow-soft">
        <p className="text-[11px] uppercase tracking-wide text-accent">My workspace</p>
        <h1 className="mt-1 text-xl font-bold sm:text-2xl">Welcome back</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Check in, track your leave and salary, raise claims and work through your tasks.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {tiles.map((t) => (
          <button
            key={t.label}
            onClick={() => onNavigate(t.tab)}
            className="grid place-items-center gap-2 rounded-xl border border-border bg-card px-3 py-6 shadow-soft transition-shadow hover:shadow-lift"
          >
            <t.icon className="h-6 w-6 text-ink" />
            <span className="text-sm text-muted-foreground">{t.label}</span>
          </button>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Panel title="Getting things done">
          <ul className="space-y-3 text-sm text-muted-foreground">
            <li>• Mark attendance from My Attendance before starting your day.</li>
            <li>• Leave and claim requests go to your reporting manager for approval.</li>
            <li>• Keep your Employment Details complete for payroll accuracy.</li>
          </ul>
        </Panel>
        <Panel title="Shortcuts">
          <div className="grid gap-3 sm:grid-cols-2">
            {(["templates", "ai"] as Tab[]).map((id) => (
              <button
                key={id}
                onClick={() => onNavigate(id)}
                className="rounded-lg border border-border bg-background px-4 py-3 text-left text-sm font-medium transition-shadow hover:shadow-lift"
              >
                {id === "templates" ? "Templates library" : "AI Assistant"}
              </button>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}
