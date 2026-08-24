import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight, Shuffle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useCategories } from "@/lib/parametres";

export const Route = createFileRoute("/_authenticated/themes")({
  head: () => ({
    meta: [
      { title: "Thèmes du Code — LE MAGNIFICAT" },
      {
        name: "description",
        content: "Choisissez un thème du Code de la route béninois et entraînez-vous par série.",
      },
      { property: "og:title", content: "Thèmes du Code — LE MAGNIFICAT" },
      { property: "og:description", content: "Entraînement par thème du Code de la route." },
    ],
  }),
  component: Themes,
});

function Themes() {
  const { data: categories, isLoading } = useCategories();

  const { data: comptes } = useQuery({
    queryKey: ["comptes-questions-valides"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("questions")
        .select("categorie_id")
        .eq("statut_validation", "valide");
      if (error) throw error;
      const map: Record<string, number> = {};
      (data ?? []).forEach((q) => {
        if (q.categorie_id) map[q.categorie_id] = (map[q.categorie_id] ?? 0) + 1;
      });
      return map;
    },
  });

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Choisir un thème</h1>

      <Link to="/entrainement" search={{ categorie: undefined }}>
        <Card className="shadow-card transition-colors hover:bg-secondary">
          <CardContent className="flex items-center gap-3 p-4">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand text-primary-foreground">
              <Shuffle className="h-5 w-5" />
            </span>
            <div className="flex-1">
              <p className="font-semibold">Entraînement aléatoire</p>
              <p className="text-xs text-muted-foreground">Questions tirées de tous les thèmes</p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </CardContent>
        </Card>
      </Link>

      {isLoading && <p className="text-sm text-muted-foreground">Chargement…</p>}

      <div className="space-y-3">
        {(categories ?? []).map((c) => {
          const nb = comptes?.[c.id] ?? 0;
          return (
            <Link key={c.id} to="/entrainement" search={{ categorie: c.id }}>
              <Card className="shadow-card transition-colors hover:bg-secondary">
                <CardContent className="flex items-center gap-3 p-4">
                  <div className="flex-1">
                    <p className="font-semibold">{c.nom}</p>
                    {c.description && (
                      <p className="text-xs text-muted-foreground">{c.description}</p>
                    )}
                  </div>
                  <Badge variant={nb > 0 ? "secondary" : "outline"}>
                    {nb} question{nb > 1 ? "s" : ""}
                  </Badge>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      <p className="text-xs text-muted-foreground">
        Seules les questions validées par l'auto-école sont proposées à l'entraînement.
      </p>
    </div>
  );
}
