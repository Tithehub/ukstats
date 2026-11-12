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
      citizen_journalists: {
        Row: {
          bio: string
          created_at: string
          id: string
          name: string
          photo_url: string | null
          review_note: string | null
          rumble_url: string | null
          status: string
          substack_url: string | null
          updated_at: string
          user_id: string | null
          website_url: string | null
          x_url: string | null
          youtube_channel_id: string | null
          youtube_url: string | null
        }
        Insert: {
          bio?: string
          created_at?: string
          id?: string
          name: string
          photo_url?: string | null
          review_note?: string | null
          rumble_url?: string | null
          status?: string
          substack_url?: string | null
          updated_at?: string
          user_id?: string | null
          website_url?: string | null
          x_url?: string | null
          youtube_channel_id?: string | null
          youtube_url?: string | null
        }
        Update: {
          bio?: string
          created_at?: string
          id?: string
          name?: string
          photo_url?: string | null
          review_note?: string | null
          rumble_url?: string | null
          status?: string
          substack_url?: string | null
          updated_at?: string
          user_id?: string | null
          website_url?: string | null
          x_url?: string | null
          youtube_channel_id?: string | null
          youtube_url?: string | null
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
      education_institutions: {
        Row: {
          admissions: string | null
          capacity: number | null
          census_date: string | null
          fsm_pct: number | null
          gender: string | null
          high_age: number | null
          id: string
          kind: string
          ks4: Json | null
          la: string | null
          low_age: number | null
          name: string
          nation: string
          ofsted: Json | null
          phase: string | null
          postcode: string | null
          provider: Json | null
          pupils: number | null
          region: string | null
          religious: string | null
          search: string
          source_date: string | null
          town: string | null
          trust: string | null
          type: string | null
          type_group: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          admissions?: string | null
          capacity?: number | null
          census_date?: string | null
          fsm_pct?: number | null
          gender?: string | null
          high_age?: number | null
          id: string
          kind: string
          ks4?: Json | null
          la?: string | null
          low_age?: number | null
          name: string
          nation?: string
          ofsted?: Json | null
          phase?: string | null
          postcode?: string | null
          provider?: Json | null
          pupils?: number | null
          region?: string | null
          religious?: string | null
          search?: string
          source_date?: string | null
          town?: string | null
          trust?: string | null
          type?: string | null
          type_group?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          admissions?: string | null
          capacity?: number | null
          census_date?: string | null
          fsm_pct?: number | null
          gender?: string | null
          high_age?: number | null
          id?: string
          kind?: string
          ks4?: Json | null
          la?: string | null
          low_age?: number | null
          name?: string
          nation?: string
          ofsted?: Json | null
          phase?: string | null
          postcode?: string | null
          provider?: Json | null
          pupils?: number | null
          region?: string | null
          religious?: string | null
          search?: string
          source_date?: string | null
          town?: string | null
          trust?: string | null
          type?: string | null
          type_group?: string | null
          updated_at?: string
          website?: string | null
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
      game_scores: {
        Row: {
          answers: Json
          created_at: string
          day: string
          game: string
          id: string
          max_score: number
          score: number
          user_id: string
        }
        Insert: {
          answers?: Json
          created_at?: string
          day: string
          game: string
          id?: string
          max_score: number
          score: number
          user_id: string
        }
        Update: {
          answers?: Json
          created_at?: string
          day?: string
          game?: string
          id?: string
          max_score?: number
          score?: number
          user_id?: string
        }
        Relationships: []
      }
      horse_aliases: {
        Row: {
          alias: string
          horse_id: string
        }
        Insert: {
          alias: string
          horse_id: string
        }
        Update: {
          alias?: string
          horse_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "horse_aliases_horse_id_fkey"
            columns: ["horse_id"]
            isOneToOne: false
            referencedRelation: "horses"
            referencedColumns: ["id"]
          },
        ]
      }
      horses: {
        Row: {
          country: string | null
          dam: string | null
          foaled: string | null
          id: string
          name: string
          sex: string | null
          sire: string | null
          source_id: string | null
          trainer_id: string | null
          updated_at: string
        }
        Insert: {
          country?: string | null
          dam?: string | null
          foaled?: string | null
          id: string
          name: string
          sex?: string | null
          sire?: string | null
          source_id?: string | null
          trainer_id?: string | null
          updated_at?: string
        }
        Update: {
          country?: string | null
          dam?: string | null
          foaled?: string | null
          id?: string
          name?: string
          sex?: string | null
          sire?: string | null
          source_id?: string | null
          trainer_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "horses_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "racing_data_sources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "horses_trainer_id_fkey"
            columns: ["trainer_id"]
            isOneToOne: false
            referencedRelation: "trainers"
            referencedColumns: ["id"]
          },
        ]
      }
      improvement_plans: {
        Row: {
          created_at: string
          id: string
          run_id: string | null
          summary: string
          tasks: Json
        }
        Insert: {
          created_at?: string
          id?: string
          run_id?: string | null
          summary: string
          tasks?: Json
        }
        Update: {
          created_at?: string
          id?: string
          run_id?: string | null
          summary?: string
          tasks?: Json
        }
        Relationships: []
      }
      jockeys: {
        Row: {
          id: string
          name: string
          source_id: string | null
          updated_at: string
        }
        Insert: {
          id: string
          name: string
          source_id?: string | null
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          source_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "jockeys_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "racing_data_sources"
            referencedColumns: ["id"]
          },
        ]
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
      meetings: {
        Row: {
          going: string | null
          id: string
          meeting_date: string
          racecourse_id: string
          source_id: string | null
          status: string
          surface: string | null
          updated_at: string
        }
        Insert: {
          going?: string | null
          id: string
          meeting_date: string
          racecourse_id: string
          source_id?: string | null
          status?: string
          surface?: string | null
          updated_at?: string
        }
        Update: {
          going?: string | null
          id?: string
          meeting_date?: string
          racecourse_id?: string
          source_id?: string | null
          status?: string
          surface?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "meetings_racecourse_id_fkey"
            columns: ["racecourse_id"]
            isOneToOne: false
            referencedRelation: "racecourses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meetings_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "racing_data_sources"
            referencedColumns: ["id"]
          },
        ]
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
      non_runners: {
        Row: {
          declared_at: string
          horse_id: string
          id: string
          race_id: string
          reason: string | null
          source_id: string | null
        }
        Insert: {
          declared_at?: string
          horse_id: string
          id?: string
          race_id: string
          reason?: string | null
          source_id?: string | null
        }
        Update: {
          declared_at?: string
          horse_id?: string
          id?: string
          race_id?: string
          reason?: string | null
          source_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "non_runners_horse_id_fkey"
            columns: ["horse_id"]
            isOneToOne: false
            referencedRelation: "horses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "non_runners_race_id_fkey"
            columns: ["race_id"]
            isOneToOne: false
            referencedRelation: "races"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "non_runners_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "racing_data_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      odds_snapshots: {
        Row: {
          bookmaker: string
          captured_at: string
          decimal_odds: number
          horse_id: string
          id: string
          race_id: string
          source_id: string | null
        }
        Insert: {
          bookmaker: string
          captured_at?: string
          decimal_odds: number
          horse_id: string
          id?: string
          race_id: string
          source_id?: string | null
        }
        Update: {
          bookmaker?: string
          captured_at?: string
          decimal_odds?: number
          horse_id?: string
          id?: string
          race_id?: string
          source_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "odds_snapshots_horse_id_fkey"
            columns: ["horse_id"]
            isOneToOne: false
            referencedRelation: "horses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "odds_snapshots_race_id_fkey"
            columns: ["race_id"]
            isOneToOne: false
            referencedRelation: "races"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "odds_snapshots_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "racing_data_sources"
            referencedColumns: ["id"]
          },
        ]
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
          avatar_path: string | null
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_path?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_path?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      race_results: {
        Row: {
          beaten_lengths: number | null
          horse_id: string
          official: boolean
          position: number | null
          race_id: string
          recorded_at: string
          starting_price_decimal: number | null
          status: string
        }
        Insert: {
          beaten_lengths?: number | null
          horse_id: string
          official?: boolean
          position?: number | null
          race_id: string
          recorded_at?: string
          starting_price_decimal?: number | null
          status?: string
        }
        Update: {
          beaten_lengths?: number | null
          horse_id?: string
          official?: boolean
          position?: number | null
          race_id?: string
          recorded_at?: string
          starting_price_decimal?: number | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "race_results_horse_id_fkey"
            columns: ["horse_id"]
            isOneToOne: false
            referencedRelation: "horses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "race_results_race_id_fkey"
            columns: ["race_id"]
            isOneToOne: false
            referencedRelation: "races"
            referencedColumns: ["id"]
          },
        ]
      }
      racecourses: {
        Row: {
          country: string
          id: string
          name: string
          source_id: string | null
          surface: string | null
        }
        Insert: {
          country?: string
          id: string
          name: string
          source_id?: string | null
          surface?: string | null
        }
        Update: {
          country?: string
          id?: string
          name?: string
          source_id?: string | null
          surface?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "racecourses_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "racing_data_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      races: {
        Row: {
          class: string | null
          distance_yards: number | null
          field_size: number | null
          going: string | null
          id: string
          meeting_id: string
          name: string
          off_time: string
          prize_gbp: number | null
          race_type: string | null
          status: string
          updated_at: string
        }
        Insert: {
          class?: string | null
          distance_yards?: number | null
          field_size?: number | null
          going?: string | null
          id: string
          meeting_id: string
          name: string
          off_time: string
          prize_gbp?: number | null
          race_type?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          class?: string | null
          distance_yards?: number | null
          field_size?: number | null
          going?: string | null
          id?: string
          meeting_id?: string
          name?: string
          off_time?: string
          prize_gbp?: number | null
          race_type?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "races_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
        ]
      }
      racing_audit_logs: {
        Row: {
          action: string
          actor: string | null
          created_at: string
          entity: string
          entity_id: string
          id: string
          original: Json | null
          reason: string | null
        }
        Insert: {
          action: string
          actor?: string | null
          created_at?: string
          entity: string
          entity_id: string
          id?: string
          original?: Json | null
          reason?: string | null
        }
        Update: {
          action?: string
          actor?: string | null
          created_at?: string
          entity?: string
          entity_id?: string
          id?: string
          original?: Json | null
          reason?: string | null
        }
        Relationships: []
      }
      racing_data_sources: {
        Row: {
          id: string
          kind: string
          last_error: string | null
          last_error_at: string | null
          last_success_at: string | null
          licence_note: string | null
          name: string
          records_imported: number
          status: string
          updated_at: string
        }
        Insert: {
          id: string
          kind: string
          last_error?: string | null
          last_error_at?: string | null
          last_success_at?: string | null
          licence_note?: string | null
          name: string
          records_imported?: number
          status?: string
          updated_at?: string
        }
        Update: {
          id?: string
          kind?: string
          last_error?: string | null
          last_error_at?: string | null
          last_success_at?: string | null
          licence_note?: string | null
          name?: string
          records_imported?: number
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      racing_import_logs: {
        Row: {
          error: string | null
          finished_at: string | null
          id: string
          job: string
          records: number
          source_id: string | null
          started_at: string
          status: string
        }
        Insert: {
          error?: string | null
          finished_at?: string | null
          id?: string
          job: string
          records?: number
          source_id?: string | null
          started_at?: string
          status: string
        }
        Update: {
          error?: string | null
          finished_at?: string | null
          id?: string
          job?: string
          records?: number
          source_id?: string | null
          started_at?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "racing_import_logs_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "racing_data_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      rent_channels: {
        Row: {
          accent: string
          all_countries: boolean
          countries: string[]
          created_at: string
          display_name: string
          id: string
          layout: string
          logo_url: string | null
          presented_by: string | null
          presenter: string
          requested_at: string | null
          show_sponsor_box: boolean
          slug: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          accent?: string
          all_countries?: boolean
          countries?: string[]
          created_at?: string
          display_name: string
          id?: string
          layout?: string
          logo_url?: string | null
          presented_by?: string | null
          presenter?: string
          requested_at?: string | null
          show_sponsor_box?: boolean
          slug: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          accent?: string
          all_countries?: boolean
          countries?: string[]
          created_at?: string
          display_name?: string
          id?: string
          layout?: string
          logo_url?: string | null
          presented_by?: string | null
          presenter?: string
          requested_at?: string | null
          show_sponsor_box?: boolean
          slug?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      rent_entitlements: {
        Row: {
          active: boolean
          ai_presenter: boolean
          all_countries: boolean
          cancel_at_period_end: boolean
          environment: string | null
          expires_at: string | null
          max_countries: number
          no_sponsor_box: boolean
          source: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          sub_status: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          active?: boolean
          ai_presenter?: boolean
          all_countries?: boolean
          cancel_at_period_end?: boolean
          environment?: string | null
          expires_at?: string | null
          max_countries?: number
          no_sponsor_box?: boolean
          source?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          sub_status?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          active?: boolean
          ai_presenter?: boolean
          all_countries?: boolean
          cancel_at_period_end?: boolean
          environment?: string | null
          expires_at?: string | null
          max_countries?: number
          no_sponsor_box?: boolean
          source?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          sub_status?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      report_editions: {
        Row: {
          created_at: string
          edition: string
          id: string
          kind: string
          pages: number | null
          report_date: string
          storage_path: string
        }
        Insert: {
          created_at?: string
          edition: string
          id?: string
          kind?: string
          pages?: number | null
          report_date: string
          storage_path: string
        }
        Update: {
          created_at?: string
          edition?: string
          id?: string
          kind?: string
          pages?: number | null
          report_date?: string
          storage_path?: string
        }
        Relationships: []
      }
      report_purchases: {
        Row: {
          created_at: string
          edition: string
          environment: string
          id: string
          report_date: string
          stripe_session_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          edition: string
          environment: string
          id?: string
          report_date: string
          stripe_session_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          edition?: string
          environment?: string
          id?: string
          report_date?: string
          stripe_session_id?: string
          user_id?: string
        }
        Relationships: []
      }
      report_subscriptions: {
        Row: {
          cancel_at_period_end: boolean
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          edition: string
          environment: string
          id: string
          price_id: string
          status: string
          stripe_customer_id: string
          stripe_subscription_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          edition: string
          environment: string
          id?: string
          price_id: string
          status: string
          stripe_customer_id: string
          stripe_subscription_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          edition?: string
          environment?: string
          id?: string
          price_id?: string
          status?: string
          stripe_customer_id?: string
          stripe_subscription_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      runners: {
        Row: {
          age: number | null
          cloth_number: number | null
          draw: number | null
          form: string | null
          headgear: string | null
          horse_id: string
          id: string
          jockey_id: string | null
          non_runner: boolean
          official_rating: number | null
          race_id: string
          trainer_id: string | null
          updated_at: string
          weight_lbs: number | null
        }
        Insert: {
          age?: number | null
          cloth_number?: number | null
          draw?: number | null
          form?: string | null
          headgear?: string | null
          horse_id: string
          id: string
          jockey_id?: string | null
          non_runner?: boolean
          official_rating?: number | null
          race_id: string
          trainer_id?: string | null
          updated_at?: string
          weight_lbs?: number | null
        }
        Update: {
          age?: number | null
          cloth_number?: number | null
          draw?: number | null
          form?: string | null
          headgear?: string | null
          horse_id?: string
          id?: string
          jockey_id?: string | null
          non_runner?: boolean
          official_rating?: number | null
          race_id?: string
          trainer_id?: string | null
          updated_at?: string
          weight_lbs?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "runners_horse_id_fkey"
            columns: ["horse_id"]
            isOneToOne: false
            referencedRelation: "horses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "runners_jockey_id_fkey"
            columns: ["jockey_id"]
            isOneToOne: false
            referencedRelation: "jockeys"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "runners_race_id_fkey"
            columns: ["race_id"]
            isOneToOne: false
            referencedRelation: "races"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "runners_trainer_id_fkey"
            columns: ["trainer_id"]
            isOneToOne: false
            referencedRelation: "trainers"
            referencedColumns: ["id"]
          },
        ]
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
      sponsor_review_links: {
        Row: {
          created_at: string
          id: string
          platform: string
          sponsor_id: string
          status: string
          updated_at: string
          url: string
        }
        Insert: {
          created_at?: string
          id?: string
          platform: string
          sponsor_id: string
          status?: string
          updated_at?: string
          url: string
        }
        Update: {
          created_at?: string
          id?: string
          platform?: string
          sponsor_id?: string
          status?: string
          updated_at?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "sponsor_review_links_sponsor_id_fkey"
            columns: ["sponsor_id"]
            isOneToOne: false
            referencedRelation: "sponsors"
            referencedColumns: ["id"]
          },
        ]
      }
      sponsors: {
        Row: {
          active: boolean
          approved: boolean
          banner_path: string | null
          banner_url: string | null
          created_at: string
          ends_at: string | null
          environment: string | null
          id: string
          logo_path: string | null
          name: string
          paid: boolean
          placement: string
          plan: string | null
          qr_url: string | null
          region: string
          regions: string[] | null
          starts_at: string | null
          stream_path: string | null
          stripe_subscription_id: string | null
          tagline: string | null
          topic: string | null
          url: string
          user_id: string | null
        }
        Insert: {
          active?: boolean
          approved?: boolean
          banner_path?: string | null
          banner_url?: string | null
          created_at?: string
          ends_at?: string | null
          environment?: string | null
          id?: string
          logo_path?: string | null
          name: string
          paid?: boolean
          placement?: string
          plan?: string | null
          qr_url?: string | null
          region?: string
          regions?: string[] | null
          starts_at?: string | null
          stream_path?: string | null
          stripe_subscription_id?: string | null
          tagline?: string | null
          topic?: string | null
          url: string
          user_id?: string | null
        }
        Update: {
          active?: boolean
          approved?: boolean
          banner_path?: string | null
          banner_url?: string | null
          created_at?: string
          ends_at?: string | null
          environment?: string | null
          id?: string
          logo_path?: string | null
          name?: string
          paid?: boolean
          placement?: string
          plan?: string | null
          qr_url?: string | null
          region?: string
          regions?: string[] | null
          starts_at?: string | null
          stream_path?: string | null
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
      trainers: {
        Row: {
          id: string
          name: string
          source_id: string | null
          updated_at: string
        }
        Insert: {
          id: string
          name: string
          source_id?: string | null
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          source_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "trainers_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "racing_data_sources"
            referencedColumns: ["id"]
          },
        ]
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
      admin_rent_channels: {
        Args: never
        Returns: {
          created_at: string
          display_name: string
          email: string
          requested_at: string
          slug: string
          status: string
          user_id: string
        }[]
      }
      game_leaderboard: {
        Args: {
          _game: string
          _since: string
          _until: string
          max_rows?: number
        }
        Returns: {
          best: number
          games: number
          player: string
          total: number
        }[]
      }
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
      get_public_rent_channel: {
        Args: { _slug: string }
        Returns: {
          accent: string
          active: boolean
          ai_presenter: boolean
          all_countries: boolean
          countries: string[]
          display_name: string
          ent_all_countries: boolean
          expires_at: string
          layout: string
          logo_url: string
          max_countries: number
          no_sponsor_box: boolean
          presented_by: string
          presenter: string
          show_sponsor_box: boolean
          slug: string
        }[]
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
      list_report_editions: {
        Args: { max_rows?: number }
        Returns: {
          edition: string
          kind: string
          pages: number
          report_date: string
        }[]
      }
      rent_slug_available: { Args: { _slug: string }; Returns: boolean }
      school_quality_by_la: {
        Args: never
        Returns: {
          good: number
          la: string
          rated: number
        }[]
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
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
