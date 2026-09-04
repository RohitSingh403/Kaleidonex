import { createServerFn } from "@tanstack/react-start";
import { requireAdmin } from "@/lib/require-admin";

export type EmploymentProfileInput = {
  full_name: string;
  designation: string;
  employee_code: string;
  joining_date: string | null;
  employment_type: string;
  work_mode: string;
  status: string;
  work_location: string;
  working_organisation: string;
  salary: number;
  manager_name: string;
  manager_email: string;
  is_verified: boolean;
  verified_by: string;
  verified_on: string | null;
};

export type PersonalInput = {
  date_of_birth: string | null;
  gender: string;
  blood_group: string;
  marital_status: string;
  contact_number: string;
  alternate_number: string;
  personal_email: string;
  cur_street: string;
  cur_city: string;
  cur_state: string;
  cur_pincode: string;
  perm_street: string;
  perm_city: string;
  perm_state: string;
  perm_pincode: string;
  emergency_name: string;
  emergency_number: string;
  emergency_relation: string;
  emergency_address: string;
  bank_account_holder: string;
  bank_name: string;
  bank_account_number: string;
  bank_ifsc: string;
  bank_branch: string;
  pan_no: string;
  aadhaar_no: string;
};

export const getEmploymentProfile = createServerFn({ method: "GET" })
  .middleware([requireAdmin])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("employee_profile")
      .select("*")
      .eq("user_id", context.userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  });

export const saveEmploymentProfile = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .validator((input: EmploymentProfileInput) => input)
  .handler(async ({ data, context }) => {
    // 1. Fetch existing profile so protected fields cannot be altered by non-leadership
    const { data: existing } = await context.supabase
      .from("employee_profile")
      .select("*")
      .eq("user_id", context.userId)
      .maybeSingle();

    const isManagement = context.isSuper;

    const payload: Record<string, unknown> = {
      user_id: context.userId,
      full_name: data.full_name,
      work_mode: data.work_mode,
      work_location: data.work_location,
      working_organisation: data.working_organisation,
      manager_name: data.manager_name,
      manager_email: data.manager_email,
      // Management-only fields
      designation: isManagement ? data.designation : (existing?.designation ?? data.designation),
      employee_code: isManagement ? data.employee_code : (existing?.employee_code ?? data.employee_code),
      joining_date: isManagement ? data.joining_date : (existing?.joining_date ?? data.joining_date),
      employment_type: isManagement ? data.employment_type : (existing?.employment_type ?? data.employment_type),
      status: isManagement ? data.status : (existing?.status ?? "Active"),
      salary: isManagement ? Number(data.salary || 0) : Number(existing?.salary ?? 0),
      is_verified: isManagement ? data.is_verified : (existing?.is_verified ?? false),
      verified_by: isManagement ? data.verified_by : (existing?.verified_by ?? ""),
      verified_on: isManagement ? data.verified_on : (existing?.verified_on ?? null),
    };

    const { error } = await (context.supabase as any)
      .from("employee_profile")
      .upsert(payload, { onConflict: "user_id" });
    if (error) throw new Error(error.message);

    return { ok: true };
  });

export const getPersonalDetails = createServerFn({ method: "GET" })
  .middleware([requireAdmin])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("employee_personal")
      .select("*")
      .eq("user_id", context.userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  });

export const savePersonalDetails = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .validator((input: PersonalInput) => input)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("employee_personal")
      .upsert({ ...data, user_id: context.userId }, { onConflict: "user_id" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getEmployeeDocuments = createServerFn({ method: "GET" })
  .middleware([requireAdmin])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("employee_documents")
      .select("*")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    return data;
  });

export const saveEmployeeDocument = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .validator(
    (input: { doc_type: string; info: string; file_url: string; file_name: string }) => input,
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("employee_documents").insert({
      ...data,
      status: "uploaded",
      user_id: context.userId,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteEmployeeDocument = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .validator((input: { id: string }) => input)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("employee_documents")
      .delete()
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
