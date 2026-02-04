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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      attendance_sessions: {
        Row: {
          company_id: string | null
          created_at: string
          id: string
          notes: string | null
          session_id: string | null
          sign_in_time: string
          sign_out_time: string | null
          status: Database["public"]["Enums"]["attendance_status"] | null
          user_id: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          session_id?: string | null
          sign_in_time?: string
          sign_out_time?: string | null
          status?: Database["public"]["Enums"]["attendance_status"] | null
          user_id: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          session_id?: string | null
          sign_in_time?: string
          sign_out_time?: string | null
          status?: Database["public"]["Enums"]["attendance_status"] | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_sessions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_sessions_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "work_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_history: {
        Row: {
          amount: number
          company_id: string
          created_at: string | null
          currency: string | null
          description: string | null
          id: string
          invoice_url: string | null
          status: string | null
        }
        Insert: {
          amount: number
          company_id: string
          created_at?: string | null
          currency?: string | null
          description?: string | null
          id?: string
          invoice_url?: string | null
          status?: string | null
        }
        Update: {
          amount?: number
          company_id?: string
          created_at?: string | null
          currency?: string | null
          description?: string | null
          id?: string
          invoice_url?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "billing_history_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          created_at: string | null
          domain: string | null
          id: string
          is_active: boolean | null
          logo_url: string | null
          name: string
          slug: string
          trial_ends_at: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          domain?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name: string
          slug: string
          trial_ends_at?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          domain?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name?: string
          slug?: string
          trial_ends_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      company_settings: {
        Row: {
          company_id: string | null
          created_at: string
          id: string
          setting_key: string
          setting_value: Json
          updated_at: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          id?: string
          setting_key: string
          setting_value?: Json
          updated_at?: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          id?: string
          setting_key?: string
          setting_value?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_settings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      departments: {
        Row: {
          company_id: string | null
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "departments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      holidays: {
        Row: {
          company_id: string | null
          created_at: string
          date: string
          id: string
          name: string
          type: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          date: string
          id?: string
          name: string
          type?: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          date?: string
          id?: string
          name?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "holidays_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      leave_balances: {
        Row: {
          casual_leave: number | null
          company_id: string | null
          created_at: string
          id: string
          paid_leave: number | null
          sick_leave: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          casual_leave?: number | null
          company_id?: string | null
          created_at?: string
          id?: string
          paid_leave?: number | null
          sick_leave?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          casual_leave?: number | null
          company_id?: string | null
          created_at?: string
          id?: string
          paid_leave?: number | null
          sick_leave?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "leave_balances_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      leave_requests: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          company_id: string | null
          created_at: string
          end_date: string
          id: string
          leave_type: Database["public"]["Enums"]["leave_type"]
          reason: string | null
          rejection_reason: string | null
          start_date: string
          status: Database["public"]["Enums"]["leave_status"] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          company_id?: string | null
          created_at?: string
          end_date: string
          id?: string
          leave_type: Database["public"]["Enums"]["leave_type"]
          reason?: string | null
          rejection_reason?: string | null
          start_date: string
          status?: Database["public"]["Enums"]["leave_status"] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          company_id?: string | null
          created_at?: string
          end_date?: string
          id?: string
          leave_type?: Database["public"]["Enums"]["leave_type"]
          reason?: string | null
          rejection_reason?: string | null
          start_date?: string
          status?: Database["public"]["Enums"]["leave_status"] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "leave_requests_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      payroll: {
        Row: {
          base_salary: number | null
          company_id: string | null
          created_at: string
          deductions: number | null
          epf_amount: number | null
          esic_amount: number | null
          gross_salary: number | null
          id: string
          month: number
          net_salary: number | null
          paid_leave_days: number | null
          pf_amount: number | null
          present_days: number | null
          processed_at: string | null
          status: string | null
          total_additions: number | null
          total_deductions: number | null
          unpaid_leave_days: number | null
          updated_at: string
          user_id: string
          working_days: number | null
          year: number
        }
        Insert: {
          base_salary?: number | null
          company_id?: string | null
          created_at?: string
          deductions?: number | null
          epf_amount?: number | null
          esic_amount?: number | null
          gross_salary?: number | null
          id?: string
          month: number
          net_salary?: number | null
          paid_leave_days?: number | null
          pf_amount?: number | null
          present_days?: number | null
          processed_at?: string | null
          status?: string | null
          total_additions?: number | null
          total_deductions?: number | null
          unpaid_leave_days?: number | null
          updated_at?: string
          user_id: string
          working_days?: number | null
          year: number
        }
        Update: {
          base_salary?: number | null
          company_id?: string | null
          created_at?: string
          deductions?: number | null
          epf_amount?: number | null
          esic_amount?: number | null
          gross_salary?: number | null
          id?: string
          month?: number
          net_salary?: number | null
          paid_leave_days?: number | null
          pf_amount?: number | null
          present_days?: number | null
          processed_at?: string | null
          status?: string | null
          total_additions?: number | null
          total_deductions?: number | null
          unpaid_leave_days?: number | null
          updated_at?: string
          user_id?: string
          working_days?: number | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "payroll_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      payroll_adjustments: {
        Row: {
          adjustment_type: string
          amount: number
          company_id: string | null
          created_at: string
          id: string
          name: string
          payroll_id: string
        }
        Insert: {
          adjustment_type: string
          amount?: number
          company_id?: string | null
          created_at?: string
          id?: string
          name: string
          payroll_id: string
        }
        Update: {
          adjustment_type?: string
          amount?: number
          company_id?: string | null
          created_at?: string
          id?: string
          name?: string
          payroll_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payroll_adjustments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payroll_adjustments_payroll_id_fkey"
            columns: ["payroll_id"]
            isOneToOne: false
            referencedRelation: "payroll"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
          base_price: number
          created_at: string
          features: Json | null
          id: string
          is_active: boolean | null
          max_employees: number
          name: string
          plan_type: Database["public"]["Enums"]["plan_type"]
          price_per_employee: number
          updated_at: string
        }
        Insert: {
          base_price?: number
          created_at?: string
          features?: Json | null
          id?: string
          is_active?: boolean | null
          max_employees?: number
          name: string
          plan_type: Database["public"]["Enums"]["plan_type"]
          price_per_employee?: number
          updated_at?: string
        }
        Update: {
          base_price?: number
          created_at?: string
          features?: Json | null
          id?: string
          is_active?: boolean | null
          max_employees?: number
          name?: string
          plan_type?: Database["public"]["Enums"]["plan_type"]
          price_per_employee?: number
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          address: string | null
          avatar_url: string | null
          bank_account_number: string | null
          bank_ifsc: string | null
          bank_name: string | null
          company_id: string | null
          created_at: string
          date_of_joining: string | null
          department_id: string | null
          email: string
          employee_id: string | null
          first_name: string
          id: string
          last_name: string
          monthly_salary: number | null
          phone: string | null
          reporting_manager_id: string | null
          salary_type: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          bank_account_number?: string | null
          bank_ifsc?: string | null
          bank_name?: string | null
          company_id?: string | null
          created_at?: string
          date_of_joining?: string | null
          department_id?: string | null
          email: string
          employee_id?: string | null
          first_name: string
          id?: string
          last_name: string
          monthly_salary?: number | null
          phone?: string | null
          reporting_manager_id?: string | null
          salary_type?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          bank_account_number?: string | null
          bank_ifsc?: string | null
          bank_name?: string | null
          company_id?: string | null
          created_at?: string
          date_of_joining?: string | null
          department_id?: string | null
          email?: string
          employee_id?: string | null
          first_name?: string
          id?: string
          last_name?: string
          monthly_salary?: number | null
          phone?: string | null
          reporting_manager_id?: string | null
          salary_type?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_reporting_manager_id_fkey"
            columns: ["reporting_manager_id"]
            isOneToOne: false
            referencedRelation: "employee_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_reporting_manager_id_fkey"
            columns: ["reporting_manager_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          base_price: number | null
          company_id: string
          created_at: string | null
          current_period_end: string | null
          current_period_start: string | null
          id: string
          max_employees: number | null
          plan_type: Database["public"]["Enums"]["plan_type"] | null
          price_per_employee: number | null
          status: Database["public"]["Enums"]["subscription_status"] | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string | null
        }
        Insert: {
          base_price?: number | null
          company_id: string
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          max_employees?: number | null
          plan_type?: Database["public"]["Enums"]["plan_type"] | null
          price_per_employee?: number | null
          status?: Database["public"]["Enums"]["subscription_status"] | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string | null
        }
        Update: {
          base_price?: number | null
          company_id?: string
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          max_employees?: number | null
          plan_type?: Database["public"]["Enums"]["plan_type"] | null
          price_per_employee?: number | null
          status?: Database["public"]["Enums"]["subscription_status"] | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      super_admins: {
        Row: {
          created_at: string | null
          email: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
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
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      work_sessions: {
        Row: {
          company_id: string | null
          created_at: string
          end_time: string
          id: string
          is_active: boolean | null
          name: string
          start_time: string
          updated_at: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          end_time: string
          id?: string
          is_active?: boolean | null
          name: string
          start_time: string
          updated_at?: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          end_time?: string
          id?: string
          is_active?: boolean | null
          name?: string
          start_time?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_sessions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      employee_directory: {
        Row: {
          avatar_url: string | null
          department_id: string | null
          employee_id: string | null
          first_name: string | null
          id: string | null
          last_name: string | null
          reporting_manager_id: string | null
          user_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          department_id?: string | null
          employee_id?: string | null
          first_name?: string | null
          id?: string | null
          last_name?: string | null
          reporting_manager_id?: string | null
          user_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          department_id?: string | null
          employee_id?: string | null
          first_name?: string | null
          id?: string | null
          last_name?: string | null
          reporting_manager_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_reporting_manager_id_fkey"
            columns: ["reporting_manager_id"]
            isOneToOne: false
            referencedRelation: "employee_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_reporting_manager_id_fkey"
            columns: ["reporting_manager_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      belongs_to_company: {
        Args: { _company_id: string; _user_id: string }
        Returns: boolean
      }
      get_user_company_id: { Args: { _user_id: string }; Returns: string }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_manager_or_above: { Args: { _user_id: string }; Returns: boolean }
      is_super_admin: { Args: { _user_id: string }; Returns: boolean }
      manages_user: {
        Args: { _employee_user_id: string; _manager_user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "owner" | "admin" | "manager" | "employee" | "super_admin"
      attendance_status: "present" | "absent" | "half_day" | "on_leave" | "late"
      leave_status: "pending" | "approved" | "rejected"
      leave_type: "casual" | "sick" | "paid" | "unpaid"
      plan_type: "free" | "starter" | "professional" | "enterprise"
      subscription_status:
        | "trialing"
        | "active"
        | "past_due"
        | "canceled"
        | "paused"
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
      app_role: ["owner", "admin", "manager", "employee", "super_admin"],
      attendance_status: ["present", "absent", "half_day", "on_leave", "late"],
      leave_status: ["pending", "approved", "rejected"],
      leave_type: ["casual", "sick", "paid", "unpaid"],
      plan_type: ["free", "starter", "professional", "enterprise"],
      subscription_status: [
        "trialing",
        "active",
        "past_due",
        "canceled",
        "paused",
      ],
    },
  },
} as const
