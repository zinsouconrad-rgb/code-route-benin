import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import {
  enregistrerCacheQuestions,
  lireCacheQuestions,
  lireToutesQuestionsCache,
} from "@/lib/hors-ligne";

export type Reponse = Tables<"reponses">;
export type Question = Tables<"questions"> & { reponses: Reponse[] };

const SELECT_QUESTION = "*, reponses(*)";

/** Questions visibles par un élève : uniquement le statut « valide ».
 *  Hors ligne, on rejoue les questions déjà mises en cache. */
export async function chargerQuestionsValidees(categorieId: string | null, limite: number) {
  const cleCache = `serie:${categorieId ?? "aleatoire"}`;
  try {
    let req = supabase
      .from("questions")
      .select(SELECT_QUESTION)
      .eq("statut_validation", "valide")
      .limit(Math.max(limite, 50));
    if (categorieId) req = req.eq("categorie_id", categorieId);
    const { data, error } = await req;
    if (error) throw error;
    const questions = (data ?? []) as unknown as Question[];
    questions.forEach((q) => q.reponses.sort((a, b) => a.ordre - b.ordre));
    enregistrerCacheQuestions(cleCache, questions);
    return melanger(questions).slice(0, limite);
  } catch (erreur) {
    const secours =
      lireCacheQuestions(cleCache) ??
      (categorieId
        ? lireToutesQuestionsCache().filter((q) => q.categorie_id === categorieId)
        : lireToutesQuestionsCache());
    if (secours.length === 0) throw erreur;
    return melanger(secours).slice(0, limite);
  }
}


export function melanger<T>(tableau: T[]): T[] {
  const copie = [...tableau];
  for (let i = copie.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = copie[i]!;
    copie[i] = copie[j]!;
    copie[j] = tmp;
  }
  return copie;
}

export function reponseExacte(question: Question, choix: string[]): boolean {
  const bonnes = question.reponses.filter((r) => r.est_correcte).map((r) => r.id);
  if (bonnes.length !== choix.length) return false;
  return bonnes.every((id) => choix.includes(id));
}

export const libelleType: Record<string, string> = {
  choix_unique: "Choix unique",
  choix_multiple: "Choix multiple",
  vrai_faux: "Vrai / Faux",
};

export const libelleStatut: Record<string, string> = {
  brouillon: "Brouillon",
  a_valider: "À valider",
  valide: "Validée",
};
