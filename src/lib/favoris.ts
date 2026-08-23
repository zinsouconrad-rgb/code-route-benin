import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/useAuth";

/** Identifiants des questions mises en favori par l'utilisateur connecté. */
export function useFavoris() {
  const { utilisateur } = useSession();
  return useQuery({
    queryKey: ["favoris", utilisateur?.id],
    enabled: !!utilisateur,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("favoris")
        .select("question_id")
        .eq("user_id", utilisateur!.id);
      if (error) throw error;
      return (data ?? []).map((f) => f.question_id);
    },
  });
}

export function useBasculerFavori() {
  const { utilisateur } = useSession();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ questionId, actif }: { questionId: string; actif: boolean }) => {
      if (!utilisateur) return;
      if (actif) {
        const { error } = await supabase
          .from("favoris")
          .delete()
          .eq("user_id", utilisateur.id)
          .eq("question_id", questionId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("favoris")
          .insert({ user_id: utilisateur.id, question_id: questionId });
        if (error) throw error;
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["favoris"] }),
  });
}
