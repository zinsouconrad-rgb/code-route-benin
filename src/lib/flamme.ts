import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Flamme = {
  /** Jours consécutifs avec au moins une session enregistrée. */
  serie: number;
  /** Questions travaillées aujourd'hui (toutes sessions confondues). */
  questionsAujourdhui: number;
};

function cleJour(d: Date) {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

/** Calcule la flamme (série de jours) et l'avancement du jour à partir des sessions. */
export function useFlamme(utilisateurId: string | undefined) {
  return useQuery({
    queryKey: ["flamme", utilisateurId],
    enabled: !!utilisateurId,
    queryFn: async (): Promise<Flamme> => {
      const { data, error } = await supabase
        .from("sessions_examen")
        .select("date, nombre_questions")
        .eq("user_id", utilisateurId!)
        .order("date", { ascending: false })
        .limit(500);
      if (error) throw error;

      const jours = new Set<string>();
      let questionsAujourdhui = 0;
      const aujourdhui = cleJour(new Date());
      for (const s of data ?? []) {
        const d = new Date(s.date);
        jours.add(cleJour(d));
        if (cleJour(d) === aujourdhui) questionsAujourdhui += s.nombre_questions;
      }

      // La flamme reste allumée tant que la journée n'est pas finie :
      // on part d'aujourd'hui, sinon d'hier, puis on remonte tant qu'un jour a une session.
      let serie = 0;
      const curseur = new Date();
      if (!jours.has(cleJour(curseur))) curseur.setDate(curseur.getDate() - 1);
      while (jours.has(cleJour(curseur))) {
        serie += 1;
        curseur.setDate(curseur.getDate() - 1);
      }

      return { serie, questionsAujourdhui };
    },
  });
}
