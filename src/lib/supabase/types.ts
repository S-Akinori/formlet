export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      forms: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          endpoint_key: string;
          admin_email: string;
          redirect_url: string | null;
          allowed_origins: string[] | null;
          embed_theme: "simple" | "shop" | "compact";
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          endpoint_key: string;
          admin_email: string;
          redirect_url?: string | null;
          allowed_origins?: string[] | null;
          embed_theme?: "simple" | "shop" | "compact";
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          endpoint_key?: string;
          admin_email?: string;
          redirect_url?: string | null;
          allowed_origins?: string[] | null;
          embed_theme?: "simple" | "shop" | "compact";
          is_active?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      user_subscriptions: {
        Row: {
          id: string;
          user_id: string;
          stripe_mode: "test" | "live";
          plan: "free" | "pro";
          status: string;
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          current_period_end: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          stripe_mode?: "test" | "live";
          plan?: "free" | "pro";
          status?: string;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          current_period_end?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          stripe_mode?: "test" | "live";
          plan?: "free" | "pro";
          status?: string;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          current_period_end?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      submissions: {
        Row: {
          id: string;
          form_id: string;
          data: Json;
          sender_email: string | null;
          sender_name: string | null;
          ip_address: string | null;
          user_agent: string | null;
          status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          form_id: string;
          data: Json;
          sender_email?: string | null;
          sender_name?: string | null;
          ip_address?: string | null;
          user_agent?: string | null;
          status?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          form_id?: string;
          data?: Json;
          sender_email?: string | null;
          sender_name?: string | null;
          ip_address?: string | null;
          user_agent?: string | null;
          status?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      email_settings: {
        Row: {
          id: string;
          user_id: string;
          smtp_host: string;
          smtp_port: number;
          smtp_user: string;
          smtp_password: string;
          from_email: string;
          from_name: string;
          secure: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          smtp_host: string;
          smtp_port: number;
          smtp_user: string;
          smtp_password: string;
          from_email: string;
          from_name: string;
          secure?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          smtp_host?: string;
          smtp_port?: number;
          smtp_user?: string;
          smtp_password?: string;
          from_email?: string;
          from_name?: string;
          secure?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      form_email_settings: {
        Row: {
          id: string;
          form_id: string;
          smtp_host: string;
          smtp_port: number;
          smtp_user: string;
          smtp_password: string;
          from_email: string;
          from_name: string;
          secure: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          form_id: string;
          smtp_host: string;
          smtp_port: number;
          smtp_user: string;
          smtp_password: string;
          from_email: string;
          from_name: string;
          secure?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          form_id?: string;
          smtp_host?: string;
          smtp_port?: number;
          smtp_user?: string;
          smtp_password?: string;
          from_email?: string;
          from_name?: string;
          secure?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      form_fields: {
        Row: {
          id: string;
          form_id: string;
          field_name: string;
          label: string;
          input_type: "text" | "textarea" | "email" | "url" | "tel" | "number" | "file" | "select" | "checkbox" | "radio";
          is_required: boolean;
          min_length: number | null;
          max_length: number | null;
          pattern: string | null;
          options: Json;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          form_id: string;
          field_name: string;
          label: string;
          input_type?: "text" | "textarea" | "email" | "url" | "tel" | "number" | "file" | "select" | "checkbox" | "radio";
          is_required?: boolean;
          min_length?: number | null;
          max_length?: number | null;
          pattern?: string | null;
          options?: Json;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          form_id?: string;
          field_name?: string;
          label?: string;
          input_type?: "text" | "textarea" | "email" | "url" | "tel" | "number" | "file" | "select" | "checkbox" | "radio";
          is_required?: boolean;
          min_length?: number | null;
          max_length?: number | null;
          pattern?: string | null;
          options?: Json;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      email_templates: {
        Row: {
          id: string;
          form_id: string;
          type: "admin" | "reply";
          subject: string;
          body: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          form_id: string;
          type: "admin" | "reply";
          subject: string;
          body: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          form_id?: string;
          type?: "admin" | "reply";
          subject?: string;
          body?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      rate_limits: {
        Row: {
          id: string;
          endpoint_key: string;
          ip_address: string;
          window_start: string;
          request_count: number;
        };
        Insert: {
          id?: string;
          endpoint_key: string;
          ip_address: string;
          window_start?: string;
          request_count?: number;
        };
        Update: {
          id?: string;
          endpoint_key?: string;
          ip_address?: string;
          window_start?: string;
          request_count?: number;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
