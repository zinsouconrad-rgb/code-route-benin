import { createFileRoute } from "@tanstack/react-router";
import { BookMarked } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ImageQuestion } from "@/components/ImageQuestion";
import { useFichesPubliees } from "@/lib/fiches";
import { useCategories } from "@/lib/parametres";

export const Route = createFileRoute("/_authenticated/fiches")({
  head: () => ({
    meta: [
      { title: "Fiches et panneaux — LE MAGNIFICAT" },
      {
        name: "description",
        content:
          "Consultez les fiches pédagogiques et les panneaux du Code de la route rédigés par les moniteurs de l'auto-école.",
      },
      { property: "og:title", content: "Fiches et panneaux — LE MAGNIFICAT" },
      {
        property: "og:description",
        content: "Fiches pédagogiques du Code de la route béninois.",
      },
    ],
  }),
  component: Fiches,
});

function Fiches() {
  const { data: fiches, isLoading } = useFichesPubliees();
  const { data: categories } = useCategories();
  const nomCategorie = (id: string | null) =>
    categories?.find((c) => c.id === id)?.nom ?? "Général";

  return (
    <div className="space-y-4">
      <h1 className="flex items-center gap-2 text-xl font-bold">
        <BookMarked className="h-5 w-5 text-primary" /> Fiches et panneaux
      </h1>

      {isLoading && <p className="text-sm text-muted-foreground">Chargement…</p>}

      {!isLoading && (fiches ?? []).length === 0 && (
        <Card className="shadow-card">
          <CardContent className="p-5 text-sm text-muted-foreground">
            Aucune fiche publiée pour le moment. Les moniteurs de l'auto-école les ajoutent depuis
            le back-office.
          </CardContent>
        </Card>
      )}

      {(fiches ?? []).map((f) => (
        <Card key={f.id} className="shadow-card">
          <CardHeader className="space-y-2">
            <Badge variant="secondary" className="w-fit">
              {nomCategorie(f.categorie_id)}
            </Badge>
            <CardTitle className="text-base">{f.titre}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {f.image_url && <ImageQuestion chemin={f.image_url} alt={f.titre} />}
            <p className="whitespace-pre-wrap text-sm leading-relaxed">{f.contenu}</p>
            {f.source && <p className="text-xs text-muted-foreground">Source : {f.source}</p>}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
