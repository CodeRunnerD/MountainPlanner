export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      expenses: {
        Row: {
          amount: number
          category: Database["public"]["Enums"]["expense_category"]
          created_at: string
          description: string | null
          id: string
          paid_by: string
          split_among: string[] | null
          trip_id: string
        }
        Insert: {
          amount?: number
          category?: Database["public"]["Enums"]["expense_category"]
          created_at?: string
          description?: string | null
          id?: string
          paid_by: string
          split_among?: string[] | null
          trip_id: string
        }
        Update: {
          amount?: number
          category?: Database["public"]["Enums"]["expense_category"]
          created_at?: string
          description?: string | null
          id?: string
          paid_by?: string
          split_among?: string[] | null
          trip_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "expenses_paid_by_fkey"
            columns: ["paid_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      medical_info: {
        Row: {
          allergies: string[] | null
          blood_type: Database["public"]["Enums"]["blood_type_enum"] | null
          id: string
          medications: string | null
          notes: string | null
          profile_id: string
        }
        Insert: {
          allergies?: string[] | null
          blood_type?: Database["public"]["Enums"]["blood_type_enum"] | null
          id?: string
          medications?: string | null
          notes?: string | null
          profile_id: string
        }
        Update: {
          allergies?: string[] | null
          blood_type?: Database["public"]["Enums"]["blood_type_enum"] | null
          id?: string
          medications?: string | null
          notes?: string | null
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "medical_info_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      participant_equipment: {
        Row: {
          equipment_id: string
          id: string
          participant_id: string
          status: Database["public"]["Enums"]["equipment_status"]
        }
        Insert: {
          equipment_id: string
          id?: string
          participant_id: string
          status?: Database["public"]["Enums"]["equipment_status"]
        }
        Update: {
          equipment_id?: string
          id?: string
          participant_id?: string
          status?: Database["public"]["Enums"]["equipment_status"]
        }
        Relationships: [
          {
            foreignKeyName: "participant_equipment_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "trip_equipment_requirements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "participant_equipment_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "trip_participants"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          approval_status: Database["public"]["Enums"]["user_approval_status"]
          avatar_url: string | null
          created_at: string
          display_name: string
          id: string
          lat: number | null
          lng: number | null
          neighborhood: string | null
          phone: string | null
          role: Database["public"]["Enums"]["app_role"]
        }
        Insert: {
          approval_status?: Database["public"]["Enums"]["user_approval_status"]
          avatar_url?: string | null
          created_at?: string
          display_name?: string
          id: string
          lat?: number | null
          lng?: number | null
          neighborhood?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["app_role"]
        }
        Update: {
          approval_status?: Database["public"]["Enums"]["user_approval_status"]
          avatar_url?: string | null
          created_at?: string
          display_name?: string
          id?: string
          lat?: number | null
          lng?: number | null
          neighborhood?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["app_role"]
        }
        Relationships: []
      }
      route_skill_requirements: {
        Row: {
          id: string
          route_id: string
          skill_tag: string
        }
        Insert: {
          id?: string
          route_id: string
          skill_tag: string
        }
        Update: {
          id?: string
          route_id?: string
          skill_tag?: string
        }
        Relationships: [
          {
            foreignKeyName: "route_skill_requirements_route_id_fkey"
            columns: ["route_id"]
            isOneToOne: false
            referencedRelation: "routes"
            referencedColumns: ["id"]
          },
        ]
      }
      route_waypoints: {
        Row: {
          elevation: number | null
          id: string
          lat: number
          lng: number
          name: string
          order_index: number
          route_id: string
          type: Database["public"]["Enums"]["waypoint_type"]
        }
        Insert: {
          elevation?: number | null
          id?: string
          lat: number
          lng: number
          name: string
          order_index?: number
          route_id: string
          type?: Database["public"]["Enums"]["waypoint_type"]
        }
        Update: {
          elevation?: number | null
          id?: string
          lat?: number
          lng?: number
          name?: string
          order_index?: number
          route_id?: string
          type?: Database["public"]["Enums"]["waypoint_type"]
        }
        Relationships: [
          {
            foreignKeyName: "route_waypoints_route_id_fkey"
            columns: ["route_id"]
            isOneToOne: false
            referencedRelation: "routes"
            referencedColumns: ["id"]
          },
        ]
      }
      routes: {
        Row: {
          cover_image: string | null
          created_at: string
          created_by: string | null
          description: string | null
          difficulty: string | null
          gpx_file_path: string | null
          gpx_parsed: Json | null
          id: string
          name: string
          source_url: string | null
          status: Database["public"]["Enums"]["route_status"]
          story: string | null
        }
        Insert: {
          cover_image?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          difficulty?: string | null
          gpx_file_path?: string | null
          gpx_parsed?: Json | null
          id?: string
          name: string
          source_url?: string | null
          status?: Database["public"]["Enums"]["route_status"]
          story?: string | null
        }
        Update: {
          cover_image?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          difficulty?: string | null
          gpx_file_path?: string | null
          gpx_parsed?: Json | null
          id?: string
          name?: string
          source_url?: string | null
          status?: Database["public"]["Enums"]["route_status"]
          story?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "routes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      sensitive_data_vault: {
        Row: {
          created_at: string
          encrypted_cedula: string | null
          encrypted_emergency_phone: string | null
          encrypted_insurance: string | null
          id: string
          profile_id: string
          trip_id: string
        }
        Insert: {
          created_at?: string
          encrypted_cedula?: string | null
          encrypted_emergency_phone?: string | null
          encrypted_insurance?: string | null
          id?: string
          profile_id: string
          trip_id: string
        }
        Update: {
          created_at?: string
          encrypted_cedula?: string | null
          encrypted_emergency_phone?: string | null
          encrypted_insurance?: string | null
          id?: string
          profile_id?: string
          trip_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sensitive_data_vault_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sensitive_data_vault_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      summit_log: {
        Row: {
          completed_at: string
          id: string
          notes: string | null
          profile_id: string
          route_id: string | null
          trip_id: string | null
        }
        Insert: {
          completed_at: string
          id?: string
          notes?: string | null
          profile_id: string
          route_id?: string | null
          trip_id?: string | null
        }
        Update: {
          completed_at?: string
          id?: string
          notes?: string | null
          profile_id?: string
          route_id?: string | null
          trip_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "summit_log_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "summit_log_route_id_fkey"
            columns: ["route_id"]
            isOneToOne: false
            referencedRelation: "routes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "summit_log_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      transport_assignments: {
        Row: {
          assigned_by: string | null
          id: string
          participant_id: string
          vehicle_id: string
        }
        Insert: {
          assigned_by?: string | null
          id?: string
          participant_id: string
          vehicle_id: string
        }
        Update: {
          assigned_by?: string | null
          id?: string
          participant_id?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transport_assignments_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transport_assignments_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "trip_participants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transport_assignments_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_equipment_requirements: {
        Row: {
          id: string
          item_name: string
          mandatory: boolean
          trip_id: string
        }
        Insert: {
          id?: string
          item_name: string
          mandatory?: boolean
          trip_id: string
        }
        Update: {
          id?: string
          item_name?: string
          mandatory?: boolean
          trip_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_equipment_requirements_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_participants: {
        Row: {
          id: string
          needs_transport: boolean
          profile_id: string
          registered_at: string
          status: Database["public"]["Enums"]["registration_status"]
          trip_id: string
        }
        Insert: {
          id?: string
          needs_transport?: boolean
          profile_id: string
          registered_at?: string
          status?: Database["public"]["Enums"]["registration_status"]
          trip_id: string
        }
        Update: {
          id?: string
          needs_transport?: boolean
          profile_id?: string
          registered_at?: string
          status?: Database["public"]["Enums"]["registration_status"]
          trip_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_participants_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_participants_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trips: {
        Row: {
          cover_image: string | null
          created_at: string
          end_date: string | null
          id: string
          max_participants: number | null
          meeting_lat: number | null
          meeting_lng: number | null
          meeting_point: string | null
          organizer_id: string
          pace: Database["public"]["Enums"]["trip_pace"]
          route_id: string
          start_date: string
          status: Database["public"]["Enums"]["trip_status"]
          story: string | null
          title: string
        }
        Insert: {
          cover_image?: string | null
          created_at?: string
          end_date?: string | null
          id?: string
          max_participants?: number | null
          meeting_lat?: number | null
          meeting_lng?: number | null
          meeting_point?: string | null
          organizer_id: string
          pace?: Database["public"]["Enums"]["trip_pace"]
          route_id: string
          start_date: string
          status?: Database["public"]["Enums"]["trip_status"]
          story?: string | null
          title: string
        }
        Update: {
          cover_image?: string | null
          created_at?: string
          end_date?: string | null
          id?: string
          max_participants?: number | null
          meeting_lat?: number | null
          meeting_lng?: number | null
          meeting_point?: string | null
          organizer_id?: string
          pace?: Database["public"]["Enums"]["trip_pace"]
          route_id?: string
          start_date?: string
          status?: Database["public"]["Enums"]["trip_status"]
          story?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "trips_organizer_id_fkey"
            columns: ["organizer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trips_route_id_fkey"
            columns: ["route_id"]
            isOneToOne: false
            referencedRelation: "routes"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicles: {
        Row: {
          capacity: number
          id: string
          is_confirmed: boolean
          model: string | null
          owner_id: string
          tags: string[] | null
          trip_id: string
        }
        Insert: {
          capacity?: number
          id?: string
          is_confirmed?: boolean
          model?: string | null
          owner_id: string
          tags?: string[] | null
          trip_id: string
        }
        Update: {
          capacity?: number
          id?: string
          is_confirmed?: boolean
          model?: string | null
          owner_id?: string
          tags?: string[] | null
          trip_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicles_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicles_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      app_role: "organizer" | "expedition_lead" | "participant"
      blood_type_enum: "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-"
      equipment_status: "owned" | "needs_rental"
      expense_category: "fuel" | "rental" | "food" | "other"
      registration_status: "pending" | "confirmed" | "rejected" | "cancelled"
      route_status: "draft" | "pending_approval" | "published"
      trip_pace: "slow" | "medium" | "sport"
      trip_status: "draft" | "open" | "closed" | "completed" | "cancelled"
      user_approval_status:
        | "pending_email"
        | "pending_approval"
        | "active"
        | "rejected"
        | "suspended"
      waypoint_type: "start" | "waypoint" | "summit" | "end"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      app_role: ["organizer", "expedition_lead", "participant"],
      blood_type_enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
      equipment_status: ["owned", "needs_rental"],
      expense_category: ["fuel", "rental", "food", "other"],
      registration_status: ["pending", "confirmed", "rejected", "cancelled"],
      route_status: ["draft", "pending_approval", "published"],
      trip_pace: ["slow", "medium", "sport"],
      trip_status: ["draft", "open", "closed", "completed", "cancelled"],
      user_approval_status: [
        "pending_email",
        "pending_approval",
        "active",
        "rejected",
        "suspended",
      ],
      waypoint_type: ["start", "waypoint", "summit", "end"],
    },
  },
} as const

