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
      journal_entries: {
        Row: {
          id: string
          user_id: string
          content: string
          mood: string | null
          color_state: string | null
          word_count: number | null
          duration_seconds: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          content: string
          mood?: string | null
          color_state?: string | null
          word_count?: number | null
          duration_seconds?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          content?: string
          mood?: string | null
          color_state?: string | null
          word_count?: number | null
          duration_seconds?: number | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      emergent_orgs: {
        Row: {
          id: string
          name: string
          slug: string
          plan: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          slug: string
          plan?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          plan?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      emergent_org_members: {
        Row: {
          id: string
          org_id: string
          user_id: string
          role: string
          joined_at: string | null
        }
        Insert: {
          id?: string
          org_id: string
          user_id: string
          role?: string
          joined_at?: string | null
        }
        Update: {
          id?: string
          org_id?: string
          user_id?: string
          role?: string
          joined_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "emergent_org_members_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "emergent_orgs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "emergent_org_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      emergent_projects: {
        Row: {
          id: string
          org_id: string
          name: string
          slug: string
          description: string | null
          stack: string | null
          framework: string | null
          language: string | null
          status: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          org_id: string
          name: string
          slug: string
          description?: string | null
          stack?: string | null
          framework?: string | null
          language?: string | null
          status?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          org_id?: string
          name?: string
          slug?: string
          description?: string | null
          stack?: string | null
          framework?: string | null
          language?: string | null
          status?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "emergent_projects_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "emergent_orgs"
            referencedColumns: ["id"]
          }
        ]
      }
      emergent_project_secrets: {
        Row: {
          id: string
          project_id: string
          key: string
          encrypted_value: string
          iv: string
          auth_tag: string
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          project_id: string
          key: string
          encrypted_value: string
          iv: string
          auth_tag: string
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          project_id?: string
          key?: string
          encrypted_value?: string
          iv?: string
          auth_tag?: string
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "emergent_project_secrets_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "emergent_projects"
            referencedColumns: ["id"]
          }
        ]
      }
      emergent_workspaces: {
        Row: {
          id: string
          project_id: string
          workspace_id: string
          subdomain: string
          status: string
          error_message: string | null
          container_id: string | null
          container_image: string | null
          port: number | null
          cpu_limit_cores: number | null
          memory_limit_mb: number | null
          storage_limit_mb: number | null
          cpu_usage_percent: number | null
          memory_usage_mb: number | null
          storage_used_mb: number | null
          started_at: string | null
          stopped_at: string | null
          last_activity_at: string | null
          auto_shutdown_minutes: number | null
          shutdown_scheduled_at: string | null
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          project_id: string
          workspace_id: string
          subdomain: string
          status?: string
          error_message?: string | null
          container_id?: string | null
          container_image?: string | null
          port?: number | null
          cpu_limit_cores?: number | null
          memory_limit_mb?: number | null
          storage_limit_mb?: number | null
          cpu_usage_percent?: number | null
          memory_usage_mb?: number | null
          storage_used_mb?: number | null
          started_at?: string | null
          stopped_at?: string | null
          last_activity_at?: string | null
          auto_shutdown_minutes?: number | null
          shutdown_scheduled_at?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          project_id?: string
          workspace_id?: string
          subdomain?: string
          status?: string
          error_message?: string | null
          container_id?: string | null
          container_image?: string | null
          port?: number | null
          cpu_limit_cores?: number | null
          memory_limit_mb?: number | null
          storage_limit_mb?: number | null
          cpu_usage_percent?: number | null
          memory_usage_mb?: number | null
          storage_used_mb?: number | null
          started_at?: string | null
          stopped_at?: string | null
          last_activity_at?: string | null
          auto_shutdown_minutes?: number | null
          shutdown_scheduled_at?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "emergent_workspaces_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "emergent_projects"
            referencedColumns: ["id"]
          }
        ]
      }
      emergent_deployments: {
        Row: {
          id: string
          project_id: string
          deployment_number: number | null
          version: string | null
          environment: string
          status: string
          error_message: string | null
          build_started_at: string | null
          build_completed_at: string | null
          build_duration_seconds: number | null
          build_logs_url: string | null
          deploy_started_at: string | null
          deploy_completed_at: string | null
          deploy_duration_seconds: number | null
          deploy_logs_url: string | null
          preview_url: string | null
          production_url: string | null
          git_commit_sha: string | null
          git_branch: string | null
          git_commit_message: string | null
          git_author: string | null
          platform: string | null
          platform_deployment_id: string | null
          platform_url: string | null
          health_check_url: string | null
          health_check_status: string | null
          health_check_last_checked_at: string | null
          triggered_by: string | null
          metadata: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          deployment_number?: number | null
          version?: string | null
          environment?: string
          status?: string
          error_message?: string | null
          build_started_at?: string | null
          build_completed_at?: string | null
          build_duration_seconds?: number | null
          build_logs_url?: string | null
          deploy_started_at?: string | null
          deploy_completed_at?: string | null
          deploy_duration_seconds?: number | null
          deploy_logs_url?: string | null
          preview_url?: string | null
          production_url?: string | null
          git_commit_sha?: string | null
          git_branch?: string | null
          git_commit_message?: string | null
          git_author?: string | null
          platform?: string | null
          platform_deployment_id?: string | null
          platform_url?: string | null
          health_check_url?: string | null
          health_check_status?: string | null
          health_check_last_checked_at?: string | null
          triggered_by?: string | null
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          deployment_number?: number | null
          version?: string | null
          environment?: string
          status?: string
          error_message?: string | null
          build_started_at?: string | null
          build_completed_at?: string | null
          build_duration_seconds?: number | null
          build_logs_url?: string | null
          deploy_started_at?: string | null
          deploy_completed_at?: string | null
          deploy_duration_seconds?: number | null
          deploy_logs_url?: string | null
          preview_url?: string | null
          production_url?: string | null
          git_commit_sha?: string | null
          git_branch?: string | null
          git_commit_message?: string | null
          git_author?: string | null
          platform?: string | null
          platform_deployment_id?: string | null
          platform_url?: string | null
          health_check_url?: string | null
          health_check_status?: string | null
          health_check_last_checked_at?: string | null
          triggered_by?: string | null
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "emergent_deployments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "emergent_projects"
            referencedColumns: ["id"]
          }
        ]
      }
      emergent_integrations: {
        Row: {
          id: string
          project_id: string
          service: string
          config: Json | null
          status: string | null
          last_sync_at: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          project_id: string
          service: string
          config?: Json | null
          status?: string | null
          last_sync_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          project_id?: string
          service?: string
          config?: Json | null
          status?: string | null
          last_sync_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "emergent_integrations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "emergent_projects"
            referencedColumns: ["id"]
          }
        ]
      }
      emergent_playbooks: {
        Row: {
          id: string
          name: string
          description: string | null
          service: string
          code_templates: Json
          is_verified: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          service: string
          code_templates: Json
          is_verified?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          service?: string
          code_templates?: Json
          is_verified?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      conversations: {
        Row: {
          ai_model: string | null
          color_state: string | null
          created_at: string | null
          id: string
          message_count: number | null
          session_id: string
          title: string | null
          updated_at: string | null
        }
        Insert: {
          ai_model?: string | null
          color_state?: string | null
          created_at?: string | null
          id?: string
          message_count?: number | null
          session_id: string
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          ai_model?: string | null
          color_state?: string | null
          created_at?: string | null
          id?: string
          message_count?: number | null
          session_id?: string
          title?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversations_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          created_at: string | null
          id: string
          properties: Json | null
          session_id: string | null
          type: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          properties?: Json | null
          session_id?: string | null
          type: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          properties?: Json | null
          session_id?: string | null
          type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      feature_flags: {
        Row: {
          id: string
          name: string
          description: string | null
          enabled: boolean
          scope: string
          target_id: string | null
          config: Json
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          enabled?: boolean
          scope?: string
          target_id?: string | null
          config?: Json
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          enabled?: boolean
          scope?: string
          target_id?: string | null
          config?: Json
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "feature_flags_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      feature_flag_audit: {
        Row: {
          id: string
          flag_id: string | null
          flag_name: string
          action: string
          changed_by: string | null
          changes: Json
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          flag_id?: string | null
          flag_name: string
          action: string
          changed_by?: string | null
          changes?: Json
          metadata?: Json
          created_at?: string
        }
        Update: {
          id?: string
          flag_id?: string | null
          flag_name?: string
          action?: string
          changed_by?: string | null
          changes?: Json
          metadata?: Json
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "feature_flag_audit_flag_id_fkey"
            columns: ["flag_id"]
            isOneToOne: false
            referencedRelation: "feature_flags"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feature_flag_audit_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      feature_flag_webhooks: {
        Row: {
          id: string
          flag_id: string | null
          url: string
          secret: string | null
          enabled: boolean
          events: string[]
          retry_config: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          flag_id?: string | null
          url: string
          secret?: string | null
          enabled?: boolean
          events?: string[]
          retry_config?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          flag_id?: string | null
          url?: string
          secret?: string | null
          enabled?: boolean
          events?: string[]
          retry_config?: Json
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "feature_flag_webhooks_flag_id_fkey"
            columns: ["flag_id"]
            isOneToOne: false
            referencedRelation: "feature_flags"
            referencedColumns: ["id"]
          },
        ]
      }
      feature_flag_webhook_logs: {
        Row: {
          id: string
          webhook_id: string | null
          flag_id: string | null
          url: string
          event: string
          payload: Json
          status_code: number | null
          response_body: string | null
          error: string | null
          attempt_number: number
          delivered_at: string
        }
        Insert: {
          id?: string
          webhook_id?: string | null
          flag_id?: string | null
          url: string
          event: string
          payload: Json
          status_code?: number | null
          response_body?: string | null
          error?: string | null
          attempt_number?: number
          delivered_at?: string
        }
        Update: {
          id?: string
          webhook_id?: string | null
          flag_id?: string | null
          url?: string
          event?: string
          payload?: Json
          status_code?: number | null
          response_body?: string | null
          error?: string | null
          attempt_number?: number
          delivered_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "feature_flag_webhook_logs_webhook_id_fkey"
            columns: ["webhook_id"]
            isOneToOne: false
            referencedRelation: "feature_flag_webhooks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feature_flag_webhook_logs_flag_id_fkey"
            columns: ["flag_id"]
            isOneToOne: false
            referencedRelation: "feature_flags"
            referencedColumns: ["id"]
          },
        ]
      }
      memory: {
        Row: {
          created_at: string | null
          expires_at: string | null
          id: string
          key: string
          session_id: string
          value: string
          zone: string | null
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          key: string
          session_id: string
          value: string
          zone?: string | null
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          key?: string
          session_id?: string
          value?: string
          zone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "memory_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          color: string | null
          content: string
          conversation_id: string
          created_at: string | null
          id: string
          role: string
          tokens_used: number | null
        }
        Insert: {
          color?: string | null
          content: string
          conversation_id: string
          created_at?: string | null
          id?: string
          role: string
          tokens_used?: number | null
        }
        Update: {
          color?: string | null
          content?: string
          conversation_id?: string
          created_at?: string | null
          id?: string
          role?: string
          tokens_used?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action_details: Json | null
          action_type: string
          created_at: string | null
          id: string
          ip_address: string | null
          user_agent: string | null
          user_email: string | null
          user_id: string | null
        }
        Insert: {
          action_details?: Json | null
          action_type: string
          created_at?: string | null
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Update: {
          action_details?: Json | null
          action_type?: string
          created_at?: string | null
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          cubiqo_email: string | null
          cubiqo_phone: string | null
          display_name: string | null
          email: string | null
          handle: string | null
          id: string
          is_admin: boolean | null
          onboarding_completed: boolean | null
          onboarding_data: Json | null
          phone: string | null
          preferences: Json | null
          tier_id: string | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          cubiqo_email?: string | null
          cubiqo_phone?: string | null
          display_name?: string | null
          email?: string | null
          handle?: string | null
          id: string
          is_admin?: boolean | null
          onboarding_completed?: boolean | null
          onboarding_data?: Json | null
          phone?: string | null
          preferences?: Json | null
          tier_id?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          cubiqo_email?: string | null
          cubiqo_phone?: string | null
          display_name?: string | null
          email?: string | null
          handle?: string | null
          id?: string
          is_admin?: boolean | null
          onboarding_completed?: boolean | null
          onboarding_data?: Json | null
          phone?: string | null
          preferences?: Json | null
          tier_id?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      design_toggles: {
        Row: {
          id: string
          name: string
          display_name: string
          description: string | null
          category: 'design' | 'feature' | 'experiment'
          is_enabled: boolean
          config: Json
          updated_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          display_name: string
          description?: string | null
          category?: 'design' | 'feature' | 'experiment'
          is_enabled?: boolean
          config?: Json
          updated_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          display_name?: string
          description?: string | null
          category?: 'design' | 'feature' | 'experiment'
          is_enabled?: boolean
          config?: Json
          updated_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      sessions: {
        Row: {
          created_at: string | null
          device_info: Json | null
          expires_at: string | null
          geo_location: string | null
          id: string
          is_guest: boolean | null
          user_id: string | null
          adaptive_model_state: Json | null
        }
        Insert: {
          created_at?: string | null
          device_info?: Json | null
          expires_at?: string | null
          geo_location?: string | null
          id?: string
          is_guest?: boolean | null
          user_id?: string | null
          adaptive_model_state?: Json | null
        }
        Update: {
          created_at?: string | null
          device_info?: Json | null
          expires_at?: string | null
          geo_location?: string | null
          id?: string
          is_guest?: boolean | null
          user_id?: string | null
          adaptive_model_state?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      friends: {
        Row: {
          id: string
          user_id: string
          friend_id: string
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          friend_id: string
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          friend_id?: string
          status?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "friends_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "friends_friend_id_fkey"
            columns: ["friend_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      direct_messages: {
        Row: {
          id: string
          sender_id: string
          receiver_id: string
          content: string
          is_read: boolean
          is_voice_delivered: boolean
          created_at: string
        }
        Insert: {
          id?: string
          sender_id: string
          receiver_id: string
          content: string
          is_read?: boolean
          is_voice_delivered?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          sender_id?: string
          receiver_id?: string
          content?: string
          is_read?: boolean
          is_voice_delivered?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "direct_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "direct_messages_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      },
      social_accounts: {
        Row: {
          id: string
          platform: 'twitter' | 'tiktok' | 'linkedin' | 'instagram' | 'youtube'
          username: string
          password_encrypted: string | null
          persona_type: 'builder' | 'guru' | 'philosopher' | 'artist' | 'memer' | null
          status: 'active' | 'limited' | 'banned' | 'offline' | null
          last_posted_at: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          platform: 'twitter' | 'tiktok' | 'linkedin' | 'instagram' | 'youtube'
          username: string
          password_encrypted?: string | null
          persona_type?: 'builder' | 'guru' | 'philosopher' | 'artist' | 'memer' | null
          status?: 'active' | 'limited' | 'banned' | 'offline' | null
          last_posted_at?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          platform?: 'twitter' | 'tiktok' | 'linkedin' | 'instagram' | 'youtube'
          username?: string
          password_encrypted?: string | null
          persona_type?: 'builder' | 'guru' | 'philosopher' | 'artist' | 'memer' | null
          status?: 'active' | 'limited' | 'banned' | 'offline' | null
          last_posted_at?: string | null
          created_at?: string | null
        }
        Relationships: []
      },
      social_campaigns: {
        Row: {
          id: string
          name: string
          seed_topic: string
          status: 'draft' | 'running' | 'paused' | 'completed' | null
          total_posts_target: number | null
          created_at: string | null
        }
        Insert: {
          id?: string
          name: string
          seed_topic: string
          status?: 'draft' | 'running' | 'paused' | 'completed' | null
          total_posts_target?: number | null
          created_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          seed_topic?: string
          status?: 'draft' | 'running' | 'paused' | 'completed' | null
          total_posts_target?: number | null
          created_at?: string | null
        }
        Relationships: []
      },
      content_queue: {
        Row: {
          id: string
          campaign_id: string | null
          target_account_id: string | null
          content_type: 'video' | 'image' | 'text' | null
          generation_status: 'pending' | 'processing' | 'ready' | 'failed' | 'posted' | null
          asset_url: string | null
          caption: string | null
          scheduled_for: string | null
          posted_at: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          campaign_id?: string | null
          target_account_id?: string | null
          content_type?: 'video' | 'image' | 'text' | null
          generation_status?: 'pending' | 'processing' | 'ready' | 'failed' | 'posted' | null
          asset_url?: string | null
          caption?: string | null
          scheduled_for?: string | null
          posted_at?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          campaign_id?: string | null
          target_account_id?: string | null
          content_type?: 'video' | 'image' | 'text' | null
          generation_status?: 'pending' | 'processing' | 'ready' | 'failed' | 'posted' | null
          asset_url?: string | null
          caption?: string | null
          scheduled_for?: string | null
          posted_at?: string | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "content_queue_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "social_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_queue_target_account_id_fkey"
            columns: ["target_account_id"]
            isOneToOne: false
            referencedRelation: "social_accounts"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cleanup_expired_data: { Args: never; Returns: undefined }
      convert_guest_session: {
        Args: { p_email?: string; p_session_id: string; p_user_id: string }
        Returns: string
      }
      ensure_profile_and_session: {
        Args: {
          p_device_info?: Json
          p_email?: string
          p_geo_location?: string
          p_user_id: string
        }
        Returns: {
          is_new_session: boolean
          session_id: string
        }[]
      }
      generate_unique_handle: { Args: never; Returns: string }
      log_admin_action: {
        Args: {
          p_user_id: string
          p_user_email: string
          p_action_type: string
          p_action_details?: Json
          p_ip_address?: string
          p_user_agent?: string
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
    Enums: {},
  },
} as const
