import { supabase } from "@/integrations/supabase/client";
import type { Question } from "@/lib/questions";

export type ReponseSaisie = {
  question_id: string;
  reponse_donnee: string[];
  est_correcte: boolean;
};

/** Enregistre le détail des réponses d'une session (base de la révision des erreurs). */
export async function enregistrerReponses(sessionId: string, reponses: ReponseSaisie[]) {
  if (!sessionId || reponses.length === 0) return;
  await supabase
    .from("reponses_utilisateur")
    .insert(reponses.map((r) => ({ ...r, session_id: sessionId })));
}

const SELECT_QUESTION = "*, reponses(*)";

async function chargerParIds(ids: string[], limite: number): Promise<Question[]> {
  if (ids.length === 0) return [];
  const { data, error } = await supabase
    .from("questions")
    .select(SELECT_QUESTION)
    .in("id", ids.slice(0, limite))
    .eq("statut_validation", "valide");
  if (error) throw error;
  const questions = (data ?? []) as unknown as Question[];
  questions.forEach((q) => q.reponses.sort((a, b) => a.ordre - b.ordre));
  return questions;
}

/** Questions déjà ratées par l'utilisateur, hors questions désormais réussies. */
export async function chargerQuestionsRatees(userId: string, limite = 20): Promise<Question[]> {
  const { data, error } = await supabase
    .from("reponses_utilisateur")
    .select("question_id, est_correcte, date, sessions_examen!inner(user_id)")
    .eq("sessions_examen.user_id", userId)
    .order("date", { ascending: false })
    .limit(500);
  if (error) throw error;

  const dernier = new Map<string, boolean>();
  for (const ligne of data ?? []) {
    if (!dernier.has(ligne.question_id)) dernier.set(ligne.question_id, ligne.est_correcte);
  }
  const ratees = [...dernier.entries()].filter(([, ok]) => !ok).map(([id]) => id);
  return chargerParIds(ratees, limite);
}

export async function chargerQuestionsFavorites(ids: string[], limite = 20): Promise<Question[]> {
  return chargerParIds(ids, limite);
}
