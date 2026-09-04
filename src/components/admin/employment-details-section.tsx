import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CheckSquare, Loader2, Trash2, Upload, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  getEmploymentProfile,
  saveEmploymentProfile,
  getPersonalDetails,
  savePersonalDetails,
  getEmployeeDocuments,
  saveEmployeeDocument,
  deleteEmployeeDocument,
  type EmploymentProfileInput,
  type PersonalInput,
} from "@/lib/employment.functions";

type Tab = "status" | "personal" | "documents";

const TABS: { id: Tab; label: string }[] = [
  { id: "status", label: "Profile Status" },
  { id: "personal", label: "Personal Information" },
  { id: "documents", label: "Documents" },
];

export function EmploymentDetailsSection({ initialTab = "status" }: { initialTab?: Tab }) {
  const [tab, setTab] = useState<Tab>(initialTab);

  useEffect(() => {
    setTab(initialTab);
  }, [initialTab]);

  return (
    <div className="space-y-4">
      <div className="flex gap-6 border-b border-border">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`-mb-px border-b-2 px-1 pb-3 text-sm transition-colors ${
              tab === t.id
                ? "border-accent font-semibold text-accent"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "status" && <ProfileStatusTab />}
      {tab === "personal" && <PersonalTab />}
      {tab === "documents" && <DocumentsTab />}
    </div>
  );
}

function Loading() {
  return (
    <div className="grid place-items-center py-16 text-muted-foreground">
      <Loader2 className="h-5 w-5 animate-spin" />
    </div>
  );
}

const inputCls =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-accent";
const labelCls = "mb-1 block text-xs font-medium text-muted-foreground";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <span className={labelCls}>{label}</span>
      {children}
    </div>
  );
}

// ─── Profile Status ──────────────────────────────────────

const emptyProfile: EmploymentProfileInput = {
  full_name: "",
  designation: "",
  employee_code: "",
  joining_date: null,
  employment_type: "Full-Time",
  work_mode: "Onsite",
  status: "Active",
  work_location: "",
  working_organisation: "",
  salary: 0,
  manager_name: "",
  manager_email: "",
  is_verified: false,
  verified_by: "",
  verified_on: null,
};

function ProfileStatusTab() {
  const qc = useQueryClient();
  const fetchProfile = useServerFn(getEmploymentProfile);
  const fetchPersonal = useServerFn(getPersonalDetails);
  const fetchDocs = useServerFn(getEmployeeDocuments);
  const save = useServerFn(saveEmploymentProfile);

  const { data, isLoading } = useQuery({ queryKey: ["emp-profile"], queryFn: () => fetchProfile() });
  const { data: personal } = useQuery({ queryKey: ["emp-personal"], queryFn: () => fetchPersonal() });
  const { data: docs } = useQuery({ queryKey: ["emp-docs"], queryFn: () => fetchDocs() });

  const roleQuery = useQuery({
    queryKey: ["current-user-roles"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const { data } = await supabase.from("user_roles").select("role").eq("user_id", user.id);
      return (data ?? []).map((r) => r.role);
    },
  });
  const isManagement = (roleQuery.data ?? []).some((r) => r === "admin" || r === "ceo");

  const [edit, setEdit] = useState(false);
  const [form, setForm] = useState<EmploymentProfileInput>(emptyProfile);
  const [error, setError] = useState("");

  useEffect(() => {
    if (data) {
      const { user_id: _u, created_at: _c, updated_at: _up, ...rest } = data;
      setForm({ ...emptyProfile, ...rest });
    }
  }, [data]);

  const mutation = useMutation({
    mutationFn: (payload: EmploymentProfileInput) => save({ data: payload }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["emp-profile"] });
      setEdit(false);
      setError("");
    },
    onError: (e: Error) => setError(e.message),
  });

  const completion = useMemo(() => {
    const basicKeys: (keyof EmploymentProfileInput)[] = [
      "full_name",
      "designation",
      "employee_code",
      "work_location",
      "working_organisation",
      "manager_name",
    ];
    const basic = data
      ? Math.round(
          (basicKeys.filter((k) => String((data as Record<string, unknown>)[k] ?? "").length > 0)
            .length /
            basicKeys.length) *
            100,
        )
      : 0;
    const personalKeys = [
      "contact_number",
      "personal_email",
      "cur_city",
      "perm_city",
      "emergency_name",
      "bank_account_number",
      "pan_no",
      "aadhaar_no",
    ];
    const pdetails = personal
      ? Math.round(
          (personalKeys.filter(
            (k) => String((personal as Record<string, unknown>)[k] ?? "").length > 0,
          ).length /
            personalKeys.length) *
            100,
        )
      : 0;
    const documents = Math.min(100, Math.round(((docs?.length ?? 0) / 9) * 100));
    return { basic, pdetails, documents };
  }, [data, personal, docs]);

  if (isLoading) return <Loading />;

  const initial = (form.full_name || "E").slice(0, 1).toUpperCase();

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-soft">
      <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr]">
        <div className="min-w-0 space-y-5">
          <div className="flex items-center gap-4">
            <span className="grid h-14 w-14 place-items-center rounded-full bg-primary/15 text-xl font-bold text-primary">
              {initial}
            </span>
            <div className="min-w-0">
              <p className="truncate text-base font-semibold">{form.full_name || "Your name"}</p>
              <p className="text-xs text-muted-foreground">{form.designation || "Designation"}</p>
              <p className="text-xs text-muted-foreground">
                Employee ID: {form.employee_code || "—"}
              </p>
            </div>
            <button
              onClick={() => setEdit((v) => !v)}
              className="ml-auto rounded-md border border-border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-secondary"
            >
              {edit ? "Cancel" : "Edit details"}
            </button>
          </div>

          {edit ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                mutation.mutate(form);
              }}
              className="grid gap-3 sm:grid-cols-2"
            >
              <Field label="Full Name">
                <input
                  className={inputCls}
                  value={form.full_name}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                />
              </Field>
              <Field label="Designation">
                <input
                  className={`${inputCls} ${!isManagement ? "bg-muted/40 cursor-not-allowed text-muted-foreground" : ""}`}
                  disabled={!isManagement}
                  readOnly={!isManagement}
                  value={form.designation}
                  onChange={(e) => isManagement && setForm({ ...form, designation: e.target.value })}
                />
              </Field>
              <Field label="Employee ID">
                <input
                  className={`${inputCls} ${!isManagement ? "bg-muted/40 cursor-not-allowed text-muted-foreground" : ""}`}
                  disabled={!isManagement}
                  readOnly={!isManagement}
                  value={form.employee_code}
                  onChange={(e) => isManagement && setForm({ ...form, employee_code: e.target.value })}
                />
              </Field>
              <Field label="Joining Date">
                <input
                  type="date"
                  className={`${inputCls} ${!isManagement ? "bg-muted/40 cursor-not-allowed text-muted-foreground" : ""}`}
                  disabled={!isManagement}
                  readOnly={!isManagement}
                  value={form.joining_date ?? ""}
                  onChange={(e) => isManagement && setForm({ ...form, joining_date: e.target.value || null })}
                />
              </Field>
              <Field label="Employment Type">
                <select
                  className={`${inputCls} ${!isManagement ? "bg-muted/40 cursor-not-allowed text-muted-foreground" : ""}`}
                  disabled={!isManagement}
                  value={form.employment_type}
                  onChange={(e) => isManagement && setForm({ ...form, employment_type: e.target.value })}
                >
                  {["Full-Time", "Part-Time", "Intern", "Contract"].map((o) => (
                    <option key={o}>{o}</option>
                  ))}
                </select>
              </Field>
              <Field label="Work Mode">
                <select
                  className={inputCls}
                  value={form.work_mode}
                  onChange={(e) => setForm({ ...form, work_mode: e.target.value })}
                >
                  {["Onsite", "Hybrid", "Remote"].map((o) => (
                    <option key={o}>{o}</option>
                  ))}
                </select>
              </Field>
              <Field label="Status">
                <select
                  className={`${inputCls} ${!isManagement ? "bg-muted/40 cursor-not-allowed text-muted-foreground" : ""}`}
                  disabled={!isManagement}
                  value={form.status}
                  onChange={(e) => isManagement && setForm({ ...form, status: e.target.value })}
                >
                  {["Active", "Probation", "Notice Period", "Inactive"].map((o) => (
                    <option key={o}>{o}</option>
                  ))}
                </select>
              </Field>
              <Field label="Salary (₹)">
                {isManagement ? (
                  <input
                    type="number"
                    min="0"
                    className={inputCls}
                    value={form.salary}
                    onChange={(e) => setForm({ ...form, salary: Number(e.target.value) })}
                  />
                ) : (
                  <div className="relative">
                    <input
                      type="text"
                      disabled
                      readOnly
                      className={`${inputCls} bg-muted/40 cursor-not-allowed pr-8 text-muted-foreground font-semibold`}
                      value={form.salary ? `₹${Number(form.salary).toLocaleString("en-IN")}` : "₹0"}
                    />
                    <Lock className="absolute right-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  </div>
                )}
              </Field>
              <Field label="Work Location">
                <input
                  className={inputCls}
                  value={form.work_location}
                  onChange={(e) => setForm({ ...form, work_location: e.target.value })}
                />
              </Field>
              <Field label="Working Organisation">
                <input
                  className={inputCls}
                  value={form.working_organisation}
                  onChange={(e) => setForm({ ...form, working_organisation: e.target.value })}
                />
              </Field>
              <Field label="Reporting Manager">
                <input
                  className={inputCls}
                  value={form.manager_name}
                  onChange={(e) => setForm({ ...form, manager_name: e.target.value })}
                />
              </Field>
              <Field label="Manager Email">
                <input
                  className={inputCls}
                  value={form.manager_email}
                  onChange={(e) => setForm({ ...form, manager_email: e.target.value })}
                />
              </Field>
              {isManagement ? (
                <>
                  <label className="flex items-center gap-2 text-sm sm:col-span-2">
                    <input
                      type="checkbox"
                      checked={form.is_verified}
                      onChange={(e) => setForm({ ...form, is_verified: e.target.checked })}
                    />
                    Profile verified
                  </label>
                  <Field label="Verified By">
                    <input
                      className={inputCls}
                      value={form.verified_by}
                      onChange={(e) => setForm({ ...form, verified_by: e.target.value })}
                    />
                  </Field>
                  <Field label="Verified On">
                    <input
                      type="date"
                      className={inputCls}
                      value={form.verified_on ?? ""}
                      onChange={(e) => setForm({ ...form, verified_on: e.target.value || null })}
                    />
                  </Field>
                </>
              ) : null}
              {error ? <p className="text-sm text-destructive sm:col-span-2">{error}</p> : null}
              <div className="sm:col-span-2">
                <button
                  type="submit"
                  disabled={mutation.isPending}
                  className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60"
                >
                  {mutation.isPending ? "Saving…" : "Save Employment Details"}
                </button>
              </div>
            </form>
          ) : (
            <>
              <div className="grid gap-x-8 gap-y-2 text-sm sm:grid-cols-2">
                <Info label="Joining Date" value={form.joining_date ?? "—"} />
                <Info label="Employment Type" value={form.employment_type} />
                <Info label="Status" value={form.status} />
                <Info label="Work Mode" value={form.work_mode} />
                <Info label="Work Location" value={form.work_location || "—"} />
                <Info label="Salary" value={form.salary ? `₹${form.salary.toLocaleString("en-IN")}` : "—"} />
                <Info label="Working Organisation" value={form.working_organisation || "—"} />
              </div>

              <div className="rounded-lg border-l-4 border-l-emerald-500 bg-emerald-500/10 p-4">
                <p className="text-sm font-semibold text-emerald-700">Reporting Manager</p>
                <div className="mt-2 flex items-center gap-3">
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-teal-500/30 text-sm font-bold text-teal-800">
                    {(form.manager_name || "M").slice(0, 1).toUpperCase()}
                  </span>
                  <div>
                    <p className="text-sm font-medium">{form.manager_name || "—"}</p>
                    <p className="text-xs text-muted-foreground">{form.manager_email || "—"}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border-l-4 border-l-emerald-500 bg-emerald-500/10 p-4">
                <p className="text-sm font-semibold text-emerald-700">Verification Status</p>
                <div className="mt-2 flex items-start gap-2 text-sm">
                  <CheckSquare
                    className={`mt-0.5 h-4 w-4 ${form.is_verified ? "text-emerald-600" : "text-muted-foreground"}`}
                  />
                  <div>
                    <p>
                      Profile {form.is_verified ? "Verified" : "Not verified"}
                      {form.verified_by ? ` (${form.verified_by})` : ""}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Status: {form.is_verified ? "Verified" : "Pending"}
                      {form.verified_on ? ` · ${form.verified_on}` : ""}
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="min-w-0">
          <p className="text-sm font-semibold">Completion Breakdown</p>
          <div className="mt-6 flex h-52 items-end gap-6 border-b border-border">
            <Bar label="Basic Info" value={completion.basic} className="bg-indigo-400" />
            <Bar label="Personal Details" value={completion.pdetails} className="bg-amber-400" />
            <Bar label="Documents" value={completion.documents} className="bg-red-400" />
          </div>
          <div className="mt-2 flex gap-6 text-center text-xs text-muted-foreground">
            <span className="flex-1">Basic Info</span>
            <span className="flex-1">Personal Details</span>
            <span className="flex-1">Documents</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <p className="truncate">
      <span className="font-medium">{label}:</span>{" "}
      <span className="text-muted-foreground">{value}</span>
    </p>
  );
}

function Bar({ label, value, className }: { label: string; value: number; className: string }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-end" title={`${label}: ${value}%`}>
      <span className="mb-1 text-xs font-medium text-muted-foreground">{value}%</span>
      <div
        className={`w-full rounded-t-sm transition-all ${className}`}
        style={{ height: `${Math.max(4, value)}%` }}
      />
    </div>
  );
}

// ─── Personal Information ────────────────────────────────

const emptyPersonal: PersonalInput = {
  date_of_birth: null,
  gender: "",
  blood_group: "",
  marital_status: "",
  contact_number: "",
  alternate_number: "",
  personal_email: "",
  cur_street: "",
  cur_city: "",
  cur_state: "",
  cur_pincode: "",
  perm_street: "",
  perm_city: "",
  perm_state: "",
  perm_pincode: "",
  emergency_name: "",
  emergency_number: "",
  emergency_relation: "",
  emergency_address: "",
  bank_account_holder: "",
  bank_name: "",
  bank_account_number: "",
  bank_ifsc: "",
  bank_branch: "",
  pan_no: "",
  aadhaar_no: "",
};

function PersonalTab() {
  const qc = useQueryClient();
  const fetchPersonal = useServerFn(getPersonalDetails);
  const save = useServerFn(savePersonalDetails);
  const { data, isLoading } = useQuery({ queryKey: ["emp-personal"], queryFn: () => fetchPersonal() });

  const [form, setForm] = useState<PersonalInput>(emptyPersonal);
  const [same, setSame] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (data) {
      const { user_id: _u, created_at: _c, updated_at: _up, ...rest } = data;
      setForm({ ...emptyPersonal, ...rest });
    }
  }, [data]);

  const mutation = useMutation({
    mutationFn: (payload: PersonalInput) => save({ data: payload }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["emp-personal"] });
      setMsg("Personal details saved.");
    },
    onError: (e: Error) => setMsg(e.message),
  });

  if (isLoading) return <Loading />;

  const set = (k: keyof PersonalInput, v: string) => setForm((f) => ({ ...f, [k]: v }));

  function copyAddress(checked: boolean) {
    setSame(checked);
    if (checked) {
      setForm((f) => ({
        ...f,
        perm_street: f.cur_street,
        perm_city: f.cur_city,
        perm_state: f.cur_state,
        perm_pincode: f.cur_pincode,
      }));
    }
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setMsg("");
        mutation.mutate(form);
      }}
      className="space-y-6 rounded-xl border border-border bg-card p-5 shadow-soft"
    >
      <h2 className="text-base font-semibold">Personal Details</h2>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Date of Birth *">
          <input
            type="date"
            className={inputCls}
            value={form.date_of_birth ?? ""}
            onChange={(e) => setForm({ ...form, date_of_birth: e.target.value || null })}
          />
        </Field>
        <Field label="Gender *">
          <select className={inputCls} value={form.gender} onChange={(e) => set("gender", e.target.value)}>
            <option value="">Select</option>
            {["Male", "Female", "Other"].map((o) => (
              <option key={o}>{o}</option>
            ))}
          </select>
        </Field>
        <Field label="Blood Group">
          <select
            className={inputCls}
            value={form.blood_group}
            onChange={(e) => set("blood_group", e.target.value)}
          >
            <option value="">Select</option>
            {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((o) => (
              <option key={o}>{o}</option>
            ))}
          </select>
        </Field>
        <Field label="Marital Status *">
          <select
            className={inputCls}
            value={form.marital_status}
            onChange={(e) => set("marital_status", e.target.value)}
          >
            <option value="">Select</option>
            {["Single", "Married", "Other"].map((o) => (
              <option key={o}>{o}</option>
            ))}
          </select>
        </Field>
        <Field label="Contact Number *">
          <input
            className={inputCls}
            value={form.contact_number}
            onChange={(e) => set("contact_number", e.target.value)}
          />
        </Field>
        <Field label="Alternate Number">
          <input
            className={inputCls}
            value={form.alternate_number}
            onChange={(e) => set("alternate_number", e.target.value)}
          />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Personal Email *">
            <input
              type="email"
              className={inputCls}
              value={form.personal_email}
              onChange={(e) => set("personal_email", e.target.value)}
            />
          </Field>
        </div>
      </div>

      <div>
        <h3 className="mb-2 text-sm font-semibold">Current Address *</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Street">
            <input className={inputCls} value={form.cur_street} onChange={(e) => set("cur_street", e.target.value)} />
          </Field>
          <Field label="City">
            <input className={inputCls} value={form.cur_city} onChange={(e) => set("cur_city", e.target.value)} />
          </Field>
          <Field label="State">
            <input className={inputCls} value={form.cur_state} onChange={(e) => set("cur_state", e.target.value)} />
          </Field>
          <Field label="Pincode">
            <input className={inputCls} value={form.cur_pincode} onChange={(e) => set("cur_pincode", e.target.value)} />
          </Field>
        </div>
      </div>

      <div>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-semibold">Permanent Address *</h3>
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            <input type="checkbox" checked={same} onChange={(e) => copyAddress(e.target.checked)} />
            Same as Current
          </label>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Street">
            <input className={inputCls} value={form.perm_street} onChange={(e) => set("perm_street", e.target.value)} />
          </Field>
          <Field label="City">
            <input className={inputCls} value={form.perm_city} onChange={(e) => set("perm_city", e.target.value)} />
          </Field>
          <Field label="State">
            <input className={inputCls} value={form.perm_state} onChange={(e) => set("perm_state", e.target.value)} />
          </Field>
          <Field label="Pincode">
            <input
              className={inputCls}
              value={form.perm_pincode}
              onChange={(e) => set("perm_pincode", e.target.value)}
            />
          </Field>
        </div>
      </div>

      <div>
        <h3 className="mb-2 text-sm font-semibold">Emergency Contact *</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Name*">
            <input
              className={inputCls}
              value={form.emergency_name}
              onChange={(e) => set("emergency_name", e.target.value)}
            />
          </Field>
          <Field label="Number*">
            <input
              className={inputCls}
              value={form.emergency_number}
              onChange={(e) => set("emergency_number", e.target.value)}
            />
          </Field>
          <Field label="Relation*">
            <input
              className={inputCls}
              value={form.emergency_relation}
              onChange={(e) => set("emergency_relation", e.target.value)}
            />
          </Field>
          <Field label="Address*">
            <input
              className={inputCls}
              value={form.emergency_address}
              onChange={(e) => set("emergency_address", e.target.value)}
            />
          </Field>
        </div>
      </div>

      <div>
        <h3 className="mb-2 text-sm font-semibold">Bank Details *</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Account Holder Name*">
            <input
              className={inputCls}
              value={form.bank_account_holder}
              onChange={(e) => set("bank_account_holder", e.target.value)}
            />
          </Field>
          <Field label="Bank Name*">
            <input className={inputCls} value={form.bank_name} onChange={(e) => set("bank_name", e.target.value)} />
          </Field>
          <Field label="Account Number*">
            <input
              className={inputCls}
              value={form.bank_account_number}
              onChange={(e) => set("bank_account_number", e.target.value)}
            />
          </Field>
          <Field label="Ifsc Code*">
            <input className={inputCls} value={form.bank_ifsc} onChange={(e) => set("bank_ifsc", e.target.value)} />
          </Field>
          <Field label="Branch*">
            <input className={inputCls} value={form.bank_branch} onChange={(e) => set("bank_branch", e.target.value)} />
          </Field>
        </div>
      </div>

      <div>
        <h3 className="mb-2 text-sm font-semibold">Government IDs *</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="PAN No. *">
            <input className={inputCls} value={form.pan_no} onChange={(e) => set("pan_no", e.target.value)} />
          </Field>
          <Field label="Aadhaar No. *">
            <input className={inputCls} value={form.aadhaar_no} onChange={(e) => set("aadhaar_no", e.target.value)} />
          </Field>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-3">
        {msg ? <span className="text-sm text-muted-foreground">{msg}</span> : null}
        <button
          type="submit"
          disabled={mutation.isPending}
          className="rounded-md bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60"
        >
          {mutation.isPending ? "Saving…" : "Save Personal Details"}
        </button>
      </div>
    </form>
  );
}

// ─── Documents ───────────────────────────────────────────

type DocSpec = { type: string; accept: string; required: boolean; infoLabel?: string };

const DOC_SPECS: DocSpec[] = [
  { type: "Offer Letter", accept: ".pdf,.doc,.docx", required: true },
  { type: "Appointment Letter", accept: ".pdf,.doc,.docx", required: true },
  { type: "Resume", accept: ".pdf,.doc,.docx", required: true },
  { type: "Passport Size Photo", accept: "image/*", required: true },
  { type: "PAN Card", accept: "image/*,.pdf", required: true },
  { type: "Aadhaar Card", accept: "image/*,.pdf", required: true },
  { type: "Address Proof", accept: "image/*,.pdf", required: true },
  { type: "Educational Certificates", accept: ".pdf,.jpg,.jpeg,.png", required: true, infoLabel: "Certificate Name" },
  { type: "ID Proofs", accept: "image/*,.pdf", required: true, infoLabel: "ID Proof Type" },
  { type: "Experience Letters", accept: ".pdf,.jpg,.jpeg,.png", required: false, infoLabel: "Company Name" },
  { type: "Relieving Letters", accept: ".pdf,.jpg,.jpeg,.png", required: false, infoLabel: "Company Name" },
  { type: "Salary Slips", accept: ".pdf,.jpg,.jpeg,.png", required: false, infoLabel: "Month / Year" },
  { type: "Increment Letters", accept: ".pdf,.jpg,.jpeg,.png", required: false, infoLabel: "Date" },
  { type: "Performance Reports", accept: ".pdf,.jpg,.jpeg,.png", required: false, infoLabel: "Year" },
  { type: "Appraisal Letters", accept: ".pdf,.jpg,.jpeg,.png", required: false, infoLabel: "Year" },
  { type: "Joining Documents", accept: ".pdf,.jpg,.jpeg,.png", required: false, infoLabel: "Document Name" },
  { type: "NDA Agreement", accept: ".pdf,.doc,.docx", required: false },
  { type: "Bond Agreement", accept: ".pdf,.doc,.docx", required: false },
  { type: "Other Documents", accept: ".pdf,.jpg,.jpeg,.png,.doc,.docx", required: false, infoLabel: "Document Name" },
];

function DocumentsTab() {
  const qc = useQueryClient();
  const fetchDocs = useServerFn(getEmployeeDocuments);
  const saveDoc = useServerFn(saveEmployeeDocument);
  const removeDoc = useServerFn(deleteEmployeeDocument);

  const { data, isLoading } = useQuery({ queryKey: ["emp-docs"], queryFn: () => fetchDocs() });
  const [infos, setInfos] = useState<Record<string, string>>({});
  const [files, setFiles] = useState<Record<string, File | null>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");

  const uploaded = useMemo(() => {
    const map = new Map<string, { id: string; file_name: string; file_url: string }[]>();
    for (const d of data ?? []) {
      const arr = map.get(d.doc_type) ?? [];
      arr.push({ id: d.id, file_name: d.file_name, file_url: d.file_url });
      map.set(d.doc_type, arr);
    }
    return map;
  }, [data]);

  async function handleUpload(spec: DocSpec) {
    const file = files[spec.type];
    if (!file) {
      setError(`Choose a file for ${spec.type} first.`);
      return;
    }
    setBusy(spec.type);
    setError("");
    try {
      const { data: session } = await supabase.auth.getUser();
      const uid = session.user?.id;
      if (!uid) throw new Error("Not signed in.");
      const path = `${uid}/${Date.now()}-${file.name.replace(/[^\w.\-]/g, "_")}`;
      const { error: upErr } = await supabase.storage.from("employee-documents").upload(path, file);
      if (upErr) throw new Error(upErr.message);
      await saveDoc({
        data: {
          doc_type: spec.type,
          info: infos[spec.type] ?? "",
          file_url: path,
          file_name: file.name,
        },
      });
      setFiles((f) => ({ ...f, [spec.type]: null }));
      qc.invalidateQueries({ queryKey: ["emp-docs"] });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setBusy(null);
    }
  }

  async function openDoc(path: string) {
    const { data: signed } = await supabase.storage
      .from("employee-documents")
      .createSignedUrl(path, 60);
    if (signed?.signedUrl) window.open(signed.signedUrl, "_blank");
  }

  async function handleDelete(id: string) {
    await removeDoc({ data: { id } });
    qc.invalidateQueries({ queryKey: ["emp-docs"] });
  }

  if (isLoading) return <Loading />;

  const requiredDone = DOC_SPECS.filter((s) => s.required && uploaded.has(s.type)).length;
  const optionalDone = DOC_SPECS.filter((s) => !s.required && uploaded.has(s.type)).length;

  return (
    <div className="space-y-5">
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-soft">
        <div className="bg-primary px-5 py-3 text-primary-foreground">
          <h2 className="text-base font-semibold">Document Upload</h2>
        </div>
        {error ? <p className="px-5 pt-3 text-sm text-destructive">{error}</p> : null}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-3">Document Name</th>
                <th className="px-4 py-3">Information</th>
                <th className="px-4 py-3">Choose File</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {DOC_SPECS.map((spec) => {
                const rows = uploaded.get(spec.type) ?? [];
                const done = rows.length > 0;
                return (
                  <tr key={spec.type} className="border-b border-border align-top">
                    <td className="px-4 py-3">
                      <p className="font-medium">
                        {spec.type} {spec.required ? <span className="text-destructive">*</span> : null}
                      </p>
                      <p className="text-xs text-muted-foreground">Accept: {spec.accept}</p>
                      {rows.map((r) => (
                        <p key={r.id} className="mt-1 flex items-center gap-2 text-xs">
                          <button
                            type="button"
                            onClick={() => openDoc(r.file_url)}
                            className="truncate text-primary underline"
                          >
                            {r.file_name}
                          </button>
                          <button
                            type="button"
                            aria-label="Delete document"
                            onClick={() => handleDelete(r.id)}
                            className="text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </p>
                      ))}
                    </td>
                    <td className="px-4 py-3">
                      {spec.infoLabel ? (
                        <input
                          className={inputCls}
                          placeholder={spec.infoLabel}
                          value={infos[spec.type] ?? ""}
                          onChange={(e) => setInfos((i) => ({ ...i, [spec.type]: e.target.value }))}
                        />
                      ) : (
                        <span className="text-xs text-muted-foreground">No extra info required</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="file"
                        accept={spec.accept}
                        onChange={(e) =>
                          setFiles((f) => ({ ...f, [spec.type]: e.target.files?.[0] ?? null }))
                        }
                        className="w-full text-xs"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded px-2 py-0.5 text-[11px] font-semibold ${
                          done
                            ? "bg-emerald-500/15 text-emerald-700"
                            : "bg-amber-500/20 text-amber-700"
                        }`}
                      >
                        {done ? "Uploaded" : "Pending"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => handleUpload(spec)}
                        disabled={busy === spec.type}
                        className="inline-flex items-center gap-1.5 rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
                      >
                        {busy === spec.type ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Upload className="h-3.5 w-3.5" />
                        )}
                        Upload
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-muted/40 p-5">
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">Upload Progress</p>
          <p className="mt-3 flex justify-between text-sm">
            <span>Required Documents:</span>
            <span>
              {requiredDone} / {DOC_SPECS.filter((s) => s.required).length}
            </span>
          </p>
          <p className="mt-1 flex justify-between text-sm">
            <span>Optional Documents:</span>
            <span>
              {optionalDone} / {DOC_SPECS.filter((s) => !s.required).length}
            </span>
          </p>
        </div>
        <div className="rounded-xl border border-border bg-muted/40 p-5">
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">Quick Tips</p>
          <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
            <li>Each document type has its own upload button.</li>
            <li>Supported formats: PDF, JPG, PNG, DOC.</li>
            <li>Max file size: 10MB per file.</li>
            <li>Required documents are marked with *.</li>
            <li>Upload single-page documents only.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
