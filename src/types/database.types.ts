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
          username: string | null;
          bio: string | null;
          avatar_url: string | null;
          website_url: string | null;
          is_public: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          username?: string | null;
          bio?: string | null;
          avatar_url?: string | null;
          website_url?: string | null;
          is_public?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string | null;
          username?: string | null;
          bio?: string | null;
          avatar_url?: string | null;
          website_url?: string | null;
          is_public?: boolean;
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
          author_id: string | null;
          submission_id: string | null;
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
          author_id?: string | null;
          submission_id?: string | null;
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
          author_id?: string | null;
          submission_id?: string | null;
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
      prompt_submissions: {
        Row: {
          id: string;
          author_id: string;
          revision: number;
          title: string;
          short_description: string;
          prompt: string;
          negative_prompt: string | null;
          generation_parameters: Json | null;
          category: string;
          model: string;
          compatible_models: string[];
          tags: string[];
          staged_image_path: string;
          staged_image_bucket: string;
          image_alt: string;
          width: number;
          height: number;
          aspect_ratio: string;
          aspect_ratio_value: string;
          dominant_color: string;
          status: "DRAFT" | "PENDING_REVIEW" | "CHANGES_REQUESTED" | "REJECTED" | "APPROVED";
          review_feedback: string | null;
          internal_notes: string | null;
          reviewed_by: string | null;
          reviewed_at: string | null;
          published_prompt_id: string | null;
          submitted_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          author_id: string;
          revision?: number;
          title: string;
          short_description: string;
          prompt: string;
          negative_prompt?: string | null;
          generation_parameters?: Json | null;
          category: string;
          model: string;
          compatible_models?: string[];
          tags?: string[];
          staged_image_path: string;
          staged_image_bucket?: string;
          image_alt: string;
          width?: number;
          height?: number;
          aspect_ratio?: string;
          aspect_ratio_value?: string;
          dominant_color?: string;
          status?: "DRAFT" | "PENDING_REVIEW" | "CHANGES_REQUESTED" | "REJECTED" | "APPROVED";
          review_feedback?: string | null;
          internal_notes?: string | null;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          published_prompt_id?: string | null;
          submitted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          author_id?: string;
          revision?: number;
          title?: string;
          short_description?: string;
          prompt?: string;
          negative_prompt?: string | null;
          generation_parameters?: Json | null;
          category?: string;
          model?: string;
          compatible_models?: string[];
          tags?: string[];
          staged_image_path?: string;
          staged_image_bucket?: string;
          image_alt?: string;
          width?: number;
          height?: number;
          aspect_ratio?: string;
          aspect_ratio_value?: string;
          dominant_color?: string;
          status?: "DRAFT" | "PENDING_REVIEW" | "CHANGES_REQUESTED" | "REJECTED" | "APPROVED";
          review_feedback?: string | null;
          internal_notes?: string | null;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          published_prompt_id?: string | null;
          submitted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "prompt_submissions_author_id_fkey";
            columns: ["author_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "prompt_submissions_published_prompt_id_fkey";
            columns: ["published_prompt_id"];
            referencedRelation: "prompts";
            referencedColumns: ["id"];
          }
        ];
      };
      submission_revisions: {
        Row: {
          id: string;
          submission_id: string;
          revision: number;
          snapshot: Json;
          submitted_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          submission_id: string;
          revision: number;
          snapshot: Json;
          submitted_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          submission_id?: string;
          revision?: number;
          snapshot?: Json;
          submitted_at?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "submission_revisions_submission_id_fkey";
            columns: ["submission_id"];
            referencedRelation: "prompt_submissions";
            referencedColumns: ["id"];
          }
        ];
      };
      articles: {
        Row: {
          id: string;
          slug: string;
          title: string;
          excerpt: string;
          content: string;
          cover_image_url: string | null;
          cover_image_alt: string | null;
          cover_image_width: number | null;
          cover_image_height: number | null;
          cover_image_dominant_color: string | null;
          category: string;
          tags: string[];
          status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
          published_at: string | null;
          last_edited_at: string | null;
          author_id: string | null;
          concurrency_version: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          title: string;
          excerpt: string;
          content: string;
          cover_image_url?: string | null;
          cover_image_alt?: string | null;
          cover_image_width?: number | null;
          cover_image_height?: number | null;
          cover_image_dominant_color?: string | null;
          category?: string;
          tags?: string[];
          status?: "DRAFT" | "PUBLISHED" | "ARCHIVED";
          published_at?: string | null;
          last_edited_at?: string | null;
          author_id?: string | null;
          concurrency_version?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          title?: string;
          excerpt?: string;
          content?: string;
          cover_image_url?: string | null;
          cover_image_alt?: string | null;
          cover_image_width?: number | null;
          cover_image_height?: number | null;
          cover_image_dominant_color?: string | null;
          category?: string;
          tags?: string[];
          status?: "DRAFT" | "PUBLISHED" | "ARCHIVED";
          published_at?: string | null;
          last_edited_at?: string | null;
          author_id?: string | null;
          concurrency_version?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "articles_author_id_fkey";
            columns: ["author_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      article_prompts: {
        Row: {
          article_id: string;
          prompt_id: string;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          article_id: string;
          prompt_id: string;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          article_id?: string;
          prompt_id?: string;
          sort_order?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "article_prompts_article_id_fkey";
            columns: ["article_id"];
            referencedRelation: "articles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "article_prompts_prompt_id_fkey";
            columns: ["prompt_id"];
            referencedRelation: "prompts";
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
