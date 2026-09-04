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
    <aside className="hidden h-screen sticky top-0 w-60 shrink-0 flex-col border-r border-border bg-card md:flex select-none z-20">
      {/* Pinned Top Brand Header */}
      <div className="shrink-0 px-5 pt-5 pb-3">
        <Link to="/" className="font-display text-2xl font-bold tracking-tight inline-block hover:opacity-90 transition-opacity">
          <span className="text-accent">K</span>aleido<span className="text-accent">n</span>ex
        </Link>
        <p className="mt-2 text-xs font-semibold uppercase tracking-wider text-accent">
          {scope === "ceo" ? "CEO Console" : scope === "hr" ? "HR Console" : "Working Menu"}
        </p>
        <div className="mt-3 h-px bg-border/80" />
      </div>

      {/* Scrollable Navigation Groups */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-2 space-y-5 scrollbar-thin scrollbar-thumb-muted-foreground/20 hover:scrollbar-thumb-muted-foreground/40">
        {groups.map((g) => (
          <div key={g.title} className="space-y-1">
            <p className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80">
              {g.title}
            </p>
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
                      ? "bg-secondary text-accent font-semibold shadow-xs"
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
        ))}
      </nav>
    </aside>
  );
}
