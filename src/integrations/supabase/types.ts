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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      authorization_documents: {
        Row: {
          authorization_id: string
          created_at: string
          document_category: Database["public"]["Enums"]["document_category"]
          document_name: string
          file_path: string
          file_size: number | null
          id: string
          is_required: boolean
          is_validated: boolean
          mime_type: string | null
          updated_at: string
          uploaded_by: string | null
          validated_at: string | null
          validated_by: string | null
          validation_notes: string | null
        }
        Insert: {
          authorization_id: string
          created_at?: string
          document_category: Database["public"]["Enums"]["document_category"]
          document_name: string
          file_path: string
          file_size?: number | null
          id?: string
          is_required?: boolean
          is_validated?: boolean
          mime_type?: string | null
          updated_at?: string
          uploaded_by?: string | null
          validated_at?: string | null
          validated_by?: string | null
          validation_notes?: string | null
        }
        Update: {
          authorization_id?: string
          created_at?: string
          document_category?: Database["public"]["Enums"]["document_category"]
          document_name?: string
          file_path?: string
          file_size?: number | null
          id?: string
          is_required?: boolean
          is_validated?: boolean
          mime_type?: string | null
          updated_at?: string
          uploaded_by?: string | null
          validated_at?: string | null
          validated_by?: string | null
          validation_notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "authorization_documents_authorization_id_fkey"
            columns: ["authorization_id"]
            isOneToOne: false
            referencedRelation: "authorization_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "authorization_documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "user_full"
            referencedColumns: ["auth_id"]
          },
          {
            foreignKeyName: "authorization_documents_validated_by_fkey"
            columns: ["validated_by"]
            isOneToOne: false
            referencedRelation: "user_full"
            referencedColumns: ["auth_id"]
          },
        ]
      }
      authorization_requests: {
        Row: {
          address: string | null
          applicant_type: Database["public"]["Enums"]["applicant_type"]
          approval_date: string | null
          approved_by: string | null
          business_experience_years: number | null
          children_count: number | null
          company_name: string | null
          company_nif: string | null
          created_at: string
          description: string | null
          email: string
          family_members_count: number | null
          has_other_service_stations: boolean | null
          id: string
          individual_first_name: string | null
          individual_last_name: string | null
          latitude: number | null
          longitude: number | null
          map_layers: Json | null
          national_id: string
          other_service_stations_details: string | null
          parcel_address: string
          parcel_area: number | null
          parcel_length: number | null
          parcel_reference: string | null
          parcel_shape_geom: Json | null
          parcel_width: number | null
          phone_number: string
          polygon_coordinates: Json | null
          previous_fuel_business: boolean | null
          previous_fuel_business_details: string | null
          rejection_date: string | null
          rejection_reason: string | null
          report_generated_at: string | null
          report_pdf_url: string | null
          request_number: string
          request_type: string
          review_start_date: string | null
          reviewed_by: string | null
          signature_data: string | null
          signature_date: string | null
          spouse_name: string | null
          status: Database["public"]["Enums"]["authorization_status"]
          submission_date: string | null
          submitted_by: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          applicant_type: Database["public"]["Enums"]["applicant_type"]
          approval_date?: string | null
          approved_by?: string | null
          business_experience_years?: number | null
          children_count?: number | null
          company_name?: string | null
          company_nif?: string | null
          created_at?: string
          description?: string | null
          email: string
          family_members_count?: number | null
          has_other_service_stations?: boolean | null
          id?: string
          individual_first_name?: string | null
          individual_last_name?: string | null
          latitude?: number | null
          longitude?: number | null
          map_layers?: Json | null
          national_id: string
          other_service_stations_details?: string | null
          parcel_address: string
          parcel_area?: number | null
          parcel_length?: number | null
          parcel_reference?: string | null
          parcel_shape_geom?: Json | null
          parcel_width?: number | null
          phone_number: string
          polygon_coordinates?: Json | null
          previous_fuel_business?: boolean | null
          previous_fuel_business_details?: string | null
          rejection_date?: string | null
          rejection_reason?: string | null
          report_generated_at?: string | null
          report_pdf_url?: string | null
          request_number: string
          request_type: string
          review_start_date?: string | null
          reviewed_by?: string | null
          signature_data?: string | null
          signature_date?: string | null
          spouse_name?: string | null
          status?: Database["public"]["Enums"]["authorization_status"]
          submission_date?: string | null
          submitted_by?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          applicant_type?: Database["public"]["Enums"]["applicant_type"]
          approval_date?: string | null
          approved_by?: string | null
          business_experience_years?: number | null
          children_count?: number | null
          company_name?: string | null
          company_nif?: string | null
          created_at?: string
          description?: string | null
          email?: string
          family_members_count?: number | null
          has_other_service_stations?: boolean | null
          id?: string
          individual_first_name?: string | null
          individual_last_name?: string | null
          latitude?: number | null
          longitude?: number | null
          map_layers?: Json | null
          national_id?: string
          other_service_stations_details?: string | null
          parcel_address?: string
          parcel_area?: number | null
          parcel_length?: number | null
          parcel_reference?: string | null
          parcel_shape_geom?: Json | null
          parcel_width?: number | null
          phone_number?: string
          polygon_coordinates?: Json | null
          previous_fuel_business?: boolean | null
          previous_fuel_business_details?: string | null
          rejection_date?: string | null
          rejection_reason?: string | null
          report_generated_at?: string | null
          report_pdf_url?: string | null
          request_number?: string
          request_type?: string
          review_start_date?: string | null
          reviewed_by?: string | null
          signature_data?: string | null
          signature_date?: string | null
          spouse_name?: string | null
          status?: Database["public"]["Enums"]["authorization_status"]
          submission_date?: string | null
          submitted_by?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "authorization_requests_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "user_full"
            referencedColumns: ["auth_id"]
          },
          {
            foreignKeyName: "authorization_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "user_full"
            referencedColumns: ["auth_id"]
          },
          {
            foreignKeyName: "authorization_requests_submitted_by_fkey"
            columns: ["submitted_by"]
            isOneToOne: false
            referencedRelation: "user_full"
            referencedColumns: ["auth_id"]
          },
        ]
      }
      authorization_reviews: {
        Row: {
          authorization_id: string
          comments: string | null
          created_at: string
          id: string
          recommendations: string | null
          review_type: string
          reviewer_id: string
          status: string
        }
        Insert: {
          authorization_id: string
          comments?: string | null
          created_at?: string
          id?: string
          recommendations?: string | null
          review_type: string
          reviewer_id: string
          status: string
        }
        Update: {
          authorization_id?: string
          comments?: string | null
          created_at?: string
          id?: string
          recommendations?: string | null
          review_type?: string
          reviewer_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "authorization_reviews_authorization_id_fkey"
            columns: ["authorization_id"]
            isOneToOne: false
            referencedRelation: "authorization_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "authorization_reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "user_full"
            referencedColumns: ["auth_id"]
          },
        ]
      }
      bank_guarantees: {
        Row: {
          bank_name: string
          contractor_id: string
          created_at: string
          expiry_date: string
          guarantee_amount: number
          guarantee_type: string
          id: string
          issue_date: string
          project_id: string
          status: string
          updated_at: string
        }
        Insert: {
          bank_name: string
          contractor_id: string
          created_at?: string
          expiry_date: string
          guarantee_amount: number
          guarantee_type: string
          id?: string
          issue_date: string
          project_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          bank_name?: string
          contractor_id?: string
          created_at?: string
          expiry_date?: string
          guarantee_amount?: number
          guarantee_type?: string
          id?: string
          issue_date?: string
          project_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      catch_records: {
        Row: {
          actual_sale_value: number | null
          catch_date: string
          created_at: string | null
          estimated_value: number | null
          fish_species: string
          fishing_zone: string | null
          id: string
          mission_id: string | null
          recorded_by: string | null
          weight_kg: number
        }
        Insert: {
          actual_sale_value?: number | null
          catch_date: string
          created_at?: string | null
          estimated_value?: number | null
          fish_species: string
          fishing_zone?: string | null
          id?: string
          mission_id?: string | null
          recorded_by?: string | null
          weight_kg: number
        }
        Update: {
          actual_sale_value?: number | null
          catch_date?: string
          created_at?: string | null
          estimated_value?: number | null
          fish_species?: string
          fishing_zone?: string | null
          id?: string
          mission_id?: string | null
          recorded_by?: string | null
          weight_kg?: number
        }
        Relationships: [
          {
            foreignKeyName: "catch_records_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "fishing_missions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "catch_records_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
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
      consumables_usage: {
        Row: {
          category_id: string | null
          created_at: string | null
          id: string
          item_name: string
          mission_id: string | null
          quantity_used: number
          reason: string | null
          recorded_by: string | null
          usage_date: string
        }
        Insert: {
          category_id?: string | null
          created_at?: string | null
          id?: string
          item_name: string
          mission_id?: string | null
          quantity_used: number
          reason?: string | null
          recorded_by?: string | null
          usage_date: string
        }
        Update: {
          category_id?: string | null
          created_at?: string | null
          id?: string
          item_name?: string
          mission_id?: string | null
          quantity_used?: number
          reason?: string | null
          recorded_by?: string | null
          usage_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "consumables_usage_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "supply_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consumables_usage_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "fishing_missions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consumables_usage_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          assigned_to: string | null
          created_at: string | null
          deadline_date: string | null
          description: string | null
          document_type: Database["public"]["Enums"]["document_type"]
          file_name: string | null
          file_size: number | null
          file_url: string | null
          id: string
          inspection_id: string | null
          is_internal_only: boolean | null
          is_shared_with_suppliers: boolean | null
          metadata: Json | null
          mime_type: string | null
          payment_id: string | null
          phase_id: string | null
          project_id: string | null
          shared_date: string | null
          status: Database["public"]["Enums"]["document_status"] | null
          supplier_id: string | null
          tags: string[] | null
          title: string
          updated_at: string | null
          uploaded_by: string | null
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string | null
          deadline_date?: string | null
          description?: string | null
          document_type: Database["public"]["Enums"]["document_type"]
          file_name?: string | null
          file_size?: number | null
          file_url?: string | null
          id?: string
          inspection_id?: string | null
          is_internal_only?: boolean | null
          is_shared_with_suppliers?: boolean | null
          metadata?: Json | null
          mime_type?: string | null
          payment_id?: string | null
          phase_id?: string | null
          project_id?: string | null
          shared_date?: string | null
          status?: Database["public"]["Enums"]["document_status"] | null
          supplier_id?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
          uploaded_by?: string | null
        }
        Update: {
          assigned_to?: string | null
          created_at?: string | null
          deadline_date?: string | null
          description?: string | null
          document_type?: Database["public"]["Enums"]["document_type"]
          file_name?: string | null
          file_size?: number | null
          file_url?: string | null
          id?: string
          inspection_id?: string | null
          is_internal_only?: boolean | null
          is_shared_with_suppliers?: boolean | null
          metadata?: Json | null
          mime_type?: string | null
          payment_id?: string | null
          phase_id?: string | null
          project_id?: string | null
          shared_date?: string | null
          status?: Database["public"]["Enums"]["document_status"] | null
          supplier_id?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "user_full"
            referencedColumns: ["auth_id"]
          },
          {
            foreignKeyName: "documents_inspection_id_fkey"
            columns: ["inspection_id"]
            isOneToOne: false
            referencedRelation: "inspections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_phase_id_fkey"
            columns: ["phase_id"]
            isOneToOne: false
            referencedRelation: "project_phases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      email_logs: {
        Row: {
          content_type: string
          created_at: string | null
          id: string
          metadata: Json | null
          recipient: string
          sent_at: string | null
          status: string
          subject: string
        }
        Insert: {
          content_type: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          recipient: string
          sent_at?: string | null
          status?: string
          subject: string
        }
        Update: {
          content_type?: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          recipient?: string
          sent_at?: string | null
          status?: string
          subject?: string
        }
        Relationships: []
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
          {
            foreignKeyName: "employees_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_full"
            referencedColumns: ["auth_id"]
          },
        ]
      }
      enhanced_project_milestones: {
        Row: {
          completed_date: string | null
          created_at: string | null
          dependencies: Json | null
          description: string | null
          id: string
          notes: string | null
          phase_id: string | null
          project_id: string
          status: string | null
          target_date: string
          title: string
          updated_at: string | null
          weight: number | null
        }
        Insert: {
          completed_date?: string | null
          created_at?: string | null
          dependencies?: Json | null
          description?: string | null
          id?: string
          notes?: string | null
          phase_id?: string | null
          project_id: string
          status?: string | null
          target_date: string
          title: string
          updated_at?: string | null
          weight?: number | null
        }
        Update: {
          completed_date?: string | null
          created_at?: string | null
          dependencies?: Json | null
          description?: string | null
          id?: string
          notes?: string | null
          phase_id?: string | null
          project_id?: string
          status?: string | null
          target_date?: string
          title?: string
          updated_at?: string | null
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "enhanced_project_milestones_phase_id_fkey"
            columns: ["phase_id"]
            isOneToOne: false
            referencedRelation: "project_phases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enhanced_project_milestones_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      escalation_thresholds: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          escalation_level: number
          id: string
          is_active: boolean
          severity_level: string
          threshold_name: string
          threshold_type: string
          threshold_unit: string
          threshold_value: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          escalation_level?: number
          id?: string
          is_active?: boolean
          severity_level: string
          threshold_name: string
          threshold_type: string
          threshold_unit?: string
          threshold_value: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          escalation_level?: number
          id?: string
          is_active?: boolean
          severity_level?: string
          threshold_name?: string
          threshold_type?: string
          threshold_unit?: string
          threshold_value?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      fishing_licenses: {
        Row: {
          authorized_zones: string[] | null
          cost_per_mission: number | null
          created_at: string | null
          id: string
          license_number: string
          owner_id: string | null
          quota_limit: number | null
          updated_at: string | null
          valid_from: string
          valid_until: string
        }
        Insert: {
          authorized_zones?: string[] | null
          cost_per_mission?: number | null
          created_at?: string | null
          id?: string
          license_number: string
          owner_id?: string | null
          quota_limit?: number | null
          updated_at?: string | null
          valid_from: string
          valid_until: string
        }
        Update: {
          authorized_zones?: string[] | null
          cost_per_mission?: number | null
          created_at?: string | null
          id?: string
          license_number?: string
          owner_id?: string | null
          quota_limit?: number | null
          updated_at?: string | null
          valid_from?: string
          valid_until?: string
        }
        Relationships: [
          {
            foreignKeyName: "fishing_licenses_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      fishing_missions: {
        Row: {
          budget: number
          captain_id: string
          created_at: string | null
          description: string | null
          end_date: string | null
          fishing_zone: string
          fuel_consumed: number | null
          id: string
          license_id: string
          planned_duration: number | null
          progress: number | null
          start_date: string
          status: Database["public"]["Enums"]["mission_status"] | null
          title: string
          total_catch_value: number | null
          total_catch_weight: number | null
          total_expenses: number | null
          updated_at: string | null
          vessel_id: string
        }
        Insert: {
          budget: number
          captain_id: string
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          fishing_zone: string
          fuel_consumed?: number | null
          id?: string
          license_id: string
          planned_duration?: number | null
          progress?: number | null
          start_date: string
          status?: Database["public"]["Enums"]["mission_status"] | null
          title: string
          total_catch_value?: number | null
          total_catch_weight?: number | null
          total_expenses?: number | null
          updated_at?: string | null
          vessel_id: string
        }
        Update: {
          budget?: number
          captain_id?: string
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          fishing_zone?: string
          fuel_consumed?: number | null
          id?: string
          license_id?: string
          planned_duration?: number | null
          progress?: number | null
          start_date?: string
          status?: Database["public"]["Enums"]["mission_status"] | null
          title?: string
          total_catch_value?: number | null
          total_catch_weight?: number | null
          total_expenses?: number | null
          updated_at?: string | null
          vessel_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fishing_missions_captain_id_fkey"
            columns: ["captain_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fishing_missions_license_id_fkey"
            columns: ["license_id"]
            isOneToOne: false
            referencedRelation: "fishing_licenses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fishing_missions_vessel_id_fkey"
            columns: ["vessel_id"]
            isOneToOne: false
            referencedRelation: "vessels"
            referencedColumns: ["id"]
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
          payment_type: string | null
          phase_id: string | null
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
          payment_type?: string | null
          phase_id?: string | null
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
          payment_type?: string | null
          phase_id?: string | null
          progress_at_inspection?: number
          project_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inspections_phase_id_fkey"
            columns: ["phase_id"]
            isOneToOne: false
            referencedRelation: "project_phases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inspections_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      insurance_certificates: {
        Row: {
          certificate_url: string | null
          contractor_id: string
          contractor_name: string
          coverage_amount: number
          coverage_type: string
          created_at: string
          id: string
          insurance_company: string
          last_verified: string | null
          notes: string | null
          policy_number: string
          project_id: string
          status: string
          updated_at: string
          valid_from: string
          valid_until: string
          verified_by: string | null
        }
        Insert: {
          certificate_url?: string | null
          contractor_id: string
          contractor_name: string
          coverage_amount: number
          coverage_type: string
          created_at?: string
          id?: string
          insurance_company: string
          last_verified?: string | null
          notes?: string | null
          policy_number: string
          project_id: string
          status?: string
          updated_at?: string
          valid_from: string
          valid_until: string
          verified_by?: string | null
        }
        Update: {
          certificate_url?: string | null
          contractor_id?: string
          contractor_name?: string
          coverage_amount?: number
          coverage_type?: string
          created_at?: string
          id?: string
          insurance_company?: string
          last_verified?: string | null
          notes?: string | null
          policy_number?: string
          project_id?: string
          status?: string
          updated_at?: string
          valid_from?: string
          valid_until?: string
          verified_by?: string | null
        }
        Relationships: []
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
      lab_test_prescriptions: {
        Row: {
          created_at: string
          id: string
          medical_act_code: string | null
          prescription_id: string | null
          special_instructions: string | null
          updated_at: string
          urgency_level: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          medical_act_code?: string | null
          prescription_id?: string | null
          special_instructions?: string | null
          updated_at?: string
          urgency_level?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          medical_act_code?: string | null
          prescription_id?: string | null
          special_instructions?: string | null
          updated_at?: string
          urgency_level?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lab_test_prescriptions_medical_act_code_fkey"
            columns: ["medical_act_code"]
            isOneToOne: false
            referencedRelation: "medical_acts"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "lab_test_prescriptions_prescription_id_fkey"
            columns: ["prescription_id"]
            isOneToOne: false
            referencedRelation: "prescriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      material_documents: {
        Row: {
          created_at: string
          description: string | null
          document_date: string | null
          document_number: string | null
          document_type: string
          expiry_date: string | null
          file_name: string | null
          file_size: number | null
          file_url: string | null
          id: string
          material_id: string
          metadata: Json | null
          mime_type: string | null
          supplier_name: string | null
          tags: string[] | null
          title: string
          updated_at: string
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          document_date?: string | null
          document_number?: string | null
          document_type: string
          expiry_date?: string | null
          file_name?: string | null
          file_size?: number | null
          file_url?: string | null
          id?: string
          material_id: string
          metadata?: Json | null
          mime_type?: string | null
          supplier_name?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          document_date?: string | null
          document_number?: string | null
          document_type?: string
          expiry_date?: string | null
          file_name?: string | null
          file_size?: number | null
          file_url?: string | null
          id?: string
          material_id?: string
          metadata?: Json | null
          mime_type?: string | null
          supplier_name?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "material_documents_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "material_documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "user_full"
            referencedColumns: ["auth_id"]
          },
        ]
      }
      material_suppliers: {
        Row: {
          created_at: string | null
          id: string
          is_preferred: boolean | null
          last_price_update: string | null
          lead_time_days: number | null
          material_id: string
          minimum_order_quantity: number | null
          supplier_id: string
          unit_price: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_preferred?: boolean | null
          last_price_update?: string | null
          lead_time_days?: number | null
          material_id: string
          minimum_order_quantity?: number | null
          supplier_id: string
          unit_price?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_preferred?: boolean | null
          last_price_update?: string | null
          lead_time_days?: number | null
          material_id?: string
          minimum_order_quantity?: number | null
          supplier_id?: string
          unit_price?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "material_suppliers_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "material_suppliers_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      materials: {
        Row: {
          adresse: Json | null
          asin: string | null
          available_quantity: number
          category: string
          coordinates_latitude: number | null
          coordinates_longitude: number | null
          created_at: string
          description: string
          ean: string | null
          forme: string | null
          gtin: string | null
          id: string
          image: string | null
          localisation: Json | null
          multilang_labels: Json | null
          name: string
          origin_location: string | null
          price_per_unit: number
          sku: string | null
          unit: string
          updated_at: string
          workspace_id: string | null
        }
        Insert: {
          adresse?: Json | null
          asin?: string | null
          available_quantity?: number
          category: string
          coordinates_latitude?: number | null
          coordinates_longitude?: number | null
          created_at?: string
          description: string
          ean?: string | null
          forme?: string | null
          gtin?: string | null
          id?: string
          image?: string | null
          localisation?: Json | null
          multilang_labels?: Json | null
          name: string
          origin_location?: string | null
          price_per_unit: number
          sku?: string | null
          unit: string
          updated_at?: string
          workspace_id?: string | null
        }
        Update: {
          adresse?: Json | null
          asin?: string | null
          available_quantity?: number
          category?: string
          coordinates_latitude?: number | null
          coordinates_longitude?: number | null
          created_at?: string
          description?: string
          ean?: string | null
          forme?: string | null
          gtin?: string | null
          id?: string
          image?: string | null
          localisation?: Json | null
          multilang_labels?: Json | null
          name?: string
          origin_location?: string | null
          price_per_unit?: number
          sku?: string | null
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
      medical_device_prescriptions: {
        Row: {
          created_at: string
          id: string
          medical_act_code: string | null
          prescription_id: string | null
          quantity: number | null
          remarks: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          medical_act_code?: string | null
          prescription_id?: string | null
          quantity?: number | null
          remarks?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          medical_act_code?: string | null
          prescription_id?: string | null
          quantity?: number | null
          remarks?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "medical_device_prescriptions_medical_act_code_fkey"
            columns: ["medical_act_code"]
            isOneToOne: false
            referencedRelation: "medical_acts"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "medical_device_prescriptions_prescription_id_fkey"
            columns: ["prescription_id"]
            isOneToOne: false
            referencedRelation: "prescriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      mission_crew: {
        Row: {
          created_at: string | null
          crew_member_id: string | null
          daily_rate: number | null
          days_worked: number | null
          id: string
          mission_id: string | null
          profit_share_percentage: number | null
          role: string
        }
        Insert: {
          created_at?: string | null
          crew_member_id?: string | null
          daily_rate?: number | null
          days_worked?: number | null
          id?: string
          mission_id?: string | null
          profit_share_percentage?: number | null
          role: string
        }
        Update: {
          created_at?: string | null
          crew_member_id?: string | null
          daily_rate?: number | null
          days_worked?: number | null
          id?: string
          mission_id?: string | null
          profit_share_percentage?: number | null
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "mission_crew_crew_member_id_fkey"
            columns: ["crew_member_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mission_crew_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "fishing_missions"
            referencedColumns: ["id"]
          },
        ]
      }
      mission_expenses: {
        Row: {
          amount: number
          category: string
          created_at: string | null
          description: string
          expense_date: string
          id: string
          mission_id: string | null
          receipt_url: string | null
          recorded_by: string | null
        }
        Insert: {
          amount: number
          category: string
          created_at?: string | null
          description: string
          expense_date: string
          id?: string
          mission_id?: string | null
          receipt_url?: string | null
          recorded_by?: string | null
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string | null
          description?: string
          expense_date?: string
          id?: string
          mission_id?: string | null
          receipt_url?: string | null
          recorded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mission_expenses_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "fishing_missions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mission_expenses_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      mission_investments: {
        Row: {
          created_at: string | null
          id: string
          investment_amount: number
          investor_id: string | null
          mission_id: string | null
          profit_share_percentage: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          investment_amount: number
          investor_id?: string | null
          mission_id?: string | null
          profit_share_percentage: number
        }
        Update: {
          created_at?: string | null
          id?: string
          investment_amount?: number
          investor_id?: string | null
          mission_id?: string | null
          profit_share_percentage?: number
        }
        Relationships: [
          {
            foreignKeyName: "mission_investments_investor_id_fkey"
            columns: ["investor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mission_investments_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "fishing_missions"
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
      organizational_hierarchy: {
        Row: {
          can_approve_payments: boolean | null
          can_approve_projects: boolean | null
          can_escalate_to_director: boolean | null
          created_at: string
          department: string
          direct_reports_count: number | null
          employee_id: string
          id: string
          level: number
          notification_preferences: Json | null
          organization_id: string
          parent_id: string | null
          position_title: string
          updated_at: string
        }
        Insert: {
          can_approve_payments?: boolean | null
          can_approve_projects?: boolean | null
          can_escalate_to_director?: boolean | null
          created_at?: string
          department: string
          direct_reports_count?: number | null
          employee_id: string
          id?: string
          level: number
          notification_preferences?: Json | null
          organization_id: string
          parent_id?: string | null
          position_title: string
          updated_at?: string
        }
        Update: {
          can_approve_payments?: boolean | null
          can_approve_projects?: boolean | null
          can_escalate_to_director?: boolean | null
          created_at?: string
          department?: string
          direct_reports_count?: number | null
          employee_id?: string
          id?: string
          level?: number
          notification_preferences?: Json | null
          organization_id?: string
          parent_id?: string | null
          position_title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organizational_hierarchy_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organizational_hierarchy_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organizational_hierarchy_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "organizational_hierarchy"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          address: string | null
          code: string | null
          created_at: string
          description: string | null
          email: string | null
          id: string
          is_active: boolean
          logo_url: string | null
          name: string
          phone: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          address?: string | null
          code?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name: string
          phone?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          address?: string | null
          code?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name?: string
          phone?: string | null
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      parsed_invoices: {
        Row: {
          created_at: string
          document_id: string | null
          file_name: string | null
          id: string
          invoice_date: string | null
          invoice_number: string | null
          items: Json | null
          parsed_data: Json | null
          parsing_errors: string | null
          parsing_status: string | null
          supplier_info: Json | null
          tax_amount: number | null
          tender_id: string
          total_amount: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          document_id?: string | null
          file_name?: string | null
          id?: string
          invoice_date?: string | null
          invoice_number?: string | null
          items?: Json | null
          parsed_data?: Json | null
          parsing_errors?: string | null
          parsing_status?: string | null
          supplier_info?: Json | null
          tax_amount?: number | null
          tender_id: string
          total_amount?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          document_id?: string | null
          file_name?: string | null
          id?: string
          invoice_date?: string | null
          invoice_number?: string | null
          items?: Json | null
          parsed_data?: Json | null
          parsing_errors?: string | null
          parsing_status?: string | null
          supplier_info?: Json | null
          tax_amount?: number | null
          tender_id?: string
          total_amount?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "parsed_invoices_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
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
      payment_blocks: {
        Row: {
          amount: number
          blocked_at: string
          blocked_by: string | null
          blocking_reasons: Json
          contractor_id: string
          id: string
          notes: string | null
          project_id: string
          resolved_at: string | null
          resolved_by: string | null
        }
        Insert: {
          amount: number
          blocked_at?: string
          blocked_by?: string | null
          blocking_reasons: Json
          contractor_id: string
          id?: string
          notes?: string | null
          project_id: string
          resolved_at?: string | null
          resolved_by?: string | null
        }
        Update: {
          amount?: number
          blocked_at?: string
          blocked_by?: string | null
          blocking_reasons?: Json
          contractor_id?: string
          id?: string
          notes?: string | null
          project_id?: string
          resolved_at?: string | null
          resolved_by?: string | null
        }
        Relationships: []
      }
      payments: {
        Row: {
          account_number: string | null
          amount: number
          bank_name: string | null
          check_number: string | null
          contractor_contact: string
          contractor_id: string | null
          contractor_name: string
          created_at: string
          id: string
          inspection_id: string | null
          mobile_number: string | null
          mobile_operator: string | null
          payment_date: string
          payment_method: string
          phase_id: string | null
          progress_at_payment: number
          project_id: string
          receiver_name: string | null
          transaction_id: string
          updated_at: string
        }
        Insert: {
          account_number?: string | null
          amount: number
          bank_name?: string | null
          check_number?: string | null
          contractor_contact: string
          contractor_id?: string | null
          contractor_name: string
          created_at?: string
          id?: string
          inspection_id?: string | null
          mobile_number?: string | null
          mobile_operator?: string | null
          payment_date: string
          payment_method: string
          phase_id?: string | null
          progress_at_payment: number
          project_id: string
          receiver_name?: string | null
          transaction_id: string
          updated_at?: string
        }
        Update: {
          account_number?: string | null
          amount?: number
          bank_name?: string | null
          check_number?: string | null
          contractor_contact?: string
          contractor_id?: string | null
          contractor_name?: string
          created_at?: string
          id?: string
          inspection_id?: string | null
          mobile_number?: string | null
          mobile_operator?: string | null
          payment_date?: string
          payment_method?: string
          phase_id?: string | null
          progress_at_payment?: number
          project_id?: string
          receiver_name?: string | null
          transaction_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_phase_id_fkey"
            columns: ["phase_id"]
            isOneToOne: false
            referencedRelation: "project_phases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      pharmaceutical_specialties: {
        Row: {
          active: boolean | null
          code: string
          created_at: string
          description: string | null
          label: string
          updated_at: string
        }
        Insert: {
          active?: boolean | null
          code: string
          created_at?: string
          description?: string | null
          label: string
          updated_at?: string
        }
        Update: {
          active?: boolean | null
          code?: string
          created_at?: string
          description?: string | null
          label?: string
          updated_at?: string
        }
        Relationships: []
      }
      phase_employees: {
        Row: {
          created_at: string | null
          daily_rate: number | null
          employee_contact: string | null
          employee_name: string
          employee_role: string
          end_date: string | null
          id: string
          is_primary_supplier: boolean | null
          phase_id: string
          start_date: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          daily_rate?: number | null
          employee_contact?: string | null
          employee_name: string
          employee_role: string
          end_date?: string | null
          id?: string
          is_primary_supplier?: boolean | null
          phase_id: string
          start_date?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          daily_rate?: number | null
          employee_contact?: string | null
          employee_name?: string
          employee_role?: string
          end_date?: string | null
          id?: string
          is_primary_supplier?: boolean | null
          phase_id?: string
          start_date?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "phase_employees_phase_id_fkey"
            columns: ["phase_id"]
            isOneToOne: false
            referencedRelation: "project_phases"
            referencedColumns: ["id"]
          },
        ]
      }
      prescription_medications: {
        Row: {
          created_at: string
          dosage: string
          duration_days: number | null
          id: string
          instructions: string | null
          pharmaceutical_code: string | null
          prescription_id: string | null
          quantity: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          dosage: string
          duration_days?: number | null
          id?: string
          instructions?: string | null
          pharmaceutical_code?: string | null
          prescription_id?: string | null
          quantity?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          dosage?: string
          duration_days?: number | null
          id?: string
          instructions?: string | null
          pharmaceutical_code?: string | null
          prescription_id?: string | null
          quantity?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "prescription_medications_pharmaceutical_code_fkey"
            columns: ["pharmaceutical_code"]
            isOneToOne: false
            referencedRelation: "pharmaceutical_specialties"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "prescription_medications_prescription_id_fkey"
            columns: ["prescription_id"]
            isOneToOne: false
            referencedRelation: "prescriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      prescriptions: {
        Row: {
          created_at: string
          id: string
          medical_act_id: string | null
          patient_id: string | null
          practitioner_id: string | null
          prescription_date: string
          remarks: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          medical_act_id?: string | null
          patient_id?: string | null
          practitioner_id?: string | null
          prescription_date: string
          remarks?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          medical_act_id?: string | null
          patient_id?: string | null
          practitioner_id?: string | null
          prescription_date?: string
          remarks?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "prescriptions_medical_act_id_fkey"
            columns: ["medical_act_id"]
            isOneToOne: false
            referencedRelation: "claim_medical_acts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prescriptions_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prescriptions_practitioner_id_fkey"
            columns: ["practitioner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      processing_logs: {
        Row: {
          created_at: string
          id: string
          process_type: string
          summary: Json | null
        }
        Insert: {
          created_at?: string
          id?: string
          process_type: string
          summary?: Json | null
        }
        Update: {
          created_at?: string
          id?: string
          process_type?: string
          summary?: Json | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          full_name: string | null
          id: string
          is_admin: boolean | null
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
          is_admin?: boolean | null
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
          is_admin?: boolean | null
          national_id?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "user_full"
            referencedColumns: ["auth_id"]
          },
        ]
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
      progress_invoices: {
        Row: {
          consultant_approval_status: string | null
          consultant_comments: string | null
          consultant_id: string | null
          consultant_validated_at: string | null
          created_at: string | null
          cumulative_paid: number | null
          donor_approval_required: boolean | null
          donor_approved_at: string | null
          donor_comments: string | null
          id: string
          inspection_id: string | null
          inspection_report_url: string | null
          invoice_amount: number
          invoice_number: string
          invoice_type: string
          lot_details: Json | null
          ministry_comments: string | null
          ministry_reviewer_id: string | null
          ministry_validated_at: string | null
          paid_at: string | null
          previous_progress: number | null
          progress_increment: number | null
          progress_percentage: number
          project_id: string
          quantities_executed: Json | null
          retention_amount: number | null
          service_fait_document_id: string | null
          status: string | null
          submitted_at: string | null
          submitted_by: string | null
          supporting_documents: Json | null
          total_contract_amount: number
          updated_at: string | null
          work_description: string | null
          workflow_history: Json | null
        }
        Insert: {
          consultant_approval_status?: string | null
          consultant_comments?: string | null
          consultant_id?: string | null
          consultant_validated_at?: string | null
          created_at?: string | null
          cumulative_paid?: number | null
          donor_approval_required?: boolean | null
          donor_approved_at?: string | null
          donor_comments?: string | null
          id?: string
          inspection_id?: string | null
          inspection_report_url?: string | null
          invoice_amount: number
          invoice_number: string
          invoice_type?: string
          lot_details?: Json | null
          ministry_comments?: string | null
          ministry_reviewer_id?: string | null
          ministry_validated_at?: string | null
          paid_at?: string | null
          previous_progress?: number | null
          progress_increment?: number | null
          progress_percentage: number
          project_id: string
          quantities_executed?: Json | null
          retention_amount?: number | null
          service_fait_document_id?: string | null
          status?: string | null
          submitted_at?: string | null
          submitted_by?: string | null
          supporting_documents?: Json | null
          total_contract_amount: number
          updated_at?: string | null
          work_description?: string | null
          workflow_history?: Json | null
        }
        Update: {
          consultant_approval_status?: string | null
          consultant_comments?: string | null
          consultant_id?: string | null
          consultant_validated_at?: string | null
          created_at?: string | null
          cumulative_paid?: number | null
          donor_approval_required?: boolean | null
          donor_approved_at?: string | null
          donor_comments?: string | null
          id?: string
          inspection_id?: string | null
          inspection_report_url?: string | null
          invoice_amount?: number
          invoice_number?: string
          invoice_type?: string
          lot_details?: Json | null
          ministry_comments?: string | null
          ministry_reviewer_id?: string | null
          ministry_validated_at?: string | null
          paid_at?: string | null
          previous_progress?: number | null
          progress_increment?: number | null
          progress_percentage?: number
          project_id?: string
          quantities_executed?: Json | null
          retention_amount?: number | null
          service_fait_document_id?: string | null
          status?: string | null
          submitted_at?: string | null
          submitted_by?: string | null
          supporting_documents?: Json | null
          total_contract_amount?: number
          updated_at?: string | null
          work_description?: string | null
          workflow_history?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "progress_invoices_consultant_id_fkey"
            columns: ["consultant_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "progress_invoices_inspection_id_fkey"
            columns: ["inspection_id"]
            isOneToOne: false
            referencedRelation: "inspections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "progress_invoices_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "progress_invoices_service_fait_document_id_fkey"
            columns: ["service_fait_document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "progress_invoices_submitted_by_fkey"
            columns: ["submitted_by"]
            isOneToOne: false
            referencedRelation: "user_full"
            referencedColumns: ["auth_id"]
          },
        ]
      }
      project_alerts: {
        Row: {
          acknowledged: boolean | null
          acknowledged_at: string | null
          acknowledged_by: string | null
          action_proofs: Json | null
          assigned_actions: string[] | null
          created_at: string
          description: string | null
          escalation_level: number | null
          id: string
          metadata: Json | null
          project_id: string
          resolved: boolean | null
          resolved_at: string | null
          resolved_by: string | null
          severity: string
          source: string | null
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          acknowledged?: boolean | null
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          action_proofs?: Json | null
          assigned_actions?: string[] | null
          created_at?: string
          description?: string | null
          escalation_level?: number | null
          id?: string
          metadata?: Json | null
          project_id: string
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity: string
          source?: string | null
          title: string
          type: string
          updated_at?: string
        }
        Update: {
          acknowledged?: boolean | null
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          action_proofs?: Json | null
          assigned_actions?: string[] | null
          created_at?: string
          description?: string | null
          escalation_level?: number | null
          id?: string
          metadata?: Json | null
          project_id?: string
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          source?: string | null
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_alerts_acknowledged_by_fkey"
            columns: ["acknowledged_by"]
            isOneToOne: false
            referencedRelation: "user_full"
            referencedColumns: ["auth_id"]
          },
          {
            foreignKeyName: "project_alerts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_alerts_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "user_full"
            referencedColumns: ["auth_id"]
          },
        ]
      }
      project_comments: {
        Row: {
          comment: string
          created_at: string | null
          id: string
          parent_comment_id: string | null
          project_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          comment: string
          created_at?: string | null
          id?: string
          parent_comment_id?: string | null
          project_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          comment?: string
          created_at?: string | null
          id?: string
          parent_comment_id?: string | null
          project_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_comments_parent_comment_id_fkey"
            columns: ["parent_comment_id"]
            isOneToOne: false
            referencedRelation: "project_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_comments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_materials: {
        Row: {
          created_at: string
          id: string
          material_id: string
          phase_id: string | null
          project_id: string
          quantity: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          material_id: string
          phase_id?: string | null
          project_id: string
          quantity: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          material_id?: string
          phase_id?: string | null
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
            foreignKeyName: "project_materials_phase_id_fkey"
            columns: ["phase_id"]
            isOneToOne: false
            referencedRelation: "project_phases"
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
      project_milestones: {
        Row: {
          completion_date: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          progress_percentage: number | null
          project_id: string
          status: string | null
          target_date: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          completion_date?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          progress_percentage?: number | null
          project_id: string
          status?: string | null
          target_date?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          completion_date?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          progress_percentage?: number | null
          project_id?: string
          status?: string | null
          target_date?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_milestones_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_organizations: {
        Row: {
          contract_amount: number | null
          contract_end_date: string | null
          contract_start_date: string | null
          created_at: string
          id: string
          is_primary: boolean | null
          organization_id: string
          project_id: string
          role: string
        }
        Insert: {
          contract_amount?: number | null
          contract_end_date?: string | null
          contract_start_date?: string | null
          created_at?: string
          id?: string
          is_primary?: boolean | null
          organization_id: string
          project_id: string
          role: string
        }
        Update: {
          contract_amount?: number | null
          contract_end_date?: string | null
          contract_start_date?: string | null
          created_at?: string
          id?: string
          is_primary?: boolean | null
          organization_id?: string
          project_id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_organizations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_organizations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_phases: {
        Row: {
          actual_cost: number | null
          construction_phase: string | null
          construction_stage: string | null
          created_at: string
          created_by: string | null
          custom_phase_data: Json | null
          dependencies: Json | null
          description: string | null
          end_date: string | null
          estimated_cost: number | null
          estimated_duration: number | null
          human_resources: Json | null
          id: string
          location: string | null
          materials: Json | null
          milestones: Json | null
          notes: string | null
          phase_name: string
          phase_type: string
          progress: number | null
          project_id: string
          start_date: string | null
          status: string
          suppliers: Json | null
          updated_at: string
          weight: number | null
        }
        Insert: {
          actual_cost?: number | null
          construction_phase?: string | null
          construction_stage?: string | null
          created_at?: string
          created_by?: string | null
          custom_phase_data?: Json | null
          dependencies?: Json | null
          description?: string | null
          end_date?: string | null
          estimated_cost?: number | null
          estimated_duration?: number | null
          human_resources?: Json | null
          id?: string
          location?: string | null
          materials?: Json | null
          milestones?: Json | null
          notes?: string | null
          phase_name: string
          phase_type?: string
          progress?: number | null
          project_id: string
          start_date?: string | null
          status?: string
          suppliers?: Json | null
          updated_at?: string
          weight?: number | null
        }
        Update: {
          actual_cost?: number | null
          construction_phase?: string | null
          construction_stage?: string | null
          created_at?: string
          created_by?: string | null
          custom_phase_data?: Json | null
          dependencies?: Json | null
          description?: string | null
          end_date?: string | null
          estimated_cost?: number | null
          estimated_duration?: number | null
          human_resources?: Json | null
          id?: string
          location?: string | null
          materials?: Json | null
          milestones?: Json | null
          notes?: string | null
          phase_name?: string
          phase_type?: string
          progress?: number | null
          project_id?: string
          start_date?: string | null
          status?: string
          suppliers?: Json | null
          updated_at?: string
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_project_phases_project"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_phases_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_resources: {
        Row: {
          allocation_date: string | null
          cost_per_unit: number | null
          created_at: string
          id: string
          name: string
          notes: string | null
          project_id: string
          quantity: number | null
          total_cost: number | null
          type: string
          unit: string | null
          updated_at: string
        }
        Insert: {
          allocation_date?: string | null
          cost_per_unit?: number | null
          created_at?: string
          id?: string
          name: string
          notes?: string | null
          project_id: string
          quantity?: number | null
          total_cost?: number | null
          type: string
          unit?: string | null
          updated_at?: string
        }
        Update: {
          allocation_date?: string | null
          cost_per_unit?: number | null
          created_at?: string
          id?: string
          name?: string
          notes?: string | null
          project_id?: string
          quantity?: number | null
          total_cost?: number | null
          type?: string
          unit?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_resources_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_risks: {
        Row: {
          created_at: string | null
          due_date: string | null
          id: string
          identified_by: string | null
          identified_date: string | null
          impact: string | null
          impact_numeric: number | null
          mitigation_plan: string | null
          mitigation_strategy: string | null
          owner_id: string | null
          probability: string | null
          probability_numeric: number | null
          project_id: string
          risk_description: string | null
          risk_level: string | null
          risk_score: number | null
          risk_title: string
          status: string | null
          status_new: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          due_date?: string | null
          id?: string
          identified_by?: string | null
          identified_date?: string | null
          impact?: string | null
          impact_numeric?: number | null
          mitigation_plan?: string | null
          mitigation_strategy?: string | null
          owner_id?: string | null
          probability?: string | null
          probability_numeric?: number | null
          project_id: string
          risk_description?: string | null
          risk_level?: string | null
          risk_score?: number | null
          risk_title: string
          status?: string | null
          status_new?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          due_date?: string | null
          id?: string
          identified_by?: string | null
          identified_date?: string | null
          impact?: string | null
          impact_numeric?: number | null
          mitigation_plan?: string | null
          mitigation_strategy?: string | null
          owner_id?: string | null
          probability?: string | null
          probability_numeric?: number | null
          project_id?: string
          risk_description?: string | null
          risk_level?: string | null
          risk_score?: number | null
          risk_title?: string
          status?: string | null
          status_new?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_risks_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_risks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_stakeholders: {
        Row: {
          created_at: string
          employee_id: string | null
          id: string
          is_primary: boolean | null
          project_id: string
          role_description: string | null
          stakeholder_entity_type: string
          stakeholder_type: string
          supplier_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          employee_id?: string | null
          id?: string
          is_primary?: boolean | null
          project_id: string
          role_description?: string | null
          stakeholder_entity_type: string
          stakeholder_type: string
          supplier_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          employee_id?: string | null
          id?: string
          is_primary?: boolean | null
          project_id?: string
          role_description?: string | null
          stakeholder_entity_type?: string
          stakeholder_type?: string
          supplier_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_stakeholders_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_stakeholders_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_stakeholders_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          adresse: Json | null
          allows_initial_payment: boolean | null
          attribution_date: string | null
          budget: number
          check_schedule_last_run: Json | null
          completion_date: string | null
          coordinates_latitude: number | null
          coordinates_longitude: number | null
          created_at: string
          created_by: string | null
          currency: string | null
          current_phase: string | null
          current_stage: string | null
          description: string
          end_date: string | null
          estimated_days: number | null
          financing_source: string | null
          forme: string | null
          funding_source: string | null
          id: string
          initial_advance_percentage: number | null
          initial_payment_percentage: number | null
          launch_date: string | null
          localisation: Json | null
          location: string
          main_contractor: string | null
          market_type: string | null
          payment_frequency: string | null
          payment_mode: string | null
          payment_workflow_config: Json | null
          permit_number: string | null
          priority: string | null
          progress: number
          project_order: number | null
          project_reference: string | null
          project_reference_number: string | null
          project_responsable_id: string | null
          project_type: string | null
          requires_consultant_validation: boolean | null
          requires_ministry_approval: boolean | null
          retention_percentage: number | null
          sector: string | null
          selection_mode: string | null
          start_date: string
          status: string
          team_size: number
          thumbnail: string
          title: string
          updated_at: string
        }
        Insert: {
          adresse?: Json | null
          allows_initial_payment?: boolean | null
          attribution_date?: string | null
          budget: number
          check_schedule_last_run?: Json | null
          completion_date?: string | null
          coordinates_latitude?: number | null
          coordinates_longitude?: number | null
          created_at?: string
          created_by?: string | null
          currency?: string | null
          current_phase?: string | null
          current_stage?: string | null
          description: string
          end_date?: string | null
          estimated_days?: number | null
          financing_source?: string | null
          forme?: string | null
          funding_source?: string | null
          id?: string
          initial_advance_percentage?: number | null
          initial_payment_percentage?: number | null
          launch_date?: string | null
          localisation?: Json | null
          location: string
          main_contractor?: string | null
          market_type?: string | null
          payment_frequency?: string | null
          payment_mode?: string | null
          payment_workflow_config?: Json | null
          permit_number?: string | null
          priority?: string | null
          progress?: number
          project_order?: number | null
          project_reference?: string | null
          project_reference_number?: string | null
          project_responsable_id?: string | null
          project_type?: string | null
          requires_consultant_validation?: boolean | null
          requires_ministry_approval?: boolean | null
          retention_percentage?: number | null
          sector?: string | null
          selection_mode?: string | null
          start_date: string
          status: string
          team_size: number
          thumbnail?: string
          title: string
          updated_at?: string
        }
        Update: {
          adresse?: Json | null
          allows_initial_payment?: boolean | null
          attribution_date?: string | null
          budget?: number
          check_schedule_last_run?: Json | null
          completion_date?: string | null
          coordinates_latitude?: number | null
          coordinates_longitude?: number | null
          created_at?: string
          created_by?: string | null
          currency?: string | null
          current_phase?: string | null
          current_stage?: string | null
          description?: string
          end_date?: string | null
          estimated_days?: number | null
          financing_source?: string | null
          forme?: string | null
          funding_source?: string | null
          id?: string
          initial_advance_percentage?: number | null
          initial_payment_percentage?: number | null
          launch_date?: string | null
          localisation?: Json | null
          location?: string
          main_contractor?: string | null
          market_type?: string | null
          payment_frequency?: string | null
          payment_mode?: string | null
          payment_workflow_config?: Json | null
          permit_number?: string | null
          priority?: string | null
          progress?: number
          project_order?: number | null
          project_reference?: string | null
          project_reference_number?: string | null
          project_responsable_id?: string | null
          project_type?: string | null
          requires_consultant_validation?: boolean | null
          requires_ministry_approval?: boolean | null
          retention_percentage?: number | null
          sector?: string | null
          selection_mode?: string | null
          start_date?: string
          status?: string
          team_size?: number
          thumbnail?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_full"
            referencedColumns: ["auth_id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "prospect_subscription_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_full"
            referencedColumns: ["auth_id"]
          },
        ]
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
      resource_assignments: {
        Row: {
          allocation_percentage: number | null
          created_at: string | null
          end_date: string | null
          hourly_rate: number | null
          id: string
          resource_id: string
          start_date: string | null
          task_id: string
        }
        Insert: {
          allocation_percentage?: number | null
          created_at?: string | null
          end_date?: string | null
          hourly_rate?: number | null
          id?: string
          resource_id: string
          start_date?: string | null
          task_id: string
        }
        Update: {
          allocation_percentage?: number | null
          created_at?: string | null
          end_date?: string | null
          hourly_rate?: number | null
          id?: string
          resource_id?: string
          start_date?: string | null
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "resource_assignments_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "project_resources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resource_assignments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "task_assignments"
            referencedColumns: ["id"]
          },
        ]
      }
      risk_task_relations: {
        Row: {
          created_at: string | null
          id: string
          risk_id: string
          task_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          risk_id: string
          task_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          risk_id?: string
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "risk_task_relations_risk_id_fkey"
            columns: ["risk_id"]
            isOneToOne: false
            referencedRelation: "project_risks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "risk_task_relations_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "task_assignments"
            referencedColumns: ["id"]
          },
        ]
      }
      scheduled_calls: {
        Row: {
          action_type: string
          created_at: string
          id: string
          message: string
          metadata: Json | null
          priority: string
          recipient_id: string
          recipient_phone: string
          scheduled_for: string
          status: string
          subject: string
          updated_at: string
        }
        Insert: {
          action_type: string
          created_at?: string
          id: string
          message: string
          metadata?: Json | null
          priority: string
          recipient_id: string
          recipient_phone: string
          scheduled_for: string
          status?: string
          subject: string
          updated_at?: string
        }
        Update: {
          action_type?: string
          created_at?: string
          id?: string
          message?: string
          metadata?: Json | null
          priority?: string
          recipient_id?: string
          recipient_phone?: string
          scheduled_for?: string
          status?: string
          subject?: string
          updated_at?: string
        }
        Relationships: []
      }
      service_stations: {
        Row: {
          address: string
          closing_hours: string | null
          created_at: string
          essence_price: string
          gasoil_price: string
          id: string
          latitude: number
          longitude: number
          opening_hours: string | null
          sp98_price: string | null
          territory_id: string | null
          updated_at: string
        }
        Insert: {
          address: string
          closing_hours?: string | null
          created_at?: string
          essence_price: string
          gasoil_price: string
          id?: string
          latitude: number
          longitude: number
          opening_hours?: string | null
          sp98_price?: string | null
          territory_id?: string | null
          updated_at?: string
        }
        Update: {
          address?: string
          closing_hours?: string | null
          created_at?: string
          essence_price?: string
          gasoil_price?: string
          id?: string
          latitude?: number
          longitude?: number
          opening_hours?: string | null
          sp98_price?: string | null
          territory_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_stations_territory_id_fkey"
            columns: ["territory_id"]
            isOneToOne: false
            referencedRelation: "territories"
            referencedColumns: ["id"]
          },
        ]
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
      supplier_inspections: {
        Row: {
          comments: string | null
          created_at: string
          id: string
          inspection_date: string
          inspector_name: string
          next_inspection_date: string | null
          recommendations: string | null
          score: number | null
          status: string
          supplier_id: string
          updated_at: string
        }
        Insert: {
          comments?: string | null
          created_at?: string
          id?: string
          inspection_date: string
          inspector_name: string
          next_inspection_date?: string | null
          recommendations?: string | null
          score?: number | null
          status?: string
          supplier_id: string
          updated_at?: string
        }
        Update: {
          comments?: string | null
          created_at?: string
          id?: string
          inspection_date?: string
          inspector_name?: string
          next_inspection_date?: string | null
          recommendations?: string | null
          score?: number | null
          status?: string
          supplier_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      supplier_notifications: {
        Row: {
          created_by: string | null
          email: string
          expires_at: string | null
          id: string
          metadata: Json | null
          notification_type: string
          reset_token: string | null
          sent_at: string | null
          supplier_id: string | null
          task_id: string | null
          used_at: string | null
        }
        Insert: {
          created_by?: string | null
          email: string
          expires_at?: string | null
          id?: string
          metadata?: Json | null
          notification_type: string
          reset_token?: string | null
          sent_at?: string | null
          supplier_id?: string | null
          task_id?: string | null
          used_at?: string | null
        }
        Update: {
          created_by?: string | null
          email?: string
          expires_at?: string | null
          id?: string
          metadata?: Json | null
          notification_type?: string
          reset_token?: string | null
          sent_at?: string | null
          supplier_id?: string | null
          task_id?: string | null
          used_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "supplier_notifications_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_full"
            referencedColumns: ["auth_id"]
          },
          {
            foreignKeyName: "supplier_notifications_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_payment_requests: {
        Row: {
          amount: number
          approved_at: string | null
          approved_by: string | null
          created_at: string
          description: string
          id: string
          inspection_id: string | null
          notes: string | null
          payment_reason: string
          project_id: string | null
          rejection_reason: string | null
          requested_date: string
          status: string
          supplier_id: string
          supporting_documents: string[] | null
          updated_at: string
        }
        Insert: {
          amount: number
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          description: string
          id?: string
          inspection_id?: string | null
          notes?: string | null
          payment_reason: string
          project_id?: string | null
          rejection_reason?: string | null
          requested_date?: string
          status?: string
          supplier_id: string
          supporting_documents?: string[] | null
          updated_at?: string
        }
        Update: {
          amount?: number
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          description?: string
          id?: string
          inspection_id?: string | null
          notes?: string | null
          payment_reason?: string
          project_id?: string | null
          rejection_reason?: string | null
          requested_date?: string
          status?: string
          supplier_id?: string
          supporting_documents?: string[] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "supplier_payment_requests_inspection_id_fkey"
            columns: ["inspection_id"]
            isOneToOne: false
            referencedRelation: "inspections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_payment_requests_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_payments: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          due_date: string
          id: string
          payment_date: string | null
          reference_number: string | null
          status: string
          supplier_id: string
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          description?: string | null
          due_date: string
          id?: string
          payment_date?: string | null
          reference_number?: string | null
          status?: string
          supplier_id: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          due_date?: string
          id?: string
          payment_date?: string | null
          reference_number?: string | null
          status?: string
          supplier_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      supplier_viewed_items: {
        Row: {
          created_at: string
          id: string
          item_id: string
          item_type: string
          supplier_id: string
          viewed_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          item_id: string
          item_type: string
          supplier_id: string
          viewed_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          item_id?: string
          item_type?: string
          supplier_id?: string
          viewed_at?: string
        }
        Relationships: []
      }
      suppliers: {
        Row: {
          account_number: string | null
          address: string | null
          bank_name: string | null
          category: string | null
          commerce_register_ref: string | null
          contact_person: string | null
          created_at: string | null
          default_password_reset_required: boolean | null
          email: string | null
          id: string
          is_active: boolean | null
          name: string
          nif: string | null
          phone: string | null
          rating: number | null
          rib: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          account_number?: string | null
          address?: string | null
          bank_name?: string | null
          category?: string | null
          commerce_register_ref?: string | null
          contact_person?: string | null
          created_at?: string | null
          default_password_reset_required?: boolean | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          nif?: string | null
          phone?: string | null
          rating?: number | null
          rib?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          account_number?: string | null
          address?: string | null
          bank_name?: string | null
          category?: string | null
          commerce_register_ref?: string | null
          contact_person?: string | null
          created_at?: string | null
          default_password_reset_required?: boolean | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          nif?: string | null
          phone?: string | null
          rating?: number | null
          rib?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "suppliers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_full"
            referencedColumns: ["auth_id"]
          },
        ]
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
      system_settings: {
        Row: {
          category: string
          configuration: Json | null
          created_at: string
          id: string
          key: string
          updated_at: string
        }
        Insert: {
          category: string
          configuration?: Json | null
          created_at?: string
          id?: string
          key: string
          updated_at?: string
        }
        Update: {
          category?: string
          configuration?: Json | null
          created_at?: string
          id?: string
          key?: string
          updated_at?: string
        }
        Relationships: []
      }
      task_assignments: {
        Row: {
          actual_cost: number | null
          actual_duration: number | null
          assigned_by: string | null
          assigned_to: string | null
          assignee_email: string | null
          assignee_name: string | null
          assignee_type: string | null
          completion_date: string | null
          completion_token: string | null
          completion_url: string | null
          cost_estimate: number | null
          created_at: string | null
          critical_path: boolean | null
          description: string | null
          due_date: string | null
          end_date: string | null
          estimated_duration: number | null
          id: string
          most_likely_estimate: number | null
          notes: string | null
          optimistic_estimate: number | null
          pessimistic_estimate: number | null
          phase_id: string | null
          priority: string | null
          progress: number | null
          project_id: string | null
          start_date: string | null
          status: string | null
          title: string
          updated_at: string | null
          weight: number | null
        }
        Insert: {
          actual_cost?: number | null
          actual_duration?: number | null
          assigned_by?: string | null
          assigned_to?: string | null
          assignee_email?: string | null
          assignee_name?: string | null
          assignee_type?: string | null
          completion_date?: string | null
          completion_token?: string | null
          completion_url?: string | null
          cost_estimate?: number | null
          created_at?: string | null
          critical_path?: boolean | null
          description?: string | null
          due_date?: string | null
          end_date?: string | null
          estimated_duration?: number | null
          id?: string
          most_likely_estimate?: number | null
          notes?: string | null
          optimistic_estimate?: number | null
          pessimistic_estimate?: number | null
          phase_id?: string | null
          priority?: string | null
          progress?: number | null
          project_id?: string | null
          start_date?: string | null
          status?: string | null
          title: string
          updated_at?: string | null
          weight?: number | null
        }
        Update: {
          actual_cost?: number | null
          actual_duration?: number | null
          assigned_by?: string | null
          assigned_to?: string | null
          assignee_email?: string | null
          assignee_name?: string | null
          assignee_type?: string | null
          completion_date?: string | null
          completion_token?: string | null
          completion_url?: string | null
          cost_estimate?: number | null
          created_at?: string | null
          critical_path?: boolean | null
          description?: string | null
          due_date?: string | null
          end_date?: string | null
          estimated_duration?: number | null
          id?: string
          most_likely_estimate?: number | null
          notes?: string | null
          optimistic_estimate?: number | null
          pessimistic_estimate?: number | null
          phase_id?: string | null
          priority?: string | null
          progress?: number | null
          project_id?: string | null
          start_date?: string | null
          status?: string | null
          title?: string
          updated_at?: string | null
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "task_assignments_phase_id_fkey"
            columns: ["phase_id"]
            isOneToOne: false
            referencedRelation: "project_phases"
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
      task_dependencies: {
        Row: {
          created_at: string | null
          dependency_type: string | null
          depends_on_task_id: string
          id: string
          lag_days: number | null
          task_id: string
        }
        Insert: {
          created_at?: string | null
          dependency_type?: string | null
          depends_on_task_id: string
          id?: string
          lag_days?: number | null
          task_id: string
        }
        Update: {
          created_at?: string | null
          dependency_type?: string | null
          depends_on_task_id?: string
          id?: string
          lag_days?: number | null
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_dependencies_depends_on_task_id_fkey"
            columns: ["depends_on_task_id"]
            isOneToOne: false
            referencedRelation: "task_assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_dependencies_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "task_assignments"
            referencedColumns: ["id"]
          },
        ]
      }
      tender_document_submissions: {
        Row: {
          created_at: string
          document_id: string
          id: string
          reviewed_at: string | null
          reviewed_by: string | null
          reviewer_notes: string | null
          status: string
          submission_date: string
          submitted_by: string
          tender_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          document_id: string
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          reviewer_notes?: string | null
          status?: string
          submission_date?: string
          submitted_by: string
          tender_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          document_id?: string
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          reviewer_notes?: string | null
          status?: string
          submission_date?: string
          submitted_by?: string
          tender_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tender_document_submissions_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "user_full"
            referencedColumns: ["auth_id"]
          },
          {
            foreignKeyName: "tender_document_submissions_submitted_by_fkey"
            columns: ["submitted_by"]
            isOneToOne: false
            referencedRelation: "user_full"
            referencedColumns: ["auth_id"]
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
          project_id: string | null
          reviewer_notes: string | null
          status: string | null
          subcategory: Database["public"]["Enums"]["tender_document_subcategory"]
          submission_date: string | null
          tender_id: string | null
          updated_at: string
        }
        Insert: {
          category: Database["public"]["Enums"]["tender_document_category"]
          created_at?: string
          document_id: string
          id?: string
          is_required?: boolean | null
          is_submitted?: boolean | null
          project_id?: string | null
          reviewer_notes?: string | null
          status?: string | null
          subcategory: Database["public"]["Enums"]["tender_document_subcategory"]
          submission_date?: string | null
          tender_id?: string | null
          updated_at?: string
        }
        Update: {
          category?: Database["public"]["Enums"]["tender_document_category"]
          created_at?: string
          document_id?: string
          id?: string
          is_required?: boolean | null
          is_submitted?: boolean | null
          project_id?: string | null
          reviewer_notes?: string | null
          status?: string | null
          subcategory?: Database["public"]["Enums"]["tender_document_subcategory"]
          submission_date?: string | null
          tender_id?: string | null
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
            foreignKeyName: "tender_documents_tender_id_fkey"
            columns: ["tender_id"]
            isOneToOne: false
            referencedRelation: "tenders"
            referencedColumns: ["id"]
          },
        ]
      }
      tender_estimate_items: {
        Row: {
          created_at: string
          description: string | null
          estimate_id: string
          id: string
          item_type: string | null
          material_id: string | null
          quantity: number
          total_price: number
          unit_price: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          estimate_id: string
          id?: string
          item_type?: string | null
          material_id?: string | null
          quantity?: number
          total_price?: number
          unit_price?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          estimate_id?: string
          id?: string
          item_type?: string | null
          material_id?: string | null
          quantity?: number
          total_price?: number
          unit_price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tender_estimate_items_estimate_id_fkey"
            columns: ["estimate_id"]
            isOneToOne: false
            referencedRelation: "tender_estimates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tender_estimate_items_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
        ]
      }
      tender_estimates: {
        Row: {
          created_at: string
          currency: string | null
          estimate_type: string
          final_total: number | null
          id: string
          overhead_amount: number | null
          overhead_percentage: number | null
          profit_margin_amount: number | null
          profit_margin_percentage: number | null
          project_id: string | null
          status: string | null
          submitted_by: string | null
          subtotal: number | null
          tax_amount: number | null
          tax_rate: number | null
          tender_id: string
          total_equipment_cost: number | null
          total_labor_cost: number | null
          total_materials_cost: number | null
          total_with_tax: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          currency?: string | null
          estimate_type?: string
          final_total?: number | null
          id?: string
          overhead_amount?: number | null
          overhead_percentage?: number | null
          profit_margin_amount?: number | null
          profit_margin_percentage?: number | null
          project_id?: string | null
          status?: string | null
          submitted_by?: string | null
          subtotal?: number | null
          tax_amount?: number | null
          tax_rate?: number | null
          tender_id: string
          total_equipment_cost?: number | null
          total_labor_cost?: number | null
          total_materials_cost?: number | null
          total_with_tax?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          currency?: string | null
          estimate_type?: string
          final_total?: number | null
          id?: string
          overhead_amount?: number | null
          overhead_percentage?: number | null
          profit_margin_amount?: number | null
          profit_margin_percentage?: number | null
          project_id?: string | null
          status?: string | null
          submitted_by?: string | null
          subtotal?: number | null
          tax_amount?: number | null
          tax_rate?: number | null
          tender_id?: string
          total_equipment_cost?: number | null
          total_labor_cost?: number | null
          total_materials_cost?: number | null
          total_with_tax?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      tender_step_documents: {
        Row: {
          created_at: string
          document_id: string
          document_type: string
          id: string
          is_required: boolean
          reviewer_notes: string | null
          status: string
          step_id: string
          submitted_at: string | null
        }
        Insert: {
          created_at?: string
          document_id: string
          document_type: string
          id?: string
          is_required?: boolean
          reviewer_notes?: string | null
          status?: string
          step_id: string
          submitted_at?: string | null
        }
        Update: {
          created_at?: string
          document_id?: string
          document_type?: string
          id?: string
          is_required?: boolean
          reviewer_notes?: string | null
          status?: string
          step_id?: string
          submitted_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tender_step_documents_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tender_step_documents_step_id_fkey"
            columns: ["step_id"]
            isOneToOne: false
            referencedRelation: "tender_steps"
            referencedColumns: ["id"]
          },
        ]
      }
      tender_steps: {
        Row: {
          actual_completion_date: string | null
          approval_deadline: string | null
          assigned_to: string | null
          completed_at: string | null
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          notes: string | null
          procurement_phase: string | null
          procurement_stage: string | null
          required_documents: string[] | null
          review_deadline: string | null
          status: string
          step_number: number
          submission_date: string | null
          tender_id: string
          title: string
          updated_at: string
        }
        Insert: {
          actual_completion_date?: string | null
          approval_deadline?: string | null
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          notes?: string | null
          procurement_phase?: string | null
          procurement_stage?: string | null
          required_documents?: string[] | null
          review_deadline?: string | null
          status?: string
          step_number: number
          submission_date?: string | null
          tender_id: string
          title: string
          updated_at?: string
        }
        Update: {
          actual_completion_date?: string | null
          approval_deadline?: string | null
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          notes?: string | null
          procurement_phase?: string | null
          procurement_stage?: string | null
          required_documents?: string[] | null
          review_deadline?: string | null
          status?: string
          step_number?: number
          submission_date?: string | null
          tender_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tender_steps_tender_id_fkey"
            columns: ["tender_id"]
            isOneToOne: false
            referencedRelation: "tenders"
            referencedColumns: ["id"]
          },
        ]
      }
      tender_submission_documents: {
        Row: {
          category: string
          created_at: string
          document_id: string
          id: string
          is_required: boolean | null
          subcategory: string | null
          submission_id: string
        }
        Insert: {
          category: string
          created_at?: string
          document_id: string
          id?: string
          is_required?: boolean | null
          subcategory?: string | null
          submission_id: string
        }
        Update: {
          category?: string
          created_at?: string
          document_id?: string
          id?: string
          is_required?: boolean | null
          subcategory?: string | null
          submission_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tender_submission_documents_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tender_submission_documents_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "tender_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      tender_submissions: {
        Row: {
          administrative_score: number | null
          created_at: string
          evaluator_notes: string | null
          financial_score: number | null
          id: string
          reviewed_at: string | null
          reviewer_id: string | null
          status: string
          submission_date: string
          supplier_email: string | null
          supplier_name: string | null
          technical_score: number | null
          tender_id: string
          total_score: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          administrative_score?: number | null
          created_at?: string
          evaluator_notes?: string | null
          financial_score?: number | null
          id?: string
          reviewed_at?: string | null
          reviewer_id?: string | null
          status?: string
          submission_date?: string
          supplier_email?: string | null
          supplier_name?: string | null
          technical_score?: number | null
          tender_id: string
          total_score?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          administrative_score?: number | null
          created_at?: string
          evaluator_notes?: string | null
          financial_score?: number | null
          id?: string
          reviewed_at?: string | null
          reviewer_id?: string | null
          status?: string
          submission_date?: string
          supplier_email?: string | null
          supplier_name?: string | null
          technical_score?: number | null
          tender_id?: string
          total_score?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      tender_suppliers: {
        Row: {
          created_at: string
          id: string
          supplier_id: string
          tender_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          supplier_id: string
          tender_id: string
        }
        Update: {
          created_at?: string
          id?: string
          supplier_id?: string
          tender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tender_suppliers_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tender_suppliers_tender_id_fkey"
            columns: ["tender_id"]
            isOneToOne: false
            referencedRelation: "tenders"
            referencedColumns: ["id"]
          },
        ]
      }
      tender_workflow_status: {
        Row: {
          completed_at: string | null
          created_at: string | null
          due_date: string | null
          id: string
          notes: string | null
          phase: string
          responsible_person: string | null
          stage: string
          started_at: string | null
          status: string
          tender_id: string
          updated_at: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          due_date?: string | null
          id?: string
          notes?: string | null
          phase: string
          responsible_person?: string | null
          stage: string
          started_at?: string | null
          status?: string
          tender_id: string
          updated_at?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          due_date?: string | null
          id?: string
          notes?: string | null
          phase?: string
          responsible_person?: string | null
          stage?: string
          started_at?: string | null
          status?: string
          tender_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tender_workflow_status_tender_id_fkey"
            columns: ["tender_id"]
            isOneToOne: false
            referencedRelation: "tenders"
            referencedColumns: ["id"]
          },
        ]
      }
      tenders: {
        Row: {
          attribution_date: string | null
          award_criteria: string | null
          budget_max: number | null
          budget_min: number | null
          contract_duration: number | null
          created_at: string
          current_phase: number | null
          current_stage: string | null
          deadline_date: string | null
          description: string
          eligibility_requirements: Json | null
          estimated_value: number | null
          evaluation_criteria: Json | null
          evaluation_deadline: string | null
          financing_source: string | null
          id: string
          launch_date: string | null
          market_type: string | null
          procurement_type: string | null
          project_id: string | null
          project_reference: string | null
          publication_date: string | null
          selection_mode: string | null
          status: string
          submission_deadline: string | null
          tender_category: string | null
          tender_number: string | null
          title: string
          updated_at: string
        }
        Insert: {
          attribution_date?: string | null
          award_criteria?: string | null
          budget_max?: number | null
          budget_min?: number | null
          contract_duration?: number | null
          created_at?: string
          current_phase?: number | null
          current_stage?: string | null
          deadline_date?: string | null
          description: string
          eligibility_requirements?: Json | null
          estimated_value?: number | null
          evaluation_criteria?: Json | null
          evaluation_deadline?: string | null
          financing_source?: string | null
          id?: string
          launch_date?: string | null
          market_type?: string | null
          procurement_type?: string | null
          project_id?: string | null
          project_reference?: string | null
          publication_date?: string | null
          selection_mode?: string | null
          status?: string
          submission_deadline?: string | null
          tender_category?: string | null
          tender_number?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          attribution_date?: string | null
          award_criteria?: string | null
          budget_max?: number | null
          budget_min?: number | null
          contract_duration?: number | null
          created_at?: string
          current_phase?: number | null
          current_stage?: string | null
          deadline_date?: string | null
          description?: string
          eligibility_requirements?: Json | null
          estimated_value?: number | null
          evaluation_criteria?: Json | null
          evaluation_deadline?: string | null
          financing_source?: string | null
          id?: string
          launch_date?: string | null
          market_type?: string | null
          procurement_type?: string | null
          project_id?: string | null
          project_reference?: string | null
          publication_date?: string | null
          selection_mode?: string | null
          status?: string
          submission_deadline?: string | null
          tender_category?: string | null
          tender_number?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenders_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      territories: {
        Row: {
          created_at: string
          id: string
          label: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          label: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          label?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          assigned_at: string | null
          assigned_by: string | null
          id: string
          role_name: string
          user_id: string
        }
        Insert: {
          assigned_at?: string | null
          assigned_by?: string | null
          id?: string
          role_name: string
          user_id: string
        }
        Update: {
          assigned_at?: string | null
          assigned_by?: string | null
          id?: string
          role_name?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "user_full"
            referencedColumns: ["auth_id"]
          },
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_full"
            referencedColumns: ["auth_id"]
          },
        ]
      }
      users: {
        Row: {
          aud: string | null
          banned_until: string | null
          confirmation_sent_at: string | null
          confirmation_token: string | null
          confirmed_at: string | null
          created_at: string | null
          deleted_at: string | null
          email: string | null
          email_change: string | null
          email_change_confirm_status: number | null
          email_change_sent_at: string | null
          email_change_token_current: string | null
          email_change_token_new: string | null
          email_confirmed_at: string | null
          encrypted_password: string | null
          id: string
          instance_id: string | null
          invited_at: string | null
          is_anonymous: boolean | null
          is_sso_user: boolean | null
          is_super_admin: boolean | null
          last_sign_in_at: string | null
          phone: string | null
          phone_change: string | null
          phone_change_sent_at: string | null
          phone_change_token: string | null
          phone_confirmed_at: string | null
          raw_app_meta_data: Json | null
          raw_user_meta_data: Json | null
          reauthentication_sent_at: string | null
          reauthentication_token: string | null
          recovery_sent_at: string | null
          recovery_token: string | null
          role: string | null
          updated_at: string | null
        }
        Insert: {
          aud?: string | null
          banned_until?: string | null
          confirmation_sent_at?: string | null
          confirmation_token?: string | null
          confirmed_at?: string | null
          created_at?: string | null
          deleted_at?: string | null
          email?: string | null
          email_change?: string | null
          email_change_confirm_status?: number | null
          email_change_sent_at?: string | null
          email_change_token_current?: string | null
          email_change_token_new?: string | null
          email_confirmed_at?: string | null
          encrypted_password?: string | null
          id: string
          instance_id?: string | null
          invited_at?: string | null
          is_anonymous?: boolean | null
          is_sso_user?: boolean | null
          is_super_admin?: boolean | null
          last_sign_in_at?: string | null
          phone?: string | null
          phone_change?: string | null
          phone_change_sent_at?: string | null
          phone_change_token?: string | null
          phone_confirmed_at?: string | null
          raw_app_meta_data?: Json | null
          raw_user_meta_data?: Json | null
          reauthentication_sent_at?: string | null
          reauthentication_token?: string | null
          recovery_sent_at?: string | null
          recovery_token?: string | null
          role?: string | null
          updated_at?: string | null
        }
        Update: {
          aud?: string | null
          banned_until?: string | null
          confirmation_sent_at?: string | null
          confirmation_token?: string | null
          confirmed_at?: string | null
          created_at?: string | null
          deleted_at?: string | null
          email?: string | null
          email_change?: string | null
          email_change_confirm_status?: number | null
          email_change_sent_at?: string | null
          email_change_token_current?: string | null
          email_change_token_new?: string | null
          email_confirmed_at?: string | null
          encrypted_password?: string | null
          id?: string
          instance_id?: string | null
          invited_at?: string | null
          is_anonymous?: boolean | null
          is_sso_user?: boolean | null
          is_super_admin?: boolean | null
          last_sign_in_at?: string | null
          phone?: string | null
          phone_change?: string | null
          phone_change_sent_at?: string | null
          phone_change_token?: string | null
          phone_confirmed_at?: string | null
          raw_app_meta_data?: Json | null
          raw_user_meta_data?: Json | null
          reauthentication_sent_at?: string | null
          reauthentication_token?: string | null
          recovery_sent_at?: string | null
          recovery_token?: string | null
          role?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      vessels: {
        Row: {
          capacity: number
          coordinates_latitude: number | null
          coordinates_longitude: number | null
          created_at: string | null
          daily_cost: number
          equipment: Json | null
          fuel_capacity: number | null
          id: string
          insurance_expires_at: string | null
          name: string
          registration_number: string
          status: Database["public"]["Enums"]["vessel_status"] | null
          updated_at: string | null
        }
        Insert: {
          capacity: number
          coordinates_latitude?: number | null
          coordinates_longitude?: number | null
          created_at?: string | null
          daily_cost: number
          equipment?: Json | null
          fuel_capacity?: number | null
          id?: string
          insurance_expires_at?: string | null
          name: string
          registration_number: string
          status?: Database["public"]["Enums"]["vessel_status"] | null
          updated_at?: string | null
        }
        Update: {
          capacity?: number
          coordinates_latitude?: number | null
          coordinates_longitude?: number | null
          created_at?: string | null
          daily_cost?: number
          equipment?: Json | null
          fuel_capacity?: number | null
          id?: string
          insurance_expires_at?: string | null
          name?: string
          registration_number?: string
          status?: Database["public"]["Enums"]["vessel_status"] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      workflow_status: {
        Row: {
          assigned_to: string | null
          completed_at: string | null
          created_at: string | null
          due_date: string | null
          entity_id: string
          entity_type: string
          id: string
          notes: string | null
          phase_code: string
          stage_code: string
          started_at: string | null
          status: string
          task_id: string | null
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string | null
          due_date?: string | null
          entity_id: string
          entity_type: string
          id?: string
          notes?: string | null
          phase_code: string
          stage_code: string
          started_at?: string | null
          status?: string
          task_id?: string | null
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string | null
          due_date?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          notes?: string | null
          phase_code?: string
          stage_code?: string
          started_at?: string | null
          status?: string
          task_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
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
      user_full: {
        Row: {
          aud: string | null
          auth_email: string | null
          auth_id: string | null
          banned_until: string | null
          confirmation_sent_at: string | null
          confirmation_token: string | null
          confirmed_at: string | null
          created_at: string | null
          deleted_at: string | null
          email: string | null
          email_change: string | null
          email_change_confirm_status: number | null
          email_change_sent_at: string | null
          email_change_token_current: string | null
          email_change_token_new: string | null
          email_confirmed_at: string | null
          encrypted_password: string | null
          id: string | null
          instance_id: string | null
          invited_at: string | null
          is_anonymous: boolean | null
          is_sso_user: boolean | null
          is_super_admin: boolean | null
          last_sign_in_at: string | null
          phone: string | null
          phone_change: string | null
          phone_change_sent_at: string | null
          phone_change_token: string | null
          phone_confirmed_at: string | null
          raw_app_meta_data: Json | null
          raw_user_meta_data: Json | null
          reauthentication_sent_at: string | null
          reauthentication_token: string | null
          recovery_sent_at: string | null
          recovery_token: string | null
          role: string | null
          updated_at: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      admin_update_user_email: {
        Args: { new_email: string; target_user_id: string }
        Returns: undefined
      }
      assign_user_role: {
        Args: { role_name: string; target_user_id: string }
        Returns: undefined
      }
      create_progress_invoice: {
        Args: {
          p_inspection_id: string
          p_invoice_amount: number
          p_lot_details?: Json
          p_progress_percentage: number
          p_project_id: string
          p_quantities_executed?: Json
          p_work_description: string
        }
        Returns: {
          consultant_approval_status: string | null
          consultant_comments: string | null
          consultant_id: string | null
          consultant_validated_at: string | null
          created_at: string | null
          cumulative_paid: number | null
          donor_approval_required: boolean | null
          donor_approved_at: string | null
          donor_comments: string | null
          id: string
          inspection_id: string | null
          inspection_report_url: string | null
          invoice_amount: number
          invoice_number: string
          invoice_type: string
          lot_details: Json | null
          ministry_comments: string | null
          ministry_reviewer_id: string | null
          ministry_validated_at: string | null
          paid_at: string | null
          previous_progress: number | null
          progress_increment: number | null
          progress_percentage: number
          project_id: string
          quantities_executed: Json | null
          retention_amount: number | null
          service_fait_document_id: string | null
          status: string | null
          submitted_at: string | null
          submitted_by: string | null
          supporting_documents: Json | null
          total_contract_amount: number
          updated_at: string | null
          work_description: string | null
          workflow_history: Json | null
        }
        SetofOptions: {
          from: "*"
          to: "progress_invoices"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      create_supplier_payment_request: {
        Args: {
          amount_param: number
          description_param: string
          notes_param?: string
          payment_reason_param: string
          project_id_param?: string
          supplier_id_param: string
          supporting_documents_param?: string[]
        }
        Returns: {
          amount: number
          created_at: string
          description: string
          id: string
          notes: string
          payment_reason: string
          project_id: string
          requested_date: string
          status: string
          supplier_id: string
          supporting_documents: string[]
          updated_at: string
        }[]
      }
      generate_request_number: { Args: never; Returns: string }
      generate_supplier_reset_token: {
        Args: { supplier_email: string }
        Returns: string
      }
      get_escalation_targets: {
        Args: { escalation_level_param: string; project_id_param: string }
        Returns: {
          department: string
          employee_email: string
          employee_id: string
          employee_name: string
          employee_phone: string
          hierarchy_level: number
          position_title: string
        }[]
      }
      get_escalation_thresholds: {
        Args: { threshold_type_param: string }
        Returns: {
          description: string
          escalation_level: number
          severity_level: string
          threshold_name: string
          threshold_unit: string
          threshold_value: number
        }[]
      }
      get_hierarchy_chain: {
        Args: { direction?: string; employee_id_param: string }
        Returns: {
          department: string
          distance: number
          employee_email: string
          employee_id: string
          employee_name: string
          employee_phone: string
          hierarchy_id: string
          level: number
          position_title: string
        }[]
      }
      get_project_hierarchy: {
        Args: { project_id_param: string }
        Returns: {
          can_approve_payments: boolean
          can_approve_projects: boolean
          department: string
          employee_email: string
          employee_id: string
          employee_name: string
          employee_phone: string
          hierarchy_id: string
          level: number
          notification_preferences: Json
          organization_name: string
          parent_id: string
          position_title: string
        }[]
      }
      get_user_role: {
        Args: { user_id: string }
        Returns: Database["public"]["Enums"]["user_role"]
      }
      get_user_roles: {
        Args: { target_user_id: string }
        Returns: {
          role_name: string
        }[]
      }
      has_role: {
        Args: { role_name: string; user_id: string }
        Returns: boolean
      }
      is_current_user_admin: { Args: never; Returns: boolean }
      search_projects_autocomplete: {
        Args: { search_term?: string }
        Returns: {
          id: string
          project_reference: string
          title: string
        }[]
      }
    }
    Enums: {
      applicant_type: "company" | "individual"
      authorization_status:
        | "draft"
        | "submitted"
        | "under_review"
        | "approved"
        | "rejected"
        | "returned"
      document_category:
        | "construction_permit"
        | "property_cadastre"
        | "distribution_license"
        | "environmental_study"
        | "safety_assessment"
        | "other"
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
        | "supplier_catalog"
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
        | "plan_annuel_achats"
        | "modele_paa"
        | "validation_ordonnateur"
        | "publication_armp"
        | "demande_initiation"
        | "procedure_proposee"
        | "consultation_directe"
        | "consultation_concurrentielle"
        | "lettre_consultation"
        | "modele_soumission"
        | "modele_contrat"
        | "registre_reception_plis"
        | "recu_depot_plis"
        | "pv_ouverture_plis"
        | "pv_evaluation_attribution"
        | "selection_consultants"
        | "dossier_smc_sfqc_sci"
        | "lettre_invitation"
        | "lettre_notification"
        | "nom_attributaire"
        | "delai_execution"
        | "publication_provisoire"
        | "signature_contrat"
        | "original_offres"
        | "pv_archivage"
        | "contrats_signes"
        | "preuves_publication"
        | "chemises_archivage"
        | "double_numerique"
        | "preuves_capacites_techniques"
        | "experience_generale_marche"
        | "methodologie"
        | "personnel_cle"
        | "planning_travaux"
        | "calendrier_livraison"
        | "conformite_techniques"
        | "description_besoin"
        | "ddqe"
        | "termes_reference"
        | "pv_evaluation_technique"
        | "preuves_capacites_financieres"
        | "chiffre_affaires_annuel"
        | "devis_quantitatif_estimatif"
        | "garantie_bancaire"
        | "garantie_soumission"
        | "source_financement"
        | "montant_alloue"
        | "devis_comparatifs"
        | "factures_commandes"
        | "montant_marche"
      user_role:
        | "insurance_company"
        | "practitioner"
        | "patient"
        | "admin"
        | "manager"
        | "director"
        | "agent"
        | "supplier"
      vessel_status: "active" | "maintenance" | "inactive"
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
      applicant_type: ["company", "individual"],
      authorization_status: [
        "draft",
        "submitted",
        "under_review",
        "approved",
        "rejected",
        "returned",
      ],
      document_category: [
        "construction_permit",
        "property_cadastre",
        "distribution_license",
        "environmental_study",
        "safety_assessment",
        "other",
      ],
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
        "supplier_catalog",
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
        "plan_annuel_achats",
        "modele_paa",
        "validation_ordonnateur",
        "publication_armp",
        "demande_initiation",
        "procedure_proposee",
        "consultation_directe",
        "consultation_concurrentielle",
        "lettre_consultation",
        "modele_soumission",
        "modele_contrat",
        "registre_reception_plis",
        "recu_depot_plis",
        "pv_ouverture_plis",
        "pv_evaluation_attribution",
        "selection_consultants",
        "dossier_smc_sfqc_sci",
        "lettre_invitation",
        "lettre_notification",
        "nom_attributaire",
        "delai_execution",
        "publication_provisoire",
        "signature_contrat",
        "original_offres",
        "pv_archivage",
        "contrats_signes",
        "preuves_publication",
        "chemises_archivage",
        "double_numerique",
        "preuves_capacites_techniques",
        "experience_generale_marche",
        "methodologie",
        "personnel_cle",
        "planning_travaux",
        "calendrier_livraison",
        "conformite_techniques",
        "description_besoin",
        "ddqe",
        "termes_reference",
        "pv_evaluation_technique",
        "preuves_capacites_financieres",
        "chiffre_affaires_annuel",
        "devis_quantitatif_estimatif",
        "garantie_bancaire",
        "garantie_soumission",
        "source_financement",
        "montant_alloue",
        "devis_comparatifs",
        "factures_commandes",
        "montant_marche",
      ],
      user_role: [
        "insurance_company",
        "practitioner",
        "patient",
        "admin",
        "manager",
        "director",
        "agent",
        "supplier",
      ],
      vessel_status: ["active", "maintenance", "inactive"],
    },
  },
} as const
