import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type Profil = Tables<"profils">;

type EtatSession = {
  session: Session | null;
  utilisateur: User | null;
  chargement: boolean;
};

const ContexteSession = createContext<EtatSession | null>(null);

/**
 * Un seul abonnement onAuthStateChange pour toute l'application.
 * Auparavant chaque appel à useSession() créait son propre abonnement et son
 * propre getSession() : sur une page combinant useSession + useProfil +
 * useEstAdmin, cela multipliait les appels réseau et les invalidations de cache.
 */
export function FournisseurSession({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [chargement, setChargement] = useState(true);
  const queryClient = useQueryClient();

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s);
      setChargement(false);
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") {
        // Différé : appeler Supabase (ce que font les refetch déclenchés par
        // invalidateQueries) directement dans ce callback peut bloquer le
        // renouvellement du jeton.
        setTimeout(() => queryClient.invalidateQueries(), 0);
      }
    });

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setChargement(false);
    });

    return () => sub.subscription.unsubscribe();
  }, [queryClient]);

  const valeur = useMemo<EtatSession>(
    () => ({ session, utilisateur: session?.user ?? null, chargement }),
    [session, chargement],
  );

  return <ContexteSession.Provider value={valeur}>{children}</ContexteSession.Provider>;
}

export function useSession(): EtatSession {
  const contexte = useContext(ContexteSession);
  if (!contexte) {
    throw new Error("useSession doit être utilisé à l'intérieur de <FournisseurSession>.");
  }
  return contexte;
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
