export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
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
          cep: string | null
          city: string | null
          cpf: string | null
          created_at: string | null
          credits: number | null
          email: string | null
          id: string
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
          cep?: string | null
          city?: string | null
          cpf?: string | null
          created_at?: string | null
          credits?: number | null
          email?: string | null
          id: string
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
          cep?: string | null
          city?: string | null
          cpf?: string | null
          created_at?: string | null
          credits?: number | null
          email?: string | null
          id?: string
          name?: string | null
          neighborhood?: string | null
          number?: string | null
          state?: string | null
          street?: string | null
          username?: string | null
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
      [_ in never]: never
    }
    Functions: {
      admin_update_user_credits: {
        Args: { target_user_id: string; new_credits: number }
        Returns: undefined
      }
      check_admin_access: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      cleanup_old_sessions: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      cleanup_trash: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      create_draft: {
        Args: {
          draft_title: string
          draft_content: string
          draft_audio_url: string
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
      }
      decrement_user_credit: {
        Args: { user_id: string }
        Returns: undefined
      }
      delete_draft: {
        Args: { draft_id: string }
        Returns: undefined
      }
      get_admin_dashboard_stats: {
        Args: Record<PropertyKey, never>
        Returns: Json
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
      }
      get_drafts: {
        Args: Record<PropertyKey, never>
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
      }
      get_online_users_count: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      is_admin_user: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_user_admin: {
        Args: { check_user_id: string }
        Returns: boolean
      }
      log_user_activity: {
        Args: { p_action: string; p_metadata?: Json }
        Returns: undefined
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
