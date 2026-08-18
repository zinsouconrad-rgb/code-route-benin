import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type Profil = Tables<"profils">;

export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [chargement, setChargement] = useState(true);
  const queryClient = useQueryClient();

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s);
      setChargement(false);
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") {
        queryClient.invalidateQueries();
      }
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setChargement(false);
    });
    return () => sub.subscription.unsubscribe();
  }, [queryClient]);

  return { session, utilisateur: session?.user ?? null, chargement };
}

export function useProfil() {
  const { utilisateur } = useSession();
  return useQuery({
    queryKey: ["profil", utilisateur?.id],
    enabled: !!utilisateur,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profils")
        .select("*")
        .eq("id", utilisateur!.id)
        .maybeSingle();
      if (error) throw error;
      return data as Profil | null;
    },
  });
}

export function useEstAdmin() {
  const { utilisateur } = useSession();
  return useQuery({
    queryKey: ["role-admin", utilisateur?.id],
    enabled: !!utilisateur,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", utilisateur!.id)
        .eq("role", "admin")
        .maybeSingle();
      if (error) throw error;
      return !!data;
    },
  });
}

/** Accès complet = élève LE MAGNIFICAT, ou premium non expiré. */
export function accesComplet(profil?: Profil | null): boolean {
  if (!profil) return false;
  if (profil.eleve_magnificat) return true;
  if (profil.acces !== "premium") return false;
  if (!profil.acces_expiration) return true;
  return new Date(profil.acces_expiration).getTime() > Date.now();
}