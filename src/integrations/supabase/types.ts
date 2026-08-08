// types.ts
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// Configuration du schéma
export const DB_CONFIG = {
  schemas: {
    btp: {
      tables: [
        'projects',
        'tenders',
        'tender_lots',
        'tender_submissions',
        'task_assignments',
        'project_phases',
        'project_risks',
        'project_milestones',
        'project_resources',
        'project_comments',
        'project_alerts',
        'project_members',
        'payment_blocks',
        'payment_control_actions',
        'inspections',
        'inspection_pvs',
        'inspection_documents',
        'progress_invoices',
        'payments',
        'materials',
        'material_documents',
        'material_suppliers',
        'suppliers',
        'supplier_payments',
        'supplier_inspections',
        'documents',
        'organizations',
        'employees',
        'brands',
        'brand_managers',
        'stocks',
        'stock_movements',
        'stock_alerts',
        'stock_thresholds',
        'price_references',
        'price_calculations',
        'price_revaluation_logs',
        'deliveries',
        'national_depots',
        'distance_matrix',
        'locations',
        'territories'
      ]
    }
  },
  defaultSchema: 'btp'
} as const;

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  btp: {
    Tables: {
      projects: {
        Row: {
          id: string
          title: string
          description: string | null
          project_reference: string | null
          status: string | null
          priority: string | null
          progress: number | null
          budget: number | null
          start_date: string | null
          end_date: string | null
          completion_date: string | null
          created_at: string | null
          updated_at: string | null
          created_by: string | null
          location: string | null
          latitude: number | null
          longitude: number | null
          project_type: string | null
          sector: string | null
          funding_source: string | null
          donor_organization: string | null
          main_contractor: string | null
          supervisor_id: string | null
          project_responsable_id: string | null
          workspace_id: string | null
          thumbnail: string | null
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          project_reference?: string | null
          status?: string | null
          priority?: string | null
          progress?: number | null
          budget?: number | null
          start_date?: string | null
          end_date?: string | null
          completion_date?: string | null
          created_at?: string | null
          updated_at?: string | null
          created_by?: string | null
          location?: string | null
          latitude?: number | null
          longitude?: number | null
          project_type?: string | null
          sector?: string | null
          funding_source?: string | null
          donor_organization?: string | null
          main_contractor?: string | null
          supervisor_id?: string | null
          project_responsable_id?: string | null
          workspace_id?: string | null
          thumbnail?: string | null
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          project_reference?: string | null
          status?: string | null
          priority?: string | null
          progress?: number | null
          budget?: number | null
          start_date?: string | null
          end_date?: string | null
          completion_date?: string | null
          created_at?: string | null
          updated_at?: string | null
          created_by?: string | null
          location?: string | null
          latitude?: number | null
          longitude?: number | null
          project_type?: string | null
          sector?: string | null
          funding_source?: string | null
          donor_organization?: string | null
          main_contractor?: string | null
          supervisor_id?: string | null
          project_responsable_id?: string | null
          workspace_id?: string | null
          thumbnail?: string | null
        }
        Relationships: []
      }
      tenders: {
        Row: {
          id: string
          tender_number: string | null
          title: string
          description: string | null
          project_id: string | null
          project_reference: string | null
          status: string | null
          procurement_type: string | null
          market_type: string | null
          tender_category: string | null
          selection_mode: string | null
          budget_min: number | null
          budget_max: number | null
          estimated_value: number | null
          launch_date: string | null
          publication_date: string | null
          submission_deadline: string | null
          deadline_date: string | null
          evaluation_deadline: string | null
          attribution_date: string | null
          contract_duration: number | null
          financing_source: string | null
          award_criteria: string | null
          eligibility_requirements: Json | null
          evaluation_criteria: Json | null
          current_phase: number | null
          current_stage: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          tender_number?: string | null
          title: string
          description?: string | null
          project_id?: string | null
          project_reference?: string | null
          status?: string | null
          procurement_type?: string | null
          market_type?: string | null
          tender_category?: string | null
          selection_mode?: string | null
          budget_min?: number | null
          budget_max?: number | null
          estimated_value?: number | null
          launch_date?: string | null
          publication_date?: string | null
          submission_deadline?: string | null
          deadline_date?: string | null
          evaluation_deadline?: string | null
          attribution_date?: string | null
          contract_duration?: number | null
          financing_source?: string | null
          award_criteria?: string | null
          eligibility_requirements?: Json | null
          evaluation_criteria?: Json | null
          current_phase?: number | null
          current_stage?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          tender_number?: string | null
          title?: string
          description?: string | null
          project_id?: string | null
          project_reference?: string | null
          status?: string | null
          procurement_type?: string | null
          market_type?: string | null
          tender_category?: string | null
          selection_mode?: string | null
          budget_min?: number | null
          budget_max?: number | null
          estimated_value?: number | null
          launch_date?: string | null
          publication_date?: string | null
          submission_deadline?: string | null
          deadline_date?: string | null
          evaluation_deadline?: string | null
          attribution_date?: string | null
          contract_duration?: number | null
          financing_source?: string | null
          award_criteria?: string | null
          eligibility_requirements?: Json | null
          evaluation_criteria?: Json | null
          current_phase?: number | null
          current_stage?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      tender_lots: {
        Row: {
          id: string
          tender_id: string
          number: number
          title: string
          description: string | null
          estimated_amount: number | null
          deliverables: string[]
          requirements: string[]
          linked_phase_ids: string[]
          linked_step_ids: string[]
          project_id: string | null
          created_at: string | null
          updated_at: string | null
          created_by: string | null
        }
        Insert: {
          id?: string
          tender_id: string
          number?: number
          title?: string
          description?: string | null
          estimated_amount?: number | null
          deliverables?: string[]
          requirements?: string[]
          linked_phase_ids?: string[]
          linked_step_ids?: string[]
          project_id?: string | null
          created_at?: string | null
          updated_at?: string | null
          created_by?: string | null
        }
        Update: {
          id?: string
          tender_id?: string
          number?: number
          title?: string
          description?: string | null
          estimated_amount?: number | null
          deliverables?: string[]
          requirements?: string[]
          linked_phase_ids?: string[]
          linked_step_ids?: string[]
          project_id?: string | null
          created_at?: string | null
          updated_at?: string | null
          created_by?: string | null
        }
        Relationships: []
      }
      tender_submissions: {
        Row: {
          id: string
          tender_id: string | null
          supplier_name: string | null
          supplier_email: string | null
          user_id: string | null
          status: string | null
          submission_date: string | null
          technical_score: number | null
          financial_score: number | null
          administrative_score: number | null
          total_score: number | null
          evaluator_notes: string | null
          reviewer_id: string | null
          reviewed_at: string | null
          evaluation_phase: string | null
          evaluation_stage: string | null
          secret_code: string | null
          secret_created_at: string | null
          secret_expires_at: string | null
          secret_access_count: number | null
          is_secret_active: boolean | null
          max_secret_access: number | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          tender_id?: string | null
          supplier_name?: string | null
          supplier_email?: string | null
          user_id?: string | null
          status?: string | null
          submission_date?: string | null
          technical_score?: number | null
          financial_score?: number | null
          administrative_score?: number | null
          total_score?: number | null
          evaluator_notes?: string | null
          reviewer_id?: string | null
          reviewed_at?: string | null
          evaluation_phase?: string | null
          evaluation_stage?: string | null
          secret_code?: string | null
          secret_created_at?: string | null
          secret_expires_at?: string | null
          secret_access_count?: number | null
          is_secret_active?: boolean | null
          max_secret_access?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          tender_id?: string | null
          supplier_name?: string | null
          supplier_email?: string | null
          user_id?: string | null
          status?: string | null
          submission_date?: string | null
          technical_score?: number | null
          financial_score?: number | null
          administrative_score?: number | null
          total_score?: number | null
          evaluator_notes?: string | null
          reviewer_id?: string | null
          reviewed_at?: string | null
          evaluation_phase?: string | null
          evaluation_stage?: string | null
          secret_code?: string | null
          secret_created_at?: string | null
          secret_expires_at?: string | null
          secret_access_count?: number | null
          is_secret_active?: boolean | null
          max_secret_access?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      task_assignments: {
        Row: {
          id: string
          title: string
          description: string | null
          project_id: string | null
          phase_id: string | null
          assigned_to: string | null
          assigned_by: string | null
          assignee_name: string | null
          assignee_email: string | null
          assignee_type: string | null
          status: string | null
          priority: string | null
          progress: number | null
          start_date: string | null
          end_date: string | null
          due_date: string | null
          completion_date: string | null
          estimated_duration: number | null
          actual_duration: number | null
          optimistic_estimate: number | null
          pessimistic_estimate: number | null
          most_likely_estimate: number | null
          cost_estimate: number | null
          actual_cost: number | null
          critical_path: boolean | null
          weight: number | null
          notes: string | null
          completion_token: string | null
          completion_url: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          project_id?: string | null
          phase_id?: string | null
          assigned_to?: string | null
          assigned_by?: string | null
          assignee_name?: string | null
          assignee_email?: string | null
          assignee_type?: string | null
          status?: string | null
          priority?: string | null
          progress?: number | null
          start_date?: string | null
          end_date?: string | null
          due_date?: string | null
          completion_date?: string | null
          estimated_duration?: number | null
          actual_duration?: number | null
          optimistic_estimate?: number | null
          pessimistic_estimate?: number | null
          most_likely_estimate?: number | null
          cost_estimate?: number | null
          actual_cost?: number | null
          critical_path?: boolean | null
          weight?: number | null
          notes?: string | null
          completion_token?: string | null
          completion_url?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          project_id?: string | null
          phase_id?: string | null
          assigned_to?: string | null
          assigned_by?: string | null
          assignee_name?: string | null
          assignee_email?: string | null
          assignee_type?: string | null
          status?: string | null
          priority?: string | null
          progress?: number | null
          start_date?: string | null
          end_date?: string | null
          due_date?: string | null
          completion_date?: string | null
          estimated_duration?: number | null
          actual_duration?: number | null
          optimistic_estimate?: number | null
          pessimistic_estimate?: number | null
          most_likely_estimate?: number | null
          cost_estimate?: number | null
          actual_cost?: number | null
          critical_path?: boolean | null
          weight?: number | null
          notes?: string | null
          completion_token?: string | null
          completion_url?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      project_phases: {
        Row: {
          id: string
          project_id: string | null
          phase_name: string
          phase_type: string | null
          description: string | null
          status: string | null
          progress: number | null
          start_date: string | null
          end_date: string | null
          estimated_duration: number | null
          actual_duration: number | null
          estimated_cost: number | null
          actual_cost: number | null
          weight: number | null
          order_index: number | null
          construction_phase: string | null
          construction_stage: string | null
          location: string | null
          notes: string | null
          dependencies: Json | null
          materials: Json | null
          human_resources: Json | null
          suppliers: Json | null
          milestones: Json | null
          custom_phase_data: Json | null
          created_at: string | null
          updated_at: string | null
          created_by: string | null
        }
        Insert: {
          id?: string
          project_id?: string | null
          phase_name: string
          phase_type?: string | null
          description?: string | null
          status?: string | null
          progress?: number | null
          start_date?: string | null
          end_date?: string | null
          estimated_duration?: number | null
          actual_duration?: number | null
          estimated_cost?: number | null
          actual_cost?: number | null
          weight?: number | null
          order_index?: number | null
          construction_phase?: string | null
          construction_stage?: string | null
          location?: string | null
          notes?: string | null
          dependencies?: Json | null
          materials?: Json | null
          human_resources?: Json | null
          suppliers?: Json | null
          milestones?: Json | null
          custom_phase_data?: Json | null
          created_at?: string | null
          updated_at?: string | null
          created_by?: string | null
        }
        Update: {
          id?: string
          project_id?: string | null
          phase_name?: string
          phase_type?: string | null
          description?: string | null
          status?: string | null
          progress?: number | null
          start_date?: string | null
          end_date?: string | null
          estimated_duration?: number | null
          actual_duration?: number | null
          estimated_cost?: number | null
          actual_cost?: number | null
          weight?: number | null
          order_index?: number | null
          construction_phase?: string | null
          construction_stage?: string | null
          location?: string | null
          notes?: string | null
          dependencies?: Json | null
          materials?: Json | null
          human_resources?: Json | null
          suppliers?: Json | null
          milestones?: Json | null
          custom_phase_data?: Json | null
          created_at?: string | null
          updated_at?: string | null
          created_by?: string | null
        }
        Relationships: []
      }
      project_risks: {
        Row: {
          id: string
          project_id: string
          risk_title: string
          risk_description: string | null
          risk_level: string | null
          status: string | null
          status_new: string | null
          probability: string | null
          probability_numeric: number | null
          impact: string | null
          impact_numeric: number | null
          risk_score: number | null
          mitigation_plan: string | null
          mitigation_strategy: string | null
          owner_id: string | null
          identified_by: string | null
          identified_date: string | null
          due_date: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          project_id: string
          risk_title: string
          risk_description?: string | null
          risk_level?: string | null
          status?: string | null
          status_new?: string | null
          probability?: string | null
          probability_numeric?: number | null
          impact?: string | null
          impact_numeric?: number | null
          risk_score?: number | null
          mitigation_plan?: string | null
          mitigation_strategy?: string | null
          owner_id?: string | null
          identified_by?: string | null
          identified_date?: string | null
          due_date?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          project_id?: string
          risk_title?: string
          risk_description?: string | null
          risk_level?: string | null
          status?: string | null
          status_new?: string | null
          probability?: string | null
          probability_numeric?: number | null
          impact?: string | null
          impact_numeric?: number | null
          risk_score?: number | null
          mitigation_plan?: string | null
          mitigation_strategy?: string | null
          owner_id?: string | null
          identified_by?: string | null
          identified_date?: string | null
          due_date?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      project_milestones: {
        Row: {
          id: string
          project_id: string
          title: string
          description: string | null
          status: string | null
          progress_percentage: number | null
          target_date: string | null
          completion_date: string | null
          created_at: string | null
          updated_at: string | null
          created_by: string | null
        }
        Insert: {
          id?: string
          project_id: string
          title: string
          description?: string | null
          status?: string | null
          progress_percentage?: number | null
          target_date?: string | null
          completion_date?: string | null
          created_at?: string | null
          updated_at?: string | null
          created_by?: string | null
        }
        Update: {
          id?: string
          project_id?: string
          title?: string
          description?: string | null
          status?: string | null
          progress_percentage?: number | null
          target_date?: string | null
          completion_date?: string | null
          created_at?: string | null
          updated_at?: string | null
          created_by?: string | null
        }
        Relationships: []
      }
      project_resources: {
        Row: {
          id: string
          project_id: string
          name: string
          type: string
          quantity: number | null
          unit: string | null
          cost_per_unit: number | null
          total_cost: number | null
          allocation_date: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          name: string
          type: string
          quantity?: number | null
          unit?: string | null
          cost_per_unit?: number | null
          total_cost?: number | null
          allocation_date?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          name?: string
          type?: string
          quantity?: number | null
          unit?: string | null
          cost_per_unit?: number | null
          total_cost?: number | null
          allocation_date?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      project_comments: {
        Row: {
          id: string
          project_id: string
          user_id: string
          comment: string
          parent_comment_id: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          project_id: string
          user_id: string
          comment: string
          parent_comment_id?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          project_id?: string
          user_id?: string
          comment?: string
          parent_comment_id?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      project_alerts: {
        Row: {
          id: string
          project_id: string
          title: string
          description: string | null
          type: string
          severity: string
          source: string | null
          status: string
          escalation_level: number | null
          assigned_actions: string[] | null
          action_proofs: Json | null
          metadata: Json | null
          acknowledged: boolean | null
          acknowledged_at: string | null
          acknowledged_by: string | null
          resolved: boolean | null
          resolved_at: string | null
          resolved_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          title: string
          description?: string | null
          type: string
          severity: string
          source?: string | null
          status?: string
          escalation_level?: number | null
          assigned_actions?: string[] | null
          action_proofs?: Json | null
          metadata?: Json | null
          acknowledged?: boolean | null
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          title?: string
          description?: string | null
          type?: string
          severity?: string
          source?: string | null
          status?: string
          escalation_level?: number | null
          assigned_actions?: string[] | null
          action_proofs?: Json | null
          metadata?: Json | null
          acknowledged?: boolean | null
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      project_members: {
        Row: {
          id: string
          project_id: string
          user_id: string
          role: string
          access_level: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          user_id: string
          role?: string
          access_level?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          user_id?: string
          role?: string
          access_level?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      payment_blocks: {
        Row: {
          id: string
          project_id: string
          contractor_id: string
          amount: number
          blocking_reasons: Json
          notes: string | null
          blocked_at: string
          blocked_by: string | null
          resolved_at: string | null
          resolved_by: string | null
        }
        Insert: {
          id?: string
          project_id: string
          contractor_id: string
          amount: number
          blocking_reasons: Json
          notes?: string | null
          blocked_at?: string
          blocked_by?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
        }
        Update: {
          id?: string
          project_id?: string
          contractor_id?: string
          amount?: number
          blocking_reasons?: Json
          notes?: string | null
          blocked_at?: string
          blocked_by?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
        }
        Relationships: []
      }
      payment_control_actions: {
        Row: {
          id: string
          payment_block_id: string
          action_type: string
          description: string | null
          status: string
          assigned_to: string | null
          due_date: string | null
          completed_at: string | null
          created_at: string
          updated_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          payment_block_id: string
          action_type: string
          description?: string | null
          status?: string
          assigned_to?: string | null
          due_date?: string | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          payment_block_id?: string
          action_type?: string
          description?: string | null
          status?: string
          assigned_to?: string | null
          due_date?: string | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
        Relationships: []
      }
      inspections: {
        Row: {
          id: string
          project_id: string | null
          phase_id: string | null
          inspector: string | null
          date: string | null
          status: string | null
          comments: string | null
          documents: Json | null
          payment_type: string | null
          progress_at_inspection: number | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          project_id?: string | null
          phase_id?: string | null
          inspector?: string | null
          date?: string | null
          status?: string | null
          comments?: string | null
          documents?: Json | null
          payment_type?: string | null
          progress_at_inspection?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          project_id?: string | null
          phase_id?: string | null
          inspector?: string | null
          date?: string | null
          status?: string | null
          comments?: string | null
          documents?: Json | null
          payment_type?: string | null
          progress_at_inspection?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      inspection_pvs: {
        Row: {
          id: string
          inspection_id: string
          pv_number: string
          pv_type: string
          title: string | null
          content: string
          pdf_url: string | null
          status: string
          version: number
          generated_at: string
          generated_by: string | null
          metadata: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          inspection_id: string
          pv_number: string
          pv_type: string
          title?: string | null
          content: string
          pdf_url?: string | null
          status?: string
          version?: number
          generated_at?: string
          generated_by?: string | null
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          inspection_id?: string
          pv_number?: string
          pv_type?: string
          title?: string | null
          content?: string
          pdf_url?: string | null
          status?: string
          version?: number
          generated_at?: string
          generated_by?: string | null
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      inspection_documents: {
        Row: {
          id: string
          inspection_id: string
          document_name: string
          document_type: string | null
          document_url: string
          document_id: string | null
          file_size: number | null
          metadata: Json | null
          uploaded_at: string
          uploaded_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          inspection_id: string
          document_name: string
          document_type?: string | null
          document_url: string
          document_id?: string | null
          file_size?: number | null
          metadata?: Json | null
          uploaded_at?: string
          uploaded_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          inspection_id?: string
          document_name?: string
          document_type?: string | null
          document_url?: string
          document_id?: string | null
          file_size?: number | null
          metadata?: Json | null
          uploaded_at?: string
          uploaded_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      progress_invoices: {
        Row: {
          id: string
          project_id: string | null
          inspection_id: string | null
          invoice_number: string | null
          invoice_type: string | null
          invoice_amount: number | null
          progress_percentage: number | null
          previous_progress: number | null
          progress_increment: number | null
          work_description: string | null
          quantities_executed: Json | null
          lot_details: Json | null
          status: string | null
          submitted_at: string | null
          submitted_by: string | null
          paid_at: string | null
          total_contract_amount: number | null
          cumulative_paid: number | null
          retention_amount: number | null
          inspection_report_url: string | null
          service_fait_document_id: string | null
          supporting_documents: Json | null
          consultant_id: string | null
          consultant_approval_status: string | null
          consultant_comments: string | null
          consultant_validated_at: string | null
          ministry_reviewer_id: string | null
          ministry_comments: string | null
          ministry_validated_at: string | null
          donor_approval_required: boolean | null
          donor_approved_at: string | null
          donor_comments: string | null
          workflow_history: Json | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          project_id?: string | null
          inspection_id?: string | null
          invoice_number?: string | null
          invoice_type?: string | null
          invoice_amount?: number | null
          progress_percentage?: number | null
          previous_progress?: number | null
          progress_increment?: number | null
          work_description?: string | null
          quantities_executed?: Json | null
          lot_details?: Json | null
          status?: string | null
          submitted_at?: string | null
          submitted_by?: string | null
          paid_at?: string | null
          total_contract_amount?: number | null
          cumulative_paid?: number | null
          retention_amount?: number | null
          inspection_report_url?: string | null
          service_fait_document_id?: string | null
          supporting_documents?: Json | null
          consultant_id?: string | null
          consultant_approval_status?: string | null
          consultant_comments?: string | null
          consultant_validated_at?: string | null
          ministry_reviewer_id?: string | null
          ministry_comments?: string | null
          ministry_validated_at?: string | null
          donor_approval_required?: boolean | null
          donor_approved_at?: string | null
          donor_comments?: string | null
          workflow_history?: Json | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          project_id?: string | null
          inspection_id?: string | null
          invoice_number?: string | null
          invoice_type?: string | null
          invoice_amount?: number | null
          progress_percentage?: number | null
          previous_progress?: number | null
          progress_increment?: number | null
          work_description?: string | null
          quantities_executed?: Json | null
          lot_details?: Json | null
          status?: string | null
          submitted_at?: string | null
          submitted_by?: string | null
          paid_at?: string | null
          total_contract_amount?: number | null
          cumulative_paid?: number | null
          retention_amount?: number | null
          inspection_report_url?: string | null
          service_fait_document_id?: string | null
          supporting_documents?: Json | null
          consultant_id?: string | null
          consultant_approval_status?: string | null
          consultant_comments?: string | null
          consultant_validated_at?: string | null
          ministry_reviewer_id?: string | null
          ministry_comments?: string | null
          ministry_validated_at?: string | null
          donor_approval_required?: boolean | null
          donor_approved_at?: string | null
          donor_comments?: string | null
          workflow_history?: Json | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      payments: {
        Row: {
          id: string
          project_id: string | null
          phase_id: string | null
          inspection_id: string | null
          amount: number | null
          payment_method: string | null
          payment_date: string | null
          status: string | null
          contractor_id: string | null
          contractor_name: string | null
          contractor_contact: string | null
          receiver_name: string | null
          bank_name: string | null
          account_number: string | null
          check_number: string | null
          mobile_number: string | null
          mobile_operator: string | null
          transaction_id: string | null
          progress_at_payment: number | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          project_id?: string | null
          phase_id?: string | null
          inspection_id?: string | null
          amount?: number | null
          payment_method?: string | null
          payment_date?: string | null
          status?: string | null
          contractor_id?: string | null
          contractor_name?: string | null
          contractor_contact?: string | null
          receiver_name?: string | null
          bank_name?: string | null
          account_number?: string | null
          check_number?: string | null
          mobile_number?: string | null
          mobile_operator?: string | null
          transaction_id?: string | null
          progress_at_payment?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          project_id?: string | null
          phase_id?: string | null
          inspection_id?: string | null
          amount?: number | null
          payment_method?: string | null
          payment_date?: string | null
          status?: string | null
          contractor_id?: string | null
          contractor_name?: string | null
          contractor_contact?: string | null
          receiver_name?: string | null
          bank_name?: string | null
          account_number?: string | null
          check_number?: string | null
          mobile_number?: string | null
          mobile_operator?: string | null
          transaction_id?: string | null
          progress_at_payment?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      materials: {
        Row: {
          id: string
          name: string
          description: string | null
          category: string | null
          subcategory: string | null
          unit: string | null
          quantity: number | null
          available_quantity: number | null
          min_quantity: number | null
          price_per_unit: number | null
          sku: string | null
          ean: string | null
          asin: string | null
          gtin: string | null
          image: string | null
          material_status: string | null
          origin_location: string | null
          last_restock: string | null
          workspace_id: string | null
          forme: string | null
          localisation: Json | null
          adresse: Json | null
          supplier: Json | null
          tags: Json | null
          multilang_labels: Json | null
          timeline: Json | null
          coordinates_latitude: number | null
          coordinates_longitude: number | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          category?: string | null
          subcategory?: string | null
          unit?: string | null
          quantity?: number | null
          available_quantity?: number | null
          min_quantity?: number | null
          price_per_unit?: number | null
          sku?: string | null
          ean?: string | null
          asin?: string | null
          gtin?: string | null
          image?: string | null
          material_status?: string | null
          origin_location?: string | null
          last_restock?: string | null
          workspace_id?: string | null
          forme?: string | null
          localisation?: Json | null
          adresse?: Json | null
          supplier?: Json | null
          tags?: Json | null
          multilang_labels?: Json | null
          timeline?: Json | null
          coordinates_latitude?: number | null
          coordinates_longitude?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          category?: string | null
          subcategory?: string | null
          unit?: string | null
          quantity?: number | null
          available_quantity?: number | null
          min_quantity?: number | null
          price_per_unit?: number | null
          sku?: string | null
          ean?: string | null
          asin?: string | null
          gtin?: string | null
          image?: string | null
          material_status?: string | null
          origin_location?: string | null
          last_restock?: string | null
          workspace_id?: string | null
          forme?: string | null
          localisation?: Json | null
          adresse?: Json | null
          supplier?: Json | null
          tags?: Json | null
          multilang_labels?: Json | null
          timeline?: Json | null
          coordinates_latitude?: number | null
          coordinates_longitude?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      material_documents: {
        Row: {
          id: string
          material_id: string | null
          title: string | null
          document_type: string | null
          document_number: string | null
          document_date: string | null
          expiry_date: string | null
          file_name: string | null
          file_url: string | null
          file_size: number | null
          mime_type: string | null
          metadata: Json | null
          tags: string[] | null
          description: string | null
          supplier_name: string | null
          uploaded_by: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          material_id?: string | null
          title?: string | null
          document_type?: string | null
          document_number?: string | null
          document_date?: string | null
          expiry_date?: string | null
          file_name?: string | null
          file_url?: string | null
          file_size?: number | null
          mime_type?: string | null
          metadata?: Json | null
          tags?: string[] | null
          description?: string | null
          supplier_name?: string | null
          uploaded_by?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          material_id?: string | null
          title?: string | null
          document_type?: string | null
          document_number?: string | null
          document_date?: string | null
          expiry_date?: string | null
          file_name?: string | null
          file_url?: string | null
          file_size?: number | null
          mime_type?: string | null
          metadata?: Json | null
          tags?: string[] | null
          description?: string | null
          supplier_name?: string | null
          uploaded_by?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      material_suppliers: {
        Row: {
          id: string
          material_id: string | null
          supplier_id: string | null
          unit_price: number | null
          minimum_order_quantity: number | null
          lead_time_days: number | null
          is_preferred: boolean | null
          last_price_update: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          material_id?: string | null
          supplier_id?: string | null
          unit_price?: number | null
          minimum_order_quantity?: number | null
          lead_time_days?: number | null
          is_preferred?: boolean | null
          last_price_update?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          material_id?: string | null
          supplier_id?: string | null
          unit_price?: number | null
          minimum_order_quantity?: number | null
          lead_time_days?: number | null
          is_preferred?: boolean | null
          last_price_update?: string | null
          created_at?: string | null
        }
        Relationships: []
      }
      suppliers: {
        Row: {
          id: string
          name: string
          contact_person: string | null
          email: string | null
          phone: string | null
          address: string | null
          category: string | null
          nif: string | null
          commerce_register_ref: string | null
          rib: string | null
          bank_name: string | null
          account_number: string | null
          rating: number | null
          is_active: boolean | null
          user_id: string | null
          default_password_reset_required: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          contact_person?: string | null
          email?: string | null
          phone?: string | null
          address?: string | null
          category?: string | null
          nif?: string | null
          commerce_register_ref?: string | null
          rib?: string | null
          bank_name?: string | null
          account_number?: string | null
          rating?: number | null
          is_active?: boolean | null
          user_id?: string | null
          default_password_reset_required?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          contact_person?: string | null
          email?: string | null
          phone?: string | null
          address?: string | null
          category?: string | null
          nif?: string | null
          commerce_register_ref?: string | null
          rib?: string | null
          bank_name?: string | null
          account_number?: string | null
          rating?: number | null
          is_active?: boolean | null
          user_id?: string | null
          default_password_reset_required?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      supplier_payments: {
        Row: {
          id: string
          supplier_id: string
          amount: number
          description: string | null
          due_date: string
          payment_date: string | null
          status: string
          reference_number: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          supplier_id: string
          amount: number
          description?: string | null
          due_date: string
          payment_date?: string | null
          status?: string
          reference_number?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          supplier_id?: string
          amount?: number
          description?: string | null
          due_date?: string
          payment_date?: string | null
          status?: string
          reference_number?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      supplier_inspections: {
        Row: {
          id: string
          supplier_id: string
          inspection_date: string
          inspector_name: string
          score: number | null
          status: string
          comments: string | null
          recommendations: string | null
          next_inspection_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          supplier_id: string
          inspection_date: string
          inspector_name: string
          score?: number | null
          status?: string
          comments?: string | null
          recommendations?: string | null
          next_inspection_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          supplier_id?: string
          inspection_date?: string
          inspector_name?: string
          score?: number | null
          status?: string
          comments?: string | null
          recommendations?: string | null
          next_inspection_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      documents: {
        Row: {
          id: string
          title: string | null
          description: string | null
          file_name: string | null
          file_url: string | null
          file_size: number | null
          mime_type: string | null
          document_type: string | null
          status: string | null
          project_id: string | null
          phase_id: string | null
          inspection_id: string | null
          payment_id: string | null
          supplier_id: string | null
          assigned_to: string | null
          uploaded_by: string | null
          tags: string[] | null
          metadata: Json | null
          is_internal_only: boolean | null
          is_shared_with_suppliers: boolean | null
          shared_date: string | null
          deadline_date: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          title?: string | null
          description?: string | null
          file_name?: string | null
          file_url?: string | null
          file_size?: number | null
          mime_type?: string | null
          document_type?: string | null
          status?: string | null
          project_id?: string | null
          phase_id?: string | null
          inspection_id?: string | null
          payment_id?: string | null
          supplier_id?: string | null
          assigned_to?: string | null
          uploaded_by?: string | null
          tags?: string[] | null
          metadata?: Json | null
          is_internal_only?: boolean | null
          is_shared_with_suppliers?: boolean | null
          shared_date?: string | null
          deadline_date?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          title?: string | null
          description?: string | null
          file_name?: string | null
          file_url?: string | null
          file_size?: number | null
          mime_type?: string | null
          document_type?: string | null
          status?: string | null
          project_id?: string | null
          phase_id?: string | null
          inspection_id?: string | null
          payment_id?: string | null
          supplier_id?: string | null
          assigned_to?: string | null
          uploaded_by?: string | null
          tags?: string[] | null
          metadata?: Json | null
          is_internal_only?: boolean | null
          is_shared_with_suppliers?: boolean | null
          shared_date?: string | null
          deadline_date?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      organizations: {
        Row: {
          id: string
          name: string
          code: string | null
          description: string | null
          email: string | null
          phone: string | null
          address: string | null
          website: string | null
          logo_url: string | null
          is_active: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          code?: string | null
          description?: string | null
          email?: string | null
          phone?: string | null
          address?: string | null
          website?: string | null
          logo_url?: string | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          code?: string | null
          description?: string | null
          email?: string | null
          phone?: string | null
          address?: string | null
          website?: string | null
          logo_url?: string | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      employees: {
        Row: {
          id: string
          user_id: string | null
          employee_id: string | null
          full_name: string
          email: string | null
          phone: string | null
          position: string | null
          department: string | null
          manager_id: string | null
          superior_id: string | null
          hire_date: string | null
          salary: number | null
          is_active: boolean | null
          skills: string[] | null
          certifications: Json | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          employee_id?: string | null
          full_name: string
          email?: string | null
          phone?: string | null
          position?: string | null
          department?: string | null
          manager_id?: string | null
          superior_id?: string | null
          hire_date?: string | null
          salary?: number | null
          is_active?: boolean | null
          skills?: string[] | null
          certifications?: Json | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          employee_id?: string | null
          full_name?: string
          email?: string | null
          phone?: string | null
          position?: string | null
          department?: string | null
          manager_id?: string | null
          superior_id?: string | null
          hire_date?: string | null
          salary?: number | null
          is_active?: boolean | null
          skills?: string[] | null
          certifications?: Json | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      brands: {
        Row: {
          id: string
          name: string
          description: string | null
          logo_url: string | null
          contact_email: string | null
          contact_phone: string | null
          address: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          logo_url?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          address?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          logo_url?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          address?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      brand_managers: {
        Row: {
          id: string
          brand_id: string
          user_id: string
          is_active: boolean
          assigned_at: string
          assigned_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          brand_id: string
          user_id: string
          is_active?: boolean
          assigned_at?: string
          assigned_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          brand_id?: string
          user_id?: string
          is_active?: boolean
          assigned_at?: string
          assigned_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      stocks: {
        Row: {
          id: string
          depot: string
          depot_id: string | null
          station_id: string | null
          brand_id: string | null
          product: string
          fuel_type_code: string | null
          capacity: number
          current_stock: number
          stock_level: string
          status: string
          notes: string | null
          parent_stock_id: string | null
          city_code: string | null
          city_name_fr: string | null
          city_name_ar: string | null
          current_tarif_unit: number | null
          last_revaluation_date: string | null
          rotation_rate: number | null
          trend: string | null
          last_update: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          depot: string
          depot_id?: string | null
          station_id?: string | null
          brand_id?: string | null
          product: string
          fuel_type_code?: string | null
          capacity: number
          current_stock?: number
          stock_level?: string
          status?: string
          notes?: string | null
          parent_stock_id?: string | null
          city_code?: string | null
          city_name_fr?: string | null
          city_name_ar?: string | null
          current_tarif_unit?: number | null
          last_revaluation_date?: string | null
          rotation_rate?: number | null
          trend?: string | null
          last_update?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          depot?: string
          depot_id?: string | null
          station_id?: string | null
          brand_id?: string | null
          product?: string
          fuel_type_code?: string | null
          capacity?: number
          current_stock?: number
          stock_level?: string
          status?: string
          notes?: string | null
          parent_stock_id?: string | null
          city_code?: string | null
          city_name_fr?: string | null
          city_name_ar?: string | null
          current_tarif_unit?: number | null
          last_revaluation_date?: string | null
          rotation_rate?: number | null
          trend?: string | null
          last_update?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      stock_movements: {
        Row: {
          id: string
          stock_id: string | null
          source_stock_id: string | null
          destination_stock_id: string | null
          movement_type: string | null
          movement_date: string | null
          quantity: number | null
          unit_price: number | null
          total_value: number | null
          tarif_unit: number | null
          prix_base: number | null
          index_km: number | null
          origin_code: string | null
          destination_code: string | null
          destination: string | null
          rec_id: string | null
          supplier: string | null
          reference: string | null
          notes: string | null
          recorded_by: string | null
          label_prod_fr: string | null
          label_prod_ar: string | null
          label_vill_fr: string | null
          label_vill_ar: string | null
          validation_status: string | null
          validated_at: string | null
          validated_by: string | null
          rejection_reason: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          stock_id?: string | null
          source_stock_id?: string | null
          destination_stock_id?: string | null
          movement_type?: string | null
          movement_date?: string | null
          quantity?: number | null
          unit_price?: number | null
          total_value?: number | null
          tarif_unit?: number | null
          prix_base?: number | null
          index_km?: number | null
          origin_code?: string | null
          destination_code?: string | null
          destination?: string | null
          rec_id?: string | null
          supplier?: string | null
          reference?: string | null
          notes?: string | null
          recorded_by?: string | null
          label_prod_fr?: string | null
          label_prod_ar?: string | null
          label_vill_fr?: string | null
          label_vill_ar?: string | null
          validation_status?: string | null
          validated_at?: string | null
          validated_by?: string | null
          rejection_reason?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          stock_id?: string | null
          source_stock_id?: string | null
          destination_stock_id?: string | null
          movement_type?: string | null
          movement_date?: string | null
          quantity?: number | null
          unit_price?: number | null
          total_value?: number | null
          tarif_unit?: number | null
          prix_base?: number | null
          index_km?: number | null
          origin_code?: string | null
          destination_code?: string | null
          destination?: string | null
          rec_id?: string | null
          supplier?: string | null
          reference?: string | null
          notes?: string | null
          recorded_by?: string | null
          label_prod_fr?: string | null
          label_prod_ar?: string | null
          label_vill_fr?: string | null
          label_vill_ar?: string | null
          validation_status?: string | null
          validated_at?: string | null
          validated_by?: string | null
          rejection_reason?: string | null
          created_at?: string | null
        }
        Relationships: []
      }
      stock_alerts: {
        Row: {
          id: string
          stock_id: string
          title: string
          description: string | null
          alert_type: string
          severity: string
          status: string
          threshold_id: string | null
          threshold_value: number | null
          current_value: number | null
          acknowledged_at: string | null
          acknowledged_by: string | null
          resolved_at: string | null
          resolved_by: string | null
          resolution_notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          stock_id: string
          title: string
          description?: string | null
          alert_type: string
          severity?: string
          status?: string
          threshold_id?: string | null
          threshold_value?: number | null
          current_value?: number | null
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          resolution_notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          stock_id?: string
          title?: string
          description?: string | null
          alert_type?: string
          severity?: string
          status?: string
          threshold_id?: string | null
          threshold_value?: number | null
          current_value?: number | null
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          resolution_notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      stock_thresholds: {
        Row: {
          id: string
          stock_id: string | null
          threshold_type: string
          threshold_value: number
          threshold_unit: string
          product: string | null
          depot: string | null
          is_active: boolean | null
          notification_enabled: boolean | null
          created_at: string
          updated_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          stock_id?: string | null
          threshold_type: string
          threshold_value: number
          threshold_unit?: string
          product?: string | null
          depot?: string | null
          is_active?: boolean | null
          notification_enabled?: boolean | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          stock_id?: string | null
          threshold_type?: string
          threshold_value?: number
          threshold_unit?: string
          product?: string | null
          depot?: string | null
          is_active?: boolean | null
          notification_enabled?: boolean | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
        Relationships: []
      }
      price_references: {
        Row: {
          id: string
          fuel_type_code: string
          label_prod_fr: string
          label_prod_ar: string | null
          periode: string
          prix_base: number
          tarif_km: number
          piste_coefficient: number
          volatility_cap: number
          effective_date: string
          expiry_date: string | null
          is_active: boolean
          source_document: string | null
          created_at: string
          updated_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          fuel_type_code: string
          label_prod_fr: string
          label_prod_ar?: string | null
          periode: string
          prix_base: number
          tarif_km?: number
          piste_coefficient?: number
          volatility_cap?: number
          effective_date: string
          expiry_date?: string | null
          is_active?: boolean
          source_document?: string | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          fuel_type_code?: string
          label_prod_fr?: string
          label_prod_ar?: string | null
          periode?: string
          prix_base?: number
          tarif_km?: number
          piste_coefficient?: number
          volatility_cap?: number
          effective_date?: string
          expiry_date?: string | null
          is_active?: boolean
          source_document?: string | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
        Relationships: []
      }
      price_calculations: {
        Row: {
          id: string
          rec_id: string
          stock_movement_id: string | null
          fuel_type_code: string
          label_prod_fr: string
          label_prod_ar: string | null
          label_vill_fr: string
          label_vill_ar: string | null
          origin_code: string
          destination_code: string
          distance_km: number
          index_km: number
          route_type: string
          piste_coefficient: number
          quantity_liters: number
          periode: string
          prix_base: number
          tarif_km: number
          tarif_unit: number
          total_value: number
          previous_tarif_unit: number | null
          price_variation_pct: number | null
          volatility_check: boolean | null
          calculated_at: string
          calculated_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          rec_id: string
          stock_movement_id?: string | null
          fuel_type_code: string
          label_prod_fr: string
          label_prod_ar?: string | null
          label_vill_fr: string
          label_vill_ar?: string | null
          origin_code: string
          destination_code: string
          distance_km: number
          index_km: number
          route_type: string
          piste_coefficient?: number
          quantity_liters: number
          periode: string
          prix_base: number
          tarif_km: number
          tarif_unit: number
          total_value: number
          previous_tarif_unit?: number | null
          price_variation_pct?: number | null
          volatility_check?: boolean | null
          calculated_at?: string
          calculated_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          rec_id?: string
          stock_movement_id?: string | null
          fuel_type_code?: string
          label_prod_fr?: string
          label_prod_ar?: string | null
          label_vill_fr?: string
          label_vill_ar?: string | null
          origin_code?: string
          destination_code?: string
          distance_km?: number
          index_km?: number
          route_type?: string
          piste_coefficient?: number
          quantity_liters?: number
          periode?: string
          prix_base?: number
          tarif_km?: number
          tarif_unit?: number
          total_value?: number
          previous_tarif_unit?: number | null
          price_variation_pct?: number | null
          volatility_check?: boolean | null
          calculated_at?: string
          calculated_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      price_revaluation_logs: {
        Row: {
          id: string
          stock_id: string | null
          depot_code: string
          fuel_type_code: string
          label_vill_fr: string | null
          label_vill_ar: string | null
          periode: string
          stock_volume: number
          old_value: number
          new_value: number
          old_tarif_unit: number
          new_tarif_unit: number
          variance: number
          variance_pct: number
          adjustment_type: string
          status: string
          notes: string | null
          applied_at: string | null
          approved_at: string | null
          approved_by: string | null
          created_at: string
          updated_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          stock_id?: string | null
          depot_code: string
          fuel_type_code: string
          label_vill_fr?: string | null
          label_vill_ar?: string | null
          periode: string
          stock_volume: number
          old_value: number
          new_value: number
          old_tarif_unit: number
          new_tarif_unit: number
          variance: number
          variance_pct: number
          adjustment_type?: string
          status?: string
          notes?: string | null
          applied_at?: string | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          stock_id?: string | null
          depot_code?: string
          fuel_type_code?: string
          label_vill_fr?: string | null
          label_vill_ar?: string | null
          periode?: string
          stock_volume?: number
          old_value?: number
          new_value?: number
          old_tarif_unit?: number
          new_tarif_unit?: number
          variance?: number
          variance_pct?: number
          adjustment_type?: string
          status?: string
          notes?: string | null
          applied_at?: string | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
        Relationships: []
      }
      deliveries: {
        Row: {
          id: string
          delivery_number: string
          product: string
          unit: string
          quantity_shipped: number
          quantity_received: number | null
          quantity_difference: number | null
          discrepancy_notes: string | null
          status: string
          driver_name: string
          driver_license: string | null
          truck_registration: string
          truck_technical_visit_expiry: string | null
          origin_depot_id: string | null
          origin_depot_name: string | null
          destination_depot_id: string | null
          destination_depot_name: string | null
          destination_station_id: string | null
          destination_station_name: string | null
          departure_date: string | null
          arrival_date: string | null
          loading_date: string | null
          unloading_date: string | null
          loading_qr_code: string | null
          unloading_qr_code: string | null
          delivery_slip: string | null
          transport_certificate: string | null
          inspection_certificate: string | null
          cargo_certificate_id: string | null
          import_batch_reference: string | null
          unloading_report_number: string | null
          created_at: string
          updated_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          delivery_number: string
          product: string
          unit?: string
          quantity_shipped?: number
          quantity_received?: number | null
          quantity_difference?: number | null
          discrepancy_notes?: string | null
          status?: string
          driver_name?: string
          driver_license?: string | null
          truck_registration?: string
          truck_technical_visit_expiry?: string | null
          origin_depot_id?: string | null
          origin_depot_name?: string | null
          destination_depot_id?: string | null
          destination_depot_name?: string | null
          destination_station_id?: string | null
          destination_station_name?: string | null
          departure_date?: string | null
          arrival_date?: string | null
          loading_date?: string | null
          unloading_date?: string | null
          loading_qr_code?: string | null
          unloading_qr_code?: string | null
          delivery_slip?: string | null
          transport_certificate?: string | null
          inspection_certificate?: string | null
          cargo_certificate_id?: string | null
          import_batch_reference?: string | null
          unloading_report_number?: string | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          delivery_number?: string
          product?: string
          unit?: string
          quantity_shipped?: number
          quantity_received?: number | null
          quantity_difference?: number | null
          discrepancy_notes?: string | null
          status?: string
          driver_name?: string
          driver_license?: string | null
          truck_registration?: string
          truck_technical_visit_expiry?: string | null
          origin_depot_id?: string | null
          origin_depot_name?: string | null
          destination_depot_id?: string | null
          destination_depot_name?: string | null
          destination_station_id?: string | null
          destination_station_name?: string | null
          departure_date?: string | null
          arrival_date?: string | null
          loading_date?: string | null
          unloading_date?: string | null
          loading_qr_code?: string | null
          unloading_qr_code?: string | null
          delivery_slip?: string | null
          transport_certificate?: string | null
          inspection_certificate?: string | null
          cargo_certificate_id?: string | null
          import_batch_reference?: string | null
          unloading_report_number?: string | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
        Relationships: []
      }
      national_depots: {
        Row: {
          id: string
          code: string
          name: string
          address: string | null
          city: string | null
          wilaya: string | null
          operator: string | null
          manager_id: string | null
          total_capacity: number | null
          latitude: number | null
          longitude: number | null
          notes: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          code: string
          name: string
          address?: string | null
          city?: string | null
          wilaya?: string | null
          operator?: string | null
          manager_id?: string | null
          total_capacity?: number | null
          latitude?: number | null
          longitude?: number | null
          notes?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          code?: string
          name?: string
          address?: string | null
          city?: string | null
          wilaya?: string | null
          operator?: string | null
          manager_id?: string | null
          total_capacity?: number | null
          latitude?: number | null
          longitude?: number | null
          notes?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      distance_matrix: {
        Row: {
          id: string
          origin_code: string
          origin_name_fr: string
          origin_name_ar: string | null
          destination_code: string
          destination_name_fr: string
          destination_name_ar: string | null
          distance_km: number
          estimated_hours: number | null
          route_type: string
          piste_percentage: number | null
          notes: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          origin_code: string
          origin_name_fr: string
          origin_name_ar?: string | null
          destination_code: string
          destination_name_fr: string
          destination_name_ar?: string | null
          distance_km: number
          estimated_hours?: number | null
          route_type?: string
          piste_percentage?: number | null
          notes?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          origin_code?: string
          origin_name_fr?: string
          origin_name_ar?: string | null
          destination_code?: string
          destination_name_fr?: string
          destination_name_ar?: string | null
          distance_km?: number
          estimated_hours?: number | null
          route_type?: string
          piste_percentage?: number | null
          notes?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      locations: {
        Row: {
          id: string
          code: string
          name: string
          name_ar: string | null
          type: string
          parent_code: string | null
          latitude: number | null
          longitude: number | null
          population: number | null
          economic_importance: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          code: string
          name: string
          name_ar?: string | null
          type: string
          parent_code?: string | null
          latitude?: number | null
          longitude?: number | null
          population?: number | null
          economic_importance?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          code?: string
          name?: string
          name_ar?: string | null
          type?: string
          parent_code?: string | null
          latitude?: number | null
          longitude?: number | null
          population?: number | null
          economic_importance?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      territories: {
        Row: {
          id: string
          label: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          label: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          label?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      // Vues BTP (à ajouter si nécessaire)
    }
    Functions: {
      // Fonctions BTP (à ajouter si nécessaire)
    }
    Enums: {
      // Enums BTP (à ajouter si nécessaire)
    }
  }
}

// Type helpers pour accéder aux tables BTP
export type SchemaTables<Schema extends keyof Database> = 
  Database[Schema] extends { Tables: infer T } ? T : never;

export type BTPTables = SchemaTables<'btp'>;

export type BTPTable<T extends keyof BTPTables> = 
  BTPTables[T] extends { Row: infer R } ? R : never;

export type BTPTableInsert<T extends keyof BTPTables> = 
  BTPTables[T] extends { Insert: infer I } ? I : never;

export type BTPTableUpdate<T extends keyof BTPTables> = 
  BTPTables[T] extends { Update: infer U } ? U : never;

// Fonction utilitaire pour obtenir le nom de la table avec schéma
export const getTableName = (table: keyof BTPTables): string => {
  return `${DB_CONFIG.defaultSchema}.${table}`;
};

// Fonction utilitaire pour obtenir le schéma par défaut
export const getDefaultSchema = (): string => {
  return DB_CONFIG.defaultSchema;
};