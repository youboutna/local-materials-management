export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      claim_medical_acts: {
        Row: {
          claim_id: string
          id: string
          medical_act_code: string
          price_charged: number
          quantity: number | null
          remarks: string | null
        }
        Insert: {
          claim_id: string
          id?: string
          medical_act_code: string
          price_charged: number
          quantity?: number | null
          remarks?: string | null
        }
        Update: {
          claim_id?: string
          id?: string
          medical_act_code?: string
          price_charged?: number
          quantity?: number | null
          remarks?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "claim_medical_acts_claim_id_fkey"
            columns: ["claim_id"]
            isOneToOne: false
            referencedRelation: "health_claims"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "claim_medical_acts_medical_act_code_fkey"
            columns: ["medical_act_code"]
            isOneToOne: false
            referencedRelation: "medical_acts"
            referencedColumns: ["code"]
          },
        ]
      }
      health_claims: {
        Row: {
          act_reimbursement_rates: Json | null
          claim_date: string
          created_at: string
          id: string
          insurance_company_id: string | null
          invoice_number: string | null
          patient_id: string
          practitioner_name: string | null
          status: string | null
          total_amount: number
          updated_at: string
          valid_for_reimbursement: boolean | null
        }
        Insert: {
          act_reimbursement_rates?: Json | null
          claim_date: string
          created_at?: string
          id?: string
          insurance_company_id?: string | null
          invoice_number?: string | null
          patient_id: string
          practitioner_name?: string | null
          status?: string | null
          total_amount: number
          updated_at?: string
          valid_for_reimbursement?: boolean | null
        }
        Update: {
          act_reimbursement_rates?: Json | null
          claim_date?: string
          created_at?: string
          id?: string
          insurance_company_id?: string | null
          invoice_number?: string | null
          patient_id?: string
          practitioner_name?: string | null
          status?: string | null
          total_amount?: number
          updated_at?: string
          valid_for_reimbursement?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "health_claims_insurance_company_id_fkey"
            columns: ["insurance_company_id"]
            isOneToOne: false
            referencedRelation: "insurance_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "health_claims_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      inspections: {
        Row: {
          comments: string | null
          created_at: string
          date: string
          documents: Json | null
          id: string
          inspector: string
          progress_at_inspection: number
          project_id: string
          status: string
          updated_at: string
        }
        Insert: {
          comments?: string | null
          created_at?: string
          date: string
          documents?: Json | null
          id?: string
          inspector: string
          progress_at_inspection: number
          project_id: string
          status: string
          updated_at?: string
        }
        Update: {
          comments?: string | null
          created_at?: string
          date?: string
          documents?: Json | null
          id?: string
          inspector?: string
          progress_at_inspection?: number
          project_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inspections_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      insurance_companies: {
        Row: {
          address: string | null
          contact_person: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          contact_person?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          contact_person?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      materials: {
        Row: {
          available_quantity: number
          category: string
          created_at: string
          description: string
          id: string
          image: string | null
          name: string
          origin_location: string | null
          price_per_unit: number
          unit: string
          updated_at: string
        }
        Insert: {
          available_quantity?: number
          category: string
          created_at?: string
          description: string
          id?: string
          image?: string | null
          name: string
          origin_location?: string | null
          price_per_unit: number
          unit: string
          updated_at?: string
        }
        Update: {
          available_quantity?: number
          category?: string
          created_at?: string
          description?: string
          id?: string
          image?: string | null
          name?: string
          origin_location?: string | null
          price_per_unit?: number
          unit?: string
          updated_at?: string
        }
        Relationships: []
      }
      medical_acts: {
        Row: {
          code: string
          created_at: string
          default_price: number | null
          label: string
          type_label: string | null
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          default_price?: number | null
          label: string
          type_label?: string | null
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          default_price?: number | null
          label?: string
          type_label?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      patients: {
        Row: {
          address: string | null
          allergies_notes: string | null
          blood_type: string | null
          created_at: string
          date_of_birth: string | null
          gender: string | null
          id: string
          insurance_number: string | null
          medical_history_notes: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          allergies_notes?: string | null
          blood_type?: string | null
          created_at?: string
          date_of_birth?: string | null
          gender?: string | null
          id: string
          insurance_number?: string | null
          medical_history_notes?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          allergies_notes?: string | null
          blood_type?: string | null
          created_at?: string
          date_of_birth?: string | null
          gender?: string | null
          id?: string
          insurance_number?: string | null
          medical_history_notes?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "patients_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          id: string
          inspection_id: string | null
          payment_date: string
          payment_method: string
          progress_at_payment: number
          project_id: string
          transaction_id: string
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          inspection_id?: string | null
          payment_date: string
          payment_method: string
          progress_at_payment: number
          project_id: string
          transaction_id: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          inspection_id?: string | null
          payment_date?: string
          payment_method?: string
          progress_at_payment?: number
          project_id?: string
          transaction_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          full_name: string | null
          id: string
          national_id: string | null
          phone: string | null
          role: Database["public"]["Enums"]["user_role"] | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          full_name?: string | null
          id: string
          national_id?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string
          national_id?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      project_materials: {
        Row: {
          created_at: string
          id: string
          material_id: string
          project_id: string
          quantity: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          material_id: string
          project_id: string
          quantity: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          material_id?: string
          project_id?: string
          quantity?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_materials_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_materials_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          budget: number
          coordinates_latitude: number | null
          coordinates_longitude: number | null
          created_at: string
          description: string
          end_date: string | null
          id: string
          location: string
          progress: number
          start_date: string
          status: string
          team_size: number
          thumbnail: string
          title: string
          updated_at: string
        }
        Insert: {
          budget: number
          coordinates_latitude?: number | null
          coordinates_longitude?: number | null
          created_at?: string
          description: string
          end_date?: string | null
          id?: string
          location: string
          progress?: number
          start_date: string
          status: string
          team_size: number
          thumbnail?: string
          title: string
          updated_at?: string
        }
        Update: {
          budget?: number
          coordinates_latitude?: number | null
          coordinates_longitude?: number | null
          created_at?: string
          description?: string
          end_date?: string | null
          id?: string
          location?: string
          progress?: number
          start_date?: string
          status?: string
          team_size?: number
          thumbnail?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      prospect_subscription_requests: {
        Row: {
          address: string
          bank_details_url: string | null
          company_name: string | null
          created_at: string
          email: string
          id: string
          id_card_url: string | null
          phone: string
          practitioner_specialty: string | null
          prospect_type: string
          selected_plan_price_text: string
          selected_plan_title: string
          social_security_card_url: string | null
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          address: string
          bank_details_url?: string | null
          company_name?: string | null
          created_at?: string
          email: string
          id?: string
          id_card_url?: string | null
          phone: string
          practitioner_specialty?: string | null
          prospect_type: string
          selected_plan_price_text: string
          selected_plan_title: string
          social_security_card_url?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          address?: string
          bank_details_url?: string | null
          company_name?: string | null
          created_at?: string
          email?: string
          id?: string
          id_card_url?: string | null
          phone?: string
          practitioner_specialty?: string | null
          prospect_type?: string
          selected_plan_price_text?: string
          selected_plan_title?: string
          social_security_card_url?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          act_codes: Json | null
          active: boolean | null
          category: string | null
          coverage_details: Json | null
          coverage_rate: number | null
          created_at: string
          end_date: string | null
          id: string
          insurance_company_id: string | null
          name: string | null
          patient_id: string
          policy_number: string | null
          price: number | null
          start_date: string | null
          updated_at: string
        }
        Insert: {
          act_codes?: Json | null
          active?: boolean | null
          category?: string | null
          coverage_details?: Json | null
          coverage_rate?: number | null
          created_at?: string
          end_date?: string | null
          id?: string
          insurance_company_id?: string | null
          name?: string | null
          patient_id: string
          policy_number?: string | null
          price?: number | null
          start_date?: string | null
          updated_at?: string
        }
        Update: {
          act_codes?: Json | null
          active?: boolean | null
          category?: string | null
          coverage_details?: Json | null
          coverage_rate?: number | null
          created_at?: string
          end_date?: string | null
          id?: string
          insurance_company_id?: string | null
          name?: string | null
          patient_id?: string
          policy_number?: string | null
          price?: number | null
          start_date?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_insurance_company_id_fkey"
            columns: ["insurance_company_id"]
            isOneToOne: false
            referencedRelation: "insurance_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_role: {
        Args: { user_id: string }
        Returns: Database["public"]["Enums"]["user_role"]
      }
    }
    Enums: {
      user_role: "insurance_company" | "practitioner" | "patient"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      user_role: ["insurance_company", "practitioner", "patient"],
    },
  },
} as const
