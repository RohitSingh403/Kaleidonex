import { useState } from "react";
import { type SubTab, subTabs } from "./my-panel/types";
import { EmployeeDashboard } from "./my-panel/employee-dashboard-tab";
import { AttendanceWorkspace, MarkAttendance, MonthlyAttendance } from "./my-panel/attendance-tab";
import { LeaveTab } from "./my-panel/leave-tab";
import { SalaryTab } from "./my-panel/salary-tab";
import { RequestsTab } from "./my-panel/requests-tab";

export { type SubTab, type AttendanceRow, type LeaveRow, type SalaryRow, type RequestRow } from "./my-panel/types";

export function MyPanelSection({ only }: { only?: SubTab } = {}) {
  const [sub, setSub] = useState<SubTab>(only ?? "dashboard");
  const activeSub = only ?? sub;

  return (
    <div className="space-y-5">
      <div className={`flex flex-wrap items-center gap-1 border-b border-border ${only ? "hidden" : ""}`}>
        {subTabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setSub(t.id)}
            className={`-mb-px border-b-2 px-3 py-2 text-sm transition-colors ${
              sub === t.id
                ? "border-primary font-semibold text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {activeSub === "dashboard" && <EmployeeDashboard go={setSub} />}
      {activeSub === "mark" && <MarkAttendance onDone={() => setSub("monthly")} />}
      {activeSub === "monthly" && <MonthlyAttendance />}
      {activeSub === "attendance" && <AttendanceWorkspace />}
      {activeSub === "leave" && <LeaveTab />}
      {activeSub === "salary" && <SalaryTab />}
      {activeSub === "requests" && <RequestsTab />}
    </div>
  );
}
