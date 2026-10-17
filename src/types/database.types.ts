export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey";
            columns: ["id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      prompts: {
        Row: {
          id: string;
          slug: string;
          title: string;
          short_description: string;
          prompt: string;
          category: string;
          model: string;
          compatible_models: string[];
          tags: string[];
          image_url: string;
          image_alt: string;
          width: number;
          height: number;
          aspect_ratio: string;
          aspect_ratio_value: string;
          dominant_color: string;
          negative_prompt: string | null;
          generation_parameters: Json | null;
          source_attribution: Json;
          published: boolean;
          published_at: string;
          status: "draft" | "published" | "archived";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          slug: string;
          title: string;
          short_description: string;
          prompt: string;
          category: string;
          model: string;
          compatible_models?: string[];
          tags?: string[];
          image_url: string;
          image_alt: string;
          width?: number;
          height?: number;
          aspect_ratio?: string;
          aspect_ratio_value?: string;
          dominant_color?: string;
          negative_prompt?: string | null;
          generation_parameters?: Json | null;
          source_attribution?: Json;
          published?: boolean;
          published_at?: string;
          status?: "draft" | "published" | "archived";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          title?: string;
          short_description?: string;
          prompt?: string;
          category?: string;
          model?: string;
          compatible_models?: string[];
          tags?: string[];
          image_url?: string;
          image_alt?: string;
          width?: number;
          height?: number;
          aspect_ratio?: string;
          aspect_ratio_value?: string;
          dominant_color?: string;
          negative_prompt?: string | null;
          generation_parameters?: Json | null;
          source_attribution?: Json;
          published?: boolean;
          published_at?: string;
          status?: "draft" | "published" | "archived";
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      admin_users: {
        Row: {
          user_id: string;
          created_at: string;
          created_by: string | null;
        };
        Insert: {
          user_id: string;
          created_at?: string;
          created_by?: string | null;
        };
        Update: {
          user_id?: string;
          created_at?: string;
          created_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "admin_users_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      admin_audit_logs: {
        Row: {
          id: string;
          actor_id: string;
          prompt_id: string | null;
          action: string;
          previous_state: Json | null;
          new_state: Json | null;
          changed_fields: string[];
          created_at: string;
        };
        Insert: {
          id?: string;
          actor_id: string;
          prompt_id?: string | null;
          action: string;
          previous_state?: Json | null;
          new_state?: Json | null;
          changed_fields?: string[];
          created_at?: string;
        };
        Update: {
          id?: string;
          actor_id?: string;
          prompt_id?: string | null;
          action?: string;
          previous_state?: Json | null;
          new_state?: Json | null;
          changed_fields?: string[];
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "admin_audit_logs_actor_id_fkey";
            columns: ["actor_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "admin_audit_logs_prompt_id_fkey";
            columns: ["prompt_id"];
            referencedRelation: "prompts";
            referencedColumns: ["id"];
          }
        ];
      };
      bookmarks: {
        Row: {
          id: string;
          user_id: string;
          prompt_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          prompt_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          prompt_id?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "bookmarks_prompt_id_fkey";
            columns: ["prompt_id"];
            referencedRelation: "prompts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "bookmarks_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      is_admin: {
        Args: {
          user_id: string;
        };
        Returns: boolean;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
