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
    PostgrestVersion: "12.2.3"
  }
  public: {
    Tables: {
      auth_sessions: {
        Row: {
          access_token: string | null
          created_at: string | null
          expires_at: string | null
          id: string
          metadata: Json | null
          provider: string
          provider_session_id: string | null
          refresh_token: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          access_token?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          metadata?: Json | null
          provider?: string
          provider_session_id?: string | null
          refresh_token?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          access_token?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          metadata?: Json | null
          provider?: string
          provider_session_id?: string | null
          refresh_token?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      blocked_senders: {
        Row: {
          blocked_at: string
          blocked_by: string | null
          created_at: string
          email: string
          id: string
          is_active: boolean
          reason: string | null
        }
        Insert: {
          blocked_at?: string
          blocked_by?: string | null
          created_at?: string
          email: string
          id?: string
          is_active?: boolean
          reason?: string | null
        }
        Update: {
          blocked_at?: string
          blocked_by?: string | null
          created_at?: string
          email?: string
          id?: string
          is_active?: boolean
          reason?: string | null
        }
        Relationships: []
      }
      brand_managers: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          brand_id: string
          created_at: string
          id: string
          is_active: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          brand_id: string
          created_at?: string
          id?: string
          is_active?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          brand_id?: string
          created_at?: string
          id?: string
          is_active?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "brand_managers_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      brands: {
        Row: {
          address: string | null
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          logo_url: string | null
          name: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      complaints: {
        Row: {
          assigned_name: string | null
          assigned_to: string | null
          complainant_email: string | null
          complainant_name: string | null
          complainant_phone: string | null
          complaint_type: string
          created_at: string
          description: string
          id: string
          incident_date: string | null
          investigation_notes: string | null
          is_anonymous: boolean
          reported_by: string | null
          resolution: string | null
          resolution_date: string | null
          station_id: string | null
          station_name: string | null
          status: string
          updated_at: string
        }
        Insert: {
          assigned_name?: string | null
          assigned_to?: string | null
          complainant_email?: string | null
          complainant_name?: string | null
          complainant_phone?: string | null
          complaint_type: string
          created_at?: string
          description: string
          id?: string
          incident_date?: string | null
          investigation_notes?: string | null
          is_anonymous?: boolean
          reported_by?: string | null
          resolution?: string | null
          resolution_date?: string | null
          station_id?: string | null
          station_name?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          assigned_name?: string | null
          assigned_to?: string | null
          complainant_email?: string | null
          complainant_name?: string | null
          complainant_phone?: string | null
          complaint_type?: string
          created_at?: string
          description?: string
          id?: string
          incident_date?: string | null
          investigation_notes?: string | null
          is_anonymous?: boolean
          reported_by?: string | null
          resolution?: string | null
          resolution_date?: string | null
          station_id?: string | null
          station_name?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      contact_messages: {
        Row: {
          created_at: string
          default_reply_email: string
          id: string
          is_archived: boolean
          is_read: boolean
          is_spam: boolean
          message: string
          metadata: Json | null
          sender_email: string
          sender_name: string
          sender_phone: string | null
          subject: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          default_reply_email?: string
          id?: string
          is_archived?: boolean
          is_read?: boolean
          is_spam?: boolean
          message: string
          metadata?: Json | null
          sender_email: string
          sender_name: string
          sender_phone?: string | null
          subject: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          default_reply_email?: string
          id?: string
          is_archived?: boolean
          is_read?: boolean
          is_spam?: boolean
          message?: string
          metadata?: Json | null
          sender_email?: string
          sender_name?: string
          sender_phone?: string | null
          subject?: string
          updated_at?: string
        }
        Relationships: []
      }
      danger_reports: {
        Row: {
          assigned_inspector_id: string | null
          assigned_inspector_name: string | null
          created_at: string
          depot_id: string | null
          description: string
          id: string
          investigation_result: string | null
          latitude: number | null
          location_description: string
          longitude: number | null
          photos: Json | null
          report_type: string
          reporter_contact: string | null
          station_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          assigned_inspector_id?: string | null
          assigned_inspector_name?: string | null
          created_at?: string
          depot_id?: string | null
          description: string
          id?: string
          investigation_result?: string | null
          latitude?: number | null
          location_description?: string
          longitude?: number | null
          photos?: Json | null
          report_type: string
          reporter_contact?: string | null
          station_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          assigned_inspector_id?: string | null
          assigned_inspector_name?: string | null
          created_at?: string
          depot_id?: string | null
          description?: string
          id?: string
          investigation_result?: string | null
          latitude?: number | null
          location_description?: string
          longitude?: number | null
          photos?: Json | null
          report_type?: string
          reporter_contact?: string | null
          station_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      deliveries: {
        Row: {
          arrival_date: string | null
          cargo_certificate_id: string | null
          compartment_number: string | null
          created_at: string
          created_by: string | null
          delivery_number: string
          delivery_slip: string | null
          delivery_slip_number: string | null
          density_15c: number | null
          departure_date: string | null
          destination_depot_id: string | null
          destination_depot_name: string | null
          destination_station_id: string | null
          destination_station_name: string | null
          discrepancy_notes: string | null
          driver_license: string | null
          driver_name: string
          id: string
          import_batch_reference: string | null
          inspection_certificate: string | null
          loading_date: string | null
          loading_qr_code: string | null
          origin_depot_id: string | null
          origin_depot_name: string | null
          product: string
          product_standard: string | null
          quantity_difference: number | null
          quantity_received: number | null
          quantity_shipped: number
          seal_numbers: string | null
          status: string
          temperature_c: number | null
          transport_certificate: string | null
          truck_registration: string
          truck_technical_visit_expiry: string | null
          unit: string
          unloading_date: string | null
          unloading_qr_code: string | null
          unloading_report_number: string | null
          updated_at: string
          volume_15c: number | null
        }
        Insert: {
          arrival_date?: string | null
          cargo_certificate_id?: string | null
          compartment_number?: string | null
          created_at?: string
          created_by?: string | null
          delivery_number: string
          delivery_slip?: string | null
          delivery_slip_number?: string | null
          density_15c?: number | null
          departure_date?: string | null
          destination_depot_id?: string | null
          destination_depot_name?: string | null
          destination_station_id?: string | null
          destination_station_name?: string | null
          discrepancy_notes?: string | null
          driver_license?: string | null
          driver_name?: string
          id?: string
          import_batch_reference?: string | null
          inspection_certificate?: string | null
          loading_date?: string | null
          loading_qr_code?: string | null
          origin_depot_id?: string | null
          origin_depot_name?: string | null
          product: string
          product_standard?: string | null
          quantity_difference?: number | null
          quantity_received?: number | null
          quantity_shipped?: number
          seal_numbers?: string | null
          status?: string
          temperature_c?: number | null
          transport_certificate?: string | null
          truck_registration?: string
          truck_technical_visit_expiry?: string | null
          unit?: string
          unloading_date?: string | null
          unloading_qr_code?: string | null
          unloading_report_number?: string | null
          updated_at?: string
          volume_15c?: number | null
        }
        Update: {
          arrival_date?: string | null
          cargo_certificate_id?: string | null
          compartment_number?: string | null
          created_at?: string
          created_by?: string | null
          delivery_number?: string
          delivery_slip?: string | null
          delivery_slip_number?: string | null
          density_15c?: number | null
          departure_date?: string | null
          destination_depot_id?: string | null
          destination_depot_name?: string | null
          destination_station_id?: string | null
          destination_station_name?: string | null
          discrepancy_notes?: string | null
          driver_license?: string | null
          driver_name?: string
          id?: string
          import_batch_reference?: string | null
          inspection_certificate?: string | null
          loading_date?: string | null
          loading_qr_code?: string | null
          origin_depot_id?: string | null
          origin_depot_name?: string | null
          product?: string
          product_standard?: string | null
          quantity_difference?: number | null
          quantity_received?: number | null
          quantity_shipped?: number
          seal_numbers?: string | null
          status?: string
          temperature_c?: number | null
          transport_certificate?: string | null
          truck_registration?: string
          truck_technical_visit_expiry?: string | null
          unit?: string
          unloading_date?: string | null
          unloading_qr_code?: string | null
          unloading_report_number?: string | null
          updated_at?: string
          volume_15c?: number | null
        }
        Relationships: []
      }
      distance_matrix: {
        Row: {
          created_at: string
          destination_code: string
          destination_name_ar: string | null
          destination_name_fr: string
          distance_km: number
          estimated_hours: number | null
          id: string
          is_active: boolean
          notes: string | null
          origin_code: string
          origin_name_ar: string | null
          origin_name_fr: string
          piste_percentage: number | null
          route_type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          destination_code: string
          destination_name_ar?: string | null
          destination_name_fr: string
          distance_km: number
          estimated_hours?: number | null
          id?: string
          is_active?: boolean
          notes?: string | null
          origin_code: string
          origin_name_ar?: string | null
          origin_name_fr: string
          piste_percentage?: number | null
          route_type?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          destination_code?: string
          destination_name_ar?: string | null
          destination_name_fr?: string
          distance_km?: number
          estimated_hours?: number | null
          id?: string
          is_active?: boolean
          notes?: string | null
          origin_code?: string
          origin_name_ar?: string | null
          origin_name_fr?: string
          piste_percentage?: number | null
          route_type?: string
          updated_at?: string
        }
        Relationships: []
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
      email_templates: {
        Row: {
          body_html: string
          body_text: string | null
          category: string
          created_at: string | null
          created_by: string | null
          id: string
          is_active: boolean | null
          subject: string
          template_key: string
          updated_at: string | null
          variables: Json | null
        }
        Insert: {
          body_html: string
          body_text?: string | null
          category: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          subject: string
          template_key: string
          updated_at?: string | null
          variables?: Json | null
        }
        Update: {
          body_html?: string
          body_text?: string | null
          category?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          subject?: string
          template_key?: string
          updated_at?: string | null
          variables?: Json | null
        }
        Relationships: []
      }
      form_templates: {
        Row: {
          category: string
          created_at: string | null
          created_by: string
          description: string
          fields: Json
          id: string
          is_active: boolean
          is_public: boolean
          name: string
          sections: Json | null
          template_type: string
          updated_at: string | null
          usage_count: number
          version: string
        }
        Insert: {
          category: string
          created_at?: string | null
          created_by: string
          description: string
          fields?: Json
          id?: string
          is_active?: boolean
          is_public?: boolean
          name: string
          sections?: Json | null
          template_type: string
          updated_at?: string | null
          usage_count?: number
          version?: string
        }
        Update: {
          category?: string
          created_at?: string | null
          created_by?: string
          description?: string
          fields?: Json
          id?: string
          is_active?: boolean
          is_public?: boolean
          name?: string
          sections?: Json | null
          template_type?: string
          updated_at?: string | null
          usage_count?: number
          version?: string
        }
        Relationships: []
      }
      import_forecasts: {
        Row: {
          actual_cost: number | null
          actual_sales: number | null
          actual_volume: number | null
          created_at: string
          forecasted_cost: number | null
          forecasted_volume: number
          id: string
          importer_id: string
          importer_name: string | null
          period: string
          period_month: number | null
          period_quarter: number | null
          period_year: number
          product: string
          sales_variance: number | null
          status: string
          updated_at: string
          variance: number | null
          variance_percentage: number | null
        }
        Insert: {
          actual_cost?: number | null
          actual_sales?: number | null
          actual_volume?: number | null
          created_at?: string
          forecasted_cost?: number | null
          forecasted_volume?: number
          id?: string
          importer_id: string
          importer_name?: string | null
          period: string
          period_month?: number | null
          period_quarter?: number | null
          period_year: number
          product: string
          sales_variance?: number | null
          status?: string
          updated_at?: string
          variance?: number | null
          variance_percentage?: number | null
        }
        Update: {
          actual_cost?: number | null
          actual_sales?: number | null
          actual_volume?: number | null
          created_at?: string
          forecasted_cost?: number | null
          forecasted_volume?: number
          id?: string
          importer_id?: string
          importer_name?: string | null
          period?: string
          period_month?: number | null
          period_quarter?: number | null
          period_year?: number
          product?: string
          sales_variance?: number | null
          status?: string
          updated_at?: string
          variance?: number | null
          variance_percentage?: number | null
        }
        Relationships: []
      }
      incidents: {
        Row: {
          affected_area: string | null
          casualties: number | null
          corrective_action_plan: string | null
          corrective_deadline: string | null
          corrective_status: string | null
          created_at: string
          depot_id: string | null
          description: string
          documents: Json | null
          formal_notice_date: string | null
          formal_notice_deadline: string | null
          formal_notice_issued: boolean | null
          id: string
          immediate_actions: string
          incident_date: string
          incident_type: string
          injuries: number | null
          investigation_date: string | null
          investigation_findings: string | null
          investigator_id: string | null
          investigator_name: string | null
          latitude: number | null
          location_details: string
          longitude: number | null
          photos: Json | null
          pv_date: string | null
          pv_number: string | null
          pv_transmitted_to_minister: boolean | null
          pv_transmitted_to_prosecutor: boolean | null
          reported_by: string | null
          reported_by_name: string | null
          root_cause: string | null
          severity: string
          station_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          affected_area?: string | null
          casualties?: number | null
          corrective_action_plan?: string | null
          corrective_deadline?: string | null
          corrective_status?: string | null
          created_at?: string
          depot_id?: string | null
          description: string
          documents?: Json | null
          formal_notice_date?: string | null
          formal_notice_deadline?: string | null
          formal_notice_issued?: boolean | null
          id?: string
          immediate_actions?: string
          incident_date?: string
          incident_type: string
          injuries?: number | null
          investigation_date?: string | null
          investigation_findings?: string | null
          investigator_id?: string | null
          investigator_name?: string | null
          latitude?: number | null
          location_details?: string
          longitude?: number | null
          photos?: Json | null
          pv_date?: string | null
          pv_number?: string | null
          pv_transmitted_to_minister?: boolean | null
          pv_transmitted_to_prosecutor?: boolean | null
          reported_by?: string | null
          reported_by_name?: string | null
          root_cause?: string | null
          severity?: string
          station_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          affected_area?: string | null
          casualties?: number | null
          corrective_action_plan?: string | null
          corrective_deadline?: string | null
          corrective_status?: string | null
          created_at?: string
          depot_id?: string | null
          description?: string
          documents?: Json | null
          formal_notice_date?: string | null
          formal_notice_deadline?: string | null
          formal_notice_issued?: boolean | null
          id?: string
          immediate_actions?: string
          incident_date?: string
          incident_type?: string
          injuries?: number | null
          investigation_date?: string | null
          investigation_findings?: string | null
          investigator_id?: string | null
          investigator_name?: string | null
          latitude?: number | null
          location_details?: string
          longitude?: number | null
          photos?: Json | null
          pv_date?: string | null
          pv_number?: string | null
          pv_transmitted_to_minister?: boolean | null
          pv_transmitted_to_prosecutor?: boolean | null
          reported_by?: string | null
          reported_by_name?: string | null
          root_cause?: string | null
          severity?: string
          station_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      inspection_documents: {
        Row: {
          created_at: string
          document_id: string | null
          document_name: string
          document_type: string | null
          document_url: string
          file_size: number | null
          id: string
          inspection_id: string
          metadata: Json | null
          updated_at: string
          uploaded_at: string
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          document_id?: string | null
          document_name: string
          document_type?: string | null
          document_url: string
          file_size?: number | null
          id?: string
          inspection_id: string
          metadata?: Json | null
          updated_at?: string
          uploaded_at?: string
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          document_id?: string | null
          document_name?: string
          document_type?: string | null
          document_url?: string
          file_size?: number | null
          id?: string
          inspection_id?: string
          metadata?: Json | null
          updated_at?: string
          uploaded_at?: string
          uploaded_by?: string | null
        }
        Relationships: []
      }
      inspection_pvs: {
        Row: {
          content: string
          created_at: string
          generated_at: string
          generated_by: string | null
          id: string
          inspection_id: string
          metadata: Json | null
          pdf_url: string | null
          pv_number: string
          pv_type: string
          status: string
          title: string | null
          updated_at: string
          version: number
        }
        Insert: {
          content: string
          created_at?: string
          generated_at?: string
          generated_by?: string | null
          id?: string
          inspection_id: string
          metadata?: Json | null
          pdf_url?: string | null
          pv_number: string
          pv_type: string
          status?: string
          title?: string | null
          updated_at?: string
          version?: number
        }
        Update: {
          content?: string
          created_at?: string
          generated_at?: string
          generated_by?: string | null
          id?: string
          inspection_id?: string
          metadata?: Json | null
          pdf_url?: string | null
          pv_number?: string
          pv_type?: string
          status?: string
          title?: string | null
          updated_at?: string
          version?: number
        }
        Relationships: []
      }
      inspector_availability: {
        Row: {
          created_at: string
          date: string
          id: string
          inspector_id: string
          is_available: boolean
          reason: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          inspector_id: string
          is_available?: boolean
          reason?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          inspector_id?: string
          is_available?: boolean
          reason?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inspector_availability_inspector_id_fkey"
            columns: ["inspector_id"]
            isOneToOne: false
            referencedRelation: "inspectors"
            referencedColumns: ["id"]
          },
        ]
      }
      inspectors: {
        Row: {
          certifications: string[]
          created_at: string
          email: string | null
          full_name: string
          id: string
          phone: string | null
          specializations: string[]
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          certifications?: string[]
          created_at?: string
          email?: string | null
          full_name: string
          id?: string
          phone?: string | null
          specializations?: string[]
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          certifications?: string[]
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          phone?: string | null
          specializations?: string[]
          status?: string
          updated_at?: string
          user_id?: string | null
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
      locations: {
        Row: {
          code: string
          created_at: string | null
          economic_importance: string | null
          id: string
          latitude: number | null
          longitude: number | null
          name: string
          name_ar: string | null
          parent_code: string | null
          population: number | null
          type: string
          updated_at: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          economic_importance?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          name: string
          name_ar?: string | null
          parent_code?: string | null
          population?: number | null
          type: string
          updated_at?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          economic_importance?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          name?: string
          name_ar?: string | null
          parent_code?: string | null
          population?: number | null
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_locations_parent_code"
            columns: ["parent_code"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["code"]
          },
        ]
      }
      national_depots: {
        Row: {
          address: string | null
          city: string | null
          code: string
          created_at: string
          id: string
          is_active: boolean
          latitude: number | null
          longitude: number | null
          manager_id: string | null
          name: string
          notes: string | null
          operator: string | null
          total_capacity: number | null
          updated_at: string
          wilaya: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          code: string
          created_at?: string
          id?: string
          is_active?: boolean
          latitude?: number | null
          longitude?: number | null
          manager_id?: string | null
          name: string
          notes?: string | null
          operator?: string | null
          total_capacity?: number | null
          updated_at?: string
          wilaya?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          code?: string
          created_at?: string
          id?: string
          is_active?: boolean
          latitude?: number | null
          longitude?: number | null
          manager_id?: string | null
          name?: string
          notes?: string | null
          operator?: string | null
          total_capacity?: number | null
          updated_at?: string
          wilaya?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          action_url: string | null
          created_at: string
          expires_at: string | null
          id: string
          message: string
          metadata: Json | null
          phase_id: string | null
          priority: string
          project_id: string | null
          read: boolean
          recipient_id: string
          related_id: string | null
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          action_url?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          message: string
          metadata?: Json | null
          phase_id?: string | null
          priority?: string
          project_id?: string | null
          read?: boolean
          recipient_id: string
          related_id?: string | null
          title: string
          type: string
          updated_at?: string
        }
        Update: {
          action_url?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          message?: string
          metadata?: Json | null
          phase_id?: string | null
          priority?: string
          project_id?: string | null
          read?: boolean
          recipient_id?: string
          related_id?: string | null
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      oauth_providers: {
        Row: {
          auth_url: string | null
          client_id: string | null
          client_secret: string | null
          configuration: Json | null
          created_at: string | null
          enabled: boolean | null
          id: string
          provider_name: string
          scopes: string[] | null
          token_url: string | null
          updated_at: string | null
          user_info_url: string | null
        }
        Insert: {
          auth_url?: string | null
          client_id?: string | null
          client_secret?: string | null
          configuration?: Json | null
          created_at?: string | null
          enabled?: boolean | null
          id?: string
          provider_name: string
          scopes?: string[] | null
          token_url?: string | null
          updated_at?: string | null
          user_info_url?: string | null
        }
        Update: {
          auth_url?: string | null
          client_id?: string | null
          client_secret?: string | null
          configuration?: Json | null
          created_at?: string | null
          enabled?: boolean | null
          id?: string
          provider_name?: string
          scopes?: string[] | null
          token_url?: string | null
          updated_at?: string | null
          user_info_url?: string | null
        }
        Relationships: []
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
      payment_control_actions: {
        Row: {
          action_type: string
          assigned_to: string | null
          completed_at: string | null
          created_at: string
          created_by: string | null
          description: string | null
          due_date: string | null
          id: string
          payment_block_id: string
          status: string
          updated_at: string
        }
        Insert: {
          action_type: string
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          payment_block_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          action_type?: string
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          payment_block_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_control_actions_payment_block_id_fkey"
            columns: ["payment_block_id"]
            isOneToOne: false
            referencedRelation: "payment_blocks"
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
        Relationships: []
      }
      phase_materials: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          material_id: string
          phase_id: string
          project_id: string | null
          quantity: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          material_id: string
          phase_id: string
          project_id?: string | null
          quantity?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          material_id?: string
          phase_id?: string
          project_id?: string | null
          quantity?: number
          updated_at?: string
        }
        Relationships: []
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
      price_calculations: {
        Row: {
          calculated_at: string
          calculated_by: string | null
          created_at: string
          destination_code: string
          distance_km: number
          fuel_type_code: string
          id: string
          index_km: number
          label_prod_ar: string | null
          label_prod_fr: string
          label_vill_ar: string | null
          label_vill_fr: string
          origin_code: string
          periode: string
          piste_coefficient: number
          previous_tarif_unit: number | null
          price_variation_pct: number | null
          prix_base: number
          quantity_liters: number
          rec_id: string
          route_type: string
          stock_movement_id: string | null
          tarif_km: number
          tarif_unit: number
          total_value: number
          updated_at: string
          volatility_check: boolean | null
        }
        Insert: {
          calculated_at?: string
          calculated_by?: string | null
          created_at?: string
          destination_code: string
          distance_km: number
          fuel_type_code: string
          id?: string
          index_km: number
          label_prod_ar?: string | null
          label_prod_fr: string
          label_vill_ar?: string | null
          label_vill_fr: string
          origin_code: string
          periode: string
          piste_coefficient?: number
          previous_tarif_unit?: number | null
          price_variation_pct?: number | null
          prix_base: number
          quantity_liters: number
          rec_id: string
          route_type: string
          stock_movement_id?: string | null
          tarif_km: number
          tarif_unit: number
          total_value: number
          updated_at?: string
          volatility_check?: boolean | null
        }
        Update: {
          calculated_at?: string
          calculated_by?: string | null
          created_at?: string
          destination_code?: string
          distance_km?: number
          fuel_type_code?: string
          id?: string
          index_km?: number
          label_prod_ar?: string | null
          label_prod_fr?: string
          label_vill_ar?: string | null
          label_vill_fr?: string
          origin_code?: string
          periode?: string
          piste_coefficient?: number
          previous_tarif_unit?: number | null
          price_variation_pct?: number | null
          prix_base?: number
          quantity_liters?: number
          rec_id?: string
          route_type?: string
          stock_movement_id?: string | null
          tarif_km?: number
          tarif_unit?: number
          total_value?: number
          updated_at?: string
          volatility_check?: boolean | null
        }
        Relationships: []
      }
      price_references: {
        Row: {
          created_at: string
          created_by: string | null
          effective_date: string
          expiry_date: string | null
          fuel_type_code: string
          id: string
          is_active: boolean
          label_prod_ar: string | null
          label_prod_fr: string
          periode: string
          piste_coefficient: number
          prix_base: number
          source_document: string | null
          tarif_km: number
          updated_at: string
          volatility_cap: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          effective_date: string
          expiry_date?: string | null
          fuel_type_code: string
          id?: string
          is_active?: boolean
          label_prod_ar?: string | null
          label_prod_fr: string
          periode: string
          piste_coefficient?: number
          prix_base: number
          source_document?: string | null
          tarif_km?: number
          updated_at?: string
          volatility_cap?: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          effective_date?: string
          expiry_date?: string | null
          fuel_type_code?: string
          id?: string
          is_active?: boolean
          label_prod_ar?: string | null
          label_prod_fr?: string
          periode?: string
          piste_coefficient?: number
          prix_base?: number
          source_document?: string | null
          tarif_km?: number
          updated_at?: string
          volatility_cap?: number
        }
        Relationships: []
      }
      price_revaluation_logs: {
        Row: {
          adjustment_type: string
          applied_at: string | null
          approved_at: string | null
          approved_by: string | null
          created_at: string
          created_by: string | null
          depot_code: string
          fuel_type_code: string
          id: string
          label_vill_ar: string | null
          label_vill_fr: string | null
          new_tarif_unit: number
          new_value: number
          notes: string | null
          old_tarif_unit: number
          old_value: number
          periode: string
          status: string
          stock_id: string | null
          stock_volume: number
          updated_at: string
          variance: number
          variance_pct: number
        }
        Insert: {
          adjustment_type?: string
          applied_at?: string | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          created_by?: string | null
          depot_code: string
          fuel_type_code: string
          id?: string
          label_vill_ar?: string | null
          label_vill_fr?: string | null
          new_tarif_unit: number
          new_value: number
          notes?: string | null
          old_tarif_unit: number
          old_value: number
          periode: string
          status?: string
          stock_id?: string | null
          stock_volume: number
          updated_at?: string
          variance: number
          variance_pct: number
        }
        Update: {
          adjustment_type?: string
          applied_at?: string | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          created_by?: string | null
          depot_code?: string
          fuel_type_code?: string
          id?: string
          label_vill_ar?: string | null
          label_vill_fr?: string | null
          new_tarif_unit?: number
          new_value?: number
          notes?: string | null
          old_tarif_unit?: number
          old_value?: number
          periode?: string
          status?: string
          stock_id?: string | null
          stock_volume?: number
          updated_at?: string
          variance?: number
          variance_pct?: number
        }
        Relationships: [
          {
            foreignKeyName: "price_revaluation_logs_stock_id_fkey"
            columns: ["stock_id"]
            isOneToOne: false
            referencedRelation: "stocks"
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
          auth_provider: string | null
          avatar_url: string | null
          brand_id: string | null
          created_at: string | null
          department: string | null
          depot_id: string | null
          full_name: string | null
          id: string
          is_admin: boolean | null
          last_login_at: string | null
          national_id: string | null
          phone: string | null
          provider_data: Json | null
          provider_id: string | null
          region: string | null
          role: Database["public"]["Enums"]["user_role"] | null
          station_id: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          auth_provider?: string | null
          avatar_url?: string | null
          brand_id?: string | null
          created_at?: string | null
          department?: string | null
          depot_id?: string | null
          full_name?: string | null
          id: string
          is_admin?: boolean | null
          last_login_at?: string | null
          national_id?: string | null
          phone?: string | null
          provider_data?: Json | null
          provider_id?: string | null
          region?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          station_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          auth_provider?: string | null
          avatar_url?: string | null
          brand_id?: string | null
          created_at?: string | null
          department?: string | null
          depot_id?: string | null
          full_name?: string | null
          id?: string
          is_admin?: boolean | null
          last_login_at?: string | null
          national_id?: string | null
          phone?: string | null
          provider_data?: Json | null
          provider_id?: string | null
          region?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          station_id?: string | null
          status?: string | null
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
          {
            foreignKeyName: "profit_distributions_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["user_id"]
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
        Relationships: []
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
        ]
      }
      project_members: {
        Row: {
          access_level: number
          created_at: string
          id: string
          project_id: string
          role: string
          updated_at: string
          user_id: string
        }
        Insert: {
          access_level?: number
          created_at?: string
          id?: string
          project_id: string
          role?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          access_level?: number
          created_at?: string
          id?: string
          project_id?: string
          role?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      project_milestones: {
        Row: {
          completion_date: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          phase_id: string | null
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
          phase_id?: string | null
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
          phase_id?: string | null
          progress_percentage?: number | null
          project_id?: string
          status?: string | null
          target_date?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
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
        Relationships: []
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
            foreignKeyName: "project_risks_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["user_id"]
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
        Relationships: []
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
      station_fuel_availability: {
        Row: {
          created_at: string
          id: string
          last_updated: string
          notes: string | null
          price_reported_at: string | null
          product: string
          queue_status: string
          reported_price: number | null
          station_id: string
          status: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          last_updated?: string
          notes?: string | null
          price_reported_at?: string | null
          product: string
          queue_status?: string
          reported_price?: number | null
          station_id: string
          status?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          last_updated?: string
          notes?: string | null
          price_reported_at?: string | null
          product?: string
          queue_status?: string
          reported_price?: number | null
          station_id?: string
          status?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      station_fuel_availability_history: {
        Row: {
          changed_at: string
          changed_by: string | null
          id: string
          notes: string | null
          previous_queue_status: string | null
          previous_reported_price: number | null
          previous_status: string | null
          product: string
          queue_status: string | null
          reported_price: number | null
          station_id: string
          status: string
        }
        Insert: {
          changed_at?: string
          changed_by?: string | null
          id?: string
          notes?: string | null
          previous_queue_status?: string | null
          previous_reported_price?: number | null
          previous_status?: string | null
          product: string
          queue_status?: string | null
          reported_price?: number | null
          station_id: string
          status: string
        }
        Update: {
          changed_at?: string
          changed_by?: string | null
          id?: string
          notes?: string | null
          previous_queue_status?: string | null
          previous_reported_price?: number | null
          previous_status?: string | null
          product?: string
          queue_status?: string | null
          reported_price?: number | null
          station_id?: string
          status?: string
        }
        Relationships: []
      }
      stock_alerts: {
        Row: {
          acknowledged_at: string | null
          acknowledged_by: string | null
          alert_type: string
          created_at: string
          current_value: number | null
          description: string | null
          id: string
          resolution_notes: string | null
          resolved_at: string | null
          resolved_by: string | null
          severity: string
          status: string
          stock_id: string
          threshold_id: string | null
          threshold_value: number | null
          title: string
          updated_at: string
        }
        Insert: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          alert_type: string
          created_at?: string
          current_value?: number | null
          description?: string | null
          id?: string
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          status?: string
          stock_id: string
          threshold_id?: string | null
          threshold_value?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          alert_type?: string
          created_at?: string
          current_value?: number | null
          description?: string | null
          id?: string
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          status?: string
          stock_id?: string
          threshold_id?: string | null
          threshold_value?: number | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_alerts_stock_id_fkey"
            columns: ["stock_id"]
            isOneToOne: false
            referencedRelation: "stocks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_alerts_threshold_id_fkey"
            columns: ["threshold_id"]
            isOneToOne: false
            referencedRelation: "stock_thresholds"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_thresholds: {
        Row: {
          created_at: string
          created_by: string | null
          depot: string | null
          id: string
          is_active: boolean | null
          notification_enabled: boolean | null
          product: string | null
          stock_id: string | null
          threshold_type: string
          threshold_unit: string
          threshold_value: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          depot?: string | null
          id?: string
          is_active?: boolean | null
          notification_enabled?: boolean | null
          product?: string | null
          stock_id?: string | null
          threshold_type: string
          threshold_unit?: string
          threshold_value: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          depot?: string | null
          id?: string
          is_active?: boolean | null
          notification_enabled?: boolean | null
          product?: string | null
          stock_id?: string | null
          threshold_type?: string
          threshold_unit?: string
          threshold_value?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_thresholds_stock_id_fkey"
            columns: ["stock_id"]
            isOneToOne: false
            referencedRelation: "stocks"
            referencedColumns: ["id"]
          },
        ]
      }
      stocks: {
        Row: {
          brand_id: string | null
          capacity: number
          city_code: string | null
          city_name_ar: string | null
          city_name_fr: string | null
          created_at: string
          current_stock: number
          current_tarif_unit: number | null
          depot: string
          depot_id: string | null
          depot_type: string | null
          exploitation_stock_level: number | null
          fuel_type_code: string | null
          id: string
          last_revaluation_date: string | null
          last_update: string | null
          notes: string | null
          parent_stock_id: string | null
          product: string
          rotation_rate: number | null
          security_stock_level: number | null
          station_id: string | null
          status: string
          stock_category: string | null
          stock_impompable: number | null
          stock_level: Database["public"]["Enums"]["stock_level"]
          stock_outil: number | null
          trend: string | null
          updated_at: string
          wilaya: string | null
          zone: string | null
        }
        Insert: {
          brand_id?: string | null
          capacity: number
          city_code?: string | null
          city_name_ar?: string | null
          city_name_fr?: string | null
          created_at?: string
          current_stock?: number
          current_tarif_unit?: number | null
          depot: string
          depot_id?: string | null
          depot_type?: string | null
          exploitation_stock_level?: number | null
          fuel_type_code?: string | null
          id?: string
          last_revaluation_date?: string | null
          last_update?: string | null
          notes?: string | null
          parent_stock_id?: string | null
          product: string
          rotation_rate?: number | null
          security_stock_level?: number | null
          station_id?: string | null
          status?: string
          stock_category?: string | null
          stock_impompable?: number | null
          stock_level?: Database["public"]["Enums"]["stock_level"]
          stock_outil?: number | null
          trend?: string | null
          updated_at?: string
          wilaya?: string | null
          zone?: string | null
        }
        Update: {
          brand_id?: string | null
          capacity?: number
          city_code?: string | null
          city_name_ar?: string | null
          city_name_fr?: string | null
          created_at?: string
          current_stock?: number
          current_tarif_unit?: number | null
          depot?: string
          depot_id?: string | null
          depot_type?: string | null
          exploitation_stock_level?: number | null
          fuel_type_code?: string | null
          id?: string
          last_revaluation_date?: string | null
          last_update?: string | null
          notes?: string | null
          parent_stock_id?: string | null
          product?: string
          rotation_rate?: number | null
          security_stock_level?: number | null
          station_id?: string | null
          status?: string
          stock_category?: string | null
          stock_impompable?: number | null
          stock_level?: Database["public"]["Enums"]["stock_level"]
          stock_outil?: number | null
          trend?: string | null
          updated_at?: string
          wilaya?: string | null
          zone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stocks_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stocks_depot_id_fkey"
            columns: ["depot_id"]
            isOneToOne: false
            referencedRelation: "national_depots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stocks_parent_stock_id_fkey"
            columns: ["parent_stock_id"]
            isOneToOne: false
            referencedRelation: "stocks"
            referencedColumns: ["id"]
          },
        ]
      }
      submission_access_logs: {
        Row: {
          accessed_at: string
          accessed_by: string | null
          accessed_sections: string[] | null
          action_type: string
          created_at: string
          id: string
          ip_address: string | null
          metadata: Json | null
          submission_id: string
          user_agent: string | null
        }
        Insert: {
          accessed_at?: string
          accessed_by?: string | null
          accessed_sections?: string[] | null
          action_type: string
          created_at?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          submission_id: string
          user_agent?: string | null
        }
        Update: {
          accessed_at?: string
          accessed_by?: string | null
          accessed_sections?: string[] | null
          action_type?: string
          created_at?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          submission_id?: string
          user_agent?: string | null
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
            foreignKeyName: "supply_requests_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["user_id"]
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
          {
            foreignKeyName: "supply_requests_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["user_id"]
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
        Relationships: []
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
        Relationships: []
      }
      tender_estimate_items: {
        Row: {
          bid_ref: string | null
          btp_code: string | null
          category: string | null
          created_at: string
          description: string | null
          employee_qualification_id: string | null
          estimate_id: string
          estimated_hours: number | null
          id: string
          item_code: string | null
          item_type: string | null
          material_id: string | null
          milestone_id: string | null
          phase_id: string | null
          quantity: number
          resource_kind: string | null
          resource_type: string | null
          source: string | null
          source_type: string | null
          specifications: string | null
          submitted_by: string | null
          supplier_contract_ref: string | null
          supplier_id: string | null
          task_id: string | null
          total_price: number
          unit: string | null
          unit_price: number
          updated_at: string
        }
        Insert: {
          bid_ref?: string | null
          btp_code?: string | null
          category?: string | null
          created_at?: string
          description?: string | null
          employee_qualification_id?: string | null
          estimate_id: string
          estimated_hours?: number | null
          id?: string
          item_code?: string | null
          item_type?: string | null
          material_id?: string | null
          milestone_id?: string | null
          phase_id?: string | null
          quantity?: number
          resource_kind?: string | null
          resource_type?: string | null
          source?: string | null
          source_type?: string | null
          specifications?: string | null
          submitted_by?: string | null
          supplier_contract_ref?: string | null
          supplier_id?: string | null
          task_id?: string | null
          total_price?: number
          unit?: string | null
          unit_price?: number
          updated_at?: string
        }
        Update: {
          bid_ref?: string | null
          btp_code?: string | null
          category?: string | null
          created_at?: string
          description?: string | null
          employee_qualification_id?: string | null
          estimate_id?: string
          estimated_hours?: number | null
          id?: string
          item_code?: string | null
          item_type?: string | null
          material_id?: string | null
          milestone_id?: string | null
          phase_id?: string | null
          quantity?: number
          resource_kind?: string | null
          resource_type?: string | null
          source?: string | null
          source_type?: string | null
          specifications?: string | null
          submitted_by?: string | null
          supplier_contract_ref?: string | null
          supplier_id?: string | null
          task_id?: string | null
          total_price?: number
          unit?: string | null
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
      tender_lot_documents: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          file_name: string | null
          file_size: number | null
          file_url: string
          id: string
          lot_id: string | null
          lot_ids: string[]
          mime_type: string | null
          tender_id: string
          title: string
          updated_at: string
          uploaded_by: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          file_name?: string | null
          file_size?: number | null
          file_url: string
          id?: string
          lot_id?: string | null
          lot_ids?: string[]
          mime_type?: string | null
          tender_id: string
          title: string
          updated_at?: string
          uploaded_by?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          file_name?: string | null
          file_size?: number | null
          file_url?: string
          id?: string
          lot_id?: string | null
          lot_ids?: string[]
          mime_type?: string | null
          tender_id?: string
          title?: string
          updated_at?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tender_lot_documents_lot_id_fkey"
            columns: ["lot_id"]
            isOneToOne: false
            referencedRelation: "tender_lots"
            referencedColumns: ["id"]
          },
        ]
      }
      tender_lots: {
        Row: {
          created_at: string
          created_by: string | null
          deliverables: string[]
          description: string | null
          estimated_amount: number | null
          id: string
          linked_phase_ids: string[]
          linked_step_ids: string[]
          number: number
          project_id: string | null
          requirements: string[]
          tender_id: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          deliverables?: string[]
          description?: string | null
          estimated_amount?: number | null
          id?: string
          linked_phase_ids?: string[]
          linked_step_ids?: string[]
          number?: number
          project_id?: string | null
          requirements?: string[]
          tender_id: string
          title?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          deliverables?: string[]
          description?: string | null
          estimated_amount?: number | null
          id?: string
          linked_phase_ids?: string[]
          linked_step_ids?: string[]
          number?: number
          project_id?: string | null
          requirements?: string[]
          tender_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      tender_sharing_access_logs: {
        Row: {
          accessed_at: string | null
          accessed_documents: string[] | null
          action_type: string | null
          id: string
          ip_address: string | null
          metadata: Json | null
          sharing_secret_id: string
          user_agent: string | null
        }
        Insert: {
          accessed_at?: string | null
          accessed_documents?: string[] | null
          action_type?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          sharing_secret_id: string
          user_agent?: string | null
        }
        Update: {
          accessed_at?: string | null
          accessed_documents?: string[] | null
          action_type?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          sharing_secret_id?: string
          user_agent?: string | null
        }
        Relationships: []
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
        Relationships: []
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
        Relationships: []
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
          expired_at: string | null
          expires_at: string | null
          id: string
          role_name: string
          status: string | null
          user_id: string
        }
        Insert: {
          assigned_at?: string | null
          assigned_by?: string | null
          expired_at?: string | null
          expires_at?: string | null
          id?: string
          role_name: string
          status?: string | null
          user_id: string
        }
        Update: {
          assigned_at?: string | null
          assigned_by?: string | null
          expired_at?: string | null
          expires_at?: string | null
          id?: string
          role_name?: string
          status?: string | null
          user_id?: string
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
    }
    Views: {
      authorization_documents: {
        Row: {
          authorization_id: string | null
          created_at: string | null
          document_category:
            | Database["public"]["Enums"]["document_category"]
            | null
          document_name: string | null
          file_path: string | null
          file_size: number | null
          id: string | null
          is_required: boolean | null
          is_validated: boolean | null
          mime_type: string | null
          updated_at: string | null
          uploaded_by: string | null
          validated_at: string | null
          validated_by: string | null
          validation_notes: string | null
        }
        Insert: {
          authorization_id?: string | null
          created_at?: string | null
          document_category?:
            | Database["public"]["Enums"]["document_category"]
            | null
          document_name?: string | null
          file_path?: string | null
          file_size?: number | null
          id?: string | null
          is_required?: boolean | null
          is_validated?: boolean | null
          mime_type?: string | null
          updated_at?: string | null
          uploaded_by?: string | null
          validated_at?: string | null
          validated_by?: string | null
          validation_notes?: string | null
        }
        Update: {
          authorization_id?: string | null
          created_at?: string | null
          document_category?:
            | Database["public"]["Enums"]["document_category"]
            | null
          document_name?: string | null
          file_path?: string | null
          file_size?: number | null
          id?: string | null
          is_required?: boolean | null
          is_validated?: boolean | null
          mime_type?: string | null
          updated_at?: string | null
          uploaded_by?: string | null
          validated_at?: string | null
          validated_by?: string | null
          validation_notes?: string | null
        }
        Relationships: []
      }
      authorization_requests: {
        Row: {
          address: string | null
          applicant_type: Database["public"]["Enums"]["applicant_type"] | null
          approval_date: string | null
          approved_by: string | null
          business_experience_years: number | null
          children_count: number | null
          company_name: string | null
          company_nif: string | null
          created_at: string | null
          description: string | null
          email: string | null
          family_members_count: number | null
          has_other_service_stations: boolean | null
          id: string | null
          individual_first_name: string | null
          individual_last_name: string | null
          latitude: number | null
          longitude: number | null
          map_layers: Json | null
          national_id: string | null
          other_service_stations_details: string | null
          parcel_address: string | null
          parcel_area: number | null
          parcel_length: number | null
          parcel_reference: string | null
          parcel_shape_geom: Json | null
          parcel_width: number | null
          phone_number: string | null
          polygon_coordinates: Json | null
          previous_fuel_business: boolean | null
          previous_fuel_business_details: string | null
          rejection_date: string | null
          rejection_reason: string | null
          report_generated_at: string | null
          report_pdf_url: string | null
          request_number: string | null
          request_type: string | null
          review_start_date: string | null
          reviewed_by: string | null
          signature_data: string | null
          signature_date: string | null
          spouse_name: string | null
          status: Database["public"]["Enums"]["authorization_status"] | null
          submission_date: string | null
          submitted_by: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          applicant_type?: Database["public"]["Enums"]["applicant_type"] | null
          approval_date?: string | null
          approved_by?: string | null
          business_experience_years?: number | null
          children_count?: number | null
          company_name?: string | null
          company_nif?: string | null
          created_at?: string | null
          description?: string | null
          email?: string | null
          family_members_count?: number | null
          has_other_service_stations?: boolean | null
          id?: string | null
          individual_first_name?: string | null
          individual_last_name?: string | null
          latitude?: number | null
          longitude?: number | null
          map_layers?: Json | null
          national_id?: string | null
          other_service_stations_details?: string | null
          parcel_address?: string | null
          parcel_area?: number | null
          parcel_length?: number | null
          parcel_reference?: string | null
          parcel_shape_geom?: Json | null
          parcel_width?: number | null
          phone_number?: string | null
          polygon_coordinates?: Json | null
          previous_fuel_business?: boolean | null
          previous_fuel_business_details?: string | null
          rejection_date?: string | null
          rejection_reason?: string | null
          report_generated_at?: string | null
          report_pdf_url?: string | null
          request_number?: string | null
          request_type?: string | null
          review_start_date?: string | null
          reviewed_by?: string | null
          signature_data?: string | null
          signature_date?: string | null
          spouse_name?: string | null
          status?: Database["public"]["Enums"]["authorization_status"] | null
          submission_date?: string | null
          submitted_by?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          applicant_type?: Database["public"]["Enums"]["applicant_type"] | null
          approval_date?: string | null
          approved_by?: string | null
          business_experience_years?: number | null
          children_count?: number | null
          company_name?: string | null
          company_nif?: string | null
          created_at?: string | null
          description?: string | null
          email?: string | null
          family_members_count?: number | null
          has_other_service_stations?: boolean | null
          id?: string | null
          individual_first_name?: string | null
          individual_last_name?: string | null
          latitude?: number | null
          longitude?: number | null
          map_layers?: Json | null
          national_id?: string | null
          other_service_stations_details?: string | null
          parcel_address?: string | null
          parcel_area?: number | null
          parcel_length?: number | null
          parcel_reference?: string | null
          parcel_shape_geom?: Json | null
          parcel_width?: number | null
          phone_number?: string | null
          polygon_coordinates?: Json | null
          previous_fuel_business?: boolean | null
          previous_fuel_business_details?: string | null
          rejection_date?: string | null
          rejection_reason?: string | null
          report_generated_at?: string | null
          report_pdf_url?: string | null
          request_number?: string | null
          request_type?: string | null
          review_start_date?: string | null
          reviewed_by?: string | null
          signature_data?: string | null
          signature_date?: string | null
          spouse_name?: string | null
          status?: Database["public"]["Enums"]["authorization_status"] | null
          submission_date?: string | null
          submitted_by?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      authorization_reviews: {
        Row: {
          authorization_id: string | null
          comments: string | null
          created_at: string | null
          id: string | null
          recommendations: string | null
          review_type: string | null
          reviewer_id: string | null
          status: string | null
        }
        Insert: {
          authorization_id?: string | null
          comments?: string | null
          created_at?: string | null
          id?: string | null
          recommendations?: string | null
          review_type?: string | null
          reviewer_id?: string | null
          status?: string | null
        }
        Update: {
          authorization_id?: string | null
          comments?: string | null
          created_at?: string | null
          id?: string | null
          recommendations?: string | null
          review_type?: string | null
          reviewer_id?: string | null
          status?: string | null
        }
        Relationships: []
      }
      catch_records: {
        Row: {
          actual_sale_value: number | null
          catch_date: string | null
          created_at: string | null
          estimated_value: number | null
          fish_species: string | null
          fishing_zone: string | null
          id: string | null
          mission_id: string | null
          recorded_by: string | null
          weight_kg: number | null
        }
        Insert: {
          actual_sale_value?: number | null
          catch_date?: string | null
          created_at?: string | null
          estimated_value?: number | null
          fish_species?: string | null
          fishing_zone?: string | null
          id?: string | null
          mission_id?: string | null
          recorded_by?: string | null
          weight_kg?: number | null
        }
        Update: {
          actual_sale_value?: number | null
          catch_date?: string | null
          created_at?: string | null
          estimated_value?: number | null
          fish_species?: string | null
          fishing_zone?: string | null
          id?: string | null
          mission_id?: string | null
          recorded_by?: string | null
          weight_kg?: number | null
        }
        Relationships: []
      }
      claim_medical_acts: {
        Row: {
          claim_id: string | null
          id: string | null
          medical_act_code: string | null
          price_charged: number | null
          quantity: number | null
          remarks: string | null
        }
        Insert: {
          claim_id?: string | null
          id?: string | null
          medical_act_code?: string | null
          price_charged?: number | null
          quantity?: number | null
          remarks?: string | null
        }
        Update: {
          claim_id?: string | null
          id?: string | null
          medical_act_code?: string | null
          price_charged?: number | null
          quantity?: number | null
          remarks?: string | null
        }
        Relationships: []
      }
      compliance_items_with_details: {
        Row: {
          bank_guarantee: Json | null
          bank_guarantee_id: string | null
          category: string | null
          compliance_level: string | null
          created_at: string | null
          created_by: string | null
          deadline: string | null
          description: string | null
          documents: Json | null
          external_references: string[] | null
          id: string | null
          last_reviewed: string | null
          mitigation_plan: string | null
          mitigation_required: boolean | null
          next_review: string | null
          notes: Json | null
          priority: string | null
          project_id: string | null
          responsible: string | null
          risk_level: string | null
          status: string | null
          subcategory: string | null
          title: string | null
          type: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Relationships: []
      }
      consumables_usage: {
        Row: {
          category_id: string | null
          created_at: string | null
          id: string | null
          item_name: string | null
          mission_id: string | null
          quantity_used: number | null
          reason: string | null
          recorded_by: string | null
          usage_date: string | null
        }
        Insert: {
          category_id?: string | null
          created_at?: string | null
          id?: string | null
          item_name?: string | null
          mission_id?: string | null
          quantity_used?: number | null
          reason?: string | null
          recorded_by?: string | null
          usage_date?: string | null
        }
        Update: {
          category_id?: string | null
          created_at?: string | null
          id?: string | null
          item_name?: string | null
          mission_id?: string | null
          quantity_used?: number | null
          reason?: string | null
          recorded_by?: string | null
          usage_date?: string | null
        }
        Relationships: []
      }
      document_validation_logs: {
        Row: {
          created_at: string | null
          document_id: string | null
          errors: Json | null
          id: string | null
          is_valid: boolean | null
          processing_time_ms: number | null
          submission_id: string | null
          validated_at: string | null
          validated_by: string | null
          validation_type: string | null
          warnings: Json | null
        }
        Insert: {
          created_at?: string | null
          document_id?: string | null
          errors?: Json | null
          id?: string | null
          is_valid?: boolean | null
          processing_time_ms?: number | null
          submission_id?: string | null
          validated_at?: string | null
          validated_by?: string | null
          validation_type?: string | null
          warnings?: Json | null
        }
        Update: {
          created_at?: string | null
          document_id?: string | null
          errors?: Json | null
          id?: string | null
          is_valid?: boolean | null
          processing_time_ms?: number | null
          submission_id?: string | null
          validated_at?: string | null
          validated_by?: string | null
          validation_type?: string | null
          warnings?: Json | null
        }
        Relationships: []
      }
      escalation_thresholds: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          escalation_level: number | null
          id: string | null
          is_active: boolean | null
          severity_level: string | null
          threshold_name: string | null
          threshold_type: string | null
          threshold_unit: string | null
          threshold_value: number | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          escalation_level?: number | null
          id?: string | null
          is_active?: boolean | null
          severity_level?: string | null
          threshold_name?: string | null
          threshold_type?: string | null
          threshold_unit?: string | null
          threshold_value?: number | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          escalation_level?: number | null
          id?: string | null
          is_active?: boolean | null
          severity_level?: string | null
          threshold_name?: string | null
          threshold_type?: string | null
          threshold_unit?: string | null
          threshold_value?: number | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      fishing_licenses: {
        Row: {
          authorized_zones: string[] | null
          cost_per_mission: number | null
          created_at: string | null
          id: string | null
          license_number: string | null
          owner_id: string | null
          quota_limit: number | null
          updated_at: string | null
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          authorized_zones?: string[] | null
          cost_per_mission?: number | null
          created_at?: string | null
          id?: string | null
          license_number?: string | null
          owner_id?: string | null
          quota_limit?: number | null
          updated_at?: string | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          authorized_zones?: string[] | null
          cost_per_mission?: number | null
          created_at?: string | null
          id?: string | null
          license_number?: string | null
          owner_id?: string | null
          quota_limit?: number | null
          updated_at?: string | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: []
      }
      fishing_missions: {
        Row: {
          budget: number | null
          captain_id: string | null
          created_at: string | null
          description: string | null
          end_date: string | null
          fishing_zone: string | null
          fuel_consumed: number | null
          id: string | null
          license_id: string | null
          planned_duration: number | null
          progress: number | null
          start_date: string | null
          status: Database["public"]["Enums"]["mission_status"] | null
          title: string | null
          total_catch_value: number | null
          total_catch_weight: number | null
          total_expenses: number | null
          updated_at: string | null
          vessel_id: string | null
        }
        Insert: {
          budget?: number | null
          captain_id?: string | null
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          fishing_zone?: string | null
          fuel_consumed?: number | null
          id?: string | null
          license_id?: string | null
          planned_duration?: number | null
          progress?: number | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["mission_status"] | null
          title?: string | null
          total_catch_value?: number | null
          total_catch_weight?: number | null
          total_expenses?: number | null
          updated_at?: string | null
          vessel_id?: string | null
        }
        Update: {
          budget?: number | null
          captain_id?: string | null
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          fishing_zone?: string | null
          fuel_consumed?: number | null
          id?: string | null
          license_id?: string | null
          planned_duration?: number | null
          progress?: number | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["mission_status"] | null
          title?: string | null
          total_catch_value?: number | null
          total_catch_weight?: number | null
          total_expenses?: number | null
          updated_at?: string | null
          vessel_id?: string | null
        }
        Relationships: []
      }
      health_claims: {
        Row: {
          act_reimbursement_rates: Json | null
          claim_date: string | null
          created_at: string | null
          id: string | null
          insurance_company_id: string | null
          invoice_number: string | null
          patient_id: string | null
          practitioner_name: string | null
          status: string | null
          total_amount: number | null
          updated_at: string | null
          valid_for_reimbursement: boolean | null
        }
        Insert: {
          act_reimbursement_rates?: Json | null
          claim_date?: string | null
          created_at?: string | null
          id?: string | null
          insurance_company_id?: string | null
          invoice_number?: string | null
          patient_id?: string | null
          practitioner_name?: string | null
          status?: string | null
          total_amount?: number | null
          updated_at?: string | null
          valid_for_reimbursement?: boolean | null
        }
        Update: {
          act_reimbursement_rates?: Json | null
          claim_date?: string | null
          created_at?: string | null
          id?: string | null
          insurance_company_id?: string | null
          invoice_number?: string | null
          patient_id?: string | null
          practitioner_name?: string | null
          status?: string | null
          total_amount?: number | null
          updated_at?: string | null
          valid_for_reimbursement?: boolean | null
        }
        Relationships: []
      }
      hse_evaluations: {
        Row: {
          category: string | null
          corrective_actions: string[] | null
          created_at: string | null
          deadline: string | null
          documents: string[] | null
          environment_score: number | null
          evaluation_date: string | null
          evaluator_id: string | null
          evaluator_name: string | null
          findings: string | null
          id: string | null
          inspection_type: string | null
          location_details: string | null
          non_conformities: string[] | null
          observations: string | null
          overall_score: number | null
          photos: string[] | null
          recommendations: string | null
          review_date: string | null
          review_notes: string | null
          reviewed_by: string | null
          risk_level: string | null
          safety_score: number | null
          station_id: string | null
          station_name: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          corrective_actions?: string[] | null
          created_at?: string | null
          deadline?: string | null
          documents?: string[] | null
          environment_score?: number | null
          evaluation_date?: string | null
          evaluator_id?: string | null
          evaluator_name?: string | null
          findings?: string | null
          id?: string | null
          inspection_type?: string | null
          location_details?: string | null
          non_conformities?: string[] | null
          observations?: string | null
          overall_score?: number | null
          photos?: string[] | null
          recommendations?: string | null
          review_date?: string | null
          review_notes?: string | null
          reviewed_by?: string | null
          risk_level?: string | null
          safety_score?: number | null
          station_id?: string | null
          station_name?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          corrective_actions?: string[] | null
          created_at?: string | null
          deadline?: string | null
          documents?: string[] | null
          environment_score?: number | null
          evaluation_date?: string | null
          evaluator_id?: string | null
          evaluator_name?: string | null
          findings?: string | null
          id?: string | null
          inspection_type?: string | null
          location_details?: string | null
          non_conformities?: string[] | null
          observations?: string | null
          overall_score?: number | null
          photos?: string[] | null
          recommendations?: string | null
          review_date?: string | null
          review_notes?: string | null
          reviewed_by?: string | null
          risk_level?: string | null
          safety_score?: number | null
          station_id?: string | null
          station_name?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      lab_test_prescriptions: {
        Row: {
          created_at: string | null
          id: string | null
          medical_act_code: string | null
          prescription_id: string | null
          special_instructions: string | null
          updated_at: string | null
          urgency_level: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string | null
          medical_act_code?: string | null
          prescription_id?: string | null
          special_instructions?: string | null
          updated_at?: string | null
          urgency_level?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string | null
          medical_act_code?: string | null
          prescription_id?: string | null
          special_instructions?: string | null
          updated_at?: string | null
          urgency_level?: string | null
        }
        Relationships: []
      }
      medical_acts: {
        Row: {
          code: string | null
          created_at: string | null
          default_price: number | null
          label: string | null
          type_label: string | null
          updated_at: string | null
        }
        Insert: {
          code?: string | null
          created_at?: string | null
          default_price?: number | null
          label?: string | null
          type_label?: string | null
          updated_at?: string | null
        }
        Update: {
          code?: string | null
          created_at?: string | null
          default_price?: number | null
          label?: string | null
          type_label?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      medical_device_prescriptions: {
        Row: {
          created_at: string | null
          id: string | null
          medical_act_code: string | null
          prescription_id: string | null
          quantity: number | null
          remarks: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string | null
          medical_act_code?: string | null
          prescription_id?: string | null
          quantity?: number | null
          remarks?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string | null
          medical_act_code?: string | null
          prescription_id?: string | null
          quantity?: number | null
          remarks?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      mission_crew: {
        Row: {
          created_at: string | null
          crew_member_id: string | null
          daily_rate: number | null
          days_worked: number | null
          id: string | null
          mission_id: string | null
          profit_share_percentage: number | null
          role: string | null
        }
        Insert: {
          created_at?: string | null
          crew_member_id?: string | null
          daily_rate?: number | null
          days_worked?: number | null
          id?: string | null
          mission_id?: string | null
          profit_share_percentage?: number | null
          role?: string | null
        }
        Update: {
          created_at?: string | null
          crew_member_id?: string | null
          daily_rate?: number | null
          days_worked?: number | null
          id?: string | null
          mission_id?: string | null
          profit_share_percentage?: number | null
          role?: string | null
        }
        Relationships: []
      }
      mission_expenses: {
        Row: {
          amount: number | null
          category: string | null
          created_at: string | null
          description: string | null
          expense_date: string | null
          id: string | null
          mission_id: string | null
          receipt_url: string | null
          recorded_by: string | null
        }
        Insert: {
          amount?: number | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          expense_date?: string | null
          id?: string | null
          mission_id?: string | null
          receipt_url?: string | null
          recorded_by?: string | null
        }
        Update: {
          amount?: number | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          expense_date?: string | null
          id?: string | null
          mission_id?: string | null
          receipt_url?: string | null
          recorded_by?: string | null
        }
        Relationships: []
      }
      mission_investments: {
        Row: {
          created_at: string | null
          id: string | null
          investment_amount: number | null
          investor_id: string | null
          mission_id: string | null
          profit_share_percentage: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string | null
          investment_amount?: number | null
          investor_id?: string | null
          mission_id?: string | null
          profit_share_percentage?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string | null
          investment_amount?: number | null
          investor_id?: string | null
          mission_id?: string | null
          profit_share_percentage?: number | null
        }
        Relationships: []
      }
      monitoring_alerts: {
        Row: {
          alert_type: string | null
          assigned_to: string | null
          created_at: string | null
          description: string | null
          id: string | null
          metadata: Json | null
          priority: string | null
          resolution_notes: string | null
          resolved_at: string | null
          resolved_by: string | null
          station_id: string | null
          status: string | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          alert_type?: string | null
          assigned_to?: string | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          metadata?: Json | null
          priority?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          station_id?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          alert_type?: string | null
          assigned_to?: string | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          metadata?: Json | null
          priority?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          station_id?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      patients: {
        Row: {
          address: string | null
          allergies_notes: string | null
          blood_type: string | null
          created_at: string | null
          date_of_birth: string | null
          gender: string | null
          id: string | null
          insurance_number: string | null
          medical_history_notes: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          allergies_notes?: string | null
          blood_type?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          gender?: string | null
          id?: string | null
          insurance_number?: string | null
          medical_history_notes?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          allergies_notes?: string | null
          blood_type?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          gender?: string | null
          id?: string | null
          insurance_number?: string | null
          medical_history_notes?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      prescriptions: {
        Row: {
          created_at: string | null
          id: string | null
          medical_act_id: string | null
          patient_id: string | null
          practitioner_id: string | null
          prescription_date: string | null
          remarks: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string | null
          medical_act_id?: string | null
          patient_id?: string | null
          practitioner_id?: string | null
          prescription_date?: string | null
          remarks?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string | null
          medical_act_id?: string | null
          patient_id?: string | null
          practitioner_id?: string | null
          prescription_date?: string | null
          remarks?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      service_stations: {
        Row: {
          address: string | null
          authorization_id: string | null
          capacity_essence: number | null
          capacity_gasoil: number | null
          capacity_gpl: number | null
          capacity_sp98: number | null
          closing_hours: string | null
          company_nif: string | null
          created_at: string | null
          employees_count: number | null
          essence_price: string | null
          fuel_types: string[] | null
          gasoil_price: string | null
          has_car_wash: boolean | null
          has_convenience_store: boolean | null
          has_restaurant: boolean | null
          has_tire_service: boolean | null
          id: string | null
          last_inspection_date: string | null
          latitude: number | null
          longitude: number | null
          manager_name: string | null
          manager_phone: string | null
          notes: string | null
          number_of_pumps: number | null
          opening_date: string | null
          opening_hours: string | null
          owner_email: string | null
          owner_id: string | null
          owner_name: string | null
          owner_national_id: string | null
          owner_phone: string | null
          owner_type: string | null
          parcel_area: number | null
          parcel_reference: string | null
          sp98_price: string | null
          station_code: string | null
          station_name: string | null
          status: string | null
          territory_id: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          authorization_id?: string | null
          capacity_essence?: number | null
          capacity_gasoil?: number | null
          capacity_gpl?: number | null
          capacity_sp98?: number | null
          closing_hours?: string | null
          company_nif?: string | null
          created_at?: string | null
          employees_count?: number | null
          essence_price?: string | null
          fuel_types?: string[] | null
          gasoil_price?: string | null
          has_car_wash?: boolean | null
          has_convenience_store?: boolean | null
          has_restaurant?: boolean | null
          has_tire_service?: boolean | null
          id?: string | null
          last_inspection_date?: string | null
          latitude?: number | null
          longitude?: number | null
          manager_name?: string | null
          manager_phone?: string | null
          notes?: string | null
          number_of_pumps?: number | null
          opening_date?: string | null
          opening_hours?: string | null
          owner_email?: string | null
          owner_id?: string | null
          owner_name?: string | null
          owner_national_id?: string | null
          owner_phone?: string | null
          owner_type?: string | null
          parcel_area?: number | null
          parcel_reference?: string | null
          sp98_price?: string | null
          station_code?: string | null
          station_name?: string | null
          status?: string | null
          territory_id?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          authorization_id?: string | null
          capacity_essence?: number | null
          capacity_gasoil?: number | null
          capacity_gpl?: number | null
          capacity_sp98?: number | null
          closing_hours?: string | null
          company_nif?: string | null
          created_at?: string | null
          employees_count?: number | null
          essence_price?: string | null
          fuel_types?: string[] | null
          gasoil_price?: string | null
          has_car_wash?: boolean | null
          has_convenience_store?: boolean | null
          has_restaurant?: boolean | null
          has_tire_service?: boolean | null
          id?: string | null
          last_inspection_date?: string | null
          latitude?: number | null
          longitude?: number | null
          manager_name?: string | null
          manager_phone?: string | null
          notes?: string | null
          number_of_pumps?: number | null
          opening_date?: string | null
          opening_hours?: string | null
          owner_email?: string | null
          owner_id?: string | null
          owner_name?: string | null
          owner_national_id?: string | null
          owner_phone?: string | null
          owner_type?: string | null
          parcel_area?: number | null
          parcel_reference?: string | null
          sp98_price?: string | null
          station_code?: string | null
          station_name?: string | null
          status?: string | null
          territory_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      supply_categories: {
        Row: {
          description: string | null
          id: string | null
          name: string | null
          unit: string | null
        }
        Insert: {
          description?: string | null
          id?: string | null
          name?: string | null
          unit?: string | null
        }
        Update: {
          description?: string | null
          id?: string | null
          name?: string | null
          unit?: string | null
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          full_name: string | null
          role: string | null
          user_id: string | null
        }
        Insert: {
          full_name?: string | null
          role?: never
          user_id?: string | null
        }
        Update: {
          full_name?: string | null
          role?: never
          user_id?: string | null
        }
        Relationships: []
      }
      vessels: {
        Row: {
          capacity: number | null
          coordinates_latitude: number | null
          coordinates_longitude: number | null
          created_at: string | null
          daily_cost: number | null
          equipment: Json | null
          fuel_capacity: number | null
          id: string | null
          insurance_expires_at: string | null
          name: string | null
          registration_number: string | null
          status: Database["public"]["Enums"]["vessel_status"] | null
          updated_at: string | null
        }
        Insert: {
          capacity?: number | null
          coordinates_latitude?: number | null
          coordinates_longitude?: number | null
          created_at?: string | null
          daily_cost?: number | null
          equipment?: Json | null
          fuel_capacity?: number | null
          id?: string | null
          insurance_expires_at?: string | null
          name?: string | null
          registration_number?: string | null
          status?: Database["public"]["Enums"]["vessel_status"] | null
          updated_at?: string | null
        }
        Update: {
          capacity?: number | null
          coordinates_latitude?: number | null
          coordinates_longitude?: number | null
          created_at?: string | null
          daily_cost?: number | null
          equipment?: Json | null
          fuel_capacity?: number | null
          id?: string | null
          insurance_expires_at?: string | null
          name?: string | null
          registration_number?: string | null
          status?: Database["public"]["Enums"]["vessel_status"] | null
          updated_at?: string | null
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
      can_approve_authorizations: {
        Args: { _user_id: string }
        Returns: boolean
      }
      can_create_notification_for_user: {
        Args: { target_recipient_id: string }
        Returns: boolean
      }
      can_inspect: { Args: { _user_id: string }; Returns: boolean }
      can_view_national_data: { Args: { _user_id: string }; Returns: boolean }
      can_view_stock: {
        Args: { _stock_id: string; _user_id: string }
        Returns: boolean
      }
      cleanup_expired_user_roles: { Args: never; Returns: number }
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
        Returns: unknown
        SetofOptions: {
          from: "*"
          to: "progress_invoices"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      create_station_from_authorization: {
        Args: { auth_id: string; territory_id_param?: string }
        Returns: string
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
      generate_movement_rec_id: { Args: never; Returns: string }
      generate_request_number: { Args: never; Returns: string }
      generate_station_code: { Args: never; Returns: string }
      generate_submission_secret_code: { Args: never; Returns: string }
      generate_supplier_reset_token: {
        Args: { supplier_email: string }
        Returns: string
      }
      generate_tender_secret_code: { Args: never; Returns: string }
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
      get_highest_role: { Args: { p_user_id: string }; Returns: string }
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
      get_submission_activity_logs: {
        Args: { p_submission_id: string }
        Returns: {
          action: string
          created_at: string
          details: string
          id: string
          performed_by: string
          submission_id: string
        }[]
      }
      get_user_role: { Args: { p_user_id: string }; Returns: string }
      get_user_roles: {
        Args: { target_user_id: string }
        Returns: {
          role_name: string
        }[]
      }
      get_validation_logs: {
        Args: { p_submission_id: string }
        Returns: {
          created_at: string
          document_id: string
          errors: Json
          id: string
          is_valid: boolean
          submission_id: string
          validated_at: string
          warnings: Json
        }[]
      }
      has_any_role: {
        Args: { _roles: string[]; _user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: { role_name: string; user_id: string }
        Returns: boolean
      }
      increment_template_usage: {
        Args: { template_id: string }
        Returns: undefined
      }
      infra_asset_delete: {
        Args: { p_asset_id: string; p_project_id: string }
        Returns: undefined
      }
      infra_asset_list: {
        Args: { p_project_id: string }
        Returns: {
          asset_type: string
          geojson: Json
          id: string
          name: string
          project_id: string
          properties: Json
          status: string
        }[]
      }
      infra_asset_save: {
        Args: {
          p_asset_id?: string
          p_asset_type: string
          p_geojson: Json
          p_name: string
          p_project_id: string
          p_status?: string
        }
        Returns: string
      }
      infra_realization_save: {
        Args: {
          p_asset_id: string
          p_completed_on?: string
          p_inspection_id?: string
          p_phase_id?: string
          p_project_id: string
          p_realization: string
        }
        Returns: string
      }
      infra_zone_analysis: {
        Args: { p_buffer_meters?: number; p_project_id: string; p_zone: Json }
        Returns: Json
      }
      is_brand_manager_of_station: {
        Args: { _station_id: string; _user_id: string }
        Returns: boolean
      }
      is_brand_manager_of_stock: {
        Args: { _stock_id: string; _user_id: string }
        Returns: boolean
      }
      is_current_user_admin: { Args: never; Returns: boolean }
      is_current_user_director: { Args: never; Returns: boolean }
      is_depot_manager_of: {
        Args: { _depot_id: string; _user_id: string }
        Returns: boolean
      }
      is_station_owner: {
        Args: { _station_id: string; _user_id: string }
        Returns: boolean
      }
      is_stock_owner: {
        Args: { _stock_id: string; _user_id: string }
        Returns: boolean
      }
      is_user_admin: { Args: { p_user_id: string }; Returns: boolean }
      normalize_intervention_zones: { Args: { input: Json }; Returns: Json }
      project_workbench_access: {
        Args: { p_project_id: string; p_write?: boolean }
        Returns: boolean
      }
      project_workbench_projects: {
        Args: never
        Returns: {
          can_manage: boolean
          id: string
          reference: string
          title: string
        }[]
      }
      search_projects_autocomplete: {
        Args: { search_term?: string }
        Returns: {
          id: string
          project_reference: string
          title: string
        }[]
      }
      validate_submission_secret: {
        Args: { secret_code_param: string }
        Returns: {
          is_valid: boolean
          message: string
          submission_id: string
          supplier_name: string
          tender_id: string
        }[]
      }
      validate_tender_secret: {
        Args: { secret_code_param: string }
        Returns: {
          allowed_documents: string[]
          is_valid: boolean
          message: string
          tender_id: string
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
      inspection_status:
        | "approved"
        | "requires_changes"
        | "rejected"
        | "pending"
      mission_status: "planned" | "in_progress" | "completed" | "cancelled"
      movement_validation_status:
        | "pending"
        | "validated"
        | "rejected"
        | "in_transit"
      notification_type:
        | "task_assignment"
        | "project_update"
        | "inspection_required"
        | "payment_due"
        | "document_review"
        | "system"
      project_status:
        | "en cours"
        | "terminé"
        | "en attente"
        | "en inspection"
        | "suspendu"
        | "annulé"
      stock_level: "national" | "brand" | "station"
      supply_request_status: "pending" | "approved" | "rejected" | "completed"
      task_priority: "low" | "medium" | "high" | "urgent"
      task_status: "pending" | "in_progress" | "completed" | "cancelled"
      task_type:
        | "project"
        | "inspection"
        | "document"
        | "payment"
        | "material"
        | "general"
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
      workflow_step_status:
        | "pending"
        | "in_progress"
        | "completed"
        | "approved"
        | "rejected"
        | "on_hold"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      inspection_status: [
        "approved",
        "requires_changes",
        "rejected",
        "pending",
      ],
      mission_status: ["planned", "in_progress", "completed", "cancelled"],
      movement_validation_status: [
        "pending",
        "validated",
        "rejected",
        "in_transit",
      ],
      notification_type: [
        "task_assignment",
        "project_update",
        "inspection_required",
        "payment_due",
        "document_review",
        "system",
      ],
      project_status: [
        "en cours",
        "terminé",
        "en attente",
        "en inspection",
        "suspendu",
        "annulé",
      ],
      stock_level: ["national", "brand", "station"],
      supply_request_status: ["pending", "approved", "rejected", "completed"],
      task_priority: ["low", "medium", "high", "urgent"],
      task_status: ["pending", "in_progress", "completed", "cancelled"],
      task_type: [
        "project",
        "inspection",
        "document",
        "payment",
        "material",
        "general",
      ],
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
      workflow_step_status: [
        "pending",
        "in_progress",
        "completed",
        "approved",
        "rejected",
        "on_hold",
      ],
    },
  },
} as const
