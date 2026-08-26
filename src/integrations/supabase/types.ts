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
      categories: {
        Row: {
          date_creation: string
          description: string | null
          icone: string | null
          id: string
          nom: string
          ordre_affichage: number
        }
        Insert: {
          date_creation?: string
          description?: string | null
          icone?: string | null
          id?: string
          nom: string
          ordre_affichage?: number
        }
        Update: {
          date_creation?: string
          description?: string | null
          icone?: string | null
          id?: string
          nom?: string
          ordre_affichage?: number
        }
        Relationships: []
      }
      favoris: {
        Row: {
          date: string
          id: string
          question_id: string
          user_id: string
        }
        Insert: {
          date?: string
          id?: string
          question_id: string
          user_id: string
        }
        Update: {
          date?: string
          id?: string
          question_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favoris_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      paiements: {
        Row: {
          agregateur: Database["public"]["Enums"]["agregateur_paiement"] | null
          date: string
          id: string
          montant_fcfa: number
          moyen: Database["public"]["Enums"]["moyen_paiement"] | null
          reference_transaction: string | null
          statut: Database["public"]["Enums"]["statut_paiement"]
          tarif_code: string
          user_id: string
        }
        Insert: {
          agregateur?: Database["public"]["Enums"]["agregateur_paiement"] | null
          date?: string
          id?: string
          montant_fcfa?: number
          moyen?: Database["public"]["Enums"]["moyen_paiement"] | null
          reference_transaction?: string | null
          statut?: Database["public"]["Enums"]["statut_paiement"]
          tarif_code: string
          user_id: string
        }
        Update: {
          agregateur?: Database["public"]["Enums"]["agregateur_paiement"] | null
          date?: string
          id?: string
          montant_fcfa?: number
          moyen?: Database["public"]["Enums"]["moyen_paiement"] | null
          reference_transaction?: string | null
          statut?: Database["public"]["Enums"]["statut_paiement"]
          tarif_code?: string
          user_id?: string
        }
        Relationships: []
      }
      parametres: {
        Row: {
          cle: string
          libelle: string | null
          maj: string
          valeur: string
        }
        Insert: {
          cle: string
          libelle?: string | null
          maj?: string
          valeur: string
        }
        Update: {
          cle?: string
          libelle?: string | null
          maj?: string
          valeur?: string
        }
        Relationships: []
      }
      profils: {
        Row: {
          acces: Database["public"]["Enums"]["type_acces"]
          acces_debut: string | null
          acces_expiration: string | null
          date_inscription: string
          eleve_magnificat: boolean
          id: string
          nom_complet: string
          offre: Database["public"]["Enums"]["type_offre"]
          telephone: string | null
        }
        Insert: {
          acces?: Database["public"]["Enums"]["type_acces"]
          acces_debut?: string | null
          acces_expiration?: string | null
          date_inscription?: string
          eleve_magnificat?: boolean
          id: string
          nom_complet?: string
          offre?: Database["public"]["Enums"]["type_offre"]
          telephone?: string | null
        }
        Update: {
          acces?: Database["public"]["Enums"]["type_acces"]
          acces_debut?: string | null
          acces_expiration?: string | null
          date_inscription?: string
          eleve_magnificat?: boolean
          id?: string
          nom_complet?: string
          offre?: Database["public"]["Enums"]["type_offre"]
          telephone?: string | null
        }
        Relationships: []
      }
      progression: {
        Row: {
          categorie_id: string
          id: string
          maj: string
          questions_reussies: number
          questions_tentees: number
          taux_reussite: number
          user_id: string
        }
        Insert: {
          categorie_id: string
          id?: string
          maj?: string
          questions_reussies?: number
          questions_tentees?: number
          taux_reussite?: number
          user_id: string
        }
        Update: {
          categorie_id?: string
          id?: string
          maj?: string
          questions_reussies?: number
          questions_tentees?: number
          taux_reussite?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "progression_categorie_id_fkey"
            columns: ["categorie_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      questions: {
        Row: {
          categorie_id: string | null
          cree_par: string | null
          date_creation: string
          date_validation: string | null
          difficulte: Database["public"]["Enums"]["difficulte_question"]
          enonce: string
          explication: string | null
          id: string
          image_url: string | null
          source: string | null
          statut_validation: Database["public"]["Enums"]["statut_validation"]
          type: Database["public"]["Enums"]["type_question"]
          valide_par: string | null
        }
        Insert: {
          categorie_id?: string | null
          cree_par?: string | null
          date_creation?: string
          date_validation?: string | null
          difficulte?: Database["public"]["Enums"]["difficulte_question"]
          enonce: string
          explication?: string | null
          id?: string
          image_url?: string | null
          source?: string | null
          statut_validation?: Database["public"]["Enums"]["statut_validation"]
          type?: Database["public"]["Enums"]["type_question"]
          valide_par?: string | null
        }
        Update: {
          categorie_id?: string | null
          cree_par?: string | null
          date_creation?: string
          date_validation?: string | null
          difficulte?: Database["public"]["Enums"]["difficulte_question"]
          enonce?: string
          explication?: string | null
          id?: string
          image_url?: string | null
          source?: string | null
          statut_validation?: Database["public"]["Enums"]["statut_validation"]
          type?: Database["public"]["Enums"]["type_question"]
          valide_par?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "questions_categorie_id_fkey"
            columns: ["categorie_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      reponses: {
        Row: {
          est_correcte: boolean
          id: string
          image_url: string | null
          ordre: number
          question_id: string
          texte: string
        }
        Insert: {
          est_correcte?: boolean
          id?: string
          image_url?: string | null
          ordre?: number
          question_id: string
          texte: string
        }
        Update: {
          est_correcte?: boolean
          id?: string
          image_url?: string | null
          ordre?: number
          question_id?: string
          texte?: string
        }
        Relationships: [
          {
            foreignKeyName: "reponses_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      reponses_utilisateur: {
        Row: {
          date: string
          est_correcte: boolean
          id: string
          question_id: string
          reponse_donnee: string[]
          session_id: string
        }
        Insert: {
          date?: string
          est_correcte?: boolean
          id?: string
          question_id: string
          reponse_donnee?: string[]
          session_id: string
        }
        Update: {
          date?: string
          est_correcte?: boolean
          id?: string
          question_id?: string
          reponse_donnee?: string[]
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reponses_utilisateur_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reponses_utilisateur_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions_examen"
            referencedColumns: ["id"]
          },
        ]
      }
      sessions_examen: {
        Row: {
          categorie_id: string | null
          date: string
          duree_secondes: number
          id: string
          mode: Database["public"]["Enums"]["mode_session"]
          nombre_questions: number
          reussi: boolean
          score: number
          user_id: string
        }
        Insert: {
          categorie_id?: string | null
          date?: string
          duree_secondes?: number
          id?: string
          mode?: Database["public"]["Enums"]["mode_session"]
          nombre_questions?: number
          reussi?: boolean
          score?: number
          user_id: string
        }
        Update: {
          categorie_id?: string | null
          date?: string
          duree_secondes?: number
          id?: string
          mode?: Database["public"]["Enums"]["mode_session"]
          nombre_questions?: number
          reussi?: boolean
          score?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sessions_examen_categorie_id_fkey"
            columns: ["categorie_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      signalements: {
        Row: {
          date: string
          id: string
          motif: string
          question_id: string
          statut: Database["public"]["Enums"]["statut_signalement"]
          user_id: string
        }
        Insert: {
          date?: string
          id?: string
          motif: string
          question_id: string
          statut?: Database["public"]["Enums"]["statut_signalement"]
          user_id: string
        }
        Update: {
          date?: string
          id?: string
          motif?: string
          question_id?: string
          statut?: Database["public"]["Enums"]["statut_signalement"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "signalements_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      tarifs: {
        Row: {
          actif: boolean
          code: string
          duree_jours: number
          id: string
          libelle: string
          prix_fcfa: number
        }
        Insert: {
          actif?: boolean
          code: string
          duree_jours?: number
          id?: string
          libelle: string
          prix_fcfa?: number
        }
        Update: {
          actif?: boolean
          code?: string
          duree_jours?: number
          id?: string
          libelle?: string
          prix_fcfa?: number
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
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
      a_acces_complet: { Args: { _user_id: string }; Returns: boolean }
      activer_code_magnificat: { Args: { _code: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      reclamer_admin_initial: { Args: never; Returns: boolean }
    }
    Enums: {
      agregateur_paiement: "fedapay" | "paydunya"
      app_role: "eleve" | "admin"
      difficulte_question: "facile" | "moyen" | "difficile"
      mode_session: "entrainement" | "examen_blanc"
      moyen_paiement: "mtn_momo" | "moov_money" | "celtiis_cash"
      statut_paiement: "en_attente" | "reussi" | "echoue"
      statut_signalement: "ouvert" | "traite"
      statut_validation: "brouillon" | "a_valider" | "valide"
      type_acces: "gratuit" | "premium"
      type_offre: "aucune" | "pack_permis" | "mensuel" | "magnificat"
      type_question: "choix_unique" | "choix_multiple" | "vrai_faux"
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
      agregateur_paiement: ["fedapay", "paydunya"],
      app_role: ["eleve", "admin"],
      difficulte_question: ["facile", "moyen", "difficile"],
      mode_session: ["entrainement", "examen_blanc"],
      moyen_paiement: ["mtn_momo", "moov_money", "celtiis_cash"],
      statut_paiement: ["en_attente", "reussi", "echoue"],
      statut_signalement: ["ouvert", "traite"],
      statut_validation: ["brouillon", "a_valider", "valide"],
      type_acces: ["gratuit", "premium"],
      type_offre: ["aucune", "pack_permis", "mensuel", "magnificat"],
      type_question: ["choix_unique", "choix_multiple", "vrai_faux"],
    },
  },
} as const
