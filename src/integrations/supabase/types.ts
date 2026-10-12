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
    PostgrestVersion: "14.17"
  }
  public: {
    Tables: {
      agent_findings: {
        Row: {
          agent: string
          created_at: string
          detail: string | null
          id: string
          metric_id: string | null
          run_id: string | null
          severity: string
          status: string
          title: string
          url: string | null
        }
        Insert: {
          agent: string
          created_at?: string
          detail?: string | null
          id?: string
          metric_id?: string | null
          run_id?: string | null
          severity?: string
          status?: string
          title: string
          url?: string | null
        }
        Update: {
          agent?: string
          created_at?: string
          detail?: string | null
          id?: string
          metric_id?: string | null
          run_id?: string | null
          severity?: string
          status?: string
          title?: string
          url?: string | null
        }
        Relationships: []
      }
      agent_posts: {
        Row: {
          body: string
          created_at: string
          id: string
          kind: string
          link: string
          metric_id: string | null
          platform: string
          reviewed_at: string | null
          run_id: string | null
          source_url: string | null
          status: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          kind?: string
          link: string
          metric_id?: string | null
          platform: string
          reviewed_at?: string | null
          run_id?: string | null
          source_url?: string | null
          status?: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          kind?: string
          link?: string
          metric_id?: string | null
          platform?: string
          reviewed_at?: string | null
          run_id?: string | null
          source_url?: string | null
          status?: string
        }
        Relationships: []
      }
      agent_runs: {
        Row: {
          briefing: string | null
          finished_at: string | null
          id: string
          lease_until: string
          pause_reason: string | null
          started_at: string
          status: string
          summary: Json
        }
        Insert: {
          briefing?: string | null
          finished_at?: string | null
          id?: string
          lease_until?: string
          pause_reason?: string | null
          started_at?: string
          status?: string
          summary?: Json
        }
        Update: {
          briefing?: string | null
          finished_at?: string | null
          id?: string
          lease_until?: string
          pause_reason?: string | null
          started_at?: string
          status?: string
          summary?: Json
        }
        Relationships: []
      }
      country_metric_snapshots: {
        Row: {
          code: string
          metric_id: string
          period: string | null
          source: string | null
          source_url: string | null
          title: string | null
          updated_at: string
          value: string | null
        }
        Insert: {
          code: string
          metric_id: string
          period?: string | null
          source?: string | null
          source_url?: string | null
          title?: string | null
          updated_at?: string
          value?: string | null
        }
        Update: {
          code?: string
          metric_id?: string
          period?: string | null
          source?: string | null
          source_url?: string | null
          title?: string | null
          updated_at?: string
          value?: string | null
        }
        Relationships: []
      }
      daily_briefings: {
        Row: {
          body: string
          briefing_date: string
          change_count: number
          created_at: string
          figures: Json
          headline: string
          id: string
          updated_at: string
        }
        Insert: {
          body: string
          briefing_date: string
          change_count?: number
          created_at?: string
          figures?: Json
          headline: string
          id?: string
          updated_at?: string
        }
        Update: {
          body?: string
          briefing_date?: string
          change_count?: number
          created_at?: string
          figures?: Json
          headline?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      explainer_drafts: {
        Row: {
          created_at: string
          id: string
          metric_id: string
          reviewed_at: string | null
          sections: Json
          status: string
          summary: string
          title: string
        }
        Insert: {
          created_at?: string
          id?: string
          metric_id: string
          reviewed_at?: string | null
          sections: Json
          status?: string
          summary: string
          title: string
        }
        Update: {
          created_at?: string
          id?: string
          metric_id?: string
          reviewed_at?: string | null
          sections?: Json
          status?: string
          summary?: string
          title?: string
        }
        Relationships: []
      }
      feed_checks: {
        Row: {
          category: string
          checked_at: string
          id: string
          metric_id: string
          note: string | null
          source: string
          source_url: string
          status: string
          title: string
        }
        Insert: {
          category: string
          checked_at?: string
          id?: string
          metric_id: string
          note?: string | null
          source: string
          source_url: string
          status: string
          title: string
        }
        Update: {
          category?: string
          checked_at?: string
          id?: string
          metric_id?: string
          note?: string | null
          source?: string
          source_url?: string
          status?: string
          title?: string
        }
        Relationships: []
      }
      media_mentions: {
        Row: {
          approved: boolean
          created_at: string
          id: string
          image_url: string | null
          outlet: string
          title: string
          url: string
        }
        Insert: {
          approved?: boolean
          created_at?: string
          id?: string
          image_url?: string | null
          outlet: string
          title: string
          url: string
        }
        Update: {
          approved?: boolean
          created_at?: string
          id?: string
          image_url?: string | null
          outlet?: string
          title?: string
          url?: string
        }
        Relationships: []
      }
      metric_changes: {
        Row: {
          as_of: string | null
          category: string
          detected_at: string
          id: string
          metric_id: string
          period: string | null
          previous_value: string | null
          source: string
          source_url: string
          title: string
          value: string | null
        }
        Insert: {
          as_of?: string | null
          category: string
          detected_at?: string
          id?: string
          metric_id: string
          period?: string | null
          previous_value?: string | null
          source: string
          source_url: string
          title: string
          value?: string | null
        }
        Update: {
          as_of?: string | null
          category?: string
          detected_at?: string
          id?: string
          metric_id?: string
          period?: string | null
          previous_value?: string | null
          source?: string
          source_url?: string
          title?: string
          value?: string | null
        }
        Relationships: []
      }
      metric_revisions: {
        Row: {
          detected_at: string
          id: string
          metric_id: string
          new_value: string
          old_value: string
          period: string
          source: string | null
          source_url: string | null
          title: string
        }
        Insert: {
          detected_at?: string
          id?: string
          metric_id: string
          new_value: string
          old_value: string
          period: string
          source?: string | null
          source_url?: string | null
          title: string
        }
        Update: {
          detected_at?: string
          id?: string
          metric_id?: string
          new_value?: string
          old_value?: string
          period?: string
          source?: string | null
          source_url?: string | null
          title?: string
        }
        Relationships: []
      }
      metric_snapshots: {
        Row: {
          as_of: string | null
          category: string
          metric_id: string
          period: string | null
          source: string
          source_url: string
          title: string
          updated_at: string
          value: string | null
        }
        Insert: {
          as_of?: string | null
          category: string
          metric_id: string
          period?: string | null
          source?: string
          source_url?: string
          title: string
          updated_at?: string
          value?: string | null
        }
        Update: {
          as_of?: string | null
          category?: string
          metric_id?: string
          period?: string | null
          source?: string
          source_url?: string
          title?: string
          updated_at?: string
          value?: string | null
        }
        Relationships: []
      }
      payload_cache: {
        Row: {
          data: Json
          id: string
          updated_at: string
        }
        Insert: {
          data: Json
          id: string
          updated_at?: string
        }
        Update: {
          data?: Json
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      shared_pages: {
        Row: {
          created_at: string
          duration_hours: number
          expires_at: string
          id: string
          metric_ids: string[]
          owner_hash: string
          payment_status: string
          price_pence: number
          slug: string
          tier: string
          title: string
          user_id: string | null
          view_count: number
        }
        Insert: {
          created_at?: string
          duration_hours: number
          expires_at: string
          id?: string
          metric_ids?: string[]
          owner_hash: string
          payment_status?: string
          price_pence?: number
          slug: string
          tier?: string
          title: string
          user_id?: string | null
          view_count?: number
        }
        Update: {
          created_at?: string
          duration_hours?: number
          expires_at?: string
          id?: string
          metric_ids?: string[]
          owner_hash?: string
          payment_status?: string
          price_pence?: number
          slug?: string
          tier?: string
          title?: string
          user_id?: string | null
          view_count?: number
        }
        Relationships: []
      }
      social_accounts: {
        Row: {
          created_at: string
          credentials: Json
          id: string
          label: string
          last_posted_at: string | null
          platform: string
          user_id: string
        }
        Insert: {
          created_at?: string
          credentials: Json
          id?: string
          label: string
          last_posted_at?: string | null
          platform: string
          user_id: string
        }
        Update: {
          created_at?: string
          credentials?: Json
          id?: string
          label?: string
          last_posted_at?: string | null
          platform?: string
          user_id?: string
        }
        Relationships: []
      }
      sponsor_enquiries: {
        Row: {
          company: string
          created_at: string
          email: string
          id: string
          message: string | null
          name: string
          status: string
          website: string | null
        }
        Insert: {
          company: string
          created_at?: string
          email: string
          id?: string
          message?: string | null
          name: string
          status?: string
          website?: string | null
        }
        Update: {
          company?: string
          created_at?: string
          email?: string
          id?: string
          message?: string | null
          name?: string
          status?: string
          website?: string | null
        }
        Relationships: []
      }
      sponsors: {
        Row: {
          active: boolean
          approved: boolean
          created_at: string
          ends_at: string | null
          environment: string | null
          id: string
          name: string
          paid: boolean
          placement: string
          plan: string | null
          region: string
          starts_at: string | null
          stripe_subscription_id: string | null
          tagline: string | null
          topic: string | null
          url: string
          user_id: string | null
        }
        Insert: {
          active?: boolean
          approved?: boolean
          created_at?: string
          ends_at?: string | null
          environment?: string | null
          id?: string
          name: string
          paid?: boolean
          placement?: string
          plan?: string | null
          region?: string
          starts_at?: string | null
          stripe_subscription_id?: string | null
          tagline?: string | null
          topic?: string | null
          url: string
          user_id?: string | null
        }
        Update: {
          active?: boolean
          approved?: boolean
          created_at?: string
          ends_at?: string | null
          environment?: string | null
          id?: string
          name?: string
          paid?: boolean
          placement?: string
          plan?: string | null
          region?: string
          starts_at?: string | null
          stripe_subscription_id?: string | null
          tagline?: string | null
          topic?: string | null
          url?: string
          user_id?: string | null
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null
          created_at: string | null
          current_period_end: string | null
          current_period_start: string | null
          environment: string
          id: string
          price_id: string
          product_id: string
          status: string
          stripe_customer_id: string
          stripe_subscription_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          environment?: string
          id?: string
          price_id: string
          product_id: string
          status?: string
          stripe_customer_id: string
          stripe_subscription_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          environment?: string
          id?: string
          price_id?: string
          product_id?: string
          status?: string
          stripe_customer_id?: string
          stripe_subscription_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_approved_explainer: {
        Args: { _metric_id: string }
        Returns: {
          sections: Json
          summary: string
          title: string
        }[]
      }
      get_daily_briefing: {
        Args: { day: string }
        Returns: {
          body: string
          briefing_date: string
          change_count: number
          created_at: string
          figures: Json
          headline: string
          id: string
          updated_at: string
        }[]
        SetofOptions: {
          from: "*"
          to: "daily_briefings"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      list_daily_briefings: {
        Args: { max_rows?: number }
        Returns: {
          body: string
          briefing_date: string
          change_count: number
          created_at: string
          figures: Json
          headline: string
          id: string
          updated_at: string
        }[]
        SetofOptions: {
          from: "*"
          to: "daily_briefings"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      list_feed_checks: {
        Args: { max_rows?: number; since?: string }
        Returns: {
          category: string
          checked_at: string
          id: string
          metric_id: string
          note: string | null
          source: string
          source_url: string
          status: string
          title: string
        }[]
        SetofOptions: {
          from: "*"
          to: "feed_checks"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      list_metric_revisions: {
        Args: { _metric_id: string; max_rows?: number }
        Returns: {
          detected_at: string
          id: string
          metric_id: string
          new_value: string
          old_value: string
          period: string
          source: string | null
          source_url: string | null
          title: string
        }[]
        SetofOptions: {
          from: "*"
          to: "metric_revisions"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      list_recent_changes: {
        Args: { max_rows?: number }
        Returns: {
          as_of: string | null
          category: string
          detected_at: string
          id: string
          metric_id: string
          period: string | null
          previous_value: string | null
          source: string
          source_url: string
          title: string
          value: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "metric_changes"
          isOneToOne: false
          isSetofReturn: true
        }
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
