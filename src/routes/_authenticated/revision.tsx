import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SerieQuestions } from "@/components/SerieQuestions";
import { useSession } from "@/hooks/useAuth";
import { chargerQuestionsRatees } from "@/lib/reponses";

export const Route = createFileRoute("/_authenticated/revision")({
  head: () => ({
    meta: [
      { title: "Révision de mes erreurs — LE MAGNIFICAT" },
      {
        name: "description",
        content:
          "Rejouez uniquement les questions du Code de la route béninois que vous avez ratées pour corriger vos points faibles.",
      },
      { property: "og:title", content: "Révision de mes erreurs — LE MAGNIFICAT" },
      { property: "og:description", content: "Rejouez vos questions ratées et progressez." },
    ],
  }),
  component: Revision,
});

function Revision() {
  const { utilisateur } = useSession();
  const {
    data: questions,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["questions-ratees", utilisateur?.id],
    enabled: !!utilisateur,
    refetchOnWindowFocus: false,
    queryFn: () => chargerQuestionsRatees(utilisateur!.id),
  });

  if (isLoading) return <p className="text-sm text-muted-foreground">Chargement de vos erreurs…</p>;

  if (!questions || questions.length === 0) {
    return (
      <Card className="shadow-card">
        <CardContent className="space-y-3 p-5 text-center">
          <RotateCcw className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="font-semibold">Aucune erreur à réviser</p>
          <p className="text-sm text-muted-foreground">
            Vos questions ratées apparaîtront ici après vos séries d'entraînement et vos examens
            blancs.
          </p>
          <Button asChild variant="outline">
            <Link to="/themes">Commencer un entraînement</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <SerieQuestions
      titre="Révision de mes erreurs"
      questions={questions}
      utilisateurId={utilisateur?.id ?? ""}
      onRejouer={() => void refetch()}
    />
  );
}
