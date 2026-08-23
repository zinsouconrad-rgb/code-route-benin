import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin/signalements")({
  head: () => ({
    meta: [
      { title: "Signalements — Back-office LE MAGNIFICAT" },
      {
        name: "description",
        content: "Traitez les erreurs signalées par les élèves sur les questions du Code.",
      },
      { property: "og:title", content: "Signalements — Back-office" },
      { property: "og:description", content: "Suivi des erreurs signalées par les élèves." },
    ],
  }),
  component: Signalements,
});

function Signalements() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin-signalements"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("signalements")
        .select("*, questions(enonce)")
        .order("date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const changerStatut = useMutation({
    mutationFn: async ({ id, statut }: { id: string; statut: "ouvert" | "traite" }) => {
      const { error } = await supabase.from("signalements").update({ statut }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Signalement mis à jour.");
      queryClient.invalidateQueries({ queryKey: ["admin-signalements"] });
    },
    onError: () => toast.error("Mise à jour impossible."),
  });

  if (isLoading) return <p className="text-sm text-muted-foreground">Chargement…</p>;

  if (!data || data.length === 0)
    return (
      <Card className="shadow-card">
        <CardContent className="p-5 text-center text-sm text-muted-foreground">
          Aucun signalement pour le moment.
        </CardContent>
      </Card>
    );

  return (
    <div className="space-y-3">
      {data.map((s) => (
        <Card key={s.id} className="shadow-card">
          <CardContent className="space-y-2 p-4">
            <div className="flex items-center gap-2">
              <Badge variant={s.statut === "ouvert" ? "destructive" : "secondary"}>
                {s.statut === "ouvert" ? "Ouvert" : "Traité"}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {new Date(s.date).toLocaleDateString("fr-FR")}
              </span>
            </div>
            <p className="text-sm font-semibold">
              {(s.questions as { enonce: string } | null)?.enonce ?? "Question supprimée"}
            </p>
            <p className="text-sm text-muted-foreground">{s.motif}</p>
            <Button
              size="sm"
              variant={s.statut === "ouvert" ? "default" : "outline"}
              onClick={() =>
                changerStatut.mutate({
                  id: s.id,
                  statut: s.statut === "ouvert" ? "traite" : "ouvert",
                })
              }
            >
              {s.statut === "ouvert" ? "Marquer comme traité" : "Rouvrir"}
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
