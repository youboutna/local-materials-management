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
  auth: {
    Tables: {
      audit_log_entries: {
        Row: {
          created_at: string | null
          id: string
          instance_id: string | null
          ip_address: string
          payload: Json | null
        }
        Insert: {
          created_at?: string | null
          id: string
          instance_id?: string | null
          ip_address?: string
          payload?: Json | null
        }
        Update: {
          created_at?: string | null
          id?: string
          instance_id?: string | null
          ip_address?: string
          payload?: Json | null
        }
        Relationships: []
      }
      custom_oauth_providers: {
        Row: {
          acceptable_client_ids: string[]
          attribute_mapping: Json
          authorization_params: Json
          authorization_url: string | null
          cached_discovery: Json | null
          client_id: string
          client_secret: string
          created_at: string
          custom_claims_allowlist: string[]
          discovery_cached_at: string | null
          discovery_url: string | null
          email_optional: boolean
          enabled: boolean
          id: string
          identifier: string
          issuer: string | null
          jwks_uri: string | null
          name: string
          pkce_enabled: boolean
          provider_type: string
          scopes: string[]
          skip_nonce_check: boolean
          token_url: string | null
          updated_at: string
          userinfo_url: string | null
        }
        Insert: {
          acceptable_client_ids?: string[]
          attribute_mapping?: Json
          authorization_params?: Json
          authorization_url?: string | null
          cached_discovery?: Json | null
          client_id: string
          client_secret: string
          created_at?: string
          custom_claims_allowlist?: string[]
          discovery_cached_at?: string | null
          discovery_url?: string | null
          email_optional?: boolean
          enabled?: boolean
          id?: string
          identifier: string
          issuer?: string | null
          jwks_uri?: string | null
          name: string
          pkce_enabled?: boolean
          provider_type: string
          scopes?: string[]
          skip_nonce_check?: boolean
          token_url?: string | null
          updated_at?: string
          userinfo_url?: string | null
        }
        Update: {
          acceptable_client_ids?: string[]
          attribute_mapping?: Json
          authorization_params?: Json
          authorization_url?: string | null
          cached_discovery?: Json | null
          client_id?: string
          client_secret?: string
          created_at?: string
          custom_claims_allowlist?: string[]
          discovery_cached_at?: string | null
          discovery_url?: string | null
          email_optional?: boolean
          enabled?: boolean
          id?: string
          identifier?: string
          issuer?: string | null
          jwks_uri?: string | null
          name?: string
          pkce_enabled?: boolean
          provider_type?: string
          scopes?: string[]
          skip_nonce_check?: boolean
          token_url?: string | null
          updated_at?: string
          userinfo_url?: string | null
        }
        Relationships: []
      }
      flow_state: {
        Row: {
          auth_code: string | null
          auth_code_issued_at: string | null
          authentication_method: string
          code_challenge: string | null
          code_challenge_method:
            | Database["auth"]["Enums"]["code_challenge_method"]
            | null
          created_at: string | null
          email_optional: boolean
          id: string
          invite_token: string | null
          linking_target_id: string | null
          oauth_client_state_id: string | null
          provider_access_token: string | null
          provider_refresh_token: string | null
          provider_type: string
          referrer: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          auth_code?: string | null
          auth_code_issued_at?: string | null
          authentication_method: string
          code_challenge?: string | null
          code_challenge_method?:
            | Database["auth"]["Enums"]["code_challenge_method"]
            | null
          created_at?: string | null
          email_optional?: boolean
          id: string
          invite_token?: string | null
          linking_target_id?: string | null
          oauth_client_state_id?: string | null
          provider_access_token?: string | null
          provider_refresh_token?: string | null
          provider_type: string
          referrer?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          auth_code?: string | null
          auth_code_issued_at?: string | null
          authentication_method?: string
          code_challenge?: string | null
          code_challenge_method?:
            | Database["auth"]["Enums"]["code_challenge_method"]
            | null
          created_at?: string | null
          email_optional?: boolean
          id?: string
          invite_token?: string | null
          linking_target_id?: string | null
          oauth_client_state_id?: string | null
          provider_access_token?: string | null
          provider_refresh_token?: string | null
          provider_type?: string
          referrer?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      identities: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
          identity_data: Json
          last_sign_in_at: string | null
          provider: string
          provider_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id?: string
          identity_data: Json
          last_sign_in_at?: string | null
          provider: string
          provider_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
          identity_data?: Json
          last_sign_in_at?: string | null
          provider?: string
          provider_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "identities_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      instances: {
        Row: {
          created_at: string | null
          id: string
          raw_base_config: string | null
          updated_at: string | null
          uuid: string | null
        }
        Insert: {
          created_at?: string | null
          id: string
          raw_base_config?: string | null
          updated_at?: string | null
          uuid?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          raw_base_config?: string | null
          updated_at?: string | null
          uuid?: string | null
        }
        Relationships: []
      }
      mfa_amr_claims: {
        Row: {
          authentication_method: string
          created_at: string
          id: string
          session_id: string
          updated_at: string
        }
        Insert: {
          authentication_method: string
          created_at: string
          id: string
          session_id: string
          updated_at: string
        }
        Update: {
          authentication_method?: string
          created_at?: string
          id?: string
          session_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mfa_amr_claims_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      mfa_challenges: {
        Row: {
          created_at: string
          factor_id: string
          id: string
          ip_address: unknown
          otp_code: string | null
          verified_at: string | null
          web_authn_session_data: Json | null
        }
        Insert: {
          created_at: string
          factor_id: string
          id: string
          ip_address: unknown
          otp_code?: string | null
          verified_at?: string | null
          web_authn_session_data?: Json | null
        }
        Update: {
          created_at?: string
          factor_id?: string
          id?: string
          ip_address?: unknown
          otp_code?: string | null
          verified_at?: string | null
          web_authn_session_data?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "mfa_challenges_auth_factor_id_fkey"
            columns: ["factor_id"]
            isOneToOne: false
            referencedRelation: "mfa_factors"
            referencedColumns: ["id"]
          },
        ]
      }
      mfa_factors: {
        Row: {
          created_at: string
          factor_type: Database["auth"]["Enums"]["factor_type"]
          friendly_name: string | null
          id: string
          last_challenged_at: string | null
          last_webauthn_challenge_data: Json | null
          phone: string | null
          secret: string | null
          status: Database["auth"]["Enums"]["factor_status"]
          updated_at: string
          user_id: string
          web_authn_aaguid: string | null
          web_authn_credential: Json | null
        }
        Insert: {
          created_at: string
          factor_type: Database["auth"]["Enums"]["factor_type"]
          friendly_name?: string | null
          id: string
          last_challenged_at?: string | null
          last_webauthn_challenge_data?: Json | null
          phone?: string | null
          secret?: string | null
          status: Database["auth"]["Enums"]["factor_status"]
          updated_at: string
          user_id: string
          web_authn_aaguid?: string | null
          web_authn_credential?: Json | null
        }
        Update: {
          created_at?: string
          factor_type?: Database["auth"]["Enums"]["factor_type"]
          friendly_name?: string | null
          id?: string
          last_challenged_at?: string | null
          last_webauthn_challenge_data?: Json | null
          phone?: string | null
          secret?: string | null
          status?: Database["auth"]["Enums"]["factor_status"]
          updated_at?: string
          user_id?: string
          web_authn_aaguid?: string | null
          web_authn_credential?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "mfa_factors_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      oauth_authorizations: {
        Row: {
          approved_at: string | null
          authorization_code: string | null
          authorization_id: string
          client_id: string
          code_challenge: string | null
          code_challenge_method:
            | Database["auth"]["Enums"]["code_challenge_method"]
            | null
          created_at: string
          expires_at: string
          id: string
          nonce: string | null
          redirect_uri: string
          resource: string | null
          response_type: Database["auth"]["Enums"]["oauth_response_type"]
          scope: string
          state: string | null
          status: Database["auth"]["Enums"]["oauth_authorization_status"]
          user_id: string | null
        }
        Insert: {
          approved_at?: string | null
          authorization_code?: string | null
          authorization_id: string
          client_id: string
          code_challenge?: string | null
          code_challenge_method?:
            | Database["auth"]["Enums"]["code_challenge_method"]
            | null
          created_at?: string
          expires_at?: string
          id: string
          nonce?: string | null
          redirect_uri: string
          resource?: string | null
          response_type?: Database["auth"]["Enums"]["oauth_response_type"]
          scope: string
          state?: string | null
          status?: Database["auth"]["Enums"]["oauth_authorization_status"]
          user_id?: string | null
        }
        Update: {
          approved_at?: string | null
          authorization_code?: string | null
          authorization_id?: string
          client_id?: string
          code_challenge?: string | null
          code_challenge_method?:
            | Database["auth"]["Enums"]["code_challenge_method"]
            | null
          created_at?: string
          expires_at?: string
          id?: string
          nonce?: string | null
          redirect_uri?: string
          resource?: string | null
          response_type?: Database["auth"]["Enums"]["oauth_response_type"]
          scope?: string
          state?: string | null
          status?: Database["auth"]["Enums"]["oauth_authorization_status"]
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "oauth_authorizations_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "oauth_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "oauth_authorizations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      oauth_client_states: {
        Row: {
          code_verifier: string | null
          created_at: string
          id: string
          provider_type: string
        }
        Insert: {
          code_verifier?: string | null
          created_at: string
          id: string
          provider_type: string
        }
        Update: {
          code_verifier?: string | null
          created_at?: string
          id?: string
          provider_type?: string
        }
        Relationships: []
      }
      oauth_clients: {
        Row: {
          client_name: string | null
          client_secret_hash: string | null
          client_type: Database["auth"]["Enums"]["oauth_client_type"]
          client_uri: string | null
          created_at: string
          deleted_at: string | null
          grant_types: string
          id: string
          logo_uri: string | null
          redirect_uris: string
          registration_type: Database["auth"]["Enums"]["oauth_registration_type"]
          token_endpoint_auth_method: string
          updated_at: string
        }
        Insert: {
          client_name?: string | null
          client_secret_hash?: string | null
          client_type?: Database["auth"]["Enums"]["oauth_client_type"]
          client_uri?: string | null
          created_at?: string
          deleted_at?: string | null
          grant_types: string
          id: string
          logo_uri?: string | null
          redirect_uris: string
          registration_type: Database["auth"]["Enums"]["oauth_registration_type"]
          token_endpoint_auth_method: string
          updated_at?: string
        }
        Update: {
          client_name?: string | null
          client_secret_hash?: string | null
          client_type?: Database["auth"]["Enums"]["oauth_client_type"]
          client_uri?: string | null
          created_at?: string
          deleted_at?: string | null
          grant_types?: string
          id?: string
          logo_uri?: string | null
          redirect_uris?: string
          registration_type?: Database["auth"]["Enums"]["oauth_registration_type"]
          token_endpoint_auth_method?: string
          updated_at?: string
        }
        Relationships: []
      }
      oauth_consents: {
        Row: {
          client_id: string
          granted_at: string
          id: string
          revoked_at: string | null
          scopes: string
          user_id: string
        }
        Insert: {
          client_id: string
          granted_at?: string
          id: string
          revoked_at?: string | null
          scopes: string
          user_id: string
        }
        Update: {
          client_id?: string
          granted_at?: string
          id?: string
          revoked_at?: string | null
          scopes?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "oauth_consents_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "oauth_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "oauth_consents_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      one_time_tokens: {
        Row: {
          created_at: string
          id: string
          relates_to: string
          token_hash: string
          token_type: Database["auth"]["Enums"]["one_time_token_type"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id: string
          relates_to: string
          token_hash: string
          token_type: Database["auth"]["Enums"]["one_time_token_type"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          relates_to?: string
          token_hash?: string
          token_type?: Database["auth"]["Enums"]["one_time_token_type"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "one_time_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      refresh_tokens: {
        Row: {
          created_at: string | null
          id: number
          instance_id: string | null
          parent: string | null
          revoked: boolean | null
          session_id: string | null
          token: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: number
          instance_id?: string | null
          parent?: string | null
          revoked?: boolean | null
          session_id?: string | null
          token?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: number
          instance_id?: string | null
          parent?: string | null
          revoked?: boolean | null
          session_id?: string | null
          token?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "refresh_tokens_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      saml_providers: {
        Row: {
          attribute_mapping: Json | null
          created_at: string | null
          entity_id: string
          id: string
          metadata_url: string | null
          metadata_xml: string
          name_id_format: string | null
          sso_provider_id: string
          updated_at: string | null
        }
        Insert: {
          attribute_mapping?: Json | null
          created_at?: string | null
          entity_id: string
          id: string
          metadata_url?: string | null
          metadata_xml: string
          name_id_format?: string | null
          sso_provider_id: string
          updated_at?: string | null
        }
        Update: {
          attribute_mapping?: Json | null
          created_at?: string | null
          entity_id?: string
          id?: string
          metadata_url?: string | null
          metadata_xml?: string
          name_id_format?: string | null
          sso_provider_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "saml_providers_sso_provider_id_fkey"
            columns: ["sso_provider_id"]
            isOneToOne: false
            referencedRelation: "sso_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      saml_relay_states: {
        Row: {
          created_at: string | null
          flow_state_id: string | null
          for_email: string | null
          id: string
          redirect_to: string | null
          request_id: string
          sso_provider_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          flow_state_id?: string | null
          for_email?: string | null
          id: string
          redirect_to?: string | null
          request_id: string
          sso_provider_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          flow_state_id?: string | null
          for_email?: string | null
          id?: string
          redirect_to?: string | null
          request_id?: string
          sso_provider_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "saml_relay_states_flow_state_id_fkey"
            columns: ["flow_state_id"]
            isOneToOne: false
            referencedRelation: "flow_state"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saml_relay_states_sso_provider_id_fkey"
            columns: ["sso_provider_id"]
            isOneToOne: false
            referencedRelation: "sso_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      schema_migrations: {
        Row: {
          version: string
        }
        Insert: {
          version: string
        }
        Update: {
          version?: string
        }
        Relationships: []
      }
      sessions: {
        Row: {
          aal: Database["auth"]["Enums"]["aal_level"] | null
          created_at: string | null
          factor_id: string | null
          id: string
          ip: unknown
          not_after: string | null
          oauth_client_id: string | null
          refresh_token_counter: number | null
          refresh_token_hmac_key: string | null
          refreshed_at: string | null
          scopes: string | null
          tag: string | null
          updated_at: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          aal?: Database["auth"]["Enums"]["aal_level"] | null
          created_at?: string | null
          factor_id?: string | null
          id: string
          ip?: unknown
          not_after?: string | null
          oauth_client_id?: string | null
          refresh_token_counter?: number | null
          refresh_token_hmac_key?: string | null
          refreshed_at?: string | null
          scopes?: string | null
          tag?: string | null
          updated_at?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          aal?: Database["auth"]["Enums"]["aal_level"] | null
          created_at?: string | null
          factor_id?: string | null
          id?: string
          ip?: unknown
          not_after?: string | null
          oauth_client_id?: string | null
          refresh_token_counter?: number | null
          refresh_token_hmac_key?: string | null
          refreshed_at?: string | null
          scopes?: string | null
          tag?: string | null
          updated_at?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sessions_oauth_client_id_fkey"
            columns: ["oauth_client_id"]
            isOneToOne: false
            referencedRelation: "oauth_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      sso_domains: {
        Row: {
          created_at: string | null
          domain: string
          id: string
          sso_provider_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          domain: string
          id: string
          sso_provider_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          domain?: string
          id?: string
          sso_provider_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sso_domains_sso_provider_id_fkey"
            columns: ["sso_provider_id"]
            isOneToOne: false
            referencedRelation: "sso_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      sso_providers: {
        Row: {
          created_at: string | null
          disabled: boolean | null
          id: string
          resource_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          disabled?: boolean | null
          id: string
          resource_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          disabled?: boolean | null
          id?: string
          resource_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
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
          is_anonymous: boolean
          is_sso_user: boolean
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
          is_anonymous?: boolean
          is_sso_user?: boolean
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
          is_anonymous?: boolean
          is_sso_user?: boolean
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
      webauthn_challenges: {
        Row: {
          challenge_type: string
          created_at: string
          expires_at: string
          id: string
          session_data: Json
          user_id: string | null
        }
        Insert: {
          challenge_type: string
          created_at?: string
          expires_at: string
          id?: string
          session_data: Json
          user_id?: string | null
        }
        Update: {
          challenge_type?: string
          created_at?: string
          expires_at?: string
          id?: string
          session_data?: Json
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "webauthn_challenges_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      webauthn_credentials: {
        Row: {
          aaguid: string | null
          attestation_type: string
          backed_up: boolean
          backup_eligible: boolean
          created_at: string
          credential_id: string
          friendly_name: string
          id: string
          last_used_at: string | null
          public_key: string
          sign_count: number
          transports: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          aaguid?: string | null
          attestation_type?: string
          backed_up?: boolean
          backup_eligible?: boolean
          created_at?: string
          credential_id: string
          friendly_name?: string
          id?: string
          last_used_at?: string | null
          public_key: string
          sign_count?: number
          transports?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          aaguid?: string | null
          attestation_type?: string
          backed_up?: boolean
          backup_eligible?: boolean
          created_at?: string
          credential_id?: string
          friendly_name?: string
          id?: string
          last_used_at?: string | null
          public_key?: string
          sign_count?: number
          transports?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "webauthn_credentials_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      email: { Args: never; Returns: string }
      jwt: { Args: never; Returns: Json }
      role: { Args: never; Returns: string }
      uid: { Args: never; Returns: string }
    }
    Enums: {
      aal_level: "aal1" | "aal2" | "aal3"
      code_challenge_method: "s256" | "plain"
      factor_status: "unverified" | "verified"
      factor_type: "totp" | "webauthn" | "phone"
      oauth_authorization_status: "pending" | "approved" | "denied" | "expired"
      oauth_client_type: "public" | "confidential"
      oauth_registration_type: "dynamic" | "manual"
      oauth_response_type: "code"
      one_time_token_type:
        | "confirmation_token"
        | "reauthentication_token"
        | "recovery_token"
        | "email_change_token_new"
        | "email_change_token_current"
        | "phone_change_token"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  btp: {
    Tables: {
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
          released_at: string | null
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
          released_at?: string | null
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
          released_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_bank_guarantees_project"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
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
      boq_alignment_history: {
        Row: {
          created_at: string
          created_by: string | null
          extracted_name: string
          id: string
          normalized_key: string
          occurrences: number
          resource_id: string
          resource_type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          extracted_name: string
          id?: string
          normalized_key: string
          occurrences?: number
          resource_id: string
          resource_type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          extracted_name?: string
          id?: string
          normalized_key?: string
          occurrences?: number
          resource_id?: string
          resource_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      boq_lines: {
        Row: {
          btp_code: string | null
          category: string | null
          code: string | null
          created_at: string
          designation: string
          discount: number
          document_id: string | null
          dqe_type: string | null
          element_type: string | null
          estimate_id: string | null
          fees: number
          height: number | null
          id: string
          import_source: string | null
          length: number | null
          line_type: string
          metadata: Json
          milestone_code: string | null
          milestone_id: string | null
          note: string | null
          phase_code: string | null
          phase_id: string | null
          project_id: string | null
          quantity: number
          ras_rate: number | null
          recipient_id: string | null
          resource_id: string | null
          resource_kind: string | null
          sender_id: string | null
          source_type: string | null
          status: string
          submission_id: string | null
          task_code: string | null
          task_id: string | null
          tender_id: string | null
          total_ht: number | null
          total_ras: number | null
          total_ttc: number | null
          total_tva: number | null
          unit: string | null
          unit_price_ht: number | null
          updated_at: string
          vat_rate: number | null
          width: number | null
        }
        Insert: {
          btp_code?: string | null
          category?: string | null
          code?: string | null
          created_at?: string
          designation: string
          discount?: number
          document_id?: string | null
          dqe_type?: string | null
          element_type?: string | null
          estimate_id?: string | null
          fees?: number
          height?: number | null
          id?: string
          import_source?: string | null
          length?: number | null
          line_type: string
          metadata?: Json
          milestone_code?: string | null
          milestone_id?: string | null
          note?: string | null
          phase_code?: string | null
          phase_id?: string | null
          project_id?: string | null
          quantity?: number
          ras_rate?: number | null
          recipient_id?: string | null
          resource_id?: string | null
          resource_kind?: string | null
          sender_id?: string | null
          source_type?: string | null
          status?: string
          submission_id?: string | null
          task_code?: string | null
          task_id?: string | null
          tender_id?: string | null
          total_ht?: number | null
          total_ras?: number | null
          total_ttc?: number | null
          total_tva?: number | null
          unit?: string | null
          unit_price_ht?: number | null
          updated_at?: string
          vat_rate?: number | null
          width?: number | null
        }
        Update: {
          btp_code?: string | null
          category?: string | null
          code?: string | null
          created_at?: string
          designation?: string
          discount?: number
          document_id?: string | null
          dqe_type?: string | null
          element_type?: string | null
          estimate_id?: string | null
          fees?: number
          height?: number | null
          id?: string
          import_source?: string | null
          length?: number | null
          line_type?: string
          metadata?: Json
          milestone_code?: string | null
          milestone_id?: string | null
          note?: string | null
          phase_code?: string | null
          phase_id?: string | null
          project_id?: string | null
          quantity?: number
          ras_rate?: number | null
          recipient_id?: string | null
          resource_id?: string | null
          resource_kind?: string | null
          sender_id?: string | null
          source_type?: string | null
          status?: string
          submission_id?: string | null
          task_code?: string | null
          task_id?: string | null
          tender_id?: string | null
          total_ht?: number | null
          total_ras?: number | null
          total_ttc?: number | null
          total_tva?: number | null
          unit?: string | null
          unit_price_ht?: number | null
          updated_at?: string
          vat_rate?: number | null
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "boq_lines_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      compliance_audit_log: {
        Row: {
          changed_at: string | null
          changed_by: string
          compliance_item_id: string
          field_name: string
          id: string
          new_value: string | null
          old_value: string | null
        }
        Insert: {
          changed_at?: string | null
          changed_by: string
          compliance_item_id: string
          field_name: string
          id?: string
          new_value?: string | null
          old_value?: string | null
        }
        Update: {
          changed_at?: string | null
          changed_by?: string
          compliance_item_id?: string
          field_name?: string
          id?: string
          new_value?: string | null
          old_value?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_compliance_audit_item"
            columns: ["compliance_item_id"]
            isOneToOne: false
            referencedRelation: "compliance_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_compliance_audit_item"
            columns: ["compliance_item_id"]
            isOneToOne: false
            referencedRelation: "compliance_items_with_details"
            referencedColumns: ["id"]
          },
        ]
      }
      compliance_documents: {
        Row: {
          category: string
          compliance_item_id: string
          created_at: string | null
          document_id: string
          id: string
          is_required: boolean | null
          subcategory: string | null
          uploaded_by: string | null
        }
        Insert: {
          category: string
          compliance_item_id: string
          created_at?: string | null
          document_id: string
          id?: string
          is_required?: boolean | null
          subcategory?: string | null
          uploaded_by?: string | null
        }
        Update: {
          category?: string
          compliance_item_id?: string
          created_at?: string | null
          document_id?: string
          id?: string
          is_required?: boolean | null
          subcategory?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_compliance_documents_document"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_compliance_documents_item"
            columns: ["compliance_item_id"]
            isOneToOne: false
            referencedRelation: "compliance_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_compliance_documents_item"
            columns: ["compliance_item_id"]
            isOneToOne: false
            referencedRelation: "compliance_items_with_details"
            referencedColumns: ["id"]
          },
        ]
      }
      compliance_items: {
        Row: {
          bank_guarantee_id: string | null
          created_at: string | null
          created_by: string
          deadline: string | null
          description: string | null
          id: string
          priority: string
          project_id: string
          responsible: string
          status: string
          title: string
          type: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          bank_guarantee_id?: string | null
          created_at?: string | null
          created_by: string
          deadline?: string | null
          description?: string | null
          id?: string
          priority?: string
          project_id: string
          responsible: string
          status?: string
          title: string
          type: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          bank_guarantee_id?: string | null
          created_at?: string | null
          created_by?: string
          deadline?: string | null
          description?: string | null
          id?: string
          priority?: string
          project_id?: string
          responsible?: string
          status?: string
          title?: string
          type?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_compliance_items_bank_guarantee"
            columns: ["bank_guarantee_id"]
            isOneToOne: false
            referencedRelation: "bank_guarantees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_compliance_items_project"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      compliance_notes: {
        Row: {
          compliance_item_id: string
          created_at: string | null
          created_by: string
          id: string
          note: string
        }
        Insert: {
          compliance_item_id: string
          created_at?: string | null
          created_by: string
          id?: string
          note: string
        }
        Update: {
          compliance_item_id?: string
          created_at?: string | null
          created_by?: string
          id?: string
          note?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_compliance_notes_item"
            columns: ["compliance_item_id"]
            isOneToOne: false
            referencedRelation: "compliance_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_compliance_notes_item"
            columns: ["compliance_item_id"]
            isOneToOne: false
            referencedRelation: "compliance_items_with_details"
            referencedColumns: ["id"]
          },
        ]
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
      document_validation_logs: {
        Row: {
          created_at: string
          document_id: string
          errors: Json | null
          id: string
          is_valid: boolean
          processing_time_ms: number
          submission_id: string
          validated_at: string
          validated_by: string | null
          validation_type: string
          warnings: Json | null
        }
        Insert: {
          created_at?: string
          document_id: string
          errors?: Json | null
          id?: string
          is_valid?: boolean
          processing_time_ms?: number
          submission_id: string
          validated_at?: string
          validated_by?: string | null
          validation_type?: string
          warnings?: Json | null
        }
        Update: {
          created_at?: string
          document_id?: string
          errors?: Json | null
          id?: string
          is_valid?: boolean
          processing_time_ms?: number
          submission_id?: string
          validated_at?: string
          validated_by?: string | null
          validation_type?: string
          warnings?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "document_validation_logs_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_validation_logs_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "tender_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          access_level: string | null
          approval_date: string | null
          approval_status: string | null
          approved_by: string | null
          assigned_to: string | null
          created_at: string | null
          deadline_date: string | null
          description: string | null
          document_hash: string | null
          document_type: string | null
          document_version: string | null
          expiry_date: string | null
          file_name: string | null
          file_size: number | null
          file_url: string | null
          id: string
          inspection_id: string | null
          is_internal_only: boolean | null
          is_shared_with_suppliers: boolean | null
          metadata: Json | null
          mime_type: string | null
          parent_document_id: string | null
          payment_id: string | null
          phase_id: string | null
          project_id: string | null
          shared_date: string | null
          status: string | null
          supplier_id: string | null
          tags: string[] | null
          tender_document_id: string | null
          title: string | null
          updated_at: string | null
          uploaded_by: string | null
        }
        Insert: {
          access_level?: string | null
          approval_date?: string | null
          approval_status?: string | null
          approved_by?: string | null
          assigned_to?: string | null
          created_at?: string | null
          deadline_date?: string | null
          description?: string | null
          document_hash?: string | null
          document_type?: string | null
          document_version?: string | null
          expiry_date?: string | null
          file_name?: string | null
          file_size?: number | null
          file_url?: string | null
          id?: string
          inspection_id?: string | null
          is_internal_only?: boolean | null
          is_shared_with_suppliers?: boolean | null
          metadata?: Json | null
          mime_type?: string | null
          parent_document_id?: string | null
          payment_id?: string | null
          phase_id?: string | null
          project_id?: string | null
          shared_date?: string | null
          status?: string | null
          supplier_id?: string | null
          tags?: string[] | null
          tender_document_id?: string | null
          title?: string | null
          updated_at?: string | null
          uploaded_by?: string | null
        }
        Update: {
          access_level?: string | null
          approval_date?: string | null
          approval_status?: string | null
          approved_by?: string | null
          assigned_to?: string | null
          created_at?: string | null
          deadline_date?: string | null
          description?: string | null
          document_hash?: string | null
          document_type?: string | null
          document_version?: string | null
          expiry_date?: string | null
          file_name?: string | null
          file_size?: number | null
          file_url?: string | null
          id?: string
          inspection_id?: string | null
          is_internal_only?: boolean | null
          is_shared_with_suppliers?: boolean | null
          metadata?: Json | null
          mime_type?: string | null
          parent_document_id?: string | null
          payment_id?: string | null
          phase_id?: string | null
          project_id?: string | null
          shared_date?: string | null
          status?: string | null
          supplier_id?: string | null
          tags?: string[] | null
          tender_document_id?: string | null
          title?: string | null
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
            referencedRelation: "phases"
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
            foreignKeyName: "documents_tender_document_id_fkey"
            columns: ["tender_document_id"]
            isOneToOne: false
            referencedRelation: "tender_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      email_logs: {
        Row: {
          body: string | null
          created_at: string
          email_from: string
          email_to: string
          error_message: string | null
          id: string
          metadata: Json | null
          status: string | null
          subject: string
          template_name: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          body?: string | null
          created_at?: string
          email_from: string
          email_to: string
          error_message?: string | null
          id?: string
          metadata?: Json | null
          status?: string | null
          subject: string
          template_name?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          body?: string | null
          created_at?: string
          email_from?: string
          email_to?: string
          error_message?: string | null
          id?: string
          metadata?: Json | null
          status?: string | null
          subject?: string
          template_name?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      employees: {
        Row: {
          certifications: Json | null
          created_at: string | null
          department: string | null
          email: string | null
          employee_id: string | null
          full_name: string | null
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
          employee_id?: string | null
          full_name?: string | null
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
          employee_id?: string | null
          full_name?: string | null
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
      inspections: {
        Row: {
          comments: string | null
          created_at: string | null
          date: string | null
          documents: Json | null
          id: string
          inspector: string | null
          payment_type: string | null
          phase_id: string | null
          progress_at_inspection: number | null
          project_id: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          comments?: string | null
          created_at?: string | null
          date?: string | null
          documents?: Json | null
          id?: string
          inspector?: string | null
          payment_type?: string | null
          phase_id?: string | null
          progress_at_inspection?: number | null
          project_id: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          comments?: string | null
          created_at?: string | null
          date?: string | null
          documents?: Json | null
          id?: string
          inspector?: string | null
          payment_type?: string | null
          phase_id?: string | null
          progress_at_inspection?: number | null
          project_id?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inspections_phase_id_fkey"
            columns: ["phase_id"]
            isOneToOne: false
            referencedRelation: "phases"
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
          available_quantity: number | null
          category: string | null
          coordinates_latitude: number | null
          coordinates_longitude: number | null
          created_at: string | null
          description: string | null
          ean: string | null
          forme: string | null
          gtin: string | null
          id: string
          image: string | null
          last_restock: string | null
          lead_time_days: number | null
          localisation: Json | null
          material_code: string | null
          material_status: string | null
          maximum_stock: number | null
          min_quantity: number | null
          minimum_stock: number | null
          multilang_labels: Json | null
          name: string | null
          origin_location: string | null
          price_per_unit: number | null
          quality_grade: string | null
          quantity: number | null
          sku: string | null
          subcategory: string | null
          supplier: Json | null
          supplier_id: string | null
          tags: Json | null
          technical_specifications: Json | null
          timeline: Json | null
          unit: string | null
          updated_at: string | null
          workspace_id: string | null
        }
        Insert: {
          adresse?: Json | null
          asin?: string | null
          available_quantity?: number | null
          category?: string | null
          coordinates_latitude?: number | null
          coordinates_longitude?: number | null
          created_at?: string | null
          description?: string | null
          ean?: string | null
          forme?: string | null
          gtin?: string | null
          id?: string
          image?: string | null
          last_restock?: string | null
          lead_time_days?: number | null
          localisation?: Json | null
          material_code?: string | null
          material_status?: string | null
          maximum_stock?: number | null
          min_quantity?: number | null
          minimum_stock?: number | null
          multilang_labels?: Json | null
          name?: string | null
          origin_location?: string | null
          price_per_unit?: number | null
          quality_grade?: string | null
          quantity?: number | null
          sku?: string | null
          subcategory?: string | null
          supplier?: Json | null
          supplier_id?: string | null
          tags?: Json | null
          technical_specifications?: Json | null
          timeline?: Json | null
          unit?: string | null
          updated_at?: string | null
          workspace_id?: string | null
        }
        Update: {
          adresse?: Json | null
          asin?: string | null
          available_quantity?: number | null
          category?: string | null
          coordinates_latitude?: number | null
          coordinates_longitude?: number | null
          created_at?: string | null
          description?: string | null
          ean?: string | null
          forme?: string | null
          gtin?: string | null
          id?: string
          image?: string | null
          last_restock?: string | null
          lead_time_days?: number | null
          localisation?: Json | null
          material_code?: string | null
          material_status?: string | null
          maximum_stock?: number | null
          min_quantity?: number | null
          minimum_stock?: number | null
          multilang_labels?: Json | null
          name?: string | null
          origin_location?: string | null
          price_per_unit?: number | null
          quality_grade?: string | null
          quantity?: number | null
          sku?: string | null
          subcategory?: string | null
          supplier?: Json | null
          supplier_id?: string | null
          tags?: Json | null
          technical_specifications?: Json | null
          timeline?: Json | null
          unit?: string | null
          updated_at?: string | null
          workspace_id?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string | null
          data: Json | null
          expires_at: string | null
          id: string
          is_read: boolean | null
          message: string
          read: boolean | null
          recipient_id: string | null
          related_id: string | null
          title: string
          type: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          data?: Json | null
          expires_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          read?: boolean | null
          recipient_id?: string | null
          related_id?: string | null
          title: string
          type?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          data?: Json | null
          expires_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          read?: boolean | null
          recipient_id?: string | null
          related_id?: string | null
          title?: string
          type?: string | null
          user_id?: string
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
          external_ref: string | null
          id: string
          is_active: boolean
          logo_url: string | null
          name: string
          org_type: string | null
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
          external_ref?: string | null
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name: string
          org_type?: string | null
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
          external_ref?: string | null
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name?: string
          org_type?: string | null
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
        Relationships: [
          {
            foreignKeyName: "fk_payment_blocks_project"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
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
      payments: {
        Row: {
          account_number: string | null
          amount: number | null
          bank_name: string | null
          check_number: string | null
          contractor_contact: string | null
          contractor_id: string | null
          contractor_name: string | null
          created_at: string | null
          created_by: string | null
          id: string
          inspection_id: string | null
          mobile_number: string | null
          mobile_operator: string | null
          payment_date: string | null
          payment_method: string | null
          phase_id: string | null
          progress_at_payment: number | null
          project_id: string | null
          project_status: string | null
          receiver_name: string | null
          transaction_id: string | null
          updated_at: string | null
        }
        Insert: {
          account_number?: string | null
          amount?: number | null
          bank_name?: string | null
          check_number?: string | null
          contractor_contact?: string | null
          contractor_id?: string | null
          contractor_name?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          inspection_id?: string | null
          mobile_number?: string | null
          mobile_operator?: string | null
          payment_date?: string | null
          payment_method?: string | null
          phase_id?: string | null
          progress_at_payment?: number | null
          project_id?: string | null
          project_status?: string | null
          receiver_name?: string | null
          transaction_id?: string | null
          updated_at?: string | null
        }
        Update: {
          account_number?: string | null
          amount?: number | null
          bank_name?: string | null
          check_number?: string | null
          contractor_contact?: string | null
          contractor_id?: string | null
          contractor_name?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          inspection_id?: string | null
          mobile_number?: string | null
          mobile_operator?: string | null
          payment_date?: string | null
          payment_method?: string | null
          phase_id?: string | null
          progress_at_payment?: number | null
          project_id?: string | null
          project_status?: string | null
          receiver_name?: string | null
          transaction_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_inspection_id_fkey"
            columns: ["inspection_id"]
            isOneToOne: false
            referencedRelation: "inspections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_phase_id_fkey"
            columns: ["phase_id"]
            isOneToOne: false
            referencedRelation: "phases"
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
      phases: {
        Row: {
          actual_cost: number | null
          budget: number | null
          created_at: string | null
          custom_phase_number: number | null
          custom_stages: Json | null
          description: string | null
          end_date: string | null
          estimated_duration: number | null
          human_resources: Json | null
          id: string
          location: string | null
          materials: Json | null
          notes: string | null
          phase_name: string
          phase_type: string
          progress: number | null
          project_id: string
          stage_name: string | null
          start_date: string | null
          status: string
          suppliers: Json | null
          title: string
          updated_at: string | null
        }
        Insert: {
          actual_cost?: number | null
          budget?: number | null
          created_at?: string | null
          custom_phase_number?: number | null
          custom_stages?: Json | null
          description?: string | null
          end_date?: string | null
          estimated_duration?: number | null
          human_resources?: Json | null
          id?: string
          location?: string | null
          materials?: Json | null
          notes?: string | null
          phase_name: string
          phase_type?: string
          progress?: number | null
          project_id: string
          stage_name?: string | null
          start_date?: string | null
          status?: string
          suppliers?: Json | null
          title: string
          updated_at?: string | null
        }
        Update: {
          actual_cost?: number | null
          budget?: number | null
          created_at?: string | null
          custom_phase_number?: number | null
          custom_stages?: Json | null
          description?: string | null
          end_date?: string | null
          estimated_duration?: number | null
          human_resources?: Json | null
          id?: string
          location?: string | null
          materials?: Json | null
          notes?: string | null
          phase_name?: string
          phase_type?: string
          progress?: number | null
          project_id?: string
          stage_name?: string | null
          start_date?: string | null
          status?: string
          suppliers?: Json | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "phases_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
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
      progress_invoices: {
        Row: {
          consultant_approval_status: string | null
          consultant_comments: string | null
          consultant_id: string | null
          consultant_validated_at: string | null
          created_at: string
          cumulative_paid: number | null
          donor_approval_required: boolean | null
          donor_approved_at: string | null
          donor_comments: string | null
          id: string
          inspection_id: string | null
          inspection_report_url: string | null
          invoice_amount: number | null
          invoice_number: string | null
          invoice_type: string | null
          lot_details: Json | null
          ministry_comments: string | null
          ministry_reviewer_id: string | null
          ministry_validated_at: string | null
          paid_at: string | null
          previous_progress: number | null
          progress_increment: number | null
          progress_percentage: number | null
          project_id: string | null
          quantities_executed: Json | null
          retention_amount: number | null
          service_fait_document_id: string | null
          status: string | null
          submitted_at: string | null
          submitted_by: string | null
          supporting_documents: Json | null
          total_contract_amount: number | null
          updated_at: string
          work_description: string | null
          workflow_history: Json | null
        }
        Insert: {
          consultant_approval_status?: string | null
          consultant_comments?: string | null
          consultant_id?: string | null
          consultant_validated_at?: string | null
          created_at?: string
          cumulative_paid?: number | null
          donor_approval_required?: boolean | null
          donor_approved_at?: string | null
          donor_comments?: string | null
          id?: string
          inspection_id?: string | null
          inspection_report_url?: string | null
          invoice_amount?: number | null
          invoice_number?: string | null
          invoice_type?: string | null
          lot_details?: Json | null
          ministry_comments?: string | null
          ministry_reviewer_id?: string | null
          ministry_validated_at?: string | null
          paid_at?: string | null
          previous_progress?: number | null
          progress_increment?: number | null
          progress_percentage?: number | null
          project_id?: string | null
          quantities_executed?: Json | null
          retention_amount?: number | null
          service_fait_document_id?: string | null
          status?: string | null
          submitted_at?: string | null
          submitted_by?: string | null
          supporting_documents?: Json | null
          total_contract_amount?: number | null
          updated_at?: string
          work_description?: string | null
          workflow_history?: Json | null
        }
        Update: {
          consultant_approval_status?: string | null
          consultant_comments?: string | null
          consultant_id?: string | null
          consultant_validated_at?: string | null
          created_at?: string
          cumulative_paid?: number | null
          donor_approval_required?: boolean | null
          donor_approved_at?: string | null
          donor_comments?: string | null
          id?: string
          inspection_id?: string | null
          inspection_report_url?: string | null
          invoice_amount?: number | null
          invoice_number?: string | null
          invoice_type?: string | null
          lot_details?: Json | null
          ministry_comments?: string | null
          ministry_reviewer_id?: string | null
          ministry_validated_at?: string | null
          paid_at?: string | null
          previous_progress?: number | null
          progress_increment?: number | null
          progress_percentage?: number | null
          project_id?: string | null
          quantities_executed?: Json | null
          retention_amount?: number | null
          service_fait_document_id?: string | null
          status?: string | null
          submitted_at?: string | null
          submitted_by?: string | null
          supporting_documents?: Json | null
          total_contract_amount?: number | null
          updated_at?: string
          work_description?: string | null
          workflow_history?: Json | null
        }
        Relationships: [
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
        ]
      }
      project_alerts: {
        Row: {
          acknowledged: boolean | null
          acknowledged_at: string | null
          acknowledged_by: string | null
          action_proof: Json | null
          action_required: boolean | null
          action_taken: string | null
          action_taken_at: string | null
          action_taken_by: string | null
          available_actions: string[] | null
          created_at: string
          deadline: string | null
          delay_days: number | null
          escalation_level: number | null
          id: string
          message: string
          metadata: Json | null
          project_id: string
          project_title: string | null
          recurrence: string | null
          related_entity_id: string | null
          resolved_at: string | null
          severity: string
          source: string
          status: string
          timestamp: string | null
          title: string
          trigger_date: string | null
          type: string
          updated_at: string
        }
        Insert: {
          acknowledged?: boolean | null
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          action_proof?: Json | null
          action_required?: boolean | null
          action_taken?: string | null
          action_taken_at?: string | null
          action_taken_by?: string | null
          available_actions?: string[] | null
          created_at?: string
          deadline?: string | null
          delay_days?: number | null
          escalation_level?: number | null
          id?: string
          message: string
          metadata?: Json | null
          project_id: string
          project_title?: string | null
          recurrence?: string | null
          related_entity_id?: string | null
          resolved_at?: string | null
          severity: string
          source: string
          status?: string
          timestamp?: string | null
          title: string
          trigger_date?: string | null
          type: string
          updated_at?: string
        }
        Update: {
          acknowledged?: boolean | null
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          action_proof?: Json | null
          action_required?: boolean | null
          action_taken?: string | null
          action_taken_at?: string | null
          action_taken_by?: string | null
          available_actions?: string[] | null
          created_at?: string
          deadline?: string | null
          delay_days?: number | null
          escalation_level?: number | null
          id?: string
          message?: string
          metadata?: Json | null
          project_id?: string
          project_title?: string | null
          recurrence?: string | null
          related_entity_id?: string | null
          resolved_at?: string | null
          severity?: string
          source?: string
          status?: string
          timestamp?: string | null
          title?: string
          trigger_date?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      project_budget_links: {
        Row: {
          action_code: string | null
          allocated_ce: number
          allocated_cp: number
          chapter_code: string | null
          created_at: string
          created_by: string | null
          fiscal_year: number
          id: string
          line_code: string | null
          ministry_code: string | null
          notes: string | null
          program_code: string | null
          project_id: string
          updated_at: string
        }
        Insert: {
          action_code?: string | null
          allocated_ce?: number
          allocated_cp?: number
          chapter_code?: string | null
          created_at?: string
          created_by?: string | null
          fiscal_year?: number
          id?: string
          line_code?: string | null
          ministry_code?: string | null
          notes?: string | null
          program_code?: string | null
          project_id: string
          updated_at?: string
        }
        Update: {
          action_code?: string | null
          allocated_ce?: number
          allocated_cp?: number
          chapter_code?: string | null
          created_at?: string
          created_by?: string | null
          fiscal_year?: number
          id?: string
          line_code?: string | null
          ministry_code?: string | null
          notes?: string | null
          program_code?: string | null
          project_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_budget_links_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
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
      project_contacts: {
        Row: {
          company: string | null
          created_at: string
          email: string
          id: string
          is_primary: boolean
          name: string
          phone: string | null
          project_id: string
          role: string
          updated_at: string
        }
        Insert: {
          company?: string | null
          created_at?: string
          email: string
          id?: string
          is_primary?: boolean
          name: string
          phone?: string | null
          project_id: string
          role: string
          updated_at?: string
        }
        Update: {
          company?: string | null
          created_at?: string
          email?: string
          id?: string
          is_primary?: boolean
          name?: string
          phone?: string | null
          project_id?: string
          role?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_contacts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_documents: {
        Row: {
          id: string
          name: string
          project_id: string | null
          type: string
          uploaded_at: string | null
          url: string
        }
        Insert: {
          id?: string
          name: string
          project_id?: string | null
          type: string
          uploaded_at?: string | null
          url: string
        }
        Update: {
          id?: string
          name?: string
          project_id?: string | null
          type?: string
          uploaded_at?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_documents_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_hierarchy_nodes: {
        Row: {
          created_at: string
          id: string
          level: number
          metadata: Json
          name: string
          order_index: number
          parent_id: string | null
          path: string
          project_id: string
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          level?: number
          metadata?: Json
          name: string
          order_index?: number
          parent_id?: string | null
          path?: string
          project_id: string
          type?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          level?: number
          metadata?: Json
          name?: string
          order_index?: number
          parent_id?: string | null
          path?: string
          project_id?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_hierarchy_nodes_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "project_hierarchy_nodes"
            referencedColumns: ["id"]
          },
        ]
      }
      project_insurance_policies: {
        Row: {
          alert_sent: boolean | null
          amount: number
          coverage: string
          created_at: string
          documents: string[] | null
          end_date: string
          id: string
          issuer: string
          notes: string | null
          project_id: string
          reference: string
          renewal_date: string | null
          start_date: string
          status: string
          type: string
          updated_at: string
        }
        Insert: {
          alert_sent?: boolean | null
          amount: number
          coverage: string
          created_at?: string
          documents?: string[] | null
          end_date: string
          id?: string
          issuer: string
          notes?: string | null
          project_id: string
          reference: string
          renewal_date?: string | null
          start_date: string
          status?: string
          type: string
          updated_at?: string
        }
        Update: {
          alert_sent?: boolean | null
          amount?: number
          coverage?: string
          created_at?: string
          documents?: string[] | null
          end_date?: string
          id?: string
          issuer?: string
          notes?: string | null
          project_id?: string
          reference?: string
          renewal_date?: string | null
          start_date?: string
          status?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_insurance_policies_project_id_fkey"
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
          quantity?: number
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
            referencedRelation: "phases"
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
          actual_material_cost: number | null
          approval_requirements: string[] | null
          assigned_to: string | null
          completion_date: string | null
          created_at: string | null
          created_by: string | null
          deliverables: Json | null
          dependencies: Json | null
          description: string | null
          expected_deliverables: string[] | null
          id: string
          is_critical: boolean | null
          is_from_template: boolean | null
          material_cost_estimate: number | null
          material_usage: Json
          milestone_type: string | null
          notes: string | null
          phase_id: string | null
          predecessor_ids: string[] | null
          priority: string | null
          progress_percentage: number | null
          project_id: string
          relative_offset_days: number | null
          stage_type: string | null
          status: string | null
          tags: string[] | null
          target_date: string | null
          title: string
          type: string | null
          updated_at: string | null
          weight: number | null
        }
        Insert: {
          actual_material_cost?: number | null
          approval_requirements?: string[] | null
          assigned_to?: string | null
          completion_date?: string | null
          created_at?: string | null
          created_by?: string | null
          deliverables?: Json | null
          dependencies?: Json | null
          description?: string | null
          expected_deliverables?: string[] | null
          id?: string
          is_critical?: boolean | null
          is_from_template?: boolean | null
          material_cost_estimate?: number | null
          material_usage?: Json
          milestone_type?: string | null
          notes?: string | null
          phase_id?: string | null
          predecessor_ids?: string[] | null
          priority?: string | null
          progress_percentage?: number | null
          project_id: string
          relative_offset_days?: number | null
          stage_type?: string | null
          status?: string | null
          tags?: string[] | null
          target_date?: string | null
          title: string
          type?: string | null
          updated_at?: string | null
          weight?: number | null
        }
        Update: {
          actual_material_cost?: number | null
          approval_requirements?: string[] | null
          assigned_to?: string | null
          completion_date?: string | null
          created_at?: string | null
          created_by?: string | null
          deliverables?: Json | null
          dependencies?: Json | null
          description?: string | null
          expected_deliverables?: string[] | null
          id?: string
          is_critical?: boolean | null
          is_from_template?: boolean | null
          material_cost_estimate?: number | null
          material_usage?: Json
          milestone_type?: string | null
          notes?: string | null
          phase_id?: string | null
          predecessor_ids?: string[] | null
          priority?: string | null
          progress_percentage?: number | null
          project_id?: string
          relative_offset_days?: number | null
          stage_type?: string | null
          status?: string | null
          tags?: string[] | null
          target_date?: string | null
          title?: string
          type?: string | null
          updated_at?: string | null
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "project_milestones_phase_id_fkey"
            columns: ["phase_id"]
            isOneToOne: false
            referencedRelation: "project_phases"
            referencedColumns: ["id"]
          },
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
          actual_duration: number | null
          construction_phase: string | null
          construction_stage: string | null
          created_at: string
          created_by: string | null
          custom_phase_data: Json | null
          dependencies: Json | null
          description: string | null
          duration_days: number | null
          end_date: string
          estimated_cost: number | null
          estimated_duration: number
          external_ref: string | null
          human_resources: Json | null
          id: string
          location: string | null
          materials: Json | null
          milestones: Json | null
          notes: string | null
          order_index: number | null
          phase_code: string | null
          phase_name: string | null
          phase_type: string
          progress: number | null
          project_id: string
          start_date: string
          status: string
          suppliers: Json | null
          updated_at: string
          weight: number
        }
        Insert: {
          actual_cost?: number | null
          actual_duration?: number | null
          construction_phase?: string | null
          construction_stage?: string | null
          created_at?: string
          created_by?: string | null
          custom_phase_data?: Json | null
          dependencies?: Json | null
          description?: string | null
          duration_days?: number | null
          end_date: string
          estimated_cost?: number | null
          estimated_duration: number
          external_ref?: string | null
          human_resources?: Json | null
          id?: string
          location?: string | null
          materials?: Json | null
          milestones?: Json | null
          notes?: string | null
          order_index?: number | null
          phase_code?: string | null
          phase_name?: string | null
          phase_type?: string
          progress?: number | null
          project_id: string
          start_date: string
          status?: string
          suppliers?: Json | null
          updated_at?: string
          weight?: number
        }
        Update: {
          actual_cost?: number | null
          actual_duration?: number | null
          construction_phase?: string | null
          construction_stage?: string | null
          created_at?: string
          created_by?: string | null
          custom_phase_data?: Json | null
          dependencies?: Json | null
          description?: string | null
          duration_days?: number | null
          end_date?: string
          estimated_cost?: number | null
          estimated_duration?: number
          external_ref?: string | null
          human_resources?: Json | null
          id?: string
          location?: string | null
          materials?: Json | null
          milestones?: Json | null
          notes?: string | null
          order_index?: number | null
          phase_code?: string | null
          phase_name?: string | null
          phase_type?: string
          progress?: number | null
          project_id?: string
          start_date?: string
          status?: string
          suppliers?: Json | null
          updated_at?: string
          weight?: number
        }
        Relationships: [
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
          contract_type: string | null
          created_at: string
          employee_id: string | null
          end_date: string | null
          external_email: string | null
          external_name: string | null
          external_phone: string | null
          external_ref: string | null
          hourly_rate: number | null
          id: string
          is_active: boolean
          is_primary: boolean | null
          notes: string | null
          organization_id: string | null
          project_id: string
          responsibilities: string[] | null
          role_description: string | null
          stakeholder_entity_type: string
          stakeholder_type: string
          start_date: string | null
          supplier_id: string | null
          updated_at: string
        }
        Insert: {
          contract_type?: string | null
          created_at?: string
          employee_id?: string | null
          end_date?: string | null
          external_email?: string | null
          external_name?: string | null
          external_phone?: string | null
          external_ref?: string | null
          hourly_rate?: number | null
          id?: string
          is_active?: boolean
          is_primary?: boolean | null
          notes?: string | null
          organization_id?: string | null
          project_id: string
          responsibilities?: string[] | null
          role_description?: string | null
          stakeholder_entity_type: string
          stakeholder_type: string
          start_date?: string | null
          supplier_id?: string | null
          updated_at?: string
        }
        Update: {
          contract_type?: string | null
          created_at?: string
          employee_id?: string | null
          end_date?: string | null
          external_email?: string | null
          external_name?: string | null
          external_phone?: string | null
          external_ref?: string | null
          hourly_rate?: number | null
          id?: string
          is_active?: boolean
          is_primary?: boolean | null
          notes?: string | null
          organization_id?: string | null
          project_id?: string
          responsibilities?: string[] | null
          role_description?: string | null
          stakeholder_entity_type?: string
          stakeholder_type?: string
          start_date?: string | null
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
            foreignKeyName: "project_stakeholders_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
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
      project_strategy_links: {
        Row: {
          chantier_code: string | null
          contribution_pct: number
          created_at: string
          created_by: string | null
          id: string
          intervention_code: string | null
          justification: string | null
          lever_code: string | null
          objective_code: string | null
          project_id: string
          source_referential: string
          updated_at: string
        }
        Insert: {
          chantier_code?: string | null
          contribution_pct?: number
          created_at?: string
          created_by?: string | null
          id?: string
          intervention_code?: string | null
          justification?: string | null
          lever_code?: string | null
          objective_code?: string | null
          project_id: string
          source_referential?: string
          updated_at?: string
        }
        Update: {
          chantier_code?: string | null
          contribution_pct?: number
          created_at?: string
          created_by?: string | null
          id?: string
          intervention_code?: string | null
          justification?: string | null
          lever_code?: string | null
          objective_code?: string | null
          project_id?: string
          source_referential?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_strategy_links_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_tasks: {
        Row: {
          actual_cost: number | null
          actual_duration: number | null
          assigned_to: string[] | null
          cost_estimate: number | null
          created_at: string
          critical_path: boolean | null
          dependencies: string[] | null
          description: string | null
          end_date: string
          estimated_duration: number
          gantt_color: string | null
          id: string
          name: string
          optimistic_estimate: number | null
          pessimistic_estimate: number | null
          phase_id: string | null
          progress: number
          project_id: string
          start_date: string
          status: string
          updated_at: string
          weight: number
        }
        Insert: {
          actual_cost?: number | null
          actual_duration?: number | null
          assigned_to?: string[] | null
          cost_estimate?: number | null
          created_at?: string
          critical_path?: boolean | null
          dependencies?: string[] | null
          description?: string | null
          end_date: string
          estimated_duration: number
          gantt_color?: string | null
          id?: string
          name: string
          optimistic_estimate?: number | null
          pessimistic_estimate?: number | null
          phase_id?: string | null
          progress?: number
          project_id: string
          start_date: string
          status?: string
          updated_at?: string
          weight?: number
        }
        Update: {
          actual_cost?: number | null
          actual_duration?: number | null
          assigned_to?: string[] | null
          cost_estimate?: number | null
          created_at?: string
          critical_path?: boolean | null
          dependencies?: string[] | null
          description?: string | null
          end_date?: string
          estimated_duration?: number
          gantt_color?: string | null
          id?: string
          name?: string
          optimistic_estimate?: number | null
          pessimistic_estimate?: number | null
          phase_id?: string | null
          progress?: number
          project_id?: string
          start_date?: string
          status?: string
          updated_at?: string
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "project_tasks_phase_id_fkey"
            columns: ["phase_id"]
            isOneToOne: false
            referencedRelation: "project_phases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          allows_initial_payment: boolean | null
          area_sqm: number | null
          attribution_date: string | null
          budget: number
          budget_sources: Json
          check_schedule: Json | null
          check_schedule_last_run: Json | null
          client_id: string | null
          completion_date: string | null
          coordinates_latitude: number | null
          coordinates_longitude: number | null
          created_at: string | null
          created_by: string | null
          currency: string | null
          current_phase: string | null
          current_stage: string | null
          department: string | null
          description: string
          donor_organization: string | null
          end_date: string | null
          engineering_consultant_id: string | null
          environmental_constraints: string | null
          escalation_thresholds: Json | null
          estimated_days: number | null
          external_ref: string | null
          financing_source: string | null
          forme: string | null
          geographic_zone: string | null
          has_utilities: boolean | null
          id: string
          initial_advance_percentage: number | null
          initial_payment_percentage: number | null
          launch_date: string | null
          localisation: Json | null
          location: string
          main_contractor: string | null
          market_type: string | null
          methodology: string | null
          organization_id: string | null
          payment_frequency: string | null
          payment_mode: string | null
          permit_number: string | null
          priority: string | null
          progress: number
          project_order: number | null
          project_reference: string | null
          project_reference_number: string | null
          project_responsable_id: string | null
          project_type: string | null
          reference: string | null
          referential_code: string | null
          requires_permits: boolean | null
          retention_percentage: number | null
          sector: string | null
          selection_mode: string | null
          site_details: string | null
          start_date: string | null
          status: string
          supervisor_id: string | null
          team_size: number
          technical_manager_id: string | null
          terrain_type: string | null
          thumbnail: string | null
          title: string
          updated_at: string | null
          workspace_id: string | null
        }
        Insert: {
          allows_initial_payment?: boolean | null
          area_sqm?: number | null
          attribution_date?: string | null
          budget?: number
          budget_sources?: Json
          check_schedule?: Json | null
          check_schedule_last_run?: Json | null
          client_id?: string | null
          completion_date?: string | null
          coordinates_latitude?: number | null
          coordinates_longitude?: number | null
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          current_phase?: string | null
          current_stage?: string | null
          department?: string | null
          description: string
          donor_organization?: string | null
          end_date?: string | null
          engineering_consultant_id?: string | null
          environmental_constraints?: string | null
          escalation_thresholds?: Json | null
          estimated_days?: number | null
          external_ref?: string | null
          financing_source?: string | null
          forme?: string | null
          geographic_zone?: string | null
          has_utilities?: boolean | null
          id?: string
          initial_advance_percentage?: number | null
          initial_payment_percentage?: number | null
          launch_date?: string | null
          localisation?: Json | null
          location: string
          main_contractor?: string | null
          market_type?: string | null
          methodology?: string | null
          organization_id?: string | null
          payment_frequency?: string | null
          payment_mode?: string | null
          permit_number?: string | null
          priority?: string | null
          progress?: number
          project_order?: number | null
          project_reference?: string | null
          project_reference_number?: string | null
          project_responsable_id?: string | null
          project_type?: string | null
          reference?: string | null
          referential_code?: string | null
          requires_permits?: boolean | null
          retention_percentage?: number | null
          sector?: string | null
          selection_mode?: string | null
          site_details?: string | null
          start_date?: string | null
          status?: string
          supervisor_id?: string | null
          team_size?: number
          technical_manager_id?: string | null
          terrain_type?: string | null
          thumbnail?: string | null
          title: string
          updated_at?: string | null
          workspace_id?: string | null
        }
        Update: {
          allows_initial_payment?: boolean | null
          area_sqm?: number | null
          attribution_date?: string | null
          budget?: number
          budget_sources?: Json
          check_schedule?: Json | null
          check_schedule_last_run?: Json | null
          client_id?: string | null
          completion_date?: string | null
          coordinates_latitude?: number | null
          coordinates_longitude?: number | null
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          current_phase?: string | null
          current_stage?: string | null
          department?: string | null
          description?: string
          donor_organization?: string | null
          end_date?: string | null
          engineering_consultant_id?: string | null
          environmental_constraints?: string | null
          escalation_thresholds?: Json | null
          estimated_days?: number | null
          external_ref?: string | null
          financing_source?: string | null
          forme?: string | null
          geographic_zone?: string | null
          has_utilities?: boolean | null
          id?: string
          initial_advance_percentage?: number | null
          initial_payment_percentage?: number | null
          launch_date?: string | null
          localisation?: Json | null
          location?: string
          main_contractor?: string | null
          market_type?: string | null
          methodology?: string | null
          organization_id?: string | null
          payment_frequency?: string | null
          payment_mode?: string | null
          permit_number?: string | null
          priority?: string | null
          progress?: number
          project_order?: number | null
          project_reference?: string | null
          project_reference_number?: string | null
          project_responsable_id?: string | null
          project_type?: string | null
          reference?: string | null
          referential_code?: string | null
          requires_permits?: boolean | null
          retention_percentage?: number | null
          sector?: string | null
          selection_mode?: string | null
          site_details?: string | null
          start_date?: string | null
          status?: string
          supervisor_id?: string | null
          team_size?: number
          technical_manager_id?: string | null
          terrain_type?: string | null
          thumbnail?: string | null
          title?: string
          updated_at?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_engineering_consultant_id_fkey"
            columns: ["engineering_consultant_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_project_responsable_id_fkey"
            columns: ["project_responsable_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_supervisor_id_fkey"
            columns: ["supervisor_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_technical_manager_id_fkey"
            columns: ["technical_manager_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      quantity_takeoffs: {
        Row: {
          btp_code: string | null
          created_at: string | null
          element_type: string
          height: number | null
          id: string
          length: number | null
          material_id: string | null
          milestone_id: string | null
          note: string | null
          phase_id: string | null
          project_id: string
          quantity: number | null
          resource_type: string | null
          source: string | null
          source_type: string | null
          task_id: string | null
          total_value: number | null
          unit: string
          unit_price: number | null
          updated_at: string | null
          vat_rate: number | null
          width: number | null
        }
        Insert: {
          btp_code?: string | null
          created_at?: string | null
          element_type: string
          height?: number | null
          id?: string
          length?: number | null
          material_id?: string | null
          milestone_id?: string | null
          note?: string | null
          phase_id?: string | null
          project_id: string
          quantity?: number | null
          resource_type?: string | null
          source?: string | null
          source_type?: string | null
          task_id?: string | null
          total_value?: number | null
          unit: string
          unit_price?: number | null
          updated_at?: string | null
          vat_rate?: number | null
          width?: number | null
        }
        Update: {
          btp_code?: string | null
          created_at?: string | null
          element_type?: string
          height?: number | null
          id?: string
          length?: number | null
          material_id?: string | null
          milestone_id?: string | null
          note?: string | null
          phase_id?: string | null
          project_id?: string
          quantity?: number | null
          resource_type?: string | null
          source?: string | null
          source_type?: string | null
          task_id?: string | null
          total_value?: number | null
          unit?: string
          unit_price?: number | null
          updated_at?: string | null
          vat_rate?: number | null
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
          id?: string
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
      stock_movements: {
        Row: {
          created_at: string
          destination: string | null
          destination_code: string | null
          destination_stock_id: string | null
          id: string
          index_km: number | null
          label_prod_ar: string | null
          label_prod_fr: string | null
          label_vill_ar: string | null
          label_vill_fr: string | null
          movement_date: string | null
          movement_type: string | null
          notes: string | null
          origin_code: string | null
          prix_base: number | null
          quantity: number | null
          rec_id: string | null
          recorded_by: string | null
          reference: string | null
          rejection_reason: string | null
          source_stock_id: string | null
          stock_id: string | null
          supplier: string | null
          tarif_unit: number | null
          total_value: number | null
          unit_price: number | null
          updated_at: string
          validated_at: string | null
          validated_by: string | null
          validation_status:
            | Database["public"]["Enums"]["movement_validation_status"]
            | null
        }
        Insert: {
          created_at?: string
          destination?: string | null
          destination_code?: string | null
          destination_stock_id?: string | null
          id?: string
          index_km?: number | null
          label_prod_ar?: string | null
          label_prod_fr?: string | null
          label_vill_ar?: string | null
          label_vill_fr?: string | null
          movement_date?: string | null
          movement_type?: string | null
          notes?: string | null
          origin_code?: string | null
          prix_base?: number | null
          quantity?: number | null
          rec_id?: string | null
          recorded_by?: string | null
          reference?: string | null
          rejection_reason?: string | null
          source_stock_id?: string | null
          stock_id?: string | null
          supplier?: string | null
          tarif_unit?: number | null
          total_value?: number | null
          unit_price?: number | null
          updated_at?: string
          validated_at?: string | null
          validated_by?: string | null
          validation_status?:
            | Database["public"]["Enums"]["movement_validation_status"]
            | null
        }
        Update: {
          created_at?: string
          destination?: string | null
          destination_code?: string | null
          destination_stock_id?: string | null
          id?: string
          index_km?: number | null
          label_prod_ar?: string | null
          label_prod_fr?: string | null
          label_vill_ar?: string | null
          label_vill_fr?: string | null
          movement_date?: string | null
          movement_type?: string | null
          notes?: string | null
          origin_code?: string | null
          prix_base?: number | null
          quantity?: number | null
          rec_id?: string | null
          recorded_by?: string | null
          reference?: string | null
          rejection_reason?: string | null
          source_stock_id?: string | null
          stock_id?: string | null
          supplier?: string | null
          tarif_unit?: number | null
          total_value?: number | null
          unit_price?: number | null
          updated_at?: string
          validated_at?: string | null
          validated_by?: string | null
          validation_status?:
            | Database["public"]["Enums"]["movement_validation_status"]
            | null
        }
        Relationships: []
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
        Relationships: [
          {
            foreignKeyName: "submission_access_logs_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "tender_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      submission_activity_logs: {
        Row: {
          action: string
          created_at: string
          details: string | null
          id: string
          performed_by: string | null
          submission_id: string
        }
        Insert: {
          action: string
          created_at?: string
          details?: string | null
          id?: string
          performed_by?: string | null
          submission_id: string
        }
        Update: {
          action?: string
          created_at?: string
          details?: string | null
          id?: string
          performed_by?: string | null
          submission_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "submission_activity_logs_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "tender_submissions"
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
        Relationships: [
          {
            foreignKeyName: "supplier_inspections_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_notifications: {
        Row: {
          created_at: string
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
          updated_at: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
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
          updated_at?: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
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
          updated_at?: string
          used_at?: string | null
        }
        Relationships: [
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
        Relationships: [
          {
            foreignKeyName: "supplier_payments_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          account_number: string | null
          address: string | null
          bank_details: Json | null
          bank_info: Json
          bank_name: string | null
          business_registration: string | null
          category: string | null
          certifications: Json | null
          commerce_register_ref: string | null
          contact_person: string | null
          contract_end: string | null
          contract_start: string | null
          created_at: string | null
          default_password_reset_required: boolean | null
          delivery_zones: Json | null
          email: string | null
          external_ref: string | null
          id: string
          is_active: boolean | null
          last_contract_date: string | null
          name: string | null
          nif: string | null
          parent_supplier_id: string | null
          payment_terms: string | null
          performance_score: number | null
          phone: string | null
          preferred_supplier: boolean | null
          rating: number | null
          registration_number: string | null
          rib: string | null
          specialization: string[]
          status: string | null
          supplier_type: string | null
          tax_id: string | null
          tax_number: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          account_number?: string | null
          address?: string | null
          bank_details?: Json | null
          bank_info?: Json
          bank_name?: string | null
          business_registration?: string | null
          category?: string | null
          certifications?: Json | null
          commerce_register_ref?: string | null
          contact_person?: string | null
          contract_end?: string | null
          contract_start?: string | null
          created_at?: string | null
          default_password_reset_required?: boolean | null
          delivery_zones?: Json | null
          email?: string | null
          external_ref?: string | null
          id?: string
          is_active?: boolean | null
          last_contract_date?: string | null
          name?: string | null
          nif?: string | null
          parent_supplier_id?: string | null
          payment_terms?: string | null
          performance_score?: number | null
          phone?: string | null
          preferred_supplier?: boolean | null
          rating?: number | null
          registration_number?: string | null
          rib?: string | null
          specialization?: string[]
          status?: string | null
          supplier_type?: string | null
          tax_id?: string | null
          tax_number?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          account_number?: string | null
          address?: string | null
          bank_details?: Json | null
          bank_info?: Json
          bank_name?: string | null
          business_registration?: string | null
          category?: string | null
          certifications?: Json | null
          commerce_register_ref?: string | null
          contact_person?: string | null
          contract_end?: string | null
          contract_start?: string | null
          created_at?: string | null
          default_password_reset_required?: boolean | null
          delivery_zones?: Json | null
          email?: string | null
          external_ref?: string | null
          id?: string
          is_active?: boolean | null
          last_contract_date?: string | null
          name?: string | null
          nif?: string | null
          parent_supplier_id?: string | null
          payment_terms?: string | null
          performance_score?: number | null
          phone?: string | null
          preferred_supplier?: boolean | null
          rating?: number | null
          registration_number?: string | null
          rib?: string | null
          specialization?: string[]
          status?: string | null
          supplier_type?: string | null
          tax_id?: string | null
          tax_number?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "suppliers_parent_supplier_id_fkey"
            columns: ["parent_supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
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
          action_type: string
          actual_cost: number | null
          actual_duration: number | null
          assigned_by: string | null
          assigned_to: string[] | null
          assignee_email: string | null
          assignee_name: string
          assignee_type: string | null
          completion_token: string | null
          completion_url: string | null
          cost_estimate: number | null
          created_at: string
          critical_path: boolean | null
          description: string
          due_date: string | null
          end_date: string | null
          estimated_duration: number | null
          id: string
          metadata: Json | null
          most_likely_estimate: number | null
          notes: string | null
          optimistic_estimate: number | null
          pessimistic_estimate: number | null
          phase_id: string | null
          priority: string
          progress: number | null
          project_id: string | null
          related_id: string | null
          start_date: string | null
          status: string
          step_id: string | null
          title: string
          updated_at: string
          weight: number | null
        }
        Insert: {
          action_type: string
          actual_cost?: number | null
          actual_duration?: number | null
          assigned_by?: string | null
          assigned_to?: string[] | null
          assignee_email?: string | null
          assignee_name: string
          assignee_type?: string | null
          completion_token?: string | null
          completion_url?: string | null
          cost_estimate?: number | null
          created_at?: string
          critical_path?: boolean | null
          description: string
          due_date?: string | null
          end_date?: string | null
          estimated_duration?: number | null
          id?: string
          metadata?: Json | null
          most_likely_estimate?: number | null
          notes?: string | null
          optimistic_estimate?: number | null
          pessimistic_estimate?: number | null
          phase_id?: string | null
          priority: string
          progress?: number | null
          project_id?: string | null
          related_id?: string | null
          start_date?: string | null
          status?: string
          step_id?: string | null
          title: string
          updated_at?: string
          weight?: number | null
        }
        Update: {
          action_type?: string
          actual_cost?: number | null
          actual_duration?: number | null
          assigned_by?: string | null
          assigned_to?: string[] | null
          assignee_email?: string | null
          assignee_name?: string
          assignee_type?: string | null
          completion_token?: string | null
          completion_url?: string | null
          cost_estimate?: number | null
          created_at?: string
          critical_path?: boolean | null
          description?: string
          due_date?: string | null
          end_date?: string | null
          estimated_duration?: number | null
          id?: string
          metadata?: Json | null
          most_likely_estimate?: number | null
          notes?: string | null
          optimistic_estimate?: number | null
          pessimistic_estimate?: number | null
          phase_id?: string | null
          priority?: string
          progress?: number | null
          project_id?: string | null
          related_id?: string | null
          start_date?: string | null
          status?: string
          step_id?: string | null
          title?: string
          updated_at?: string
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "task_assignments_phase_id_fkey"
            columns: ["phase_id"]
            isOneToOne: false
            referencedRelation: "phases"
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
          supplier_id: string
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
          supplier_id: string
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
          supplier_id?: string
          tender_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      tender_documents: {
        Row: {
          category: string | null
          created_at: string | null
          document_id: string | null
          id: string
          is_required: boolean | null
          is_submitted: boolean | null
          project_id: string | null
          reviewer_notes: string | null
          status: string | null
          subcategory: string | null
          submission_date: string | null
          tender_id: string | null
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          document_id?: string | null
          id?: string
          is_required?: boolean | null
          is_submitted?: boolean | null
          project_id?: string | null
          reviewer_notes?: string | null
          status?: string | null
          subcategory?: string | null
          submission_date?: string | null
          tender_id?: string | null
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          document_id?: string | null
          id?: string
          is_required?: boolean | null
          is_submitted?: boolean | null
          project_id?: string | null
          reviewer_notes?: string | null
          status?: string | null
          subcategory?: string | null
          submission_date?: string | null
          tender_id?: string | null
          updated_at?: string | null
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
          bid_ref: string | null
          btp_code: string | null
          category: string | null
          created_at: string
          description: string
          employee_qualification_id: string | null
          estimate_id: string
          estimated_hours: number | null
          height: number | null
          id: string
          item_code: string | null
          item_type: string | null
          length: number | null
          material_id: string | null
          milestone_id: string | null
          note: string | null
          notes: string | null
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
          total_price: number | null
          unit: string
          unit_price: number
          updated_at: string
          vat_rate: number | null
          width: number | null
        }
        Insert: {
          bid_ref?: string | null
          btp_code?: string | null
          category?: string | null
          created_at?: string
          description: string
          employee_qualification_id?: string | null
          estimate_id: string
          estimated_hours?: number | null
          height?: number | null
          id?: string
          item_code?: string | null
          item_type?: string | null
          length?: number | null
          material_id?: string | null
          milestone_id?: string | null
          note?: string | null
          notes?: string | null
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
          total_price?: number | null
          unit: string
          unit_price?: number
          updated_at?: string
          vat_rate?: number | null
          width?: number | null
        }
        Update: {
          bid_ref?: string | null
          btp_code?: string | null
          category?: string | null
          created_at?: string
          description?: string
          employee_qualification_id?: string | null
          estimate_id?: string
          estimated_hours?: number | null
          height?: number | null
          id?: string
          item_code?: string | null
          item_type?: string | null
          length?: number | null
          material_id?: string | null
          milestone_id?: string | null
          note?: string | null
          notes?: string | null
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
          total_price?: number | null
          unit?: string
          unit_price?: number
          updated_at?: string
          vat_rate?: number | null
          width?: number | null
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
          description: string | null
          id: string
          overhead_amount: number | null
          overhead_percentage: number | null
          profit_amount: number | null
          profit_percentage: number | null
          project_id: string | null
          status: string | null
          submitted_by: string | null
          subtotal: number | null
          supplier_id: string | null
          tax_amount: number | null
          tax_rate: number | null
          tender_id: string
          title: string
          total_amount: number | null
          total_equipment: number | null
          total_labor: number | null
          total_materials: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          overhead_amount?: number | null
          overhead_percentage?: number | null
          profit_amount?: number | null
          profit_percentage?: number | null
          project_id?: string | null
          status?: string | null
          submitted_by?: string | null
          subtotal?: number | null
          supplier_id?: string | null
          tax_amount?: number | null
          tax_rate?: number | null
          tender_id: string
          title: string
          total_amount?: number | null
          total_equipment?: number | null
          total_labor?: number | null
          total_materials?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          overhead_amount?: number | null
          overhead_percentage?: number | null
          profit_amount?: number | null
          profit_percentage?: number | null
          project_id?: string | null
          status?: string | null
          submitted_by?: string | null
          subtotal?: number | null
          supplier_id?: string | null
          tax_amount?: number | null
          tax_rate?: number | null
          tender_id?: string
          title?: string
          total_amount?: number | null
          total_equipment?: number | null
          total_labor?: number | null
          total_materials?: number | null
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
        Relationships: [
          {
            foreignKeyName: "tender_sharing_access_logs_sharing_secret_id_fkey"
            columns: ["sharing_secret_id"]
            isOneToOne: false
            referencedRelation: "tender_sharing_secrets"
            referencedColumns: ["id"]
          },
        ]
      }
      tender_sharing_secrets: {
        Row: {
          access_count: number | null
          allowed_document_ids: string[] | null
          created_at: string | null
          expires_at: string
          id: string
          is_active: boolean | null
          max_access_count: number | null
          metadata: Json | null
          secret_code: string
          shared_by: string | null
          supplier_email: string | null
          supplier_id: string | null
          tender_id: string
          updated_at: string | null
          workflow_phase: string | null
          workflow_stage: string | null
        }
        Insert: {
          access_count?: number | null
          allowed_document_ids?: string[] | null
          created_at?: string | null
          expires_at: string
          id?: string
          is_active?: boolean | null
          max_access_count?: number | null
          metadata?: Json | null
          secret_code: string
          shared_by?: string | null
          supplier_email?: string | null
          supplier_id?: string | null
          tender_id: string
          updated_at?: string | null
          workflow_phase?: string | null
          workflow_stage?: string | null
        }
        Update: {
          access_count?: number | null
          allowed_document_ids?: string[] | null
          created_at?: string | null
          expires_at?: string
          id?: string
          is_active?: boolean | null
          max_access_count?: number | null
          metadata?: Json | null
          secret_code?: string
          shared_by?: string | null
          supplier_email?: string | null
          supplier_id?: string | null
          tender_id?: string
          updated_at?: string | null
          workflow_phase?: string | null
          workflow_stage?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tender_sharing_secrets_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tender_sharing_secrets_tender_id_fkey"
            columns: ["tender_id"]
            isOneToOne: false
            referencedRelation: "tenders"
            referencedColumns: ["id"]
          },
        ]
      }
      tender_step_documents: {
        Row: {
          created_at: string
          document_id: string
          document_type: string
          id: string
          is_required: boolean | null
          reviewer_notes: string | null
          status: string
          step_id: string
          submitted_at: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          document_id: string
          document_type: string
          id?: string
          is_required?: boolean | null
          reviewer_notes?: string | null
          status?: string
          step_id: string
          submitted_at?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          document_id?: string
          document_type?: string
          id?: string
          is_required?: boolean | null
          reviewer_notes?: string | null
          status?: string
          step_id?: string
          submitted_at?: string | null
          updated_at?: string
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
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          required_documents: string[] | null
          review_deadline: string | null
          status: Database["public"]["Enums"]["workflow_step_status"] | null
          step_number: number
          submission_date: string | null
          tender_id: string
          title: string
          updated_at: string
        }
        Insert: {
          actual_completion_date?: string | null
          approval_deadline?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          required_documents?: string[] | null
          review_deadline?: string | null
          status?: Database["public"]["Enums"]["workflow_step_status"] | null
          step_number: number
          submission_date?: string | null
          tender_id: string
          title: string
          updated_at?: string
        }
        Update: {
          actual_completion_date?: string | null
          approval_deadline?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          required_documents?: string[] | null
          review_deadline?: string | null
          status?: Database["public"]["Enums"]["workflow_step_status"] | null
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
          evaluation_phase: string | null
          evaluation_stage: string | null
          evaluator_notes: string | null
          financial_score: number | null
          id: string
          is_secret_active: boolean | null
          max_secret_access: number | null
          reviewed_at: string | null
          reviewer_id: string | null
          secret_access_count: number | null
          secret_code: string | null
          secret_created_at: string | null
          secret_expires_at: string | null
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
          evaluation_phase?: string | null
          evaluation_stage?: string | null
          evaluator_notes?: string | null
          financial_score?: number | null
          id?: string
          is_secret_active?: boolean | null
          max_secret_access?: number | null
          reviewed_at?: string | null
          reviewer_id?: string | null
          secret_access_count?: number | null
          secret_code?: string | null
          secret_created_at?: string | null
          secret_expires_at?: string | null
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
          evaluation_phase?: string | null
          evaluation_stage?: string | null
          evaluator_notes?: string | null
          financial_score?: number | null
          id?: string
          is_secret_active?: boolean | null
          max_secret_access?: number | null
          reviewed_at?: string | null
          reviewer_id?: string | null
          secret_access_count?: number | null
          secret_code?: string | null
          secret_created_at?: string | null
          secret_expires_at?: string | null
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
          tender_number: number | null
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
          tender_number?: number | null
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
          tender_number?: number | null
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
          capacity: number | null
          contact_manager: string | null
          contact_phone: string | null
          created_at: string | null
          description: string | null
          facilities: string[] | null
          id: string
          is_active: boolean | null
          location: string | null
          name: string
          owner_id: string
          settings: Json | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          capacity?: number | null
          contact_manager?: string | null
          contact_phone?: string | null
          created_at?: string | null
          description?: string | null
          facilities?: string[] | null
          id?: string
          is_active?: boolean | null
          location?: string | null
          name: string
          owner_id: string
          settings?: Json | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          capacity?: number | null
          contact_manager?: string | null
          contact_phone?: string | null
          created_at?: string | null
          description?: string | null
          facilities?: string[] | null
          id?: string
          is_active?: boolean | null
          location?: string | null
          name?: string
          owner_id?: string
          settings?: Json | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      compliance_items_with_details: {
        Row: {
          bank_guarantee_id: string | null
          created_at: string | null
          created_by: string | null
          deadline: string | null
          description: string | null
          documents: Json | null
          id: string | null
          notes: Json | null
          priority: string | null
          project_id: string | null
          responsible: string | null
          status: string | null
          title: string | null
          type: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_compliance_items_bank_guarantee"
            columns: ["bank_guarantee_id"]
            isOneToOne: false
            referencedRelation: "bank_guarantees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_compliance_items_project"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      v_boq_estimates: {
        Row: {
          btp_code: string | null
          created_at: string | null
          designation: string | null
          discount: number | null
          document_id: string | null
          element_type: string | null
          estimate_id: string | null
          fees: number | null
          height: number | null
          id: string | null
          import_source: string | null
          length: number | null
          line_type: string | null
          metadata: Json | null
          milestone_code: string | null
          milestone_id: string | null
          note: string | null
          phase_code: string | null
          phase_id: string | null
          project_id: string | null
          quantity: number | null
          ras_rate: number | null
          recipient_id: string | null
          resource_id: string | null
          resource_kind: string | null
          sender_id: string | null
          source_type: string | null
          status: string | null
          submission_id: string | null
          task_code: string | null
          task_id: string | null
          tender_id: string | null
          total_ht: number | null
          total_ras: number | null
          total_ttc: number | null
          total_tva: number | null
          unit: string | null
          unit_price_ht: number | null
          updated_at: string | null
          vat_rate: number | null
          width: number | null
        }
        Insert: {
          btp_code?: string | null
          created_at?: string | null
          designation?: string | null
          discount?: number | null
          document_id?: string | null
          element_type?: string | null
          estimate_id?: string | null
          fees?: number | null
          height?: number | null
          id?: string | null
          import_source?: string | null
          length?: number | null
          line_type?: string | null
          metadata?: Json | null
          milestone_code?: string | null
          milestone_id?: string | null
          note?: string | null
          phase_code?: string | null
          phase_id?: string | null
          project_id?: string | null
          quantity?: number | null
          ras_rate?: number | null
          recipient_id?: string | null
          resource_id?: string | null
          resource_kind?: string | null
          sender_id?: string | null
          source_type?: string | null
          status?: string | null
          submission_id?: string | null
          task_code?: string | null
          task_id?: string | null
          tender_id?: string | null
          total_ht?: number | null
          total_ras?: number | null
          total_ttc?: number | null
          total_tva?: number | null
          unit?: string | null
          unit_price_ht?: number | null
          updated_at?: string | null
          vat_rate?: number | null
          width?: number | null
        }
        Update: {
          btp_code?: string | null
          created_at?: string | null
          designation?: string | null
          discount?: number | null
          document_id?: string | null
          element_type?: string | null
          estimate_id?: string | null
          fees?: number | null
          height?: number | null
          id?: string | null
          import_source?: string | null
          length?: number | null
          line_type?: string | null
          metadata?: Json | null
          milestone_code?: string | null
          milestone_id?: string | null
          note?: string | null
          phase_code?: string | null
          phase_id?: string | null
          project_id?: string | null
          quantity?: number | null
          ras_rate?: number | null
          recipient_id?: string | null
          resource_id?: string | null
          resource_kind?: string | null
          sender_id?: string | null
          source_type?: string | null
          status?: string | null
          submission_id?: string | null
          task_code?: string | null
          task_id?: string | null
          tender_id?: string | null
          total_ht?: number | null
          total_ras?: number | null
          total_ttc?: number | null
          total_tva?: number | null
          unit?: string | null
          unit_price_ht?: number | null
          updated_at?: string | null
          vat_rate?: number | null
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "boq_lines_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      v_boq_invoices: {
        Row: {
          btp_code: string | null
          created_at: string | null
          designation: string | null
          discount: number | null
          document_id: string | null
          element_type: string | null
          estimate_id: string | null
          fees: number | null
          height: number | null
          id: string | null
          import_source: string | null
          length: number | null
          line_type: string | null
          metadata: Json | null
          milestone_code: string | null
          milestone_id: string | null
          note: string | null
          phase_code: string | null
          phase_id: string | null
          project_id: string | null
          quantity: number | null
          ras_rate: number | null
          recipient_id: string | null
          resource_id: string | null
          resource_kind: string | null
          sender_id: string | null
          source_type: string | null
          status: string | null
          submission_id: string | null
          task_code: string | null
          task_id: string | null
          tender_id: string | null
          total_ht: number | null
          total_ras: number | null
          total_ttc: number | null
          total_tva: number | null
          unit: string | null
          unit_price_ht: number | null
          updated_at: string | null
          vat_rate: number | null
          width: number | null
        }
        Insert: {
          btp_code?: string | null
          created_at?: string | null
          designation?: string | null
          discount?: number | null
          document_id?: string | null
          element_type?: string | null
          estimate_id?: string | null
          fees?: number | null
          height?: number | null
          id?: string | null
          import_source?: string | null
          length?: number | null
          line_type?: string | null
          metadata?: Json | null
          milestone_code?: string | null
          milestone_id?: string | null
          note?: string | null
          phase_code?: string | null
          phase_id?: string | null
          project_id?: string | null
          quantity?: number | null
          ras_rate?: number | null
          recipient_id?: string | null
          resource_id?: string | null
          resource_kind?: string | null
          sender_id?: string | null
          source_type?: string | null
          status?: string | null
          submission_id?: string | null
          task_code?: string | null
          task_id?: string | null
          tender_id?: string | null
          total_ht?: number | null
          total_ras?: number | null
          total_ttc?: number | null
          total_tva?: number | null
          unit?: string | null
          unit_price_ht?: number | null
          updated_at?: string | null
          vat_rate?: number | null
          width?: number | null
        }
        Update: {
          btp_code?: string | null
          created_at?: string | null
          designation?: string | null
          discount?: number | null
          document_id?: string | null
          element_type?: string | null
          estimate_id?: string | null
          fees?: number | null
          height?: number | null
          id?: string | null
          import_source?: string | null
          length?: number | null
          line_type?: string | null
          metadata?: Json | null
          milestone_code?: string | null
          milestone_id?: string | null
          note?: string | null
          phase_code?: string | null
          phase_id?: string | null
          project_id?: string | null
          quantity?: number | null
          ras_rate?: number | null
          recipient_id?: string | null
          resource_id?: string | null
          resource_kind?: string | null
          sender_id?: string | null
          source_type?: string | null
          status?: string | null
          submission_id?: string | null
          task_code?: string | null
          task_id?: string | null
          tender_id?: string | null
          total_ht?: number | null
          total_ras?: number | null
          total_ttc?: number | null
          total_tva?: number | null
          unit?: string | null
          unit_price_ht?: number | null
          updated_at?: string | null
          vat_rate?: number | null
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "boq_lines_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      v_boq_quantity_takeoffs: {
        Row: {
          btp_code: string | null
          created_at: string | null
          designation: string | null
          discount: number | null
          document_id: string | null
          element_type: string | null
          estimate_id: string | null
          fees: number | null
          height: number | null
          id: string | null
          import_source: string | null
          length: number | null
          line_type: string | null
          metadata: Json | null
          milestone_code: string | null
          milestone_id: string | null
          note: string | null
          phase_code: string | null
          phase_id: string | null
          project_id: string | null
          quantity: number | null
          ras_rate: number | null
          recipient_id: string | null
          resource_id: string | null
          resource_kind: string | null
          sender_id: string | null
          source_type: string | null
          status: string | null
          submission_id: string | null
          task_code: string | null
          task_id: string | null
          tender_id: string | null
          total_ht: number | null
          total_ras: number | null
          total_ttc: number | null
          total_tva: number | null
          unit: string | null
          unit_price_ht: number | null
          updated_at: string | null
          vat_rate: number | null
          width: number | null
        }
        Insert: {
          btp_code?: string | null
          created_at?: string | null
          designation?: string | null
          discount?: number | null
          document_id?: string | null
          element_type?: string | null
          estimate_id?: string | null
          fees?: number | null
          height?: number | null
          id?: string | null
          import_source?: string | null
          length?: number | null
          line_type?: string | null
          metadata?: Json | null
          milestone_code?: string | null
          milestone_id?: string | null
          note?: string | null
          phase_code?: string | null
          phase_id?: string | null
          project_id?: string | null
          quantity?: number | null
          ras_rate?: number | null
          recipient_id?: string | null
          resource_id?: string | null
          resource_kind?: string | null
          sender_id?: string | null
          source_type?: string | null
          status?: string | null
          submission_id?: string | null
          task_code?: string | null
          task_id?: string | null
          tender_id?: string | null
          total_ht?: number | null
          total_ras?: number | null
          total_ttc?: number | null
          total_tva?: number | null
          unit?: string | null
          unit_price_ht?: number | null
          updated_at?: string | null
          vat_rate?: number | null
          width?: number | null
        }
        Update: {
          btp_code?: string | null
          created_at?: string | null
          designation?: string | null
          discount?: number | null
          document_id?: string | null
          element_type?: string | null
          estimate_id?: string | null
          fees?: number | null
          height?: number | null
          id?: string | null
          import_source?: string | null
          length?: number | null
          line_type?: string | null
          metadata?: Json | null
          milestone_code?: string | null
          milestone_id?: string | null
          note?: string | null
          phase_code?: string | null
          phase_id?: string | null
          project_id?: string | null
          quantity?: number | null
          ras_rate?: number | null
          recipient_id?: string | null
          resource_id?: string | null
          resource_kind?: string | null
          sender_id?: string | null
          source_type?: string | null
          status?: string | null
          submission_id?: string | null
          task_code?: string | null
          task_id?: string | null
          tender_id?: string | null
          total_ht?: number | null
          total_ras?: number | null
          total_ttc?: number | null
          total_tva?: number | null
          unit?: string | null
          unit_price_ht?: number | null
          updated_at?: string | null
          vat_rate?: number | null
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "boq_lines_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      admin_update_user_email: {
        Args: { new_email: string; target_user_id: string }
        Returns: undefined
      }
      approve_supplier_payment_request: {
        Args: { approved_by_param?: string; request_id: string }
        Returns: {
          id: string
          status: string
          updated_at: string
        }[]
      }
      can_import_full_dataset: { Args: never; Returns: boolean }
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
      get_user_role: { Args: { target_user_id: string }; Returns: string }
      get_user_roles: { Args: { target_user_id: string }; Returns: string[] }
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
      has_role: {
        Args: { role_name: string; target_user_id: string }
        Returns: boolean
      }
      is_current_user_admin: { Args: never; Returns: boolean }
      normalize_intervention_zones: { Args: { input: Json }; Returns: Json }
      reject_supplier_payment_request: {
        Args: { rejection_reason_param?: string; request_id: string }
        Returns: {
          id: string
          notes: string
          status: string
          updated_at: string
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
      use_supplier_reset_token: {
        Args: { reset_token: string }
        Returns: boolean
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
      verify_supplier_reset_token: {
        Args: { reset_token: string }
        Returns: {
          email: string
          supplier_id: string
          valid: boolean
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
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
      user_roles: {
        Row: {
          assigned_at: string | null
          assigned_by: string | null
          expires_at: string | null
          id: string
          role_name: string
          status: string | null
          user_id: string
        }
        Insert: {
          assigned_at?: string | null
          assigned_by?: string | null
          expires_at?: string | null
          id?: string
          role_name: string
          status?: string | null
          user_id: string
        }
        Update: {
          assigned_at?: string | null
          assigned_by?: string | null
          expires_at?: string | null
          id?: string
          role_name?: string
          status?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      compliance_items_with_details: {
        Row: {
          bank_guarantee: Json | null
          bank_guarantee_id: string | null
          created_at: string | null
          created_by: string | null
          deadline: string | null
          description: string | null
          documents: Json | null
          id: string | null
          notes: Json | null
          priority: string | null
          project_id: string | null
          responsible: string | null
          status: string | null
          title: string | null
          type: string | null
          updated_at: string | null
          updated_by: string | null
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
    }
    Functions: {
      admin_update_user_email: {
        Args: { new_email: string; user_id: string }
        Returns: undefined
      }
      algorithm_sign: {
        Args: { algorithm: string; secret: string; signables: string }
        Returns: string
      }
      assign_user_role: {
        Args: { role_name: string; target_user_id: string }
        Returns: undefined
      }
      generate_submission_secret_code: { Args: never; Returns: string }
      get_highest_role: { Args: { user_id: string }; Returns: string }
      is_current_user_admin: { Args: never; Returns: boolean }
      is_current_user_director: { Args: never; Returns: boolean }
      jwt: { Args: never; Returns: Json }
      role: { Args: never; Returns: string }
      sign: {
        Args: { algorithm?: string; payload: Json; secret: string }
        Returns: string
      }
      try_cast_double: { Args: { inp: string }; Returns: number }
      uid: { Args: never; Returns: string }
      url_decode: { Args: { data: string }; Returns: string }
      url_encode: { Args: { data: string }; Returns: string }
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
      verify: {
        Args: { algorithm?: string; secret: string; token: string }
        Returns: {
          header: Json
          payload: Json
          valid: boolean
        }[]
      }
    }
    Enums: {
      document_status:
        | "draft"
        | "pending_review"
        | "approved"
        | "rejected"
        | "archived"
      inspection_status:
        | "approved"
        | "requires_changes"
        | "rejected"
        | "pending"
      movement_validation_status: "pending" | "validated" | "rejected"
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
        | "admin"
        | "manager"
        | "director"
        | "agent"
        | "supplier"
        | "user"
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
  storage: {
    Tables: {
      buckets: {
        Row: {
          allowed_mime_types: string[] | null
          avif_autodetection: boolean | null
          created_at: string | null
          file_size_limit: number | null
          id: string
          name: string
          owner: string | null
          owner_id: string | null
          public: boolean | null
          type: Database["storage"]["Enums"]["buckettype"]
          updated_at: string | null
        }
        Insert: {
          allowed_mime_types?: string[] | null
          avif_autodetection?: boolean | null
          created_at?: string | null
          file_size_limit?: number | null
          id: string
          name: string
          owner?: string | null
          owner_id?: string | null
          public?: boolean | null
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string | null
        }
        Update: {
          allowed_mime_types?: string[] | null
          avif_autodetection?: boolean | null
          created_at?: string | null
          file_size_limit?: number | null
          id?: string
          name?: string
          owner?: string | null
          owner_id?: string | null
          public?: boolean | null
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string | null
        }
        Relationships: []
      }
      buckets_analytics: {
        Row: {
          created_at: string
          deleted_at: string | null
          format: string
          id: string
          name: string
          type: Database["storage"]["Enums"]["buckettype"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          format?: string
          id?: string
          name: string
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          format?: string
          id?: string
          name?: string
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string
        }
        Relationships: []
      }
      buckets_vectors: {
        Row: {
          created_at: string
          id: string
          type: Database["storage"]["Enums"]["buckettype"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          id: string
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string
        }
        Relationships: []
      }
      migrations: {
        Row: {
          executed_at: string | null
          hash: string
          id: number
          name: string
        }
        Insert: {
          executed_at?: string | null
          hash: string
          id: number
          name: string
        }
        Update: {
          executed_at?: string | null
          hash?: string
          id?: number
          name?: string
        }
        Relationships: []
      }
      objects: {
        Row: {
          bucket_id: string | null
          created_at: string | null
          id: string
          last_accessed_at: string | null
          metadata: Json | null
          name: string | null
          owner: string | null
          owner_id: string | null
          path_tokens: string[] | null
          updated_at: string | null
          user_metadata: Json | null
          version: string | null
        }
        Insert: {
          bucket_id?: string | null
          created_at?: string | null
          id?: string
          last_accessed_at?: string | null
          metadata?: Json | null
          name?: string | null
          owner?: string | null
          owner_id?: string | null
          path_tokens?: string[] | null
          updated_at?: string | null
          user_metadata?: Json | null
          version?: string | null
        }
        Update: {
          bucket_id?: string | null
          created_at?: string | null
          id?: string
          last_accessed_at?: string | null
          metadata?: Json | null
          name?: string | null
          owner?: string | null
          owner_id?: string | null
          path_tokens?: string[] | null
          updated_at?: string | null
          user_metadata?: Json | null
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "objects_bucketId_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
        ]
      }
      s3_multipart_uploads: {
        Row: {
          bucket_id: string
          created_at: string
          id: string
          in_progress_size: number
          key: string
          metadata: Json | null
          owner_id: string | null
          upload_signature: string
          user_metadata: Json | null
          version: string
        }
        Insert: {
          bucket_id: string
          created_at?: string
          id: string
          in_progress_size?: number
          key: string
          metadata?: Json | null
          owner_id?: string | null
          upload_signature: string
          user_metadata?: Json | null
          version: string
        }
        Update: {
          bucket_id?: string
          created_at?: string
          id?: string
          in_progress_size?: number
          key?: string
          metadata?: Json | null
          owner_id?: string | null
          upload_signature?: string
          user_metadata?: Json | null
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "s3_multipart_uploads_bucket_id_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
        ]
      }
      s3_multipart_uploads_parts: {
        Row: {
          bucket_id: string
          created_at: string
          etag: string
          id: string
          key: string
          owner_id: string | null
          part_number: number
          size: number
          upload_id: string
          version: string
        }
        Insert: {
          bucket_id: string
          created_at?: string
          etag: string
          id?: string
          key: string
          owner_id?: string | null
          part_number: number
          size?: number
          upload_id: string
          version: string
        }
        Update: {
          bucket_id?: string
          created_at?: string
          etag?: string
          id?: string
          key?: string
          owner_id?: string | null
          part_number?: number
          size?: number
          upload_id?: string
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "s3_multipart_uploads_parts_bucket_id_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "s3_multipart_uploads_parts_upload_id_fkey"
            columns: ["upload_id"]
            isOneToOne: false
            referencedRelation: "s3_multipart_uploads"
            referencedColumns: ["id"]
          },
        ]
      }
      vector_indexes: {
        Row: {
          bucket_id: string
          created_at: string
          data_type: string
          dimension: number
          distance_metric: string
          id: string
          metadata_configuration: Json | null
          name: string
          updated_at: string
        }
        Insert: {
          bucket_id: string
          created_at?: string
          data_type: string
          dimension: number
          distance_metric: string
          id?: string
          metadata_configuration?: Json | null
          name: string
          updated_at?: string
        }
        Update: {
          bucket_id?: string
          created_at?: string
          data_type?: string
          dimension?: number
          distance_metric?: string
          id?: string
          metadata_configuration?: Json | null
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "vector_indexes_bucket_id_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets_vectors"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      allow_any_operation: {
        Args: { expected_operations: string[] }
        Returns: boolean
      }
      allow_only_operation: {
        Args: { expected_operation: string }
        Returns: boolean
      }
      can_insert_object: {
        Args: { bucketid: string; metadata: Json; name: string; owner: string }
        Returns: undefined
      }
      extension: { Args: { name: string }; Returns: string }
      filename: { Args: { name: string }; Returns: string }
      foldername: { Args: { name: string }; Returns: string[] }
      get_common_prefix: {
        Args: { p_delimiter: string; p_key: string; p_prefix: string }
        Returns: string
      }
      get_size_by_bucket: {
        Args: never
        Returns: {
          bucket_id: string
          size: number
        }[]
      }
      list_multipart_uploads_with_delimiter: {
        Args: {
          bucket_id: string
          delimiter_param: string
          max_keys?: number
          next_key_token?: string
          next_upload_token?: string
          prefix_param: string
        }
        Returns: {
          created_at: string
          id: string
          key: string
        }[]
      }
      list_objects_with_delimiter: {
        Args: {
          _bucket_id: string
          delimiter_param: string
          max_keys?: number
          next_token?: string
          prefix_param: string
          sort_order?: string
          start_after?: string
        }
        Returns: {
          created_at: string
          id: string
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
      operation: { Args: never; Returns: string }
      search: {
        Args: {
          bucketname: string
          levels?: number
          limits?: number
          offsets?: number
          prefix: string
          search?: string
          sortcolumn?: string
          sortorder?: string
        }
        Returns: {
          created_at: string
          id: string
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
      search_by_timestamp: {
        Args: {
          p_bucket_id: string
          p_level: number
          p_limit: number
          p_prefix: string
          p_sort_column: string
          p_sort_column_after: string
          p_sort_order: string
          p_start_after: string
        }
        Returns: {
          created_at: string
          id: string
          key: string
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
      search_v2: {
        Args: {
          bucket_name: string
          levels?: number
          limits?: number
          prefix: string
          sort_column?: string
          sort_column_after?: string
          sort_order?: string
          start_after?: string
        }
        Returns: {
          created_at: string
          id: string
          key: string
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
    }
    Enums: {
      buckettype: "STANDARD" | "ANALYTICS" | "VECTOR"
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
  auth: {
    Enums: {
      aal_level: ["aal1", "aal2", "aal3"],
      code_challenge_method: ["s256", "plain"],
      factor_status: ["unverified", "verified"],
      factor_type: ["totp", "webauthn", "phone"],
      oauth_authorization_status: ["pending", "approved", "denied", "expired"],
      oauth_client_type: ["public", "confidential"],
      oauth_registration_type: ["dynamic", "manual"],
      oauth_response_type: ["code"],
      one_time_token_type: [
        "confirmation_token",
        "reauthentication_token",
        "recovery_token",
        "email_change_token_new",
        "email_change_token_current",
        "phone_change_token",
      ],
    },
  },
  btp: {
    Enums: {},
  },
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      document_status: [
        "draft",
        "pending_review",
        "approved",
        "rejected",
        "archived",
      ],
      inspection_status: [
        "approved",
        "requires_changes",
        "rejected",
        "pending",
      ],
      movement_validation_status: ["pending", "validated", "rejected"],
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
      user_role: ["admin", "manager", "director", "agent", "supplier", "user"],
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
  storage: {
    Enums: {
      buckettype: ["STANDARD", "ANALYTICS", "VECTOR"],
    },
  },
} as const
