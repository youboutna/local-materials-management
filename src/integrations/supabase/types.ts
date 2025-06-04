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
      documents: {
        Row: {
          assigned_to: string | null
          created_at: string | null
          description: string | null
          document_type: Database["public"]["Enums"]["document_type"]
          file_name: string | null
          file_size: number | null
          file_url: string | null
          id: string
          inspection_id: string | null
          metadata: Json | null
          mime_type: string | null
          project_id: string | null
          status: Database["public"]["Enums"]["document_status"] | null
          tags: string[] | null
          title: string
          updated_at: string | null
          uploaded_by: string | null
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string | null
          description?: string | null
          document_type: Database["public"]["Enums"]["document_type"]
          file_name?: string | null
          file_size?: number | null
          file_url?: string | null
          id?: string
          inspection_id?: string | null
          metadata?: Json | null
          mime_type?: string | null
          project_id?: string | null
          status?: Database["public"]["Enums"]["document_status"] | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
          uploaded_by?: string | null
        }
        Update: {
          assigned_to?: string | null
          created_at?: string | null
          description?: string | null
          document_type?: Database["public"]["Enums"]["document_type"]
          file_name?: string | null
          file_size?: number | null
          file_url?: string | null
          id?: string
          inspection_id?: string | null
          metadata?: Json | null
          mime_type?: string | null
          project_id?: string | null
          status?: Database["public"]["Enums"]["document_status"] | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_inspection_id_fkey"
            columns: ["inspection_id"]
            isOneToOne: false
            referencedRelation: "inspections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          certifications: Json | null
          created_at: string | null
          department: string | null
          email: string | null
          employee_id: string
          full_name: string
          hire_date: string | null
          id: string
          is_active: boolean | null
          manager_id: string | null
          phone: string | null
          position: string | null
          salary: number | null
          skills: string[] | null
          superior_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          certifications?: Json | null
          created_at?: string | null
          department?: string | null
          email?: string | null
          employee_id: string
          full_name: string
          hire_date?: string | null
          id?: string
          is_active?: boolean | null
          manager_id?: string | null
          phone?: string | null
          position?: string | null
          salary?: number | null
          skills?: string[] | null
          superior_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          certifications?: Json | null
          created_at?: string | null
          department?: string | null
          email?: string | null
          employee_id?: string
          full_name?: string
          hire_date?: string | null
          id?: string
          is_active?: boolean | null
          manager_id?: string | null
          phone?: string | null
          position?: string | null
          salary?: number | null
          skills?: string[] | null
          superior_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employees_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_superior_id_fkey"
            columns: ["superior_id"]
            isOneToOne: false
            referencedRelation: "employees"
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
          adresse: Json | null
          available_quantity: number
          category: string
          coordinates_latitude: number | null
          coordinates_longitude: number | null
          created_at: string
          description: string
          forme: string | null
          id: string
          image: string | null
          localisation: Json | null
          name: string
          origin_location: string | null
          price_per_unit: number
          unit: string
          updated_at: string
          workspace_id: string | null
        }
        Insert: {
          adresse?: Json | null
          available_quantity?: number
          category: string
          coordinates_latitude?: number | null
          coordinates_longitude?: number | null
          created_at?: string
          description: string
          forme?: string | null
          id?: string
          image?: string | null
          localisation?: Json | null
          name: string
          origin_location?: string | null
          price_per_unit: number
          unit: string
          updated_at?: string
          workspace_id?: string | null
        }
        Update: {
          adresse?: Json | null
          available_quantity?: number
          category?: string
          coordinates_latitude?: number | null
          coordinates_longitude?: number | null
          created_at?: string
          description?: string
          forme?: string | null
          id?: string
          image?: string | null
          localisation?: Json | null
          name?: string
          origin_location?: string | null
          price_per_unit?: number
          unit?: string
          updated_at?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "materials_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          message: string
          metadata: Json | null
          read: boolean
          recipient_id: string
          related_id: string | null
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          metadata?: Json | null
          read?: boolean
          recipient_id: string
          related_id?: string | null
          title: string
          type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          metadata?: Json | null
          read?: boolean
          recipient_id?: string
          related_id?: string | null
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
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
      profit_distributions: {
        Row: {
          amount: number
          created_at: string | null
          id: string
          mission_id: string | null
          paid_at: string | null
          payment_status: string | null
          percentage: number | null
          recipient_id: string | null
          recipient_type: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          id?: string
          mission_id?: string | null
          paid_at?: string | null
          payment_status?: string | null
          percentage?: number | null
          recipient_id?: string | null
          recipient_type: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: string
          mission_id?: string | null
          paid_at?: string | null
          payment_status?: string | null
          percentage?: number | null
          recipient_id?: string | null
          recipient_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "profit_distributions_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "fishing_missions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profit_distributions_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
          attribution_date: string | null
          budget: number
          completion_date: string | null
          coordinates_latitude: number | null
          coordinates_longitude: number | null
          created_at: string
          description: string
          end_date: string | null
          financing_source: string | null
          id: string
          launch_date: string | null
          location: string
          market_type: string | null
          progress: number
          project_order: number | null
          selection_mode: string | null
          start_date: string
          status: string
          team_size: number
          thumbnail: string
          title: string
          updated_at: string
        }
        Insert: {
          attribution_date?: string | null
          budget: number
          completion_date?: string | null
          coordinates_latitude?: number | null
          coordinates_longitude?: number | null
          created_at?: string
          description: string
          end_date?: string | null
          financing_source?: string | null
          id?: string
          launch_date?: string | null
          location: string
          market_type?: string | null
          progress?: number
          project_order?: number | null
          selection_mode?: string | null
          start_date: string
          status: string
          team_size: number
          thumbnail?: string
          title: string
          updated_at?: string
        }
        Update: {
          attribution_date?: string | null
          budget?: number
          completion_date?: string | null
          coordinates_latitude?: number | null
          coordinates_longitude?: number | null
          created_at?: string
          description?: string
          end_date?: string | null
          financing_source?: string | null
          id?: string
          launch_date?: string | null
          location?: string
          market_type?: string | null
          progress?: number
          project_order?: number | null
          selection_mode?: string | null
          start_date?: string
          status?: string
          team_size?: number
          thumbnail?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      quantity_takeoffs: {
        Row: {
          created_at: string
          element_type: string
          height: number | null
          id: string
          length: number
          material_id: string
          note: string | null
          project_id: string
          quantity: number
          unit: string
          updated_at: string
          width: number | null
        }
        Insert: {
          created_at?: string
          element_type: string
          height?: number | null
          id?: string
          length?: number
          material_id: string
          note?: string | null
          project_id: string
          quantity?: number
          unit: string
          updated_at?: string
          width?: number | null
        }
        Update: {
          created_at?: string
          element_type?: string
          height?: number | null
          id?: string
          length?: number
          material_id?: string
          note?: string | null
          project_id?: string
          quantity?: number
          unit?: string
          updated_at?: string
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "quantity_takeoffs_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quantity_takeoffs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          address: string | null
          category: string | null
          contact_person: string | null
          created_at: string | null
          email: string | null
          id: string
          is_active: boolean | null
          name: string
          phone: string | null
          rating: number | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          category?: string | null
          contact_person?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          phone?: string | null
          rating?: number | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          category?: string | null
          contact_person?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          phone?: string | null
          rating?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      supply_categories: {
        Row: {
          description: string | null
          id: string
          name: string
          unit: string
        }
        Insert: {
          description?: string | null
          id?: string
          name: string
          unit: string
        }
        Update: {
          description?: string | null
          id?: string
          name?: string
          unit?: string
        }
        Relationships: []
      }
      supply_requests: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          category_id: string | null
          completed_at: string | null
          id: string
          item_name: string
          mission_id: string | null
          notes: string | null
          quantity_approved: number | null
          quantity_requested: number
          receipt_url: string | null
          requested_at: string | null
          requested_by: string | null
          status: Database["public"]["Enums"]["supply_request_status"] | null
          supplier_name: string | null
          total_cost: number | null
          unit_price: number | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          category_id?: string | null
          completed_at?: string | null
          id?: string
          item_name: string
          mission_id?: string | null
          notes?: string | null
          quantity_approved?: number | null
          quantity_requested: number
          receipt_url?: string | null
          requested_at?: string | null
          requested_by?: string | null
          status?: Database["public"]["Enums"]["supply_request_status"] | null
          supplier_name?: string | null
          total_cost?: number | null
          unit_price?: number | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          category_id?: string | null
          completed_at?: string | null
          id?: string
          item_name?: string
          mission_id?: string | null
          notes?: string | null
          quantity_approved?: number | null
          quantity_requested?: number
          receipt_url?: string | null
          requested_at?: string | null
          requested_by?: string | null
          status?: Database["public"]["Enums"]["supply_request_status"] | null
          supplier_name?: string | null
          total_cost?: number | null
          unit_price?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "supply_requests_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supply_requests_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "supply_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supply_requests_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "fishing_missions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supply_requests_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      task_assignments: {
        Row: {
          assigned_by: string | null
          assigned_to: string | null
          completion_date: string | null
          created_at: string | null
          description: string | null
          due_date: string | null
          id: string
          notes: string | null
          priority: string | null
          project_id: string | null
          status: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          assigned_by?: string | null
          assigned_to?: string | null
          completion_date?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          notes?: string | null
          priority?: string | null
          project_id?: string | null
          status?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          assigned_by?: string | null
          assigned_to?: string | null
          completion_date?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          notes?: string | null
          priority?: string | null
          project_id?: string | null
          status?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "task_assignments_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_assignments_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_assignments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      tender_documents: {
        Row: {
          category: Database["public"]["Enums"]["tender_document_category"]
          created_at: string
          document_id: string
          id: string
          is_required: boolean | null
          is_submitted: boolean | null
          project_id: string
          reviewer_notes: string | null
          status: string | null
          subcategory: Database["public"]["Enums"]["tender_document_subcategory"]
          submission_date: string | null
          updated_at: string
        }
        Insert: {
          category: Database["public"]["Enums"]["tender_document_category"]
          created_at?: string
          document_id: string
          id?: string
          is_required?: boolean | null
          is_submitted?: boolean | null
          project_id: string
          reviewer_notes?: string | null
          status?: string | null
          subcategory: Database["public"]["Enums"]["tender_document_subcategory"]
          submission_date?: string | null
          updated_at?: string
        }
        Update: {
          category?: Database["public"]["Enums"]["tender_document_category"]
          created_at?: string
          document_id?: string
          id?: string
          is_required?: boolean | null
          is_submitted?: boolean | null
          project_id?: string
          reviewer_notes?: string | null
          status?: string | null
          subcategory?: Database["public"]["Enums"]["tender_document_subcategory"]
          submission_date?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tender_documents_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tender_documents_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      workspaces: {
        Row: {
          contact_manager: string | null
          contact_phone: string | null
          created_at: string
          facilities: Json | null
          id: string
          location: string
          name: string
          status: string
          updated_at: string
        }
        Insert: {
          contact_manager?: string | null
          contact_phone?: string | null
          created_at?: string
          facilities?: Json | null
          id?: string
          location: string
          name: string
          status?: string
          updated_at?: string
        }
        Update: {
          contact_manager?: string | null
          contact_phone?: string | null
          created_at?: string
          facilities?: Json | null
          id?: string
          location?: string
          name?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
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
      document_status:
        | "draft"
        | "pending_review"
        | "approved"
        | "rejected"
        | "archived"
      document_type:
        | "inspection_report"
        | "location_photo"
        | "project_report"
        | "contract"
        | "supplier_info"
        | "task_assignment"
        | "employee_record"
        | "tender"
      mission_status: "planned" | "in_progress" | "completed" | "cancelled"
      supply_request_status: "pending" | "approved" | "rejected" | "completed"
      tender_document_category: "administrative" | "technical" | "financial"
      tender_document_subcategory:
        | "lettre_soumission"
        | "pouvoir_signature"
        | "acte_groupement"
        | "attestation_impot"
        | "attestation_cnss"
        | "attestation_non_faillite"
        | "renseignement_soumissionnaire"
        | "preuves_capacites_techniques"
        | "experience_generale_marche"
        | "methodologie"
        | "personnel_cle"
        | "planning_travaux"
        | "calendrier_livraison"
        | "conformite_techniques"
        | "preuves_capacites_financieres"
        | "chiffre_affaires_annuel"
        | "devis_quantitatif_estimatif"
        | "garantie_bancaire"
        | "garantie_soumission"
      user_role: "insurance_company" | "practitioner" | "patient"
      vessel_status: "active" | "maintenance" | "inactive"
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
      document_status: [
        "draft",
        "pending_review",
        "approved",
        "rejected",
        "archived",
      ],
      document_type: [
        "inspection_report",
        "location_photo",
        "project_report",
        "contract",
        "supplier_info",
        "task_assignment",
        "employee_record",
        "tender",
      ],
      mission_status: ["planned", "in_progress", "completed", "cancelled"],
      supply_request_status: ["pending", "approved", "rejected", "completed"],
      tender_document_category: ["administrative", "technical", "financial"],
      tender_document_subcategory: [
        "lettre_soumission",
        "pouvoir_signature",
        "acte_groupement",
        "attestation_impot",
        "attestation_cnss",
        "attestation_non_faillite",
        "renseignement_soumissionnaire",
        "preuves_capacites_techniques",
        "experience_generale_marche",
        "methodologie",
        "personnel_cle",
        "planning_travaux",
        "calendrier_livraison",
        "conformite_techniques",
        "preuves_capacites_financieres",
        "chiffre_affaires_annuel",
        "devis_quantitatif_estimatif",
        "garantie_bancaire",
        "garantie_soumission",
      ],
      user_role: ["admin", "manager", "director","agent","supplier","contractor","subcontractor"],
    },
  },
} as const
