import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Question } from "@/lib/questions";
import type { ReponseSaisie } from "@/lib/reponses";

const CLE_CACHE = "magnificat.questions.cache";
const CLE_FILE = "magnificat.sessions.attente";

type CacheQuestions = Record<string, { date: number; questions: Question[] }>;

export type SessionEnAttente = {
  id: string;
  user_id: string;
  mode: "entrainement" | "examen_blanc";
  categorie_id: string | null;
  score: number;
  nombre_questions: number;
  duree_secondes: number;
  reussi: boolean;
  reponses: ReponseSaisie[];
};

function lire<T>(cle: string, defaut: T): T {
  if (typeof window === "undefined") return defaut;
  try {
    const brut = window.localStorage.getItem(cle);
    return brut ? (JSON.parse(brut) as T) : defaut;
  } catch {
    return defaut;
  }
}

function ecrire(cle: string, valeur: unknown) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(cle, JSON.stringify(valeur));
  } catch {
    /* quota dépassé : on ignore silencieusement */
  }
}

/* ---------- Cache des questions ---------- */

export function enregistrerCacheQuestions(cle: string, questions: Question[]) {
  const cache = lire<CacheQuestions>(CLE_CACHE, {});
  cache[cle] = { date: Date.now(), questions };
  ecrire(CLE_CACHE, cache);
}

export function lireCacheQuestions(cle: string): Question[] | null {
  const cache = lire<CacheQuestions>(CLE_CACHE, {});
  return cache[cle]?.questions ?? null;
}

/** Toutes les questions déjà mises en cache, dédoublonnées (secours hors ligne). */
export function lireToutesQuestionsCache(): Question[] {
  const cache = lire<CacheQuestions>(CLE_CACHE, {});
  const parId = new Map<string, Question>();
  for (const entree of Object.values(cache)) {
    for (const q of entree.questions) parId.set(q.id, q);
  }
  return [...parId.values()];
}

export function nombreQuestionsHorsLigne() {
  return lireToutesQuestionsCache().length;
}

/* ---------- File d'attente des sessions ---------- */

export function lireFileSessions(): SessionEnAttente[] {
  return lire<SessionEnAttente[]>(CLE_FILE, []);
}

export function enfilerSession(session: Omit<SessionEnAttente, "id">) {
  const file = lireFileSessions();
  file.push({ ...session, id: crypto.randomUUID() });
  ecrire(CLE_FILE, file);
  window.dispatchEvent(new Event("magnificat-file-maj"));
}

/** Envoie les sessions stockées localement, puis vide la file des envois réussis. */
export async function synchroniserSessions(): Promise<number> {
  const file = lireFileSessions();
  if (file.length === 0) return 0;
  const restantes: SessionEnAttente[] = [];
  let envoyees = 0;

  for (const item of file) {
    const { data, error } = await supabase
      .from("sessions_examen")
      .insert({
        user_id: item.user_id,
        mode: item.mode,
        categorie_id: item.categorie_id,
        score: item.score,
        nombre_questions: item.nombre_questions,
        duree_secondes: item.duree_secondes,
        reussi: item.reussi,
      })
      .select("id")
      .maybeSingle();

    if (error || !data?.id) {
      restantes.push(item);
      continue;
    }
    if (item.reponses.length > 0) {
      await supabase
        .from("reponses_utilisateur")
        .insert(item.reponses.map((r) => ({ ...r, session_id: data.id })));
    }
    envoyees += 1;
  }

  ecrire(CLE_FILE, restantes);
  window.dispatchEvent(new Event("magnificat-file-maj"));
  return envoyees;
}

/* ---------- Hooks ---------- */

export function useEnLigne() {
  const [enLigne, setEnLigne] = useState(true);
  useEffect(() => {
    setEnLigne(navigator.onLine);
    const majOn = () => setEnLigne(true);
    const majOff = () => setEnLigne(false);
    window.addEventListener("online", majOn);
    window.addEventListener("offline", majOff);
    return () => {
      window.removeEventListener("online", majOn);
      window.removeEventListener("offline", majOff);
    };
  }, []);
  return enLigne;
}

/** Nombre de sessions en attente + synchronisation automatique au retour du réseau. */
export function useSynchronisation() {
  const enLigne = useEnLigne();
  const [enAttente, setEnAttente] = useState(0);
  const queryClient = useQueryClient();

  useEffect(() => {
    const maj = () => setEnAttente(lireFileSessions().length);
    maj();
    window.addEventListener("magnificat-file-maj", maj);
    return () => window.removeEventListener("magnificat-file-maj", maj);
  }, []);

  useEffect(() => {
    if (!enLigne || enAttente === 0) return;
    let annule = false;
    synchroniserSessions().then((n) => {
      if (annule || n === 0) return;
      toast.success(`${n} série${n > 1 ? "s" : ""} synchronisée${n > 1 ? "s" : ""}.`);
      queryClient.invalidateQueries({ queryKey: ["progression"] });
      queryClient.invalidateQueries({ queryKey: ["questions-ratees"] });
      queryClient.invalidateQueries({ queryKey: ["flamme"] });
    });
    return () => {
      annule = true;
    };
  }, [enLigne, enAttente, queryClient]);

  return { enLigne, enAttente };
}
