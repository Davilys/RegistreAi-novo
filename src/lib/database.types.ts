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
      agent_instances: {
        Row: {
          agent_name: string
          created_at: string
          id: string
          last_active_at: string | null
          memory_version: number
          policy_version: string
          prompt_version: string
          status: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          agent_name?: string
          created_at?: string
          id?: string
          last_active_at?: string | null
          memory_version?: number
          policy_version?: string
          prompt_version?: string
          status?: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          agent_name?: string
          created_at?: string
          id?: string
          last_active_at?: string | null
          memory_version?: number
          policy_version?: string
          prompt_version?: string
          status?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_instances_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: true
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_runs: {
        Row: {
          agent_role: string
          completed_at: string | null
          error_code: string | null
          error_message: string | null
          id: string
          input_redacted: Json
          model: string | null
          output_redacted: Json
          process_id: string | null
          prompt_version: string
          started_at: string
          status: string
          workspace_id: string
        }
        Insert: {
          agent_role: string
          completed_at?: string | null
          error_code?: string | null
          error_message?: string | null
          id?: string
          input_redacted?: Json
          model?: string | null
          output_redacted?: Json
          process_id?: string | null
          prompt_version: string
          started_at?: string
          status?: string
          workspace_id: string
        }
        Update: {
          agent_role?: string
          completed_at?: string | null
          error_code?: string | null
          error_message?: string | null
          id?: string
          input_redacted?: Json
          model?: string | null
          output_redacted?: Json
          process_id?: string | null
          prompt_version?: string
          started_at?: string
          status?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_runs_process_id_fkey"
            columns: ["process_id"]
            isOneToOne: false
            referencedRelation: "processes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_runs_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_state: {
        Row: {
          id: string
          process_id: string | null
          scope: string
          state: Json
          summary: string | null
          updated_at: string
          version: number
          workspace_id: string
        }
        Insert: {
          id?: string
          process_id?: string | null
          scope: string
          state?: Json
          summary?: string | null
          updated_at?: string
          version?: number
          workspace_id: string
        }
        Update: {
          id?: string
          process_id?: string | null
          scope?: string
          state?: Json
          summary?: string | null
          updated_at?: string
          version?: number
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_state_process_id_fkey"
            columns: ["process_id"]
            isOneToOne: false
            referencedRelation: "processes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_state_process_workspace_fk"
            columns: ["process_id", "workspace_id"]
            isOneToOne: false
            referencedRelation: "processes"
            referencedColumns: ["id", "workspace_id"]
          },
          {
            foreignKeyName: "agent_state_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          action: string
          actor_ref: string | null
          actor_type: string
          created_at: string
          entity_id: string | null
          entity_type: string
          id: number
          metadata: Json
          process_id: string | null
          request_id: string | null
          workspace_id: string | null
        }
        Insert: {
          action: string
          actor_ref?: string | null
          actor_type: string
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: never
          metadata?: Json
          process_id?: string | null
          request_id?: string | null
          workspace_id?: string | null
        }
        Update: {
          action?: string
          actor_ref?: string | null
          actor_type?: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: never
          metadata?: Json
          process_id?: string | null
          request_id?: string | null
          workspace_id?: string | null
        }
        Relationships: []
      }
      channel_identities: {
        Row: {
          channel: string
          created_at: string
          id: string
          identifier_hash: string
          identifier_masked: string | null
          is_primary: boolean
          verified: boolean
          verified_at: string | null
          workspace_id: string
        }
        Insert: {
          channel: string
          created_at?: string
          id?: string
          identifier_hash: string
          identifier_masked?: string | null
          is_primary?: boolean
          verified?: boolean
          verified_at?: string | null
          workspace_id: string
        }
        Update: {
          channel?: string
          created_at?: string
          id?: string
          identifier_hash?: string
          identifier_masked?: string | null
          is_primary?: boolean
          verified?: boolean
          verified_at?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "channel_identities_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_access_tokens: {
        Row: {
          contract_document_id: string
          created_at: string
          expires_at: string
          id: string
          last_viewed_at: string | null
          revoked_at: string | null
          token_hash: string
        }
        Insert: {
          contract_document_id: string
          created_at?: string
          expires_at: string
          id?: string
          last_viewed_at?: string | null
          revoked_at?: string | null
          token_hash: string
        }
        Update: {
          contract_document_id?: string
          created_at?: string
          expires_at?: string
          id?: string
          last_viewed_at?: string | null
          revoked_at?: string | null
          token_hash?: string
        }
        Relationships: [
          {
            foreignKeyName: "contract_access_tokens_contract_document_id_fkey"
            columns: ["contract_document_id"]
            isOneToOne: false
            referencedRelation: "contract_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_documents: {
        Row: {
          acceptance_channel: string | null
          acceptance_evidence: Json
          accepted_at: string | null
          accepted_phrase: string | null
          contract_version: string
          created_at: string
          document_sha256: string
          id: string
          object_path: string
          status: string
          subscription_id: string | null
          workspace_id: string
        }
        Insert: {
          acceptance_channel?: string | null
          acceptance_evidence?: Json
          accepted_at?: string | null
          accepted_phrase?: string | null
          contract_version: string
          created_at?: string
          document_sha256: string
          id?: string
          object_path: string
          status?: string
          subscription_id?: string | null
          workspace_id: string
        }
        Update: {
          acceptance_channel?: string | null
          acceptance_evidence?: Json
          accepted_at?: string | null
          accepted_phrase?: string | null
          contract_version?: string
          created_at?: string
          document_sha256?: string
          id?: string
          object_path?: string
          status?: string
          subscription_id?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contract_documents_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_documents_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_threads: {
        Row: {
          channel: string
          created_at: string
          id: string
          provider_thread_id: string | null
          status: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          channel?: string
          created_at?: string
          id?: string
          provider_thread_id?: string | null
          status?: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          channel?: string
          created_at?: string
          id?: string
          provider_thread_id?: string | null
          status?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_threads_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_consents: {
        Row: {
          accepted: boolean
          accepted_at: string | null
          channel: string | null
          consent_type: string
          created_at: string
          document_version: string
          evidence: Json
          id: string
          revoked_at: string | null
          workspace_id: string
        }
        Insert: {
          accepted: boolean
          accepted_at?: string | null
          channel?: string | null
          consent_type: string
          created_at?: string
          document_version: string
          evidence?: Json
          id?: string
          revoked_at?: string | null
          workspace_id: string
        }
        Update: {
          accepted?: boolean
          accepted_at?: string | null
          channel?: string | null
          consent_type?: string
          created_at?: string
          document_version?: string
          evidence?: Json
          id?: string
          revoked_at?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_consents_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      data_subject_requests: {
        Row: {
          completed_at: string | null
          id: string
          notes: string | null
          received_at: string
          request_type: string
          status: string
          workspace_id: string | null
        }
        Insert: {
          completed_at?: string | null
          id?: string
          notes?: string | null
          received_at?: string
          request_type: string
          status?: string
          workspace_id?: string | null
        }
        Update: {
          completed_at?: string | null
          id?: string
          notes?: string | null
          received_at?: string
          request_type?: string
          status?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "data_subject_requests_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      deadline_reminders: {
        Row: {
          created_at: string
          deadline_id: string
          id: string
          milestone: string
          outbound_message_id: string | null
          process_id: string
          sent_at: string | null
          workspace_id: string
        }
        Insert: {
          created_at?: string
          deadline_id: string
          id?: string
          milestone: string
          outbound_message_id?: string | null
          process_id: string
          sent_at?: string | null
          workspace_id: string
        }
        Update: {
          created_at?: string
          deadline_id?: string
          id?: string
          milestone?: string
          outbound_message_id?: string | null
          process_id?: string
          sent_at?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "deadline_reminders_deadline_id_fkey"
            columns: ["deadline_id"]
            isOneToOne: false
            referencedRelation: "deadlines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deadline_reminders_outbound_message_id_fkey"
            columns: ["outbound_message_id"]
            isOneToOne: false
            referencedRelation: "outbound_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deadline_reminders_process_id_fkey"
            columns: ["process_id"]
            isOneToOne: false
            referencedRelation: "processes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deadline_reminders_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      deadline_rules: {
        Row: {
          active: boolean
          continuous_days: boolean
          event_type: string
          extend_due_if_non_working: boolean
          legal_window_days: number
          source_name: string
          source_url: string
          start_rule: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          continuous_days?: boolean
          event_type: string
          extend_due_if_non_working?: boolean
          legal_window_days: number
          source_name: string
          source_url: string
          start_rule?: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          continuous_days?: boolean
          event_type?: string
          extend_due_if_non_working?: boolean
          legal_window_days?: number
          source_name?: string
          source_url?: string
          start_rule?: string
          updated_at?: string
        }
        Relationships: []
      }
      deadlines: {
        Row: {
          calculation_basis: string | null
          calendar_verified: boolean
          created_at: string
          customer_dependency: boolean
          due_at: string
          id: string
          kind: string
          legal_window_days: number | null
          missed_at: string | null
          opened_at: string
          process_id: string
          publication_date: string | null
          satisfied_at: string | null
          source_event_id: string | null
          status: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          calculation_basis?: string | null
          calendar_verified?: boolean
          created_at?: string
          customer_dependency?: boolean
          due_at: string
          id?: string
          kind: string
          legal_window_days?: number | null
          missed_at?: string | null
          opened_at?: string
          process_id: string
          publication_date?: string | null
          satisfied_at?: string | null
          source_event_id?: string | null
          status?: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          calculation_basis?: string | null
          calendar_verified?: boolean
          created_at?: string
          customer_dependency?: boolean
          due_at?: string
          id?: string
          kind?: string
          legal_window_days?: number | null
          missed_at?: string | null
          opened_at?: string
          process_id?: string
          publication_date?: string | null
          satisfied_at?: string | null
          source_event_id?: string | null
          status?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "deadlines_process_id_fkey"
            columns: ["process_id"]
            isOneToOne: false
            referencedRelation: "processes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deadlines_process_workspace_fk"
            columns: ["process_id", "workspace_id"]
            isOneToOne: false
            referencedRelation: "processes"
            referencedColumns: ["id", "workspace_id"]
          },
          {
            foreignKeyName: "deadlines_source_event_id_fkey"
            columns: ["source_event_id"]
            isOneToOne: false
            referencedRelation: "process_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deadlines_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      decision_checks: {
        Row: {
          action_type: string
          blocked_reasons: string[]
          checks: Json
          created_at: string
          id: string
          legal_case_id: string | null
          passed: boolean
          process_id: string | null
          workspace_id: string
        }
        Insert: {
          action_type: string
          blocked_reasons?: string[]
          checks?: Json
          created_at?: string
          id?: string
          legal_case_id?: string | null
          passed: boolean
          process_id?: string | null
          workspace_id: string
        }
        Update: {
          action_type?: string
          blocked_reasons?: string[]
          checks?: Json
          created_at?: string
          id?: string
          legal_case_id?: string | null
          passed?: boolean
          process_id?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "decision_checks_legal_case_id_fkey"
            columns: ["legal_case_id"]
            isOneToOne: false
            referencedRelation: "legal_cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "decision_checks_process_id_fkey"
            columns: ["process_id"]
            isOneToOne: false
            referencedRelation: "processes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "decision_checks_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          classification: string | null
          created_at: string
          id: string
          legal_case_id: string | null
          metadata: Json
          mime_type: string | null
          object_path: string
          original_filename: string | null
          process_id: string | null
          received_at: string
          requirement_id: string | null
          sha256: string | null
          size_bytes: number | null
          uploaded_by: string
          verification_status: string
          workspace_id: string
        }
        Insert: {
          classification?: string | null
          created_at?: string
          id?: string
          legal_case_id?: string | null
          metadata?: Json
          mime_type?: string | null
          object_path: string
          original_filename?: string | null
          process_id?: string | null
          received_at?: string
          requirement_id?: string | null
          sha256?: string | null
          size_bytes?: number | null
          uploaded_by?: string
          verification_status?: string
          workspace_id: string
        }
        Update: {
          classification?: string | null
          created_at?: string
          id?: string
          legal_case_id?: string | null
          metadata?: Json
          mime_type?: string | null
          object_path?: string
          original_filename?: string | null
          process_id?: string | null
          received_at?: string
          requirement_id?: string | null
          sha256?: string | null
          size_bytes?: number | null
          uploaded_by?: string
          verification_status?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_legal_case_id_fkey"
            columns: ["legal_case_id"]
            isOneToOne: false
            referencedRelation: "legal_cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_legal_case_workspace_fk"
            columns: ["legal_case_id", "workspace_id"]
            isOneToOne: false
            referencedRelation: "legal_cases"
            referencedColumns: ["id", "workspace_id"]
          },
          {
            foreignKeyName: "documents_process_id_fkey"
            columns: ["process_id"]
            isOneToOne: false
            referencedRelation: "processes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_process_workspace_fk"
            columns: ["process_id", "workspace_id"]
            isOneToOne: false
            referencedRelation: "processes"
            referencedColumns: ["id", "workspace_id"]
          },
          {
            foreignKeyName: "documents_requirement_id_fkey"
            columns: ["requirement_id"]
            isOneToOne: false
            referencedRelation: "legal_requirements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      federal_fees: {
        Row: {
          amount_cents: number | null
          amount_verified: boolean
          created_at: string
          discount_tier: string | null
          due_date: string | null
          expected_amount_cents: number | null
          external_reference: string | null
          fee_type: string
          generated_document_path: string | null
          id: string
          last_checked_at: string | null
          legal_case_id: string | null
          nice_class: number | null
          payment_confirmed_at: string | null
          process_id: string | null
          proof_document_id: string | null
          provider: string
          service_code: string | null
          status: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          amount_cents?: number | null
          amount_verified?: boolean
          created_at?: string
          discount_tier?: string | null
          due_date?: string | null
          expected_amount_cents?: number | null
          external_reference?: string | null
          fee_type: string
          generated_document_path?: string | null
          id?: string
          last_checked_at?: string | null
          legal_case_id?: string | null
          nice_class?: number | null
          payment_confirmed_at?: string | null
          process_id?: string | null
          proof_document_id?: string | null
          provider?: string
          service_code?: string | null
          status?: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          amount_cents?: number | null
          amount_verified?: boolean
          created_at?: string
          discount_tier?: string | null
          due_date?: string | null
          expected_amount_cents?: number | null
          external_reference?: string | null
          fee_type?: string
          generated_document_path?: string | null
          id?: string
          last_checked_at?: string | null
          legal_case_id?: string | null
          nice_class?: number | null
          payment_confirmed_at?: string | null
          process_id?: string | null
          proof_document_id?: string | null
          provider?: string
          service_code?: string | null
          status?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "federal_fees_legal_case_id_fkey"
            columns: ["legal_case_id"]
            isOneToOne: false
            referencedRelation: "legal_cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "federal_fees_legal_case_workspace_fk"
            columns: ["legal_case_id", "workspace_id"]
            isOneToOne: false
            referencedRelation: "legal_cases"
            referencedColumns: ["id", "workspace_id"]
          },
          {
            foreignKeyName: "federal_fees_process_id_fkey"
            columns: ["process_id"]
            isOneToOne: false
            referencedRelation: "processes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "federal_fees_process_workspace_fk"
            columns: ["process_id", "workspace_id"]
            isOneToOne: false
            referencedRelation: "processes"
            referencedColumns: ["id", "workspace_id"]
          },
          {
            foreignKeyName: "federal_fees_proof_document_id_fkey"
            columns: ["proof_document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "federal_fees_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      fee_eligibility_requests: {
        Row: {
          answered_at: string | null
          created_at: string
          declared_category: string | null
          holder_id: string
          id: string
          process_id: string
          provider_message_id: string | null
          status: string
          verified_at: string | null
          workspace_id: string
        }
        Insert: {
          answered_at?: string | null
          created_at?: string
          declared_category?: string | null
          holder_id: string
          id?: string
          process_id: string
          provider_message_id?: string | null
          status?: string
          verified_at?: string | null
          workspace_id: string
        }
        Update: {
          answered_at?: string | null
          created_at?: string
          declared_category?: string | null
          holder_id?: string
          id?: string
          process_id?: string
          provider_message_id?: string | null
          status?: string
          verified_at?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fee_eligibility_requests_holder_id_fkey"
            columns: ["holder_id"]
            isOneToOne: false
            referencedRelation: "holders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fee_eligibility_requests_process_id_fkey"
            columns: ["process_id"]
            isOneToOne: true
            referencedRelation: "processes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fee_eligibility_requests_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      holder_fee_profiles: {
        Row: {
          created_at: string
          discount_tier: string
          eligibility_basis: string | null
          holder_id: string
          source: string | null
          updated_at: string
          verification_status: string
          verified_at: string | null
        }
        Insert: {
          created_at?: string
          discount_tier?: string
          eligibility_basis?: string | null
          holder_id: string
          source?: string | null
          updated_at?: string
          verification_status?: string
          verified_at?: string | null
        }
        Update: {
          created_at?: string
          discount_tier?: string
          eligibility_basis?: string | null
          holder_id?: string
          source?: string | null
          updated_at?: string
          verification_status?: string
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "holder_fee_profiles_holder_id_fkey"
            columns: ["holder_id"]
            isOneToOne: true
            referencedRelation: "holders"
            referencedColumns: ["id"]
          },
        ]
      }
      holders: {
        Row: {
          created_at: string
          document_hash: string
          document_masked: string
          holder_type: string
          id: string
          legal_name: string
          registration_status: string
          updated_at: string
          verified_at: string | null
          workspace_id: string
        }
        Insert: {
          created_at?: string
          document_hash: string
          document_masked: string
          holder_type: string
          id?: string
          legal_name: string
          registration_status?: string
          updated_at?: string
          verified_at?: string | null
          workspace_id: string
        }
        Update: {
          created_at?: string
          document_hash?: string
          document_masked?: string
          holder_type?: string
          id?: string
          legal_name?: string
          registration_status?: string
          updated_at?: string
          verified_at?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "holders_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      inpi_calendar_years: {
        Row: {
          created_at: string
          notes: string | null
          source_name: string
          source_url: string
          updated_at: string
          verified: boolean
          verified_at: string | null
          year: number
        }
        Insert: {
          created_at?: string
          notes?: string | null
          source_name: string
          source_url: string
          updated_at?: string
          verified?: boolean
          verified_at?: string | null
          year: number
        }
        Update: {
          created_at?: string
          notes?: string | null
          source_name?: string
          source_url?: string
          updated_at?: string
          verified?: boolean
          verified_at?: string | null
          year?: number
        }
        Relationships: []
      }
      inpi_fee_catalog: {
        Row: {
          active: boolean
          billing_unit: string
          created_at: string
          discount50_amount_cents: number | null
          effective_from: string
          effective_to: string | null
          id: string
          scope: string
          service_code: string
          service_name: string
          source_url: string
          source_version: string
          standard_amount_cents: number
        }
        Insert: {
          active?: boolean
          billing_unit?: string
          created_at?: string
          discount50_amount_cents?: number | null
          effective_from: string
          effective_to?: string | null
          id?: string
          scope?: string
          service_code: string
          service_name: string
          source_url: string
          source_version: string
          standard_amount_cents: number
        }
        Update: {
          active?: boolean
          billing_unit?: string
          created_at?: string
          discount50_amount_cents?: number | null
          effective_from?: string
          effective_to?: string | null
          id?: string
          scope?: string
          service_code?: string
          service_name?: string
          source_url?: string
          source_version?: string
          standard_amount_cents?: number
        }
        Relationships: []
      }
      inpi_non_working_days: {
        Row: {
          created_at: string
          day: string
          name: string
          scope: string
          source_url: string
          verified: boolean
        }
        Insert: {
          created_at?: string
          day: string
          name: string
          scope?: string
          source_url: string
          verified?: boolean
        }
        Update: {
          created_at?: string
          day?: string
          name?: string
          scope?: string
          source_url?: string
          verified?: boolean
        }
        Relationships: []
      }
      integration_status: {
        Row: {
          config_redacted: Json
          enabled: boolean
          environment: string
          health_status: string
          last_error_code: string | null
          last_error_message: string | null
          last_health_check_at: string | null
          last_success_at: string | null
          provider: string
          updated_at: string
        }
        Insert: {
          config_redacted?: Json
          enabled?: boolean
          environment?: string
          health_status?: string
          last_error_code?: string | null
          last_error_message?: string | null
          last_health_check_at?: string | null
          last_success_at?: string | null
          provider: string
          updated_at?: string
        }
        Update: {
          config_redacted?: Json
          enabled?: boolean
          environment?: string
          health_status?: string
          last_error_code?: string | null
          last_error_message?: string | null
          last_health_check_at?: string | null
          last_success_at?: string | null
          provider?: string
          updated_at?: string
        }
        Relationships: []
      }
      legal_cases: {
        Row: {
          case_type: string
          created_at: string
          customer_message_summary: string | null
          deadline_id: string | null
          id: string
          legal_basis: Json
          process_id: string
          source_event_id: string | null
          status: string
          strategy_summary: string | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          case_type: string
          created_at?: string
          customer_message_summary?: string | null
          deadline_id?: string | null
          id?: string
          legal_basis?: Json
          process_id: string
          source_event_id?: string | null
          status?: string
          strategy_summary?: string | null
          updated_at?: string
          workspace_id: string
        }
        Update: {
          case_type?: string
          created_at?: string
          customer_message_summary?: string | null
          deadline_id?: string | null
          id?: string
          legal_basis?: Json
          process_id?: string
          source_event_id?: string | null
          status?: string
          strategy_summary?: string | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "legal_cases_deadline_id_fkey"
            columns: ["deadline_id"]
            isOneToOne: false
            referencedRelation: "deadlines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "legal_cases_process_id_fkey"
            columns: ["process_id"]
            isOneToOne: false
            referencedRelation: "processes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "legal_cases_process_workspace_fk"
            columns: ["process_id", "workspace_id"]
            isOneToOne: false
            referencedRelation: "processes"
            referencedColumns: ["id", "workspace_id"]
          },
          {
            foreignKeyName: "legal_cases_source_event_id_fkey"
            columns: ["source_event_id"]
            isOneToOne: false
            referencedRelation: "process_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "legal_cases_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      legal_requirements: {
        Row: {
          created_at: string
          fulfilled_at: string | null
          id: string
          instructions: string | null
          label: string
          legal_case_id: string
          required: boolean
          requirement_type: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          fulfilled_at?: string | null
          id?: string
          instructions?: string | null
          label: string
          legal_case_id: string
          required?: boolean
          requirement_type: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          fulfilled_at?: string | null
          id?: string
          instructions?: string | null
          label?: string
          legal_case_id?: string
          required?: boolean
          requirement_type?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "legal_requirements_legal_case_id_fkey"
            columns: ["legal_case_id"]
            isOneToOne: false
            referencedRelation: "legal_cases"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content_ciphertext: string | null
          content_nonce: string | null
          content_redacted: string | null
          created_at: string
          delivery_status: string | null
          direction: string
          encryption_key_version: number | null
          id: string
          message_type: string
          process_id: string | null
          provider_message_id: string | null
          sent_at: string
          thread_id: string
          workspace_id: string
        }
        Insert: {
          content_ciphertext?: string | null
          content_nonce?: string | null
          content_redacted?: string | null
          created_at?: string
          delivery_status?: string | null
          direction: string
          encryption_key_version?: number | null
          id?: string
          message_type?: string
          process_id?: string | null
          provider_message_id?: string | null
          sent_at: string
          thread_id: string
          workspace_id: string
        }
        Update: {
          content_ciphertext?: string | null
          content_nonce?: string | null
          content_redacted?: string | null
          created_at?: string
          delivery_status?: string | null
          direction?: string
          encryption_key_version?: number | null
          id?: string
          message_type?: string
          process_id?: string | null
          provider_message_id?: string | null
          sent_at?: string
          thread_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_process_id_fkey"
            columns: ["process_id"]
            isOneToOne: false
            referencedRelation: "processes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_process_workspace_fk"
            columns: ["process_id", "workspace_id"]
            isOneToOne: false
            referencedRelation: "processes"
            referencedColumns: ["id", "workspace_id"]
          },
          {
            foreignKeyName: "messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "conversation_threads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_thread_workspace_fk"
            columns: ["thread_id", "workspace_id"]
            isOneToOne: false
            referencedRelation: "conversation_threads"
            referencedColumns: ["id", "workspace_id"]
          },
          {
            foreignKeyName: "messages_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_profiles: {
        Row: {
          activity_description: string | null
          created_at: string
          email_hash: string | null
          email_masked: string | null
          holder_document_hash: string | null
          holder_document_masked: string | null
          holder_type: string | null
          id: string
          missing_fields: string[]
          name_masked: string | null
          onboarding_status: string
          plan_code: string | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          activity_description?: string | null
          created_at?: string
          email_hash?: string | null
          email_masked?: string | null
          holder_document_hash?: string | null
          holder_document_masked?: string | null
          holder_type?: string | null
          id?: string
          missing_fields?: string[]
          name_masked?: string | null
          onboarding_status?: string
          plan_code?: string | null
          updated_at?: string
          workspace_id: string
        }
        Update: {
          activity_description?: string | null
          created_at?: string
          email_hash?: string | null
          email_masked?: string | null
          holder_document_hash?: string | null
          holder_document_masked?: string | null
          holder_type?: string | null
          id?: string
          missing_fields?: string[]
          name_masked?: string | null
          onboarding_status?: string
          plan_code?: string | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_profiles_plan_code_fkey"
            columns: ["plan_code"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "onboarding_profiles_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: true
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      outbound_messages: {
        Row: {
          attempts: number
          body_ciphertext: string | null
          body_nonce_b64: string | null
          body_redacted: string | null
          channel: string
          created_at: string
          encryption_key_version: number | null
          id: string
          idempotency_key: string | null
          last_error: string | null
          process_id: string | null
          provider_message_id: string | null
          scheduled_at: string
          sent_at: string | null
          status: string
          template_key: string | null
          thread_id: string | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          attempts?: number
          body_ciphertext?: string | null
          body_nonce_b64?: string | null
          body_redacted?: string | null
          channel?: string
          created_at?: string
          encryption_key_version?: number | null
          id?: string
          idempotency_key?: string | null
          last_error?: string | null
          process_id?: string | null
          provider_message_id?: string | null
          scheduled_at?: string
          sent_at?: string | null
          status?: string
          template_key?: string | null
          thread_id?: string | null
          updated_at?: string
          workspace_id: string
        }
        Update: {
          attempts?: number
          body_ciphertext?: string | null
          body_nonce_b64?: string | null
          body_redacted?: string | null
          channel?: string
          created_at?: string
          encryption_key_version?: number | null
          id?: string
          idempotency_key?: string | null
          last_error?: string | null
          process_id?: string | null
          provider_message_id?: string | null
          scheduled_at?: string
          sent_at?: string | null
          status?: string
          template_key?: string | null
          thread_id?: string | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "outbound_messages_process_id_fkey"
            columns: ["process_id"]
            isOneToOne: false
            referencedRelation: "processes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "outbound_messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "conversation_threads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "outbound_messages_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount_cents: number
          created_at: string
          due_date: string | null
          external_id: string
          id: string
          paid_at: string | null
          payment_type: string
          pix_copy_paste: string | null
          pix_qr_payload: string | null
          provider: string
          raw_status: string | null
          status: string
          subscription_id: string | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          amount_cents: number
          created_at?: string
          due_date?: string | null
          external_id: string
          id?: string
          paid_at?: string | null
          payment_type: string
          pix_copy_paste?: string | null
          pix_qr_payload?: string | null
          provider?: string
          raw_status?: string | null
          status?: string
          subscription_id?: string | null
          updated_at?: string
          workspace_id: string
        }
        Update: {
          amount_cents?: number
          created_at?: string
          due_date?: string | null
          external_id?: string
          id?: string
          paid_at?: string | null
          payment_type?: string
          pix_copy_paste?: string | null
          pix_qr_payload?: string | null
          provider?: string
          raw_status?: string | null
          status?: string
          subscription_id?: string | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_subscription_workspace_fk"
            columns: ["subscription_id", "workspace_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id", "workspace_id"]
          },
          {
            foreignKeyName: "payments_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
          active: boolean
          code: string
          created_at: string
          guarantee_included: boolean
          monthly_fee_cents: number
          name: string
          public_description: string | null
          resources_included: boolean
          setup_fee_cents: number
          unlimited_marks: boolean
          updated_at: string
        }
        Insert: {
          active?: boolean
          code: string
          created_at?: string
          guarantee_included?: boolean
          monthly_fee_cents: number
          name: string
          public_description?: string | null
          resources_included?: boolean
          setup_fee_cents: number
          unlimited_marks?: boolean
          updated_at?: string
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string
          guarantee_included?: boolean
          monthly_fee_cents?: number
          name?: string
          public_description?: string | null
          resources_included?: boolean
          setup_fee_cents?: number
          unlimited_marks?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      process_classes: {
        Row: {
          created_at: string
          id: string
          is_primary: boolean
          nice_class: number
          process_id: string
          specification: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_primary?: boolean
          nice_class: number
          process_id: string
          specification?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_primary?: boolean
          nice_class?: number
          process_id?: string
          specification?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "process_classes_process_id_fkey"
            columns: ["process_id"]
            isOneToOne: false
            referencedRelation: "processes"
            referencedColumns: ["id"]
          },
        ]
      }
      process_events: {
        Row: {
          classification: string | null
          created_at: string
          event_type: string
          id: string
          occurred_at: string
          payload: Json
          process_id: string
          processed_at: string | null
          requires_action: boolean
          source: string
          source_external_id: string | null
          workspace_id: string
        }
        Insert: {
          classification?: string | null
          created_at?: string
          event_type: string
          id?: string
          occurred_at: string
          payload?: Json
          process_id: string
          processed_at?: string | null
          requires_action?: boolean
          source: string
          source_external_id?: string | null
          workspace_id: string
        }
        Update: {
          classification?: string | null
          created_at?: string
          event_type?: string
          id?: string
          occurred_at?: string
          payload?: Json
          process_id?: string
          processed_at?: string | null
          requires_action?: boolean
          source?: string
          source_external_id?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "process_events_process_id_fkey"
            columns: ["process_id"]
            isOneToOne: false
            referencedRelation: "processes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "process_events_process_workspace_fk"
            columns: ["process_id", "workspace_id"]
            isOneToOne: false
            referencedRelation: "processes"
            referencedColumns: ["id", "workspace_id"]
          },
          {
            foreignKeyName: "process_events_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      process_transition_rules: {
        Row: {
          active: boolean
          from_status: string
          to_status: string
        }
        Insert: {
          active?: boolean
          from_status: string
          to_status: string
        }
        Update: {
          active?: boolean
          from_status?: string
          to_status?: string
        }
        Relationships: []
      }
      processes: {
        Row: {
          automation_hold: boolean
          created_at: string
          filing_date: string | null
          hold_reason: string | null
          hold_resume_status: string | null
          holder_id: string
          id: string
          inpi_process_number: string | null
          last_rpi_date: string | null
          last_rpi_number: string | null
          next_action_at: string | null
          status: string
          subscription_id: string | null
          trademark_id: string
          updated_at: string
          version: number
          workspace_id: string
        }
        Insert: {
          automation_hold?: boolean
          created_at?: string
          filing_date?: string | null
          hold_reason?: string | null
          hold_resume_status?: string | null
          holder_id: string
          id?: string
          inpi_process_number?: string | null
          last_rpi_date?: string | null
          last_rpi_number?: string | null
          next_action_at?: string | null
          status?: string
          subscription_id?: string | null
          trademark_id: string
          updated_at?: string
          version?: number
          workspace_id: string
        }
        Update: {
          automation_hold?: boolean
          created_at?: string
          filing_date?: string | null
          hold_reason?: string | null
          hold_resume_status?: string | null
          holder_id?: string
          id?: string
          inpi_process_number?: string | null
          last_rpi_date?: string | null
          last_rpi_number?: string | null
          next_action_at?: string | null
          status?: string
          subscription_id?: string | null
          trademark_id?: string
          updated_at?: string
          version?: number
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "processes_holder_id_fkey"
            columns: ["holder_id"]
            isOneToOne: false
            referencedRelation: "holders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "processes_holder_workspace_fk"
            columns: ["holder_id", "workspace_id"]
            isOneToOne: false
            referencedRelation: "holders"
            referencedColumns: ["id", "workspace_id"]
          },
          {
            foreignKeyName: "processes_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "processes_subscription_workspace_fk"
            columns: ["subscription_id", "workspace_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id", "workspace_id"]
          },
          {
            foreignKeyName: "processes_trademark_id_fkey"
            columns: ["trademark_id"]
            isOneToOne: false
            referencedRelation: "trademarks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "processes_trademark_workspace_fk"
            columns: ["trademark_id", "workspace_id"]
            isOneToOne: false
            referencedRelation: "trademarks"
            referencedColumns: ["id", "workspace_id"]
          },
          {
            foreignKeyName: "processes_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      rpi_editions: {
        Row: {
          attempts: number
          created_at: string
          discovered_at: string
          id: string
          last_error: string | null
          matching_processes: number
          processed_at: string | null
          publication_date: string | null
          rpi_number: number
          section: string
          source_sha256: string | null
          source_url: string
          status: string
          total_events: number
          updated_at: string
        }
        Insert: {
          attempts?: number
          created_at?: string
          discovered_at?: string
          id?: string
          last_error?: string | null
          matching_processes?: number
          processed_at?: string | null
          publication_date?: string | null
          rpi_number: number
          section?: string
          source_sha256?: string | null
          source_url: string
          status?: string
          total_events?: number
          updated_at?: string
        }
        Update: {
          attempts?: number
          created_at?: string
          discovered_at?: string
          id?: string
          last_error?: string | null
          matching_processes?: number
          processed_at?: string | null
          publication_date?: string | null
          rpi_number?: number
          section?: string
          source_sha256?: string | null
          source_url?: string
          status?: string
          total_events?: number
          updated_at?: string
        }
        Relationships: []
      }
      security_events: {
        Row: {
          blocked: boolean
          details_redacted: Json
          event_type: string
          id: string
          occurred_at: string
          process_id: string | null
          severity: string
          source: string
          workspace_id: string | null
        }
        Insert: {
          blocked?: boolean
          details_redacted?: Json
          event_type: string
          id?: string
          occurred_at?: string
          process_id?: string | null
          severity: string
          source: string
          workspace_id?: string | null
        }
        Update: {
          blocked?: boolean
          details_redacted?: Json
          event_type?: string
          id?: string
          occurred_at?: string
          process_id?: string | null
          severity?: string
          source?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "security_events_process_id_fkey"
            columns: ["process_id"]
            isOneToOne: false
            referencedRelation: "processes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "security_events_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          asaas_customer_id: string | null
          asaas_subscription_id: string | null
          cancelled_at: string | null
          created_at: string
          holder_id: string
          holder_locked: boolean
          id: string
          plan_code: string
          setup_payment_id: string | null
          started_at: string | null
          status: string
          terms_accepted_at: string | null
          terms_version: string | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          asaas_customer_id?: string | null
          asaas_subscription_id?: string | null
          cancelled_at?: string | null
          created_at?: string
          holder_id: string
          holder_locked?: boolean
          id?: string
          plan_code: string
          setup_payment_id?: string | null
          started_at?: string | null
          status?: string
          terms_accepted_at?: string | null
          terms_version?: string | null
          updated_at?: string
          workspace_id: string
        }
        Update: {
          asaas_customer_id?: string | null
          asaas_subscription_id?: string | null
          cancelled_at?: string | null
          created_at?: string
          holder_id?: string
          holder_locked?: boolean
          id?: string
          plan_code?: string
          setup_payment_id?: string | null
          started_at?: string | null
          status?: string
          terms_accepted_at?: string | null
          terms_version?: string | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_holder_id_fkey"
            columns: ["holder_id"]
            isOneToOne: false
            referencedRelation: "holders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_plan_code_fkey"
            columns: ["plan_code"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "subscriptions_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      tool_runs: {
        Row: {
          error_code: string | null
          error_message: string | null
          finished_at: string | null
          id: string
          idempotency_key: string | null
          input_redacted: Json
          output_redacted: Json
          process_id: string | null
          started_at: string
          status: string
          tool_name: string
          workspace_id: string | null
        }
        Insert: {
          error_code?: string | null
          error_message?: string | null
          finished_at?: string | null
          id?: string
          idempotency_key?: string | null
          input_redacted?: Json
          output_redacted?: Json
          process_id?: string | null
          started_at?: string
          status?: string
          tool_name: string
          workspace_id?: string | null
        }
        Update: {
          error_code?: string | null
          error_message?: string | null
          finished_at?: string | null
          id?: string
          idempotency_key?: string | null
          input_redacted?: Json
          output_redacted?: Json
          process_id?: string | null
          started_at?: string
          status?: string
          tool_name?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tool_runs_process_id_fkey"
            columns: ["process_id"]
            isOneToOne: false
            referencedRelation: "processes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tool_runs_process_workspace_fk"
            columns: ["process_id", "workspace_id"]
            isOneToOne: false
            referencedRelation: "processes"
            referencedColumns: ["id", "workspace_id"]
          },
          {
            foreignKeyName: "tool_runs_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      trademarks: {
        Row: {
          activity_description: string | null
          created_at: string
          holder_id: string
          id: string
          logo_object_path: string | null
          name: string
          normalized_name: string
          presentation_type: string
          status: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          activity_description?: string | null
          created_at?: string
          holder_id: string
          id?: string
          logo_object_path?: string | null
          name: string
          normalized_name: string
          presentation_type?: string
          status?: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          activity_description?: string | null
          created_at?: string
          holder_id?: string
          id?: string
          logo_object_path?: string | null
          name?: string
          normalized_name?: string
          presentation_type?: string
          status?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trademarks_holder_id_fkey"
            columns: ["holder_id"]
            isOneToOne: false
            referencedRelation: "holders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trademarks_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      viability_confirmations: {
        Row: {
          confirmed_at: string | null
          confirmed_class: number | null
          created_at: string
          id: string
          process_id: string
          provider_message_id: string | null
          report_id: string
          status: string
          workspace_id: string
        }
        Insert: {
          confirmed_at?: string | null
          confirmed_class?: number | null
          created_at?: string
          id?: string
          process_id: string
          provider_message_id?: string | null
          report_id: string
          status?: string
          workspace_id: string
        }
        Update: {
          confirmed_at?: string | null
          confirmed_class?: number | null
          created_at?: string
          id?: string
          process_id?: string
          provider_message_id?: string | null
          report_id?: string
          status?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "viability_confirmations_process_id_fkey"
            columns: ["process_id"]
            isOneToOne: false
            referencedRelation: "processes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "viability_confirmations_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "viability_reports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "viability_confirmations_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      viability_matches: {
        Row: {
          created_at: string
          evidence: Json
          id: string
          inpi_process_number: string | null
          mark_name: string
          match_kind: string | null
          nice_class: number | null
          report_id: string
          similarity: number | null
          status: string | null
        }
        Insert: {
          created_at?: string
          evidence?: Json
          id?: string
          inpi_process_number?: string | null
          mark_name: string
          match_kind?: string | null
          nice_class?: number | null
          report_id: string
          similarity?: number | null
          status?: string | null
        }
        Update: {
          created_at?: string
          evidence?: Json
          id?: string
          inpi_process_number?: string | null
          mark_name?: string
          match_kind?: string | null
          nice_class?: number | null
          report_id?: string
          similarity?: number | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "viability_matches_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "viability_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      viability_reports: {
        Row: {
          completed_at: string
          confidence: number | null
          created_at: string
          id: string
          model: string | null
          process_id: string
          search_version: string | null
          summary: string
          verdict: string
        }
        Insert: {
          completed_at?: string
          confidence?: number | null
          created_at?: string
          id?: string
          model?: string | null
          process_id: string
          search_version?: string | null
          summary: string
          verdict: string
        }
        Update: {
          completed_at?: string
          confidence?: number | null
          created_at?: string
          id?: string
          model?: string | null
          process_id?: string
          search_version?: string | null
          summary?: string
          verdict?: string
        }
        Relationships: [
          {
            foreignKeyName: "viability_reports_process_id_fkey"
            columns: ["process_id"]
            isOneToOne: false
            referencedRelation: "processes"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_events: {
        Row: {
          attempts: number
          event_type: string
          external_event_id: string
          id: string
          last_error: string | null
          payload: Json
          processed_at: string | null
          processing_status: string
          provider: string
          received_at: string
          signature_valid: boolean | null
        }
        Insert: {
          attempts?: number
          event_type: string
          external_event_id: string
          id?: string
          last_error?: string | null
          payload: Json
          processed_at?: string | null
          processing_status?: string
          provider: string
          received_at?: string
          signature_valid?: boolean | null
        }
        Update: {
          attempts?: number
          event_type?: string
          external_event_id?: string
          id?: string
          last_error?: string | null
          payload?: Json
          processed_at?: string | null
          processing_status?: string
          provider?: string
          received_at?: string
          signature_valid?: boolean | null
        }
        Relationships: []
      }
      webhook_payloads: {
        Row: {
          algorithm: string
          ciphertext: string
          created_at: string
          key_version: number
          nonce_b64: string
          sha256_hex: string
          webhook_event_id: string
        }
        Insert: {
          algorithm?: string
          ciphertext: string
          created_at?: string
          key_version?: number
          nonce_b64: string
          sha256_hex: string
          webhook_event_id: string
        }
        Update: {
          algorithm?: string
          ciphertext?: string
          created_at?: string
          key_version?: number
          nonce_b64?: string
          sha256_hex?: string
          webhook_event_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhook_payloads_webhook_event_id_fkey"
            columns: ["webhook_event_id"]
            isOneToOne: true
            referencedRelation: "webhook_events"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_tasks: {
        Row: {
          attempts: number
          completed_at: string | null
          created_at: string
          due_at: string | null
          id: string
          idempotency_key: string | null
          last_error: string | null
          legal_case_id: string | null
          owner_type: string
          payload_redacted: Json
          priority: number
          process_id: string | null
          status: string
          task_type: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          attempts?: number
          completed_at?: string | null
          created_at?: string
          due_at?: string | null
          id?: string
          idempotency_key?: string | null
          last_error?: string | null
          legal_case_id?: string | null
          owner_type: string
          payload_redacted?: Json
          priority?: number
          process_id?: string | null
          status?: string
          task_type: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          attempts?: number
          completed_at?: string | null
          created_at?: string
          due_at?: string | null
          id?: string
          idempotency_key?: string | null
          last_error?: string | null
          legal_case_id?: string | null
          owner_type?: string
          payload_redacted?: Json
          priority?: number
          process_id?: string | null
          status?: string
          task_type?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflow_tasks_legal_case_id_fkey"
            columns: ["legal_case_id"]
            isOneToOne: false
            referencedRelation: "legal_cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_tasks_process_id_fkey"
            columns: ["process_id"]
            isOneToOne: false
            referencedRelation: "processes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_tasks_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspaces: {
        Row: {
          created_at: string
          display_name: string | null
          id: string
          locale: string
          primary_whatsapp_hash: string | null
          primary_whatsapp_masked: string | null
          source: string | null
          status: string
          timezone: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          id?: string
          locale?: string
          primary_whatsapp_hash?: string | null
          primary_whatsapp_masked?: string | null
          source?: string | null
          status?: string
          timezone?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          id?: string
          locale?: string
          primary_whatsapp_hash?: string | null
          primary_whatsapp_masked?: string | null
          source?: string | null
          status?: string
          timezone?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_channel_identity_secret: {
        Args: { p_channel_identity_id: string }
        Returns: {
          ciphertext: string
          key_version: number
          nonce_b64: string
        }[]
      }
      get_onboarding_profile_secret: {
        Args: { p_workspace_id: string }
        Returns: {
          ciphertext: string
          key_version: number
          nonce_b64: string
        }[]
      }
      reg_queue_archive: {
        Args: { p_msg_id: number; p_queue: string }
        Returns: boolean
      }
      reg_queue_read: {
        Args: { p_qty?: number; p_queue: string; p_visibility_timeout?: number }
        Returns: {
          enqueued_at: string
          message: Json
          msg_id: number
          read_ct: number
          vt: string
        }[]
      }
      reg_queue_send: {
        Args: { p_delay?: number; p_message: Json; p_queue: string }
        Returns: number
      }
      reg_queue_set_vt: {
        Args: { p_msg_id: number; p_queue: string; p_seconds: number }
        Returns: boolean
      }
      resolve_whatsapp_workspace: {
        Args: {
          p_ciphertext: string
          p_identifier_hash: string
          p_identifier_masked: string
          p_key_version?: number
          p_nonce_b64: string
        }
        Returns: {
          is_new: boolean
          thread_id: string
          workspace_id: string
        }[]
      }
      transition_process: {
        Args: {
          p_actor_ref?: string
          p_actor_type: string
          p_expected_version: number
          p_process_id: string
          p_reason?: string
          p_to_status: string
        }
        Returns: {
          automation_hold: boolean
          created_at: string
          filing_date: string | null
          hold_reason: string | null
          hold_resume_status: string | null
          holder_id: string
          id: string
          inpi_process_number: string | null
          last_rpi_date: string | null
          last_rpi_number: string | null
          next_action_at: string | null
          status: string
          subscription_id: string | null
          trademark_id: string
          updated_at: string
          version: number
          workspace_id: string
        }
        SetofOptions: {
          from: "*"
          to: "processes"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      upsert_onboarding_profile: {
        Args: {
          p_activity_description: string
          p_ciphertext: string
          p_email_hash: string
          p_email_masked: string
          p_holder_document_hash: string
          p_holder_document_masked: string
          p_holder_type: string
          p_key_version?: number
          p_missing_fields: string[]
          p_name_masked: string
          p_nonce_b64: string
          p_onboarding_status: string
          p_plan_code: string
          p_workspace_id: string
        }
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
