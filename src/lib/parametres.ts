import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Parametres = Record<string, string>;

export function useParametres() {
  return useQuery({
    queryKey: ["parametres"],
    queryFn: async (): Promise<Parametres> => {
      const { data, error } = await supabase.from("parametres").select("cle, valeur");
      if (error) throw error;
      return Object.fromEntries((data ?? []).map((p) => [p.cle, p.valeur]));
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function nombreParam(p: Parametres | undefined, cle: string, defaut: number) {
  const v = Number(p?.[cle]);
  return Number.isFinite(v) && v > 0 ? v : defaut;
}

export function useTarifs() {
  return useQuery({
    queryKey: ["tarifs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tarifs")
        .select("*")
        .order("prix_fcfa", { ascending: true });
      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("ordre_affichage", { ascending: true });
      if (error) throw error;
      return data;
    },
    staleTime: 60 * 1000,
  });
}

export const formatFcfa = (n: number) => `${n.toLocaleString("fr-FR")} FCFA`;
