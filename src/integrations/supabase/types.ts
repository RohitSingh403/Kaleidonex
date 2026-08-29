export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      announcements: {
        Row: {
          audience: string
          author_id: string
          body: string
          category: string
          created_at: string
          department_id: string | null
          id: string
          manager_id: string | null
          published: boolean
          title: string
          updated_at: string
        }
        Insert: {
          audience?: string
          author_id: string
          body?: string
          category?: string
          created_at?: string
          department_id?: string | null
          id?: string
          manager_id?: string | null
          published?: boolean
          title: string
          updated_at?: string
        }
        Update: {
          audience?: string
          author_id?: string
          body?: string
          category?: string
          created_at?: string
          department_id?: string | null
          id?: string
          manager_id?: string | null
          published?: boolean
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "announcements_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      approval_actions: {
        Row: {
          action: Database["public"]["Enums"]["approval_act"]
          actor_id: string | null
          actor_name: string
          actor_role: string
          comment: string
          created_at: string
          id: string
          new_state: Database["public"]["Enums"]["approval_state"]
          previous_state: Database["public"]["Enums"]["approval_state"] | null
          request_id: string
        }
        Insert: {
          action: Database["public"]["Enums"]["approval_act"]
          actor_id?: string | null
          actor_name?: string
          actor_role?: string
          comment?: string
          created_at?: string
          id?: string
          new_state: Database["public"]["Enums"]["approval_state"]
          previous_state?: Database["public"]["Enums"]["approval_state"] | null
          request_id: string
        }
        Update: {
          action?: Database["public"]["Enums"]["approval_act"]
          actor_id?: string | null
          actor_name?: string
          actor_role?: string
          comment?: string
          created_at?: string
          id?: string
          new_state?: Database["public"]["Enums"]["approval_state"]
          previous_state?: Database["public"]["Enums"]["approval_state"] | null
          request_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "approval_actions_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "approval_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      approval_requests: {
        Row: {
          amount: number
          created_at: string
          current_approver_id: string | null
          decided_at: string | null
          hr_id: string | null
          id: string
          kind: Database["public"]["Enums"]["approval_kind"]
          requester_id: string
          requires_ceo: boolean
          resource_id: string | null
          resource_table: string
          state: Database["public"]["Enums"]["approval_state"]
          summary: string
          title: string
          updated_at: string
        }
        Insert: {
          amount?: number
          created_at?: string
          current_approver_id?: string | null
          decided_at?: string | null
          hr_id?: string | null
          id?: string
          kind: Database["public"]["Enums"]["approval_kind"]
          requester_id: string
          requires_ceo?: boolean
          resource_id?: string | null
          resource_table?: string
          state?: Database["public"]["Enums"]["approval_state"]
          summary?: string
          title?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          current_approver_id?: string | null
          decided_at?: string | null
          hr_id?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["approval_kind"]
          requester_id?: string
          requires_ceo?: boolean
          resource_id?: string | null
          resource_table?: string
          state?: Database["public"]["Enums"]["approval_state"]
          summary?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      approval_rules: {
        Row: {
          created_at: string
          enabled: boolean
          id: string
          kind: Database["public"]["Enums"]["approval_kind"]
          label: string
          requires_ceo: boolean
          rule_key: string
          threshold_amount: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          enabled?: boolean
          id?: string
          kind: Database["public"]["Enums"]["approval_kind"]
          label?: string
          requires_ceo?: boolean
          rule_key: string
          threshold_amount?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          enabled?: boolean
          id?: string
          kind?: Database["public"]["Enums"]["approval_kind"]
          label?: string
          requires_ceo?: boolean
          rule_key?: string
          threshold_amount?: number
          updated_at?: string
        }
        Relationships: []
      }
      attendance: {
        Row: {
          check_in: string | null
          check_out: string | null
          created_at: string
          daily_update: string
          id: string
          status: Database["public"]["Enums"]["attendance_status"]
          updated_at: string
          user_id: string
          work_date: string
        }
        Insert: {
          check_in?: string | null
          check_out?: string | null
          created_at?: string
          daily_update?: string
          id?: string
          status?: Database["public"]["Enums"]["attendance_status"]
          updated_at?: string
          user_id?: string
          work_date?: string
        }
        Update: {
          check_in?: string | null
          check_out?: string | null
          created_at?: string
          daily_update?: string
          id?: string
          status?: Database["public"]["Enums"]["attendance_status"]
          updated_at?: string
          user_id?: string
          work_date?: string
        }
        Relationships: []
      }
      attendance_corrections: {
        Row: {
          created_at: string
          decided_at: string | null
          decided_by: string | null
          decision_note: string
          id: string
          reason: string
          requested_check_in: string | null
          requested_check_out: string | null
          requested_status: Database["public"]["Enums"]["attendance_status"]
          status: Database["public"]["Enums"]["request_status"]
          updated_at: string
          user_id: string
          work_date: string
        }
        Insert: {
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          decision_note?: string
          id?: string
          reason?: string
          requested_check_in?: string | null
          requested_check_out?: string | null
          requested_status: Database["public"]["Enums"]["attendance_status"]
          status?: Database["public"]["Enums"]["request_status"]
          updated_at?: string
          user_id: string
          work_date: string
        }
        Update: {
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          decision_note?: string
          id?: string
          reason?: string
          requested_check_in?: string | null
          requested_check_out?: string | null
          requested_status?: Database["public"]["Enums"]["attendance_status"]
          status?: Database["public"]["Enums"]["request_status"]
          updated_at?: string
          user_id?: string
          work_date?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          actor_name: string
          created_at: string
          details: string
          id: string
          target_id: string
          target_name: string
          target_type: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          actor_name?: string
          created_at?: string
          details?: string
          id?: string
          target_id?: string
          target_name?: string
          target_type?: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          actor_name?: string
          created_at?: string
          details?: string
          id?: string
          target_id?: string
          target_name?: string
          target_type?: string
        }
        Relationships: []
      }
      departments: {
        Row: {
          budget: number
          cost_center: string
          created_at: string
          head_id: string | null
          id: string
          name: string
          parent_id: string | null
          spent: number
          updated_at: string
        }
        Insert: {
          budget?: number
          cost_center?: string
          created_at?: string
          head_id?: string | null
          id?: string
          name: string
          parent_id?: string | null
          spent?: number
          updated_at?: string
        }
        Update: {
          budget?: number
          cost_center?: string
          created_at?: string
          head_id?: string | null
          id?: string
          name?: string
          parent_id?: string | null
          spent?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "departments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_documents: {
        Row: {
          created_at: string
          doc_type: string
          file_name: string
          file_url: string
          id: string
          info: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          doc_type: string
          file_name?: string
          file_url?: string
          id?: string
          info?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          doc_type?: string
          file_name?: string
          file_url?: string
          id?: string
          info?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      employee_personal: {
        Row: {
          aadhaar_no: string
          alternate_number: string
          bank_account_holder: string
          bank_account_number: string
          bank_branch: string
          bank_ifsc: string
          bank_name: string
          blood_group: string
          contact_number: string
          created_at: string
          cur_city: string
          cur_pincode: string
          cur_state: string
          cur_street: string
          date_of_birth: string | null
          emergency_address: string
          emergency_name: string
          emergency_number: string
          emergency_relation: string
          gender: string
          marital_status: string
          pan_no: string
          perm_city: string
          perm_pincode: string
          perm_state: string
          perm_street: string
          personal_email: string
          updated_at: string
          user_id: string
        }
        Insert: {
          aadhaar_no?: string
          alternate_number?: string
          bank_account_holder?: string
          bank_account_number?: string
          bank_branch?: string
          bank_ifsc?: string
          bank_name?: string
          blood_group?: string
          contact_number?: string
          created_at?: string
          cur_city?: string
          cur_pincode?: string
          cur_state?: string
          cur_street?: string
          date_of_birth?: string | null
          emergency_address?: string
          emergency_name?: string
          emergency_number?: string
          emergency_relation?: string
          gender?: string
          marital_status?: string
          pan_no?: string
          perm_city?: string
          perm_pincode?: string
          perm_state?: string
          perm_street?: string
          personal_email?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          aadhaar_no?: string
          alternate_number?: string
          bank_account_holder?: string
          bank_account_number?: string
          bank_branch?: string
          bank_ifsc?: string
          bank_name?: string
          blood_group?: string
          contact_number?: string
          created_at?: string
          cur_city?: string
          cur_pincode?: string
          cur_state?: string
          cur_street?: string
          date_of_birth?: string | null
          emergency_address?: string
          emergency_name?: string
          emergency_number?: string
          emergency_relation?: string
          gender?: string
          marital_status?: string
          pan_no?: string
          perm_city?: string
          perm_pincode?: string
          perm_state?: string
          perm_street?: string
          personal_email?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      employee_profile: {
        Row: {
          created_at: string
          department: string
          department_id: string | null
          designation: string
          employee_code: string
          employment_type: string
          full_name: string
          is_verified: boolean
          joining_date: string | null
          manager_email: string
          manager_id: string | null
          manager_name: string
          salary: number
          status: string
          updated_at: string
          user_id: string
          verified_by: string
          verified_on: string | null
          work_location: string
          work_mode: string
          working_organisation: string
        }
        Insert: {
          created_at?: string
          department?: string
          department_id?: string | null
          designation?: string
          employee_code?: string
          employment_type?: string
          full_name?: string
          is_verified?: boolean
          joining_date?: string | null
          manager_email?: string
          manager_id?: string | null
          manager_name?: string
          salary?: number
          status?: string
          updated_at?: string
          user_id: string
          verified_by?: string
          verified_on?: string | null
          work_location?: string
          work_mode?: string
          working_organisation?: string
        }
        Update: {
          created_at?: string
          department?: string
          department_id?: string | null
          designation?: string
          employee_code?: string
          employment_type?: string
          full_name?: string
          is_verified?: boolean
          joining_date?: string | null
          manager_email?: string
          manager_id?: string | null
          manager_name?: string
          salary?: number
          status?: string
          updated_at?: string
          user_id?: string
          verified_by?: string
          verified_on?: string | null
          work_location?: string
          work_mode?: string
          working_organisation?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_profile_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_requests: {
        Row: {
          created_at: string
          decided_at: string | null
          decided_by: string | null
          decision_note: string
          details: string
          id: string
          note: string
          request_type: string
          status: Database["public"]["Enums"]["request_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          decision_note?: string
          details?: string
          id?: string
          note?: string
          request_type?: string
          status?: Database["public"]["Enums"]["request_status"]
          updated_at?: string
          user_id?: string
        }
        Update: {
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          decision_note?: string
          details?: string
          id?: string
          note?: string
          request_type?: string
          status?: Database["public"]["Enums"]["request_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      exams: {
        Row: {
          average_score: number
          created_at: string
          ends_at: string | null
          grade: string
          id: string
          starts_at: string | null
          status: Database["public"]["Enums"]["exam_status"]
          subject: string
          title: string
          total_marks: number
        }
        Insert: {
          average_score?: number
          created_at?: string
          ends_at?: string | null
          grade?: string
          id?: string
          starts_at?: string | null
          status?: Database["public"]["Enums"]["exam_status"]
          subject?: string
          title: string
          total_marks?: number
        }
        Update: {
          average_score?: number
          created_at?: string
          ends_at?: string | null
          grade?: string
          id?: string
          starts_at?: string | null
          status?: Database["public"]["Enums"]["exam_status"]
          subject?: string
          title?: string
          total_marks?: number
        }
        Relationships: []
      }
      expense_claims: {
        Row: {
          amount: number
          approval_state: Database["public"]["Enums"]["approval_state"]
          category: string
          claim_no: string
          created_at: string
          decided_at: string | null
          decided_by: string | null
          decision_note: string
          expense_date: string
          hr_id: string | null
          id: string
          proof_urls: string[]
          purpose: string
          requires_ceo: boolean
          status: Database["public"]["Enums"]["claim_status"]
          user_id: string
        }
        Insert: {
          amount?: number
          approval_state?: Database["public"]["Enums"]["approval_state"]
          category?: string
          claim_no?: string
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          decision_note?: string
          expense_date?: string
          hr_id?: string | null
          id?: string
          proof_urls?: string[]
          purpose?: string
          requires_ceo?: boolean
          status?: Database["public"]["Enums"]["claim_status"]
          user_id?: string
        }
        Update: {
          amount?: number
          approval_state?: Database["public"]["Enums"]["approval_state"]
          category?: string
          claim_no?: string
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          decision_note?: string
          expense_date?: string
          hr_id?: string | null
          id?: string
          proof_urls?: string[]
          purpose?: string
          requires_ceo?: boolean
          status?: Database["public"]["Enums"]["claim_status"]
          user_id?: string
        }
        Relationships: []
      }
      expense_receipts: {
        Row: {
          claim_id: string
          created_at: string
          file_name: string
          file_url: string
          id: string
          user_id: string
        }
        Insert: {
          claim_id: string
          created_at?: string
          file_name?: string
          file_url?: string
          id?: string
          user_id: string
        }
        Update: {
          claim_id?: string
          created_at?: string
          file_name?: string
          file_url?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "expense_receipts_claim_id_fkey"
            columns: ["claim_id"]
            isOneToOne: false
            referencedRelation: "expense_claims"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          created_at: string
          email: string
          enquiry_type: string | null
          id: string
          interests: string[] | null
          message: string
          name: string
          phone: string | null
          school: string | null
          status: Database["public"]["Enums"]["lead_status"]
          type: Database["public"]["Enums"]["lead_type"]
        }
        Insert: {
          created_at?: string
          email: string
          enquiry_type?: string | null
          id?: string
          interests?: string[] | null
          message: string
          name: string
          phone?: string | null
          school?: string | null
          status?: Database["public"]["Enums"]["lead_status"]
          type?: Database["public"]["Enums"]["lead_type"]
        }
        Update: {
          created_at?: string
          email?: string
          enquiry_type?: string | null
          id?: string
          interests?: string[] | null
          message?: string
          name?: string
          phone?: string | null
          school?: string | null
          status?: Database["public"]["Enums"]["lead_status"]
          type?: Database["public"]["Enums"]["lead_type"]
        }
        Relationships: []
      }
      leave_applications: {
        Row: {
          created_at: string
          days: number
          decided_at: string | null
          decided_by: string | null
          decision_note: string
          end_date: string
          id: string
          leave_type: string
          reason: string
          start_date: string
          status: Database["public"]["Enums"]["leave_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          days?: number
          decided_at?: string | null
          decided_by?: string | null
          decision_note?: string
          end_date?: string
          id?: string
          leave_type?: string
          reason?: string
          start_date?: string
          status?: Database["public"]["Enums"]["leave_status"]
          updated_at?: string
          user_id?: string
        }
        Update: {
          created_at?: string
          days?: number
          decided_at?: string | null
          decided_by?: string | null
          decision_note?: string
          end_date?: string
          id?: string
          leave_type?: string
          reason?: string
          start_date?: string
          status?: Database["public"]["Enums"]["leave_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string
          created_at: string
          id: string
          is_read: boolean
          kind: string
          link: string
          title: string
          user_id: string
        }
        Insert: {
          body?: string
          created_at?: string
          id?: string
          is_read?: boolean
          kind?: string
          link?: string
          title: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          is_read?: boolean
          kind?: string
          link?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      onboarding_tasks: {
        Row: {
          assigned_by: string | null
          category: string
          completed_at: string | null
          created_at: string
          due_date: string | null
          id: string
          is_done: boolean
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          assigned_by?: string | null
          category?: string
          completed_at?: string | null
          created_at?: string
          due_date?: string | null
          id?: string
          is_done?: boolean
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          assigned_by?: string | null
          category?: string
          completed_at?: string | null
          created_at?: string
          due_date?: string | null
          id?: string
          is_done?: boolean
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      one_on_one_notes: {
        Row: {
          action_items: string
          agenda: string
          created_at: string
          employee_id: string
          id: string
          manager_id: string | null
          meeting_date: string
          notes: string
          updated_at: string
        }
        Insert: {
          action_items?: string
          agenda?: string
          created_at?: string
          employee_id: string
          id?: string
          manager_id?: string | null
          meeting_date?: string
          notes?: string
          updated_at?: string
        }
        Update: {
          action_items?: string
          agenda?: string
          created_at?: string
          employee_id?: string
          id?: string
          manager_id?: string | null
          meeting_date?: string
          notes?: string
          updated_at?: string
        }
        Relationships: []
      }
      org_settings: {
        Row: {
          created_at: string
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          created_at?: string
          key: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Update: {
          created_at?: string
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      performance_reviews: {
        Row: {
          created_at: string
          feedback: string
          goals_met: number
          goals_total: number
          id: string
          manager_rating: number
          period_label: string
          reviewer_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          feedback?: string
          goals_met?: number
          goals_total?: number
          id?: string
          manager_rating?: number
          period_label: string
          reviewer_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          feedback?: string
          goals_met?: number
          goals_total?: number
          id?: string
          manager_rating?: number
          period_label?: string
          reviewer_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          category: string
          created_at: string
          features: string[] | null
          id: string
          name: string
          price: string
          published: boolean
          sort_order: number
          stock: string
        }
        Insert: {
          category: string
          created_at?: string
          features?: string[] | null
          id?: string
          name: string
          price: string
          published?: boolean
          sort_order?: number
          stock?: string
        }
        Update: {
          category?: string
          created_at?: string
          features?: string[] | null
          id?: string
          name?: string
          price?: string
          published?: boolean
          sort_order?: number
          stock?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string
          id: string
        }
        Insert: {
          created_at?: string
          full_name?: string
          id: string
        }
        Update: {
          created_at?: string
          full_name?: string
          id?: string
        }
        Relationships: []
      }
      programmes: {
        Row: {
          created_at: string
          features: string[] | null
          id: string
          name: string
          published: boolean
          sort_order: number
          summary: string
          type: string
        }
        Insert: {
          created_at?: string
          features?: string[] | null
          id?: string
          name: string
          published?: boolean
          sort_order?: number
          summary?: string
          type?: string
        }
        Update: {
          created_at?: string
          features?: string[] | null
          id?: string
          name?: string
          published?: boolean
          sort_order?: number
          summary?: string
          type?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          created_at: string
          department_id: string | null
          description: string
          id: string
          name: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          department_id?: string | null
          description?: string
          id?: string
          name: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          department_id?: string | null
          description?: string
          id?: string
          name?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      review_cycles: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          name: string
          period_end: string
          period_start: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
          period_end: string
          period_start: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
          period_end?: string
          period_start?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      salary_records: {
        Row: {
          basic_salary: number
          created_at: string
          days: number
          deductions: number
          earnings: number
          id: string
          net_pay: number
          paid_on: string | null
          period_month: number
          period_year: number
          status: Database["public"]["Enums"]["salary_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          basic_salary?: number
          created_at?: string
          days?: number
          deductions?: number
          earnings?: number
          id?: string
          net_pay?: number
          paid_on?: string | null
          period_month?: number
          period_year?: number
          status?: Database["public"]["Enums"]["salary_status"]
          updated_at?: string
          user_id?: string
        }
        Update: {
          basic_salary?: number
          created_at?: string
          days?: number
          deductions?: number
          earnings?: number
          id?: string
          net_pay?: number
          paid_on?: string | null
          period_month?: number
          period_year?: number
          status?: Database["public"]["Enums"]["salary_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      schools: {
        Row: {
          city: string
          contact_person: string
          created_at: string
          email: string
          id: string
          model: string
          name: string
          phone: string
          status: Database["public"]["Enums"]["school_status"]
        }
        Insert: {
          city?: string
          contact_person?: string
          created_at?: string
          email?: string
          id?: string
          model?: string
          name: string
          phone?: string
          status?: Database["public"]["Enums"]["school_status"]
        }
        Update: {
          city?: string
          contact_person?: string
          created_at?: string
          email?: string
          id?: string
          model?: string
          name?: string
          phone?: string
          status?: Database["public"]["Enums"]["school_status"]
        }
        Relationships: []
      }
      sections: {
        Row: {
          created_at: string
          grade: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          grade: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          grade?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      students: {
        Row: {
          created_at: string
          email: string
          grade: string
          id: string
          name: string
          phone: string
          roll_no: string
          school_id: string | null
          section_id: string | null
          status: Database["public"]["Enums"]["student_status"]
        }
        Insert: {
          created_at?: string
          email?: string
          grade?: string
          id?: string
          name: string
          phone?: string
          roll_no?: string
          school_id?: string | null
          section_id?: string | null
          status?: Database["public"]["Enums"]["student_status"]
        }
        Update: {
          created_at?: string
          email?: string
          grade?: string
          id?: string
          name?: string
          phone?: string
          roll_no?: string
          school_id?: string | null
          section_id?: string | null
          status?: Database["public"]["Enums"]["student_status"]
        }
        Relationships: [
          {
            foreignKeyName: "students_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "sections"
            referencedColumns: ["id"]
          },
        ]
      }
      task_comments: {
        Row: {
          author_id: string
          author_name: string
          body: string
          created_at: string
          id: string
          task_id: string
        }
        Insert: {
          author_id: string
          author_name?: string
          body?: string
          created_at?: string
          id?: string
          task_id: string
        }
        Update: {
          author_id?: string
          author_name?: string
          body?: string
          created_at?: string
          id?: string
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_comments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          assigned_by: string | null
          created_at: string
          description: string
          due_date: string | null
          duration: string
          id: string
          priority: string
          progress: number
          project_id: string | null
          status: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          assigned_by?: string | null
          created_at?: string
          description?: string
          due_date?: string | null
          duration?: string
          id?: string
          priority?: string
          progress?: number
          project_id?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          assigned_by?: string | null
          created_at?: string
          description?: string
          due_date?: string | null
          duration?: string
          id?: string
          priority?: string
          progress?: number
          project_id?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      teachers: {
        Row: {
          created_at: string
          email: string
          id: string
          name: string
          phone: string
          school_id: string | null
          specialization: string
          status: Database["public"]["Enums"]["teacher_status"]
        }
        Insert: {
          created_at?: string
          email?: string
          id?: string
          name: string
          phone?: string
          school_id?: string | null
          specialization?: string
          status?: Database["public"]["Enums"]["teacher_status"]
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          name?: string
          phone?: string
          school_id?: string | null
          specialization?: string
          status?: Database["public"]["Enums"]["teacher_status"]
        }
        Relationships: [
          {
            foreignKeyName: "teachers_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      templates: {
        Row: {
          board: string
          created_at: string
          grade: string
          id: string
          is_draft: boolean
          is_published: boolean
          subject: string
          template_type: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          board?: string
          created_at?: string
          grade?: string
          id?: string
          is_draft?: boolean
          is_published?: boolean
          subject?: string
          template_type?: string
          title: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          board?: string
          created_at?: string
          grade?: string
          id?: string
          is_draft?: boolean
          is_published?: boolean
          subject?: string
          template_type?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      assigned_hr_of: { Args: { _user_id: string }; Returns: string }
      can_access_user: {
        Args: { _target_id: string; _viewer_id: string }
        Returns: boolean
      }
      can_approve_user: {
        Args: { _target_id: string; _viewer_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_hr: { Args: { _user_id: string }; Returns: boolean }
      is_super_admin: { Args: { _user_id: string }; Returns: boolean }
      manages_user: {
        Args: { _manager_id: string; _target_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "editor" | "ceo" | "hr" | "employee"
      approval_act:
        | "submit"
        | "approve"
        | "reject"
        | "request_changes"
        | "escalate"
        | "cancel"
      approval_kind:
        | "leave"
        | "expense"
        | "attendance_correction"
        | "employee_request"
        | "hr_escalation"
      approval_state:
        | "DRAFT"
        | "SUBMITTED"
        | "PENDING_HR"
        | "HR_APPROVED"
        | "PENDING_CEO"
        | "CEO_APPROVED"
        | "REJECTED"
        | "CHANGES_REQUESTED"
        | "CANCELLED"
      attendance_status:
        | "present"
        | "absent"
        | "half_day"
        | "leave"
        | "paid_leave"
        | "holiday"
      claim_status: "pending" | "approved" | "paid" | "rejected"
      exam_status: "draft" | "published"
      lead_status: "new" | "contacted" | "closed"
      lead_type: "contact" | "demo"
      leave_status: "pending" | "approved" | "rejected"
      request_status: "pending" | "approved" | "rejected"
      salary_status: "pending" | "paid"
      school_status: "prospect" | "active" | "inactive"
      student_status: "verified" | "pending" | "rejected"
      task_status:
        | "pending"
        | "in_progress"
        | "completed"
        | "todo"
        | "review"
        | "blocked"
      teacher_status: "active" | "inactive"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "editor", "ceo", "hr", "employee"],
      approval_act: [
        "submit",
        "approve",
        "reject",
        "request_changes",
        "escalate",
        "cancel",
      ],
      approval_kind: [
        "leave",
        "expense",
        "attendance_correction",
        "employee_request",
        "hr_escalation",
      ],
      approval_state: [
        "DRAFT",
        "SUBMITTED",
        "PENDING_HR",
        "HR_APPROVED",
        "PENDING_CEO",
        "CEO_APPROVED",
        "REJECTED",
        "CHANGES_REQUESTED",
        "CANCELLED",
      ],
      attendance_status: [
        "present",
        "absent",
        "half_day",
        "leave",
        "paid_leave",
        "holiday",
      ],
      claim_status: ["pending", "approved", "paid", "rejected"],
      exam_status: ["draft", "published"],
      lead_status: ["new", "contacted", "closed"],
      lead_type: ["contact", "demo"],
      leave_status: ["pending", "approved", "rejected"],
      request_status: ["pending", "approved", "rejected"],
      salary_status: ["pending", "paid"],
      school_status: ["prospect", "active", "inactive"],
      student_status: ["verified", "pending", "rejected"],
      task_status: [
        "pending",
        "in_progress",
        "completed",
        "todo",
        "review",
        "blocked",
      ],
      teacher_status: ["active", "inactive"],
    },
  },
} as const
