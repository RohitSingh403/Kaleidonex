import { Link } from "@tanstack/react-router";
import { type LucideIcon } from "lucide-react";

export type TabItem = {
  id: string;
  label: string;
  icon: LucideIcon;
};

export type NavGroup = {
  title: string;
  items: string[];
};

interface AdminSidebarProps {
  scope: "ceo" | "hr" | "employee";
  currentTab: string;
  onSelectTab: (tabId: string) => void;
  groups: NavGroup[];
  tabs: TabItem[];
  labelFor: (tab: TabItem) => string;
}

export function AdminSidebar({
  scope,
  currentTab,
  onSelectTab,
  groups,
  tabs,
  labelFor,
}: AdminSidebarProps) {
  return (
    <aside className="hidden h-screen sticky top-0 w-64 shrink-0 flex-col border-r border-border bg-card md:flex select-none z-20 overflow-hidden">
      {/* Pinned Top Brand Header */}
      <div className="shrink-0 px-5 pt-5 pb-4 border-b border-border/70 bg-card">
        <Link to="/" className="font-display text-2xl font-bold tracking-tight inline-block hover:opacity-90 transition-opacity">
          <span className="text-accent">K</span>aleido<span className="text-accent">n</span>ex
        </Link>
        <div className="mt-2.5 flex items-center gap-2">
          <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="rounded bg-accent/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-accent">
            {scope === "ceo" ? "CEO Console" : scope === "hr" ? "HR Console" : "Employee Portal"}
          </span>
        </div>
      </div>

      {/* Scrollable Navigation Groups */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden p-3 space-y-6 scrollbar-thin scrollbar-thumb-muted-foreground/20 hover:scrollbar-thumb-muted-foreground/40">
        {groups.map((g, idx) => (
          <div key={g.title} className="space-y-1">
            <div className="flex items-center gap-2 px-3 pb-1.5">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground/80">
                {g.title}
              </span>
              <div className="h-px flex-1 bg-border/60" />
            </div>

            <div className="space-y-0.5">
              {g.items.map((id) => {
                const t = tabs.find((x) => x.id === id);
                if (!t) return null;
                const active = currentTab === t.id;
                const Icon = t.icon;
                return (
                  <button
                    key={t.id}
                    onClick={() => onSelectTab(t.id)}
                    type="button"
                    className={`group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium transition-all ${
                      active
                        ? "bg-accent/15 text-accent font-semibold shadow-xs"
                        : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                    }`}
                  >
                    <Icon
                      className={`h-4 w-4 shrink-0 transition-colors ${
                        active ? "text-accent" : "text-muted-foreground group-hover:text-accent"
                      }`}
                    />
                    <span className="truncate">{labelFor(t)}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
}
