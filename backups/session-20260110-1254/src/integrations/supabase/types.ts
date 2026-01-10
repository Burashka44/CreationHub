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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      ad_clicks: {
        Row: {
          ad_id: string | null
          clicked_at: string
          id: string
          ip_hash: string | null
          referrer: string | null
          user_agent: string | null
        }
        Insert: {
          ad_id?: string | null
          clicked_at?: string
          id?: string
          ip_hash?: string | null
          referrer?: string | null
          user_agent?: string | null
        }
        Update: {
          ad_id?: string | null
          clicked_at?: string
          id?: string
          ip_hash?: string | null
          referrer?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ad_clicks_ad_id_fkey"
            columns: ["ad_id"]
            isOneToOne: false
            referencedRelation: "telegram_ads"
            referencedColumns: ["id"]
          },
        ]
      }
      ad_purchases: {
        Row: {
          ad_link: string | null
          clicks: number | null
          cost: number
          created_at: string
          currency: string | null
          end_date: string | null
          id: string
          name: string
          new_subscribers: number | null
          notes: string | null
          our_channel_id: string | null
          start_date: string | null
          status: string | null
          subscribers_after: number | null
          subscribers_before: number | null
          target_channel: string
          target_subscribers: number | null
          tracking_code: string | null
          updated_at: string
        }
        Insert: {
          ad_link?: string | null
          clicks?: number | null
          cost?: number
          created_at?: string
          currency?: string | null
          end_date?: string | null
          id?: string
          name: string
          new_subscribers?: number | null
          notes?: string | null
          our_channel_id?: string | null
          start_date?: string | null
          status?: string | null
          subscribers_after?: number | null
          subscribers_before?: number | null
          target_channel: string
          target_subscribers?: number | null
          tracking_code?: string | null
          updated_at?: string
        }
        Update: {
          ad_link?: string | null
          clicks?: number | null
          cost?: number
          created_at?: string
          currency?: string | null
          end_date?: string | null
          id?: string
          name?: string
          new_subscribers?: number | null
          notes?: string | null
          our_channel_id?: string | null
          start_date?: string | null
          status?: string | null
          subscribers_after?: number | null
          subscribers_before?: number | null
          target_channel?: string
          target_subscribers?: number | null
          tracking_code?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ad_purchases_our_channel_id_fkey"
            columns: ["our_channel_id"]
            isOneToOne: false
            referencedRelation: "media_channels"
            referencedColumns: ["id"]
          },
        ]
      }
      ad_sales: {
        Row: {
          ad_link: string | null
          channel_id: string
          clicks: number | null
          client_contact: string | null
          client_name: string
          created_at: string
          currency: string | null
          end_date: string | null
          id: string
          impressions: number | null
          is_paid: boolean | null
          notes: string | null
          payment_date: string | null
          price: number
          publish_date: string | null
          rate_id: string | null
          status: string | null
          tracking_code: string | null
          updated_at: string
        }
        Insert: {
          ad_link?: string | null
          channel_id: string
          clicks?: number | null
          client_contact?: string | null
          client_name: string
          created_at?: string
          currency?: string | null
          end_date?: string | null
          id?: string
          impressions?: number | null
          is_paid?: boolean | null
          notes?: string | null
          payment_date?: string | null
          price?: number
          publish_date?: string | null
          rate_id?: string | null
          status?: string | null
          tracking_code?: string | null
          updated_at?: string
        }
        Update: {
          ad_link?: string | null
          channel_id?: string
          clicks?: number | null
          client_contact?: string | null
          client_name?: string
          created_at?: string
          currency?: string | null
          end_date?: string | null
          id?: string
          impressions?: number | null
          is_paid?: boolean | null
          notes?: string | null
          payment_date?: string | null
          price?: number
          publish_date?: string | null
          rate_id?: string | null
          status?: string | null
          tracking_code?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ad_sales_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "media_channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_sales_rate_id_fkey"
            columns: ["rate_id"]
            isOneToOne: false
            referencedRelation: "channel_ad_rates"
            referencedColumns: ["id"]
          },
        ]
      }
      admins: {
        Row: {
          created_at: string
          email: string | null
          id: string
          is_active: boolean
          name: string
          phone: string | null
          receive_notifications: boolean
          telegram_chat_id: string | null
          telegram_username: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          name: string
          phone?: string | null
          receive_notifications?: boolean
          telegram_chat_id?: string | null
          telegram_username?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          name?: string
          phone?: string | null
          receive_notifications?: boolean
          telegram_chat_id?: string | null
          telegram_username?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      ai_requests: {
        Row: {
          completed_at: string | null
          created_at: string
          error_message: string | null
          id: string
          input_data: Json
          model: string | null
          output_data: Json | null
          request_type: string
          status: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          input_data?: Json
          model?: string | null
          output_data?: Json | null
          request_type: string
          status?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          input_data?: Json
          model?: string | null
          output_data?: Json | null
          request_type?: string
          status?: string
        }
        Relationships: []
      }
      app_settings: {
        Row: {
          created_at: string
          id: string
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          updated_at?: string
          value?: Json
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      channel_ad_rates: {
        Row: {
          channel_id: string
          created_at: string
          currency: string
          description: string | null
          duration_hours: number | null
          format: string
          id: string
          is_active: boolean | null
          price: number
          updated_at: string
        }
        Insert: {
          channel_id: string
          created_at?: string
          currency?: string
          description?: string | null
          duration_hours?: number | null
          format?: string
          id?: string
          is_active?: boolean | null
          price?: number
          updated_at?: string
        }
        Update: {
          channel_id?: string
          created_at?: string
          currency?: string
          description?: string | null
          duration_hours?: number | null
          format?: string
          id?: string
          is_active?: boolean | null
          price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "channel_ad_rates_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "media_channels"
            referencedColumns: ["id"]
          },
        ]
      }
      dns_configs: {
        Row: {
          created_at: string
          dns_type: string | null
          id: string
          is_active: boolean | null
          name: string
          primary_dns: string
          secondary_dns: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          dns_type?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          primary_dns: string
          secondary_dns?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          dns_type?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          primary_dns?: string
          secondary_dns?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      host_check_history: {
        Row: {
          checked_at: string
          host_id: string
          id: string
          packet_loss: number | null
          response_time_ms: number | null
          status: string
        }
        Insert: {
          checked_at?: string
          host_id: string
          id?: string
          packet_loss?: number | null
          response_time_ms?: number | null
          status: string
        }
        Update: {
          checked_at?: string
          host_id?: string
          id?: string
          packet_loss?: number | null
          response_time_ms?: number | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "host_check_history_host_id_fkey"
            columns: ["host_id"]
            isOneToOne: false
            referencedRelation: "monitored_hosts"
            referencedColumns: ["id"]
          },
        ]
      }
      media_channels: {
        Row: {
          avg_view_duration: number | null
          channel_id: string | null
          channel_url: string | null
          comments: number | null
          created_at: string
          ctr: number | null
          engagement: number | null
          growth: number | null
          id: string
          is_active: boolean
          is_monetized: boolean | null
          last_synced_at: string | null
          likes: number | null
          name: string
          platform: string
          revenue: number | null
          shares: number | null
          subscribers: number | null
          updated_at: string
          username: string | null
          videos_count: number | null
          views: number | null
          watch_hours: number | null
        }
        Insert: {
          avg_view_duration?: number | null
          channel_id?: string | null
          channel_url?: string | null
          comments?: number | null
          created_at?: string
          ctr?: number | null
          engagement?: number | null
          growth?: number | null
          id?: string
          is_active?: boolean
          is_monetized?: boolean | null
          last_synced_at?: string | null
          likes?: number | null
          name: string
          platform: string
          revenue?: number | null
          shares?: number | null
          subscribers?: number | null
          updated_at?: string
          username?: string | null
          videos_count?: number | null
          views?: number | null
          watch_hours?: number | null
        }
        Update: {
          avg_view_duration?: number | null
          channel_id?: string | null
          channel_url?: string | null
          comments?: number | null
          created_at?: string
          ctr?: number | null
          engagement?: number | null
          growth?: number | null
          id?: string
          is_active?: boolean
          is_monetized?: boolean | null
          last_synced_at?: string | null
          likes?: number | null
          name?: string
          platform?: string
          revenue?: number | null
          shares?: number | null
          subscribers?: number | null
          updated_at?: string
          username?: string | null
          videos_count?: number | null
          views?: number | null
          watch_hours?: number | null
        }
        Relationships: []
      }
      monitored_hosts: {
        Row: {
          check_type: string | null
          created_at: string
          host: string
          id: string
          is_active: boolean | null
          last_check_at: string | null
          name: string
          response_time_ms: number | null
          status: string | null
          updated_at: string
        }
        Insert: {
          check_type?: string | null
          created_at?: string
          host: string
          id?: string
          is_active?: boolean | null
          last_check_at?: string | null
          name: string
          response_time_ms?: number | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          check_type?: string | null
          created_at?: string
          host?: string
          id?: string
          is_active?: boolean | null
          last_check_at?: string | null
          name?: string
          response_time_ms?: number | null
          status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      network_traffic: {
        Row: {
          id: string
          interface_name: string | null
          recorded_at: string
          rx_bytes: number | null
          rx_rate: number | null
          tx_bytes: number | null
          tx_rate: number | null
        }
        Insert: {
          id?: string
          interface_name?: string | null
          recorded_at?: string
          rx_bytes?: number | null
          rx_rate?: number | null
          tx_bytes?: number | null
          tx_rate?: number | null
        }
        Update: {
          id?: string
          interface_name?: string | null
          recorded_at?: string
          rx_bytes?: number | null
          rx_rate?: number | null
          tx_bytes?: number | null
          tx_rate?: number | null
        }
        Relationships: []
      }
      service_uptime: {
        Row: {
          checked_at: string
          id: string
          response_time_ms: number | null
          service_id: string
          status: string
        }
        Insert: {
          checked_at?: string
          id?: string
          response_time_ms?: number | null
          service_id: string
          status: string
        }
        Update: {
          checked_at?: string
          id?: string
          response_time_ms?: number | null
          service_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_uptime_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          category: string
          created_at: string
          description: string | null
          icon: string | null
          id: string
          is_active: boolean
          last_check_at: string | null
          name: string
          port: string
          response_time_ms: number | null
          status: string | null
          updated_at: string
          url: string | null
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          last_check_at?: string | null
          name: string
          port: string
          response_time_ms?: number | null
          status?: string | null
          updated_at?: string
          url?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          last_check_at?: string | null
          name?: string
          port?: string
          response_time_ms?: number | null
          status?: string | null
          updated_at?: string
          url?: string | null
        }
        Relationships: []
      }
      system_metrics: {
        Row: {
          cpu_percent: number | null
          cpu_temp: number | null
          created_at: string
          disk_percent: number | null
          gpu_temp: number | null
          id: string
          net_rx_bytes: number | null
          net_tx_bytes: number | null
          ram_percent: number | null
          timestamp: string
        }
        Insert: {
          cpu_percent?: number | null
          cpu_temp?: number | null
          created_at?: string
          disk_percent?: number | null
          gpu_temp?: number | null
          id?: string
          net_rx_bytes?: number | null
          net_tx_bytes?: number | null
          ram_percent?: number | null
          timestamp?: string
        }
        Update: {
          cpu_percent?: number | null
          cpu_temp?: number | null
          created_at?: string
          disk_percent?: number | null
          gpu_temp?: number | null
          id?: string
          net_rx_bytes?: number | null
          net_tx_bytes?: number | null
          ram_percent?: number | null
          timestamp?: string
        }
        Relationships: []
      }
      telegram_ads: {
        Row: {
          ad_link: string | null
          ad_text: string | null
          budget: number | null
          channel_id: string | null
          clicks: number | null
          created_at: string
          end_date: string | null
          id: string
          impressions: number | null
          is_active: boolean | null
          name: string
          spent: number | null
          start_date: string | null
          status: string | null
          tracking_code: string | null
          updated_at: string
        }
        Insert: {
          ad_link?: string | null
          ad_text?: string | null
          budget?: number | null
          channel_id?: string | null
          clicks?: number | null
          created_at?: string
          end_date?: string | null
          id?: string
          impressions?: number | null
          is_active?: boolean | null
          name: string
          spent?: number | null
          start_date?: string | null
          status?: string | null
          tracking_code?: string | null
          updated_at?: string
        }
        Update: {
          ad_link?: string | null
          ad_text?: string | null
          budget?: number | null
          channel_id?: string | null
          clicks?: number | null
          created_at?: string
          end_date?: string | null
          id?: string
          impressions?: number | null
          is_active?: boolean | null
          name?: string
          spent?: number | null
          start_date?: string | null
          status?: string | null
          tracking_code?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "telegram_ads_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "media_channels"
            referencedColumns: ["id"]
          },
        ]
      }
      telegram_bots: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          token: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          token: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          token?: string
          updated_at?: string
        }
        Relationships: []
      }
      vpn_profiles: {
        Row: {
          address: string | null
          allowed_ips: string | null
          config_content: string | null
          created_at: string
          dns: string | null
          endpoint: string | null
          id: string
          is_active: boolean | null
          name: string
          private_key: string | null
          public_key: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          allowed_ips?: string | null
          config_content?: string | null
          created_at?: string
          dns?: string | null
          endpoint?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          private_key?: string | null
          public_key?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          allowed_ips?: string | null
          config_content?: string | null
          created_at?: string
          dns?: string | null
          endpoint?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          private_key?: string | null
          public_key?: string | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
