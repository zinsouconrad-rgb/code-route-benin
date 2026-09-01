import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type Fiche = Tables<"fiches">;

/** Fiches publiées, visibles par les élèves. */
export function useFichesPubliees() {
  return useQuery({
    queryKey: ["fiches", "valide"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fiches")
        .select("*")
        .eq("statut_validation", "valide")
        .order("ordre_affichage", { ascending: true });
      if (error) throw error;
      return data as Fiche[];
    },
    staleTime: 5 * 60 * 1000,
  });
}

/** Toutes les fiches, y compris brouillons (admin uniquement). */
export function useToutesFiches() {
  return useQuery({
    queryKey: ["fiches", "admin"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fiches")
        .select("*")
        .order("ordre_affichage", { ascending: true });
      if (error) throw error;
      return data as Fiche[];
    },
  });
}
