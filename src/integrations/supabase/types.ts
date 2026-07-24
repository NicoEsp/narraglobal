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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      admin_emails: {
        Row: {
          created_at: string
          email: string
        }
        Insert: {
          created_at?: string
          email: string
        }
        Update: {
          created_at?: string
          email?: string
        }
        Relationships: []
      }
      industry_subscriptions: {
        Row: {
          created_at: string
          email: string
          id: string
          source: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          source?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          source?: string
        }
        Relationships: []
      }
      political_contacts: {
        Row: {
          created_at: string
          email: string
          id: string
          name: string
          organization: string | null
          phone: string | null
          source: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          name: string
          organization?: string | null
          phone?: string | null
          source?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          name?: string
          organization?: string | null
          phone?: string | null
          source?: string
        }
        Relationships: []
      }
      suscripciones: {
        Row: {
          alta_completada_en: string | null
          categoria: string | null
          codigo: string
          competidores: Json
          created_at: string
          demo_expira: string | null
          email: string
          equipo_telefono: string | null
          equipo_tamano: number
          estado: string
          id: string
          ls_customer_id: string | null
          ls_estado: string | null
          ls_renueva_en: string | null
          ls_subscription_id: string | null
          ls_termina_en: string | null
          ls_test_mode: boolean | null
          ls_variant_id: string | null
          nombre: string
          pais_de: string | null
          pais_para: string | null
          plan: string
          pulso_dia: string
          pulso_hora: string
          redes: Json
          telefono: string | null
          token: string
          tz: string
          updated_at: string
        }
        Insert: {
          alta_completada_en?: string | null
          categoria?: string | null
          codigo: string
          competidores?: Json
          created_at?: string
          demo_expira?: string | null
          email: string
          equipo_telefono?: string | null
          equipo_tamano?: number
          estado?: string
          id?: string
          ls_customer_id?: string | null
          ls_estado?: string | null
          ls_renueva_en?: string | null
          ls_subscription_id?: string | null
          ls_termina_en?: string | null
          ls_test_mode?: boolean | null
          ls_variant_id?: string | null
          nombre: string
          pais_de?: string | null
          pais_para?: string | null
          plan?: string
          pulso_dia?: string
          pulso_hora?: string
          redes?: Json
          telefono?: string | null
          token?: string
          tz?: string
          updated_at?: string
        }
        Update: {
          alta_completada_en?: string | null
          categoria?: string | null
          codigo?: string
          competidores?: Json
          created_at?: string
          demo_expira?: string | null
          email?: string
          equipo_telefono?: string | null
          equipo_tamano?: number
          estado?: string
          id?: string
          ls_customer_id?: string | null
          ls_estado?: string | null
          ls_renueva_en?: string | null
          ls_subscription_id?: string | null
          ls_termina_en?: string | null
          ls_test_mode?: boolean | null
          ls_variant_id?: string | null
          nombre?: string
          pais_de?: string | null
          pais_para?: string | null
          plan?: string
          pulso_dia?: string
          pulso_hora?: string
          redes?: Json
          telefono?: string | null
          token?: string
          tz?: string
          updated_at?: string
        }
        Relationships: []
      }
      tableros: {
        Row: {
          avisado_en: string | null
          created_at: string
          datos: Json
          estado: string
          id: string
          programado_para: string | null
          semana: string
          suscripcion_id: string
          updated_at: string
        }
        Insert: {
          avisado_en?: string | null
          created_at?: string
          datos: Json
          estado?: string
          id?: string
          programado_para?: string | null
          semana?: string
          suscripcion_id: string
          updated_at?: string
        }
        Update: {
          avisado_en?: string | null
          created_at?: string
          datos?: Json
          estado?: string
          id?: string
          programado_para?: string | null
          semana?: string
          suscripcion_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tableros_suscripcion_id_fkey"
            columns: ["suscripcion_id"]
            isOneToOne: false
            referencedRelation: "suscripciones"
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
      completar_alta: {
        Args: { p_codigo: string; p_datos: Json }
        Returns: Database["public"]["Tables"]["suscripciones"]["Row"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      submit_industry_subscription: {
        Args: { _email: string; _honeypot?: string; _source?: string }
        Returns: string
      }
      submit_political_contact: {
        Args: {
          _email: string
          _honeypot?: string
          _name: string
          _organization?: string
          _phone: string
          _source?: string
        }
        Returns: string
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
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
