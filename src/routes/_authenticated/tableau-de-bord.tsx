import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, ChevronRight, Shuffle, Target, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { accesComplet, useProfil, useSession } from "@/hooks/useAuth";
import { useCategories } from "@/lib/parametres";

export const Route = createFileRoute("/_authenticated/tableau-de-bord")({
  head: () => ({
    meta: [
      { title: "Tableau de bord — Code de la route LE MAGNIFICAT" },
      {
        name: "description",
        content:
          "Suivez votre progression et poursuivez votre entraînement au Code de la route béninois.",
      },
      { property: "og:title", content: "Tableau de bord — LE MAGNIFICAT" },
      { property: "og:description", content: "Votre progression au Code de la route béninois." },
    ],
  }),
  component: TableauDeBord,
});

function TableauDeBord() {
  const { utilisateur } = useSession();
  const { data: profil } = useProfil();
  const { data: categories } = useCategories();
  const complet = accesComplet(profil);

  const { data: progression } = useQuery({
    queryKey: ["progression", utilisateur?.id],
    enabled: !!utilisateur,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("progression")
        .select("*")
        .eq("user_id", utilisateur!.id);
      if (error) throw error;
      return data;
    },
  });

  const tentees = (progression ?? []).reduce((s, p) => s + p.questions_tentees, 0);
  const reussies = (progression ?? []).reduce((s, p) => s + p.questions_reussies, 0);
  const taux = tentees > 0 ? Math.round((reussies / tentees) * 100) : 0;
  const faibles = (progression ?? [])
    .filter((p) => p.questions_tentees >= 3)
    .sort((a, b) => Number(a.taux_reussite) - Number(b.taux_reussite))
    .slice(0, 3);
  const nomCategorie = (id: string) => categories?.find((c) => c.id === id)?.nom ?? "Thème";

  return (
    <div className="space-y-5">
      <section className="rounded-xl bg-brand p-5 text-primary-foreground shadow-card">
        <p className="text-sm opacity-90">Bonjour</p>
        <h1 className="text-xl font-bold">{profil?.nom_complet || "Candidat"}</h1>
        <div className="mt-3 flex flex-wrap gap-2">
          <Badge variant="secondary">
            {profil?.eleve_magnificat
              ? "Élève LE MAGNIFICAT — accès offert"
              : complet
                ? "Accès complet"
                : "Version Découverte"}
          </Badge>
        </div>
        <Button asChild variant="secondary" size="lg" className="mt-4 w-full">
          <Link to="/themes">
            Continuer l'entraînement
            <ChevronRight className="h-4 w-4" />
          </Link>
        </Button>
      </section>

      <div className="grid grid-cols-2 gap-3">
        <Card className="shadow-card">
          <CardContent className="p-4">
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <TrendingUp className="h-3.5 w-3.5" /> Taux de réussite
            </p>
            <p className="mt-1 text-2xl font-bold">{taux}%</p>
            <Progress value={taux} className="mt-2 h-1.5" />
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="p-4">
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Target className="h-3.5 w-3.5" /> Questions travaillées
            </p>
            <p className="mt-1 text-2xl font-bold">{tentees}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Button asChild variant="outline" size="lg" className="justify-start">
          <Link to="/themes">
            <BookOpen className="h-4 w-4" /> Entraînement par thème
          </Link>
        </Button>
        <Button asChild variant="outline" size="lg" className="justify-start">
          <Link to="/entrainement" search={{ categorie: undefined }}>
            <Shuffle className="h-4 w-4" /> Entraînement aléatoire
          </Link>
        </Button>
      </div>

      {faibles.length > 0 && (
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-base">Vos points faibles</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {faibles.map((p) => (
              <div key={p.id}>
                <div className="mb-1 flex justify-between text-sm">
                  <span>{nomCategorie(p.categorie_id)}</span>
                  <span className="text-muted-foreground">
                    {Math.round(Number(p.taux_reussite))}%
                  </span>
                </div>
                <Progress value={Number(p.taux_reussite)} className="h-1.5" />
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card className="border-dashed shadow-none">
        <CardContent className="p-4 text-sm text-muted-foreground">
          L'examen blanc chronométré, les favoris et la révision des erreurs arrivent en phase 2.
        </CardContent>
      </Card>
    </div>
  );
}