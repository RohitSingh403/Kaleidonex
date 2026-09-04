import type { ReactNode } from "react";
import type { AttendanceStatus } from "@/lib/employee.functions";

export type SubTab = "dashboard" | "mark" | "monthly" | "leave" | "salary" | "requests" | "attendance";

export const subTabs: { id: SubTab; label: string }[] = [
  { id: "dashboard", label: "Dashboard" },
  { id: "mark", label: "Mark Attendance" },
  { id: "monthly", label: "Monthly Attendance" },
  { id: "leave", label: "Leave" },
  { id: "salary", label: "Salary" },
  { id: "requests", label: "Requests List" },
];

export type AttendanceRow = {
  id: string;
  work_date: string;
  status: AttendanceStatus;
  check_in: string | null;
  check_out: string | null;
  daily_update: string | null;
  notes?: string | null;
};

export type LeaveRow = {
  id: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  days: number;
  reason: string;
  status: "pending" | "approved" | "rejected";
  created_at?: string;
};

export type SalaryRow = {
  id: string;
  period_month: number;
  period_year: number;
  days: number;
  basic_salary: number;
  earnings: number;
  deductions: number;
  net_pay: number;
  net_salary?: number;
  status: "pending" | "paid";
  paid_on?: string | null;
};

export type RequestRow = {
  id: string;
  request_type: string;
  details?: string;
  note?: string;
  subject?: string;
  description?: string;
  status: "pending" | "approved" | "rejected";
  created_at?: string;
  admin_notes?: string | null;
  decision_note?: string;
};

export const inr = (n: number) => `₹${Number(n).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export const statusLabels: Record<AttendanceStatus, string> = {
  present: "Present",
  absent: "Absent",
  half_day: "Half Day",
  leave: "On Leave",
  paid_leave: "Paid Leave",
  holiday: "Holiday",
};

export const statusBadgeColors: Record<AttendanceStatus, string> = {
  present: "bg-emerald-500/15 text-emerald-700",
  absent: "bg-destructive/10 text-destructive",
  half_day: "bg-amber-500/15 text-amber-700",
  leave: "bg-sky-500/15 text-sky-700",
  paid_leave: "bg-teal-500/15 text-teal-700",
  holiday: "bg-violet-500/15 text-violet-700",
};

export const statusDotColors: Record<AttendanceStatus, string> = {
  present: "bg-emerald-500",
  absent: "bg-destructive",
  half_day: "bg-amber-500",
  leave: "bg-sky-500",
  paid_leave: "bg-teal-500",
  holiday: "bg-violet-500",
};
