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
