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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
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
      employee_requests: {
        Row: {
          created_at: string
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
          category: string
          claim_no: string
          created_at: string
          expense_date: string
          id: string
          proof_urls: string[]
          purpose: string
          status: Database["public"]["Enums"]["claim_status"]
          user_id: string
        }
        Insert: {
          amount?: number
          category?: string
          claim_no?: string
          created_at?: string
          expense_date?: string
          id?: string
          proof_urls?: string[]
          purpose?: string
          status?: Database["public"]["Enums"]["claim_status"]
          user_id?: string
        }
        Update: {
          amount?: number
          category?: string
          claim_no?: string
          created_at?: string
          expense_date?: string
          id?: string
          proof_urls?: string[]
          purpose?: string
          status?: Database["public"]["Enums"]["claim_status"]
          user_id?: string
        }
        Relationships: []
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
      tasks: {
        Row: {
          created_at: string
          description: string
          due_date: string | null
          duration: string
          id: string
          priority: string
          status: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string
          due_date?: string | null
          duration?: string
          id?: string
          priority?: string
          status?: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          created_at?: string
          description?: string
          due_date?: string | null
          duration?: string
          id?: string
          priority?: string
          status?: Database["public"]["Enums"]["task_status"]
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "editor"
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
      task_status: "pending" | "in_progress" | "completed"
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
      app_role: ["admin", "editor"],
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
      task_status: ["pending", "in_progress", "completed"],
      teacher_status: ["active", "inactive"],
    },
  },
} as const
