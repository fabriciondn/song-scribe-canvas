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
      admin_users: {
        Row: {
          created_at: string
          id: string
          permissions: Json | null
          role: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          permissions?: Json | null
          role?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          permissions?: Json | null
          role?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      affiliate_achievements: {
        Row: {
          achievement_description: string | null
          achievement_name: string
          achievement_type: string
          affiliate_id: string
          created_at: string
          id: string
          unlocked_at: string
        }
        Insert: {
          achievement_description?: string | null
          achievement_name: string
          achievement_type: string
          affiliate_id: string
          created_at?: string
          id?: string
          unlocked_at?: string
        }
        Update: {
          achievement_description?: string | null
          achievement_name?: string
          achievement_type?: string
          affiliate_id?: string
          created_at?: string
          id?: string
          unlocked_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_achievements_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_campaigns: {
        Row: {
          affiliate_id: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          total_clicks: number
          total_conversions: number
          updated_at: string
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
        }
        Insert: {
          affiliate_id: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          total_clicks?: number
          total_conversions?: number
          updated_at?: string
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Update: {
          affiliate_id?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          total_clicks?: number
          total_conversions?: number
          updated_at?: string
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_campaigns_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_clicks: {
        Row: {
          affiliate_id: string
          campaign_id: string | null
          converted: boolean
          created_at: string
          id: string
          ip_address: unknown
          referrer: string | null
          user_agent: string | null
          user_id: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
        }
        Insert: {
          affiliate_id: string
          campaign_id?: string | null
          converted?: boolean
          created_at?: string
          id?: string
          ip_address?: unknown
          referrer?: string | null
          user_agent?: string | null
          user_id?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Update: {
          affiliate_id?: string
          campaign_id?: string | null
          converted?: boolean
          created_at?: string
          id?: string
          ip_address?: unknown
          referrer?: string | null
          user_agent?: string | null
          user_id?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_clicks_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_clicks_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "affiliate_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_clicks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_clicks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_commissions: {
        Row: {
          affiliate_id: string
          amount: number
          campaign_id: string | null
          commission_rate: number
          created_at: string
          id: string
          paid_in_withdrawal_id: string | null
          processed_at: string | null
          reference_id: string
          status: Database["public"]["Enums"]["commission_status"]
          type: Database["public"]["Enums"]["commission_type"]
          updated_at: string
          user_id: string
          validated_at: string | null
          validation_deadline: string | null
          validation_notes: string | null
        }
        Insert: {
          affiliate_id: string
          amount: number
          campaign_id?: string | null
          commission_rate: number
          created_at?: string
          id?: string
          paid_in_withdrawal_id?: string | null
          processed_at?: string | null
          reference_id: string
          status?: Database["public"]["Enums"]["commission_status"]
          type: Database["public"]["Enums"]["commission_type"]
          updated_at?: string
          user_id: string
          validated_at?: string | null
          validation_deadline?: string | null
          validation_notes?: string | null
        }
        Update: {
          affiliate_id?: string
          amount?: number
          campaign_id?: string | null
          commission_rate?: number
          created_at?: string
          id?: string
          paid_in_withdrawal_id?: string | null
          processed_at?: string | null
          reference_id?: string
          status?: Database["public"]["Enums"]["commission_status"]
          type?: Database["public"]["Enums"]["commission_type"]
          updated_at?: string
          user_id?: string
          validated_at?: string | null
          validation_deadline?: string | null
          validation_notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_commissions_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_commissions_paid_in_withdrawal_id_fkey"
            columns: ["paid_in_withdrawal_id"]
            isOneToOne: false
            referencedRelation: "affiliate_withdrawal_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_conversions: {
        Row: {
          affiliate_id: string
          click_id: string | null
          commission_id: string | null
          created_at: string
          id: string
          reference_id: string
          type: Database["public"]["Enums"]["commission_type"]
          user_id: string
        }
        Insert: {
          affiliate_id: string
          click_id?: string | null
          commission_id?: string | null
          created_at?: string
          id?: string
          reference_id: string
          type: Database["public"]["Enums"]["commission_type"]
          user_id: string
        }
        Update: {
          affiliate_id?: string
          click_id?: string | null
          commission_id?: string | null
          created_at?: string
          id?: string
          reference_id?: string
          type?: Database["public"]["Enums"]["commission_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_conversions_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_conversions_click_id_fkey"
            columns: ["click_id"]
            isOneToOne: false
            referencedRelation: "affiliate_clicks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_conversions_commission_id_fkey"
            columns: ["commission_id"]
            isOneToOne: false
            referencedRelation: "affiliate_commissions"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_payouts: {
        Row: {
          affiliate_id: string
          amount: number
          created_at: string
          id: string
          payment_details: Json | null
          payment_method: string | null
          processed_at: string | null
          processed_by: string | null
          status: string
          updated_at: string
        }
        Insert: {
          affiliate_id: string
          amount: number
          created_at?: string
          id?: string
          payment_details?: Json | null
          payment_method?: string | null
          processed_at?: string | null
          processed_by?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          affiliate_id?: string
          amount?: number
          created_at?: string
          id?: string
          payment_details?: Json | null
          payment_method?: string | null
          processed_at?: string | null
          processed_by?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_payouts_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_withdrawal_requests: {
        Row: {
          affiliate_id: string
          amount: number
          approved_by: string | null
          created_at: string | null
          id: string
          payment_details: Json | null
          payment_method: string | null
          processed_at: string | null
          processed_by: string | null
          rejection_reason: string | null
          requested_at: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          affiliate_id: string
          amount: number
          approved_by?: string | null
          created_at?: string | null
          id?: string
          payment_details?: Json | null
          payment_method?: string | null
          processed_at?: string | null
          processed_by?: string | null
          rejection_reason?: string | null
          requested_at?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          affiliate_id?: string
          amount?: number
          approved_by?: string | null
          created_at?: string | null
          id?: string
          payment_details?: Json | null
          payment_method?: string | null
          processed_at?: string | null
          processed_by?: string | null
          rejection_reason?: string | null
          requested_at?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_withdrawal_requests_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_withdrawal_requests_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_withdrawal_requests_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliates: {
        Row: {
          affiliate_code: string
          approved_at: string | null
          approved_by: string | null
          contact_email: string | null
          created_at: string
          custom_commission_rate: number | null
          full_name: string | null
          id: string
          level: Database["public"]["Enums"]["affiliate_level"]
          promotion_strategy: string | null
          rejection_reason: string | null
          social_media_link: string | null
          status: Database["public"]["Enums"]["affiliate_status"]
          tiktok_link: string | null
          total_earnings: number
          total_paid: number
          total_registrations: number
          total_subscriptions: number
          updated_at: string
          user_id: string
          website_link: string | null
          whatsapp: string | null
          youtube_link: string | null
        }
        Insert: {
          affiliate_code: string
          approved_at?: string | null
          approved_by?: string | null
          contact_email?: string | null
          created_at?: string
          custom_commission_rate?: number | null
          full_name?: string | null
          id?: string
          level?: Database["public"]["Enums"]["affiliate_level"]
          promotion_strategy?: string | null
          rejection_reason?: string | null
          social_media_link?: string | null
          status?: Database["public"]["Enums"]["affiliate_status"]
          tiktok_link?: string | null
          total_earnings?: number
          total_paid?: number
          total_registrations?: number
          total_subscriptions?: number
          updated_at?: string
          user_id: string
          website_link?: string | null
          whatsapp?: string | null
          youtube_link?: string | null
        }
        Update: {
          affiliate_code?: string
          approved_at?: string | null
          approved_by?: string | null
          contact_email?: string | null
          created_at?: string
          custom_commission_rate?: number | null
          full_name?: string | null
          id?: string
          level?: Database["public"]["Enums"]["affiliate_level"]
          promotion_strategy?: string | null
          rejection_reason?: string | null
          social_media_link?: string | null
          status?: Database["public"]["Enums"]["affiliate_status"]
          tiktok_link?: string | null
          total_earnings?: number
          total_paid?: number
          total_registrations?: number
          total_subscriptions?: number
          updated_at?: string
          user_id?: string
          website_link?: string | null
          whatsapp?: string | null
          youtube_link?: string | null
        }
        Relationships: []
      }
      author_registrations: {
        Row: {
          additional_info: string | null
          analysis_completed_at: string | null
          analysis_started_at: string | null
          audio_file_path: string | null
          author: string
          created_at: string
          genre: string
          hash: string | null
          id: string
          lyrics: string
          other_authors: string | null
          pdf_provisorio: string | null
          rhythm: string
          song_version: string
          status: string
          terms_accepted: boolean
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          additional_info?: string | null
          analysis_completed_at?: string | null
          analysis_started_at?: string | null
          audio_file_path?: string | null
          author: string
          created_at?: string
          genre: string
          hash?: string | null
          id?: string
          lyrics: string
          other_authors?: string | null
          pdf_provisorio?: string | null
          rhythm: string
          song_version: string
          status?: string
          terms_accepted?: boolean
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          additional_info?: string | null
          analysis_completed_at?: string | null
          analysis_started_at?: string | null
          audio_file_path?: string | null
          author?: string
          created_at?: string
          genre?: string
          hash?: string | null
          id?: string
          lyrics?: string
          other_authors?: string | null
          pdf_provisorio?: string | null
          rhythm?: string
          song_version?: string
          status?: string
          terms_accepted?: boolean
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      banners: {
        Row: {
          button_text: string | null
          created_at: string
          created_by: string | null
          id: string
          image_url: string
          is_active: boolean | null
          order_index: number | null
          position: string | null
          redirect_url: string | null
          title: string
          updated_at: string
        }
        Insert: {
          button_text?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          image_url: string
          is_active?: boolean | null
          order_index?: number | null
          position?: string | null
          redirect_url?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          button_text?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          image_url?: string
          is_active?: boolean | null
          order_index?: number | null
          position?: string | null
          redirect_url?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      certificate_templates: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          design_data: Json
          id: string
          is_active: boolean
          is_default: boolean
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          design_data?: Json
          id?: string
          is_active?: boolean
          is_default?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          design_data?: Json
          id?: string
          is_active?: boolean
          is_default?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      credit_transactions: {
        Row: {
          bonus_credits: number | null
          completed_at: string | null
          created_at: string
          credits_purchased: number
          id: string
          payment_id: string | null
          payment_provider: string
          status: string
          total_amount: number
          unit_price: number
          updated_at: string
          user_id: string
        }
        Insert: {
          bonus_credits?: number | null
          completed_at?: string | null
          created_at?: string
          credits_purchased: number
          id?: string
          payment_id?: string | null
          payment_provider?: string
          status?: string
          total_amount: number
          unit_price: number
          updated_at?: string
          user_id: string
        }
        Update: {
          bonus_credits?: number | null
          completed_at?: string | null
          created_at?: string
          credits_purchased?: number
          id?: string
          payment_id?: string | null
          payment_provider?: string
          status?: string
          total_amount?: number
          unit_price?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      drafts: {
        Row: {
          audio_files: Json | null
          audio_url: string | null
          content: string
          created_at: string | null
          deleted_at: string | null
          deleted_by: string | null
          id: string
          title: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          audio_files?: Json | null
          audio_url?: string | null
          content: string
          created_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          id?: string
          title: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          audio_files?: Json | null
          audio_url?: string | null
          content?: string
          created_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          id?: string
          title?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      folders: {
        Row: {
          created_at: string | null
          deleted_at: string | null
          deleted_by: string | null
          id: string
          is_system: boolean | null
          name: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          id?: string
          is_system?: boolean | null
          name: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          id?: string
          is_system?: boolean | null
          name?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      menu_functions: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          function_key: string
          icon: string | null
          id: string
          is_hidden: boolean | null
          name: string
          route: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          function_key: string
          icon?: string | null
          id?: string
          is_hidden?: boolean | null
          name: string
          route?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          function_key?: string
          icon?: string | null
          id?: string
          is_hidden?: boolean | null
          name?: string
          route?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      moderator_registration_tokens: {
        Row: {
          created_at: string
          created_by: string
          expires_at: string
          id: string
          token: string
          updated_at: string
          used: boolean
          used_at: string | null
          used_by: string | null
        }
        Insert: {
          created_at?: string
          created_by: string
          expires_at: string
          id?: string
          token: string
          updated_at?: string
          used?: boolean
          used_at?: string | null
          used_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string
          expires_at?: string
          id?: string
          token?: string
          updated_at?: string
          used?: boolean
          used_at?: string | null
          used_by?: string | null
        }
        Relationships: []
      }
      moderator_transactions: {
        Row: {
          amount: number
          created_at: string
          description: string
          id: string
          moderator_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          description: string
          id?: string
          moderator_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string
          id?: string
          moderator_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      moderator_users: {
        Row: {
          created_at: string
          id: string
          moderator_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          moderator_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          moderator_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      music_bases: {
        Row: {
          created_at: string
          deleted_at: string | null
          deleted_by: string | null
          description: string | null
          file_path: string
          folder_id: string | null
          genre: string
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          description?: string | null
          file_path: string
          folder_id?: string | null
          genre: string
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          description?: string | null
          file_path?: string
          folder_id?: string | null
          genre?: string
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "music_bases_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "folders"
            referencedColumns: ["id"]
          },
        ]
      }
      partnership_audio_recordings: {
        Row: {
          created_at: string
          duration: number | null
          file_path: string
          id: string
          partnership_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          duration?: number | null
          file_path: string
          id?: string
          partnership_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          duration?: number | null
          file_path?: string
          id?: string
          partnership_id?: string
          user_id?: string
        }
        Relationships: []
      }
      partnership_collaborators: {
        Row: {
          created_at: string | null
          id: string
          partnership_id: string | null
          permission: string | null
          status: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          partnership_id?: string | null
          permission?: string | null
          status?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          partnership_id?: string | null
          permission?: string | null
          status?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "partnership_collaborators_partnership_id_fkey"
            columns: ["partnership_id"]
            isOneToOne: false
            referencedRelation: "partnerships"
            referencedColumns: ["id"]
          },
        ]
      }
      partnership_compositions: {
        Row: {
          author_segments: Json | null
          content: string | null
          created_at: string | null
          id: string
          last_modified_by: string | null
          partnership_id: string | null
          updated_at: string | null
        }
        Insert: {
          author_segments?: Json | null
          content?: string | null
          created_at?: string | null
          id?: string
          last_modified_by?: string | null
          partnership_id?: string | null
          updated_at?: string | null
        }
        Update: {
          author_segments?: Json | null
          content?: string | null
          created_at?: string | null
          id?: string
          last_modified_by?: string | null
          partnership_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "partnership_compositions_partnership_id_fkey"
            columns: ["partnership_id"]
            isOneToOne: true
            referencedRelation: "partnerships"
            referencedColumns: ["id"]
          },
        ]
      }
      partnership_messages: {
        Row: {
          audio_url: string | null
          content: string
          created_at: string
          id: string
          message_type: string
          partnership_id: string
          replied_to_message_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          audio_url?: string | null
          content: string
          created_at?: string
          id?: string
          message_type?: string
          partnership_id: string
          replied_to_message_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          audio_url?: string | null
          content?: string
          created_at?: string
          id?: string
          message_type?: string
          partnership_id?: string
          replied_to_message_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      partnership_parts: {
        Row: {
          approved_by: string | null
          content: string
          created_at: string
          id: string
          order_index: number
          part_type: string
          partnership_id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          approved_by?: string | null
          content: string
          created_at?: string
          id?: string
          order_index?: number
          part_type: string
          partnership_id: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          approved_by?: string | null
          content?: string
          created_at?: string
          id?: string
          order_index?: number
          part_type?: string
          partnership_id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      partnership_tokens: {
        Row: {
          created_at: string | null
          expires_at: string
          id: string
          partnership_id: string | null
          token: string
          used: boolean | null
        }
        Insert: {
          created_at?: string | null
          expires_at: string
          id?: string
          partnership_id?: string | null
          token: string
          used?: boolean | null
        }
        Update: {
          created_at?: string | null
          expires_at?: string
          id?: string
          partnership_id?: string | null
          token?: string
          used?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "partnership_tokens_partnership_id_fkey"
            columns: ["partnership_id"]
            isOneToOne: false
            referencedRelation: "partnerships"
            referencedColumns: ["id"]
          },
        ]
      }
      partnerships: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          title: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          title: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          title?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          address: string | null
          artistic_name: string | null
          avatar_url: string | null
          birth_date: string | null
          cellphone: string | null
          cep: string | null
          city: string | null
          cpf: string | null
          created_at: string | null
          credits: number | null
          email: string | null
          id: string
          moderator_notes: string | null
          name: string | null
          neighborhood: string | null
          number: string | null
          state: string | null
          street: string | null
          username: string | null
        }
        Insert: {
          address?: string | null
          artistic_name?: string | null
          avatar_url?: string | null
          birth_date?: string | null
          cellphone?: string | null
          cep?: string | null
          city?: string | null
          cpf?: string | null
          created_at?: string | null
          credits?: number | null
          email?: string | null
          id: string
          moderator_notes?: string | null
          name?: string | null
          neighborhood?: string | null
          number?: string | null
          state?: string | null
          street?: string | null
          username?: string | null
        }
        Update: {
          address?: string | null
          artistic_name?: string | null
          avatar_url?: string | null
          birth_date?: string | null
          cellphone?: string | null
          cep?: string | null
          city?: string | null
          cpf?: string | null
          created_at?: string | null
          credits?: number | null
          email?: string | null
          id?: string
          moderator_notes?: string | null
          name?: string | null
          neighborhood?: string | null
          number?: string | null
          state?: string | null
          street?: string | null
          username?: string | null
        }
        Relationships: []
      }
      public_registration_forms: {
        Row: {
          artistic_name: string | null
          birth_date: string
          cep: string
          city: string
          cpf: string
          created_at: string
          email: string
          full_name: string
          id: string
          neighborhood: string
          number: string
          phone: string | null
          state: string
          street: string
          updated_at: string
        }
        Insert: {
          artistic_name?: string | null
          birth_date: string
          cep: string
          city: string
          cpf: string
          created_at?: string
          email: string
          full_name: string
          id?: string
          neighborhood: string
          number: string
          phone?: string | null
          state: string
          street: string
          updated_at?: string
        }
        Update: {
          artistic_name?: string | null
          birth_date?: string
          cep?: string
          city?: string
          cpf?: string
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          neighborhood?: string
          number?: string
          phone?: string | null
          state?: string
          street?: string
          updated_at?: string
        }
        Relationships: []
      }
      registration_rate_limits: {
        Row: {
          created_at: string | null
          email: string | null
          first_submission: string | null
          id: string
          ip_address: unknown
          is_blocked: boolean | null
          last_submission: string | null
          submission_count: number | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          first_submission?: string | null
          id?: string
          ip_address?: unknown
          is_blocked?: boolean | null
          last_submission?: string | null
          submission_count?: number | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          first_submission?: string | null
          id?: string
          ip_address?: unknown
          is_blocked?: boolean | null
          last_submission?: string | null
          submission_count?: number | null
        }
        Relationships: []
      }
      segment_approvals: {
        Row: {
          created_at: string
          id: string
          partnership_id: string
          segment_id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          partnership_id: string
          segment_id: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          partnership_id?: string
          segment_id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      segment_comments: {
        Row: {
          comment: string
          created_at: string
          id: string
          partnership_id: string
          segment_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          comment: string
          created_at?: string
          id?: string
          partnership_id: string
          segment_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          comment?: string
          created_at?: string
          id?: string
          partnership_id?: string
          segment_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      songs: {
        Row: {
          content: string
          created_at: string | null
          deleted_at: string | null
          deleted_by: string | null
          folder_id: string | null
          id: string
          title: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          folder_id?: string | null
          id?: string
          title: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          folder_id?: string | null
          id?: string
          title?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "songs_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "folders"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          amount: number | null
          auto_renew: boolean
          created_at: string
          currency: string | null
          expires_at: string | null
          id: string
          payment_provider: string | null
          payment_provider_subscription_id: string | null
          plan_type: string
          started_at: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount?: number | null
          auto_renew?: boolean
          created_at?: string
          currency?: string | null
          expires_at?: string | null
          id?: string
          payment_provider?: string | null
          payment_provider_subscription_id?: string | null
          plan_type?: string
          started_at?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number | null
          auto_renew?: boolean
          created_at?: string
          currency?: string | null
          expires_at?: string | null
          id?: string
          payment_provider?: string | null
          payment_provider_subscription_id?: string | null
          plan_type?: string
          started_at?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      templates: {
        Row: {
          city: string | null
          collaborators: string | null
          created_at: string | null
          deleted_at: string | null
          deleted_by: string | null
          duration: string | null
          genre: string | null
          id: string
          instrumentation: string | null
          is_active: boolean | null
          location: string | null
          name: string
          notes: string | null
          selected_fields: Json | null
          updated_at: string | null
          user_id: string | null
          version: string | null
        }
        Insert: {
          city?: string | null
          collaborators?: string | null
          created_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          duration?: string | null
          genre?: string | null
          id?: string
          instrumentation?: string | null
          is_active?: boolean | null
          location?: string | null
          name: string
          notes?: string | null
          selected_fields?: Json | null
          updated_at?: string | null
          user_id?: string | null
          version?: string | null
        }
        Update: {
          city?: string | null
          collaborators?: string | null
          created_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          duration?: string | null
          genre?: string | null
          id?: string
          instrumentation?: string | null
          is_active?: boolean | null
          location?: string | null
          name?: string
          notes?: string | null
          selected_fields?: Json | null
          updated_at?: string | null
          user_id?: string | null
          version?: string | null
        }
        Relationships: []
      }
      tutorials: {
        Row: {
          category: string | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean | null
          order_index: number | null
          thumbnail_url: string | null
          title: string
          updated_at: string
          video_url: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          order_index?: number | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string
          video_url: string
        }
        Update: {
          category?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          order_index?: number | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          video_url?: string
        }
        Relationships: []
      }
      user_activity_logs: {
        Row: {
          action: string
          id: string
          ip_address: string | null
          metadata: Json | null
          timestamp: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          action: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          timestamp?: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          action?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          timestamp?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          assigned_by: string | null
          created_at: string
          id: string
          role: string
          updated_at: string
          user_id: string
        }
        Insert: {
          assigned_by?: string | null
          created_at?: string
          id?: string
          role?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          assigned_by?: string | null
          created_at?: string
          id?: string
          role?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_sessions: {
        Row: {
          created_at: string
          id: string
          ip_address: string | null
          is_active: boolean | null
          last_activity: string
          session_id: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          ip_address?: string | null
          is_active?: boolean | null
          last_activity?: string
          session_id: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          ip_address?: string | null
          is_active?: boolean | null
          last_activity?: string
          session_id?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      public_profiles: {
        Row: {
          artistic_name: string | null
          id: string | null
          name: string | null
        }
        Insert: {
          artistic_name?: string | null
          id?: string | null
          name?: string | null
        }
        Update: {
          artistic_name?: string | null
          id?: string | null
          name?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      admin_update_user_credits: {
        Args: { new_credits: number; target_user_id: string }
        Returns: undefined
      }
      can_moderator_manage_user: {
        Args: { target_user_id: string }
        Returns: boolean
      }
      check_admin_access: { Args: never; Returns: boolean }
      check_affiliate_level_upgrade: {
        Args: { p_affiliate_id: string }
        Returns: undefined
      }
      check_subscription_expiry: {
        Args: { p_user_id: string }
        Returns: boolean
      }
      cleanup_old_sessions: { Args: never; Returns: undefined }
      cleanup_trash: { Args: never; Returns: undefined }
      create_draft: {
        Args: {
          draft_audio_url: string
          draft_content: string
          draft_title: string
          draft_user_id: string
        }
        Returns: {
          audio_files: Json | null
          audio_url: string | null
          content: string
          created_at: string | null
          deleted_at: string | null
          deleted_by: string | null
          id: string
          title: string
          updated_at: string | null
          user_id: string | null
        }
        SetofOptions: {
          from: "*"
          to: "drafts"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      decrement_user_credit: { Args: { user_id: string }; Returns: undefined }
      delete_draft: { Args: { draft_id: string }; Returns: undefined }
      generate_affiliate_code: {
        Args: { user_id: string; user_name: string }
        Returns: string
      }
      get_admin_dashboard_stats: { Args: never; Returns: Json }
      get_composers_ranking: {
        Args: never
        Returns: {
          artistic_name: string
          avatar_url: string
          created_at: string
          email: string
          id: string
          name: string
          total_works: number
        }[]
      }
      get_draft_by_id: {
        Args: { draft_id: string }
        Returns: {
          audio_files: Json | null
          audio_url: string | null
          content: string
          created_at: string | null
          deleted_at: string | null
          deleted_by: string | null
          id: string
          title: string
          updated_at: string | null
          user_id: string | null
        }
        SetofOptions: {
          from: "*"
          to: "drafts"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      get_drafts: {
        Args: never
        Returns: {
          audio_files: Json | null
          audio_url: string | null
          content: string
          created_at: string | null
          deleted_at: string | null
          deleted_by: string | null
          id: string
          title: string
          updated_at: string | null
          user_id: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "drafts"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_function_status: { Args: { p_function_key: string }; Returns: string }
      get_moderator_dashboard_stats: { Args: never; Returns: Json }
      get_online_users: {
        Args: never
        Returns: {
          avatar_url: string
          email: string
          last_activity: string
          name: string
          user_id: string
        }[]
      }
      get_online_users_count: { Args: never; Returns: number }
      get_user_role: { Args: { user_id: string }; Returns: string }
      is_admin_user: { Args: never; Returns: boolean }
      is_user_admin: { Args: { check_user_id: string }; Returns: boolean }
      is_user_moderator: { Args: { check_user_id: string }; Returns: boolean }
      log_user_activity: {
        Args: { p_action: string; p_metadata?: Json }
        Returns: undefined
      }
      mark_commissions_as_paid: {
        Args: {
          p_affiliate_id: string
          p_amount: number
          p_withdrawal_id: string
        }
        Returns: undefined
      }
      moderator_update_user_credits: {
        Args: { new_credits: number; target_user_id: string }
        Returns: undefined
      }
      populate_menu_functions: { Args: never; Returns: undefined }
      process_affiliate_conversion: {
        Args: {
          p_affiliate_code: string
          p_amount: number
          p_reference_id: string
          p_type: Database["public"]["Enums"]["commission_type"]
          p_user_id: string
        }
        Returns: boolean
      }
      process_affiliate_first_purchase: {
        Args: {
          p_payment_amount: number
          p_payment_id?: string
          p_user_id: string
        }
        Returns: boolean
      }
      process_affiliate_registration: {
        Args: { p_affiliate_code: string; p_user_id: string }
        Returns: boolean
      }
      process_affiliate_withdrawal_payment: {
        Args: { p_admin_id: string; p_withdrawal_id: string }
        Returns: boolean
      }
      process_pending_registrations: { Args: never; Returns: undefined }
      register_moderator_with_token: {
        Args: {
          p_email: string
          p_name: string
          p_token: string
          p_user_id: string
        }
        Returns: boolean
      }
      secure_public_registration:
        | {
            Args: {
              p_artistic_name?: string
              p_birth_date: string
              p_cep: string
              p_city: string
              p_client_ip?: unknown
              p_cpf: string
              p_email: string
              p_full_name: string
              p_neighborhood: string
              p_number: string
              p_phone?: string
              p_state: string
              p_street: string
            }
            Returns: Json
          }
        | {
            Args: {
              p_artistic_name?: string
              p_birth_date: string
              p_cep: string
              p_city: string
              p_client_ip?: unknown
              p_cpf: string
              p_email: string
              p_full_name: string
              p_neighborhood: string
              p_number: string
              p_state: string
              p_street: string
            }
            Returns: Json
          }
      update_draft: {
        Args: { draft_id: string; draft_updates: Json }
        Returns: {
          audio_files: Json | null
          audio_url: string | null
          content: string
          created_at: string | null
          deleted_at: string | null
          deleted_by: string | null
          id: string
          title: string
          updated_at: string | null
          user_id: string | null
        }
        SetofOptions: {
          from: "*"
          to: "drafts"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      update_user_credits: {
        Args: {
          credit_amount: number
          target_user_id: string
          transaction_description?: string
        }
        Returns: boolean
      }
      validate_affiliate_commissions: { Args: never; Returns: Json }
    }
    Enums: {
      affiliate_level: "bronze" | "silver" | "gold"
      affiliate_status: "pending" | "approved" | "rejected" | "suspended"
      commission_status: "pending" | "approved" | "paid" | "cancelled"
      commission_type: "author_registration" | "subscription_recurring"
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
      affiliate_level: ["bronze", "silver", "gold"],
      affiliate_status: ["pending", "approved", "rejected", "suspended"],
      commission_status: ["pending", "approved", "paid", "cancelled"],
      commission_type: ["author_registration", "subscription_recurring"],
    },
  },
} as const
