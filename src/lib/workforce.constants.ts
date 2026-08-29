/** A day is "late" when check-in is after this time. */
export const LATE_AFTER = "09:15:00";
/** A day is an "early departure" when check-out is before this time. */
export const EARLY_BEFORE = "17:00:00";

export const TASK_STATUSES = ["todo", "in_progress", "review", "completed", "blocked"] as const;
export type TaskStatusKey = (typeof TASK_STATUSES)[number];

export const TASK_STATUS_LABEL: Record<string, string> = {
  todo: "To Do",
  pending: "To Do",
  in_progress: "In Progress",
  review: "Review",
  completed: "Completed",
  blocked: "Blocked",
};

export const ATTENDANCE_LABEL: Record<string, string> = {
  present: "Present",
  absent: "Absent",
  half_day: "Half day",
  leave: "Leave",
  paid_leave: "Paid leave",
  holiday: "Holiday",
  not_marked: "Not marked",
};

export function pct(n: number, d: number) {
  return d <= 0 ? 0 : Math.round((n / d) * 100);
}

export function toCsv(rows: Record<string, string | number>[]): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]!);
  const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
  return [headers.join(","), ...rows.map((r) => headers.map((h) => esc(r[h] ?? "")).join(","))].join("\n");
}

export function downloadCsv(filename: string, rows: Record<string, string | number>[]) {
  const blob = new Blob([toCsv(rows)], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
