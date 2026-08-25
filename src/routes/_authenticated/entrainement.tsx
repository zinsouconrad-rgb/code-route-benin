import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Trophy } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CarteQuestion } from "@/components/CarteQuestion";
import { InvitationPremium } from "@/components/InvitationPremium";
import { accesComplet, useProfil, useSession } from "@/hooks/useAuth";
import { nombreParam, useCategories, useParametres } from "@/lib/parametres";
import { chargerQuestionsValidees, type Question } from "@/lib/questions";
import { enregistrerReponses, type ReponseSaisie } from "@/lib/reponses";
import { enfilerSession } from "@/lib/hors-ligne";
import { useBasculerFavori, useFavoris } from "@/lib/favoris";


const schemaRecherche = z.object({ categorie: z.string().uuid().optional() });

export const Route = createFileRoute("/_authenticated/entrainement")({
  validateSearch: schemaRecherche,
  head: () => ({
    meta: [
      { title: "Entraînement — Code de la route LE MAGNIFICAT" },
      {
        name: "description",
        content:
          "Enchaînez les questions validées du Code de la route béninois avec correction et explication immédiates.",
      },
      { property: "og:title", content: "Entraînement — LE MAGNIFICAT" },
      {
        property: "og:description",
        content: "Questions à choix multiples avec correction expliquée.",
      },
    ],
  }),
  component: Entrainement,
});

const MAX_SERIE = 20;

