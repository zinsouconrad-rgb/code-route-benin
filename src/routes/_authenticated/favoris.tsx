import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SerieQuestions } from "@/components/SerieQuestions";
import { useSession } from "@/hooks/useAuth";
import { useFavoris } from "@/lib/favoris";
import { chargerQuestionsFavorites } from "@/lib/reponses";

export const Route = createFileRoute("/_authenticated/favoris")({
  head: () => ({
    meta: [
      { title: "Mes favoris — LE MAGNIFICAT" },
      {
        name: "description",
        content:
          "Retrouvez et rejouez les questions du Code de la route béninois que vous avez mises de côté.",
      },
      { property: "og:title", content: "Mes favoris — LE MAGNIFICAT" },
      { property: "og:description", content: "Vos questions mises de côté, prêtes à être revues." },
    ],
  }),
  component: Favoris,
});

function Favoris() {
  const { utilisateur } = useSession();
  const { data: ids, isLoading: chargeIds } = useFavoris();
  const {
    data: questions,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["questions-favorites", ids],
    enabled: !!ids,
    refetchOnWindowFocus: false,
    queryFn: () => chargerQuestionsFavorites(ids ?? []),
  });

  if (chargeIds || isLoading)
    return <p className="text-sm text-muted-foreground">Chargement de vos favoris…</p>;

  if (!questions || questions.length === 0) {
    return (
      <Card className="shadow-card">
        <CardContent className="space-y-3 p-5 text-center">
          <Star className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="font-semibold">Aucune question en favori</p>
          <p className="text-sm text-muted-foreground">
            Touchez l'étoile pendant un entraînement pour mettre une question de côté.
          </p>
          <Button asChild variant="outline">
            <Link to="/themes">Aller à l'entraînement</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <SerieQuestions
      titre="Mes favoris"
      questions={questions}
      utilisateurId={utilisateur?.id ?? ""}
      onRejouer={() => void refetch()}
    />
  );
}
