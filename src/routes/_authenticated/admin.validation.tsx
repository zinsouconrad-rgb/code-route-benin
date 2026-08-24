import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Undo2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useSession } from "@/hooks/useAuth";
import { libelleType, type Question } from "@/lib/questions";

export const Route = createFileRoute("/_authenticated/admin/validation")({
  component: AdminValidation,
});

function AdminValidation() {
  const queryClient = useQueryClient();
  const { utilisateur } = useSession();

  const { data: questions, isLoading } = useQuery({
    queryKey: ["admin-a-valider"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("questions")
        .select("*, reponses(*)")
        .eq("statut_validation", "a_valider")
        .order("date_creation", { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as Question[];
    },
  });

  const changer = useMutation({
    mutationFn: async ({ id, valide }: { id: string; valide: boolean }) => {
      const { error } = await supabase
        .from("questions")
        .update({
          statut_validation: valide ? "valide" : "brouillon",
          valide_par: valide ? (utilisateur?.id ?? null) : null,
          date_validation: valide ? new Date().toISOString() : null,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Statut mis à jour");
      queryClient.invalidateQueries({ queryKey: ["admin-a-valider"] });
      queryClient.invalidateQueries({ queryKey: ["admin-questions"] });
    },
    onError: () => toast.error("Mise à jour impossible"),
  });

  if (isLoading) return <p className="text-sm text-muted-foreground">Chargement…</p>;

  if (!questions || questions.length === 0) {
    return (
      <Card className="shadow-card">
        <CardContent className="p-5 text-center text-sm text-muted-foreground">
          Aucune question en attente de validation.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Une question n'est visible par les élèves qu'après validation par l'auto-école.
      </p>
      {questions.map((q) => (
        <Card key={q.id} className="shadow-card">
          <CardContent className="space-y-2 p-4">
            <p className="text-sm font-medium">{q.enonce}</p>
            <ul className="space-y-1 text-sm">
              {[...q.reponses]
                .sort((a, b) => a.ordre - b.ordre)
                .map((r) => (
                  <li key={r.id} className={r.est_correcte ? "font-semibold text-success" : ""}>
                    {r.est_correcte ? "✓" : "•"} {r.texte}
                  </li>
                ))}
            </ul>
            {q.explication && (
              <p className="rounded-md bg-secondary p-2 text-xs text-muted-foreground">
                {q.explication}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <Badge variant="outline">{libelleType[q.type]}</Badge>
              {q.source && <Badge variant="secondary">{q.source}</Badge>}
            </div>
            <div className="flex gap-2 pt-1">
              <Button size="sm" onClick={() => changer.mutate({ id: q.id, valide: true })}>
                <Check className="h-3.5 w-3.5" /> Valider
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => changer.mutate({ id: q.id, valide: false })}
              >
                <Undo2 className="h-3.5 w-3.5" /> Renvoyer en brouillon
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