function Entrainement() {
  const { categorie } = Route.useSearch();
  const { utilisateur } = useSession();
  const { data: profil } = useProfil();
  const { data: parametres } = useParametres();
  const { data: categories } = useCategories();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const complet = accesComplet(profil);
  const quotaGratuit = nombreParam(parametres, "gratuit_questions_par_theme", 10);
  const limite = complet ? MAX_SERIE : quotaGratuit;

  const [indice, setIndice] = useState(0);
  const [bonnes, setBonnes] = useState(0);
  const [termine, setTermine] = useState(false);
  const [debut] = useState(() => Date.now());
  const [reponses, setReponses] = useState<ReponseSaisie[]>([]);
  const { data: favoris } = useFavoris();
  const basculerFavori = useBasculerFavori();

  const { data: questions, isLoading } = useQuery({
    queryKey: ["serie", categorie ?? "aleatoire", limite],
    queryFn: () => chargerQuestionsValidees(categorie ?? null, limite),
    refetchOnWindowFocus: false,
  });

  const nomTheme = categorie
    ? (categories?.find((c) => c.id === categorie)?.nom ?? "Thème")
    : "Entraînement aléatoire";

  const enregistrer = async (total: number, score: number, saisies: ReponseSaisie[]) => {
    if (!utilisateur) return;
    const reussi = total > 0 && score / total >= 0.8;

    if (!navigator.onLine) {
      enfilerSession({
        user_id: utilisateur.id,
        mode: "entrainement",
        categorie_id: categorie ?? null,
        score,
        nombre_questions: total,
        duree_secondes: Math.round((Date.now() - debut) / 1000),
        reussi,
        reponses: saisies,
      });
      toast.info("Hors ligne : votre série sera synchronisée au retour du réseau.");
      return;
    }

    const { data: session } = await supabase
      .from("sessions_examen")
      .insert({
        user_id: utilisateur.id,
        mode: "entrainement",
        categorie_id: categorie ?? null,
        score,
        nombre_questions: total,
        duree_secondes: Math.round((Date.now() - debut) / 1000),
        reussi,
      })
      .select("id")
      .maybeSingle();

    if (session?.id) await enregistrerReponses(session.id, saisies);


    if (categorie) {
      const { data: existant } = await supabase
        .from("progression")
        .select("*")
        .eq("user_id", utilisateur.id)
        .eq("categorie_id", categorie)
        .maybeSingle();
      const tentees = (existant?.questions_tentees ?? 0) + total;
      const reussies = (existant?.questions_reussies ?? 0) + score;
      await supabase.from("progression").upsert(
        {
          ...(existant?.id ? { id: existant.id } : {}),
          user_id: utilisateur.id,
          categorie_id: categorie,
          questions_tentees: tentees,
          questions_reussies: reussies,
          taux_reussite: tentees > 0 ? (reussies / tentees) * 100 : 0,
          maj: new Date().toISOString(),
        },
        { onConflict: "user_id,categorie_id" },
      );
    }
    queryClient.invalidateQueries({ queryKey: ["progression"] });
    queryClient.invalidateQueries({ queryKey: ["questions-ratees"] });
    return session?.id;
  };

  const liste = (questions ?? []) as Question[];

  const suivant = async (choix: string[], estCorrecte: boolean) => {
    const question = liste[indice]!;
    const saisies = [
      ...reponses,
      { question_id: question.id, reponse_donnee: choix, est_correcte: estCorrecte },
    ];
    setReponses(saisies);
    const score = bonnes + (estCorrecte ? 1 : 0);
    setBonnes(score);
    if (indice + 1 >= liste.length) {
      setTermine(true);
      await enregistrer(liste.length, score, saisies);
    } else {
      setIndice(indice + 1);
    }
  };

  if (isLoading) return <p className="text-sm text-muted-foreground">Chargement des questions…</p>;

  if (liste.length === 0) {
    return (
      <Card className="shadow-card">
        <CardContent className="space-y-3 p-5 text-center">
          <p className="font-semibold">Aucune question disponible pour le moment</p>
          <p className="text-sm text-muted-foreground">
            Les questions apparaîtront ici dès que l'auto-école les aura saisies et validées.
          </p>
          <Button asChild variant="outline">
            <Link to="/themes">Retour aux thèmes</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (termine) {
    const taux = Math.round((bonnes / liste.length) * 100);
    return (
      <div className="space-y-4">
        <Card className="shadow-card">
          <CardContent className="space-y-3 p-6 text-center">
            <Trophy className="mx-auto h-10 w-10 text-primary" />
            <h1 className="text-xl font-bold">Série terminée</h1>
            <p className="text-3xl font-bold text-primary">
              {bonnes} / {liste.length}
            </p>
            <p className="text-sm text-muted-foreground">{taux}% de bonnes réponses</p>
            <div className="flex flex-col gap-2 pt-2">
              <Button
                onClick={() => {
                  setIndice(0);
                  setBonnes(0);
                  setReponses([]);
                  setTermine(false);
                  queryClient.invalidateQueries({ queryKey: ["serie"] });
                }}
              >
                Nouvelle série
              </Button>
              <Button variant="outline" onClick={() => navigate({ to: "/tableau-de-bord" })}>
                Retour au tableau de bord
              </Button>
            </div>
          </CardContent>
        </Card>
        {!complet && (
          <InvitationPremium message="Vous utilisez la version Découverte : le nombre de questions par thème est limité." />
        )}
      </div>
    );
  }

  const question = liste[indice]!;

  return (
    <div className="space-y-4">
      <div>
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-semibold">{nomTheme}</span>
          <span className="flex items-center gap-1 text-muted-foreground">
            <CheckCircle2 className="h-3.5 w-3.5 text-success" /> {bonnes}
          </span>
        </div>
        <Progress value={(indice / liste.length) * 100} className="h-1.5" />
      </div>

      {!complet && (
        <p className="rounded-lg border border-border bg-secondary p-2 text-xs text-muted-foreground">
          Version Découverte : {quotaGratuit} questions offertes par thème.
        </p>
      )}

      <CarteQuestion
        key={question.id}
        question={question}
        index={indice}
        total={liste.length}
        utilisateurId={utilisateur?.id ?? ""}
        favori={favoris?.includes(question.id) ?? false}
        onBasculerFavori={() =>
          basculerFavori.mutate({
            questionId: question.id,
            actif: favoris?.includes(question.id) ?? false,
          })
        }
        onSuivant={suivant}
      />
    </div>
  );
}
