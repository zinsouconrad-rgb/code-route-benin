import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Clock, Timer, Trophy, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CarteQuestion } from "@/components/CarteQuestion";
import { InvitationPremium } from "@/components/InvitationPremium";
import { accesComplet, useProfil, useSession } from "@/hooks/useAuth";
import { nombreParam, useParametres } from "@/lib/parametres";
import { chargerQuestionsValidees, type Question } from "@/lib/questions";
import { enregistrerReponses, type ReponseSaisie } from "@/lib/reponses";
import { enfilerSession } from "@/lib/hors-ligne";
import { toast } from "sonner";


export const Route = createFileRoute("/_authenticated/examen-blanc")({
  head: () => ({
    meta: [
      { title: "Examen blanc chronométré — Code de la route LE MAGNIFICAT" },
      {
        name: "description",
        content:
          "Passez un examen blanc chronométré du Code de la route béninois et découvrez votre score, votre temps et votre résultat.",
      },
      { property: "og:title", content: "Examen blanc chronométré — LE MAGNIFICAT" },
      {
        property: "og:description",
        content: "Conditions réelles : durée limitée, aucune correction pendant l'épreuve.",
      },
    ],
  }),
  component: ExamenBlanc,
});

const formatDuree = (s: number) =>
  `${Math.floor(s / 60)
    .toString()
    .padStart(2, "0")}:${Math.max(0, s % 60)
    .toString()
    .padStart(2, "0")}`;

function ExamenBlanc() {
  const { utilisateur } = useSession();
  const { data: profil } = useProfil();
  const { data: parametres, isLoading: chargeParam } = useParametres();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const complet = accesComplet(profil);
  const nombreQuestions = nombreParam(parametres, "examen_nombre_questions", 30);
  const dureeMinutes = nombreParam(parametres, "examen_duree_minutes", 30);
  const seuil = nombreParam(parametres, "examen_seuil_reussite", 80);
  const quotaGratuit = nombreParam(parametres, "gratuit_examens_blancs", 1);

  const [demarre, setDemarre] = useState(false);
  const [indice, setIndice] = useState(0);
  const [bonnes, setBonnes] = useState(0);
  const [termine, setTermine] = useState(false);
  const [debut, setDebut] = useState<number | null>(null);
  const [restant, setRestant] = useState(dureeMinutes * 60);
  const [dureeFinale, setDureeFinale] = useState(0);
  const [reponses, setReponses] = useState<ReponseSaisie[]>([]);

  const { data: dejaPasses } = useQuery({
    queryKey: ["examens-passes", utilisateur?.id],
    enabled: !!utilisateur,
    queryFn: async () => {
      const { count, error } = await supabase
        .from("sessions_examen")
        .select("id", { count: "exact", head: true })
        .eq("user_id", utilisateur!.id)
        .eq("mode", "examen_blanc");
      if (error) throw error;
      return count ?? 0;
    },
  });

  const quotaAtteint = !complet && (dejaPasses ?? 0) >= quotaGratuit;

  const { data: questions, isLoading } = useQuery({
    queryKey: ["examen", nombreQuestions],
    enabled: demarre,
    queryFn: () => chargerQuestionsValidees(null, nombreQuestions),
    refetchOnWindowFocus: false,
    gcTime: 0,
  });

  const liste = useMemo(() => (questions ?? []) as Question[], [questions]);

  const enregistrer = async (
    total: number,
    score: number,
    secondes: number,
    saisies: ReponseSaisie[],
  ) => {
    if (!utilisateur) return;
    const commun = {
      user_id: utilisateur.id,
      mode: "examen_blanc" as const,
      categorie_id: null,
      score,
      nombre_questions: total,
      duree_secondes: secondes,
      reussi: total > 0 && (score / total) * 100 >= seuil,
    };

    if (!navigator.onLine) {
      enfilerSession({ ...commun, reponses: saisies });
      toast.info("Hors ligne : votre examen sera synchronisé au retour du réseau.");
      return;
    }

    const { data: session } = await supabase
      .from("sessions_examen")
      .insert(commun)
      .select("id")
      .maybeSingle();
    if (session?.id) await enregistrerReponses(session.id, saisies);

    queryClient.invalidateQueries({ queryKey: ["examens-passes"] });
    queryClient.invalidateQueries({ queryKey: ["progression"] });
    queryClient.invalidateQueries({ queryKey: ["questions-ratees"] });
    queryClient.invalidateQueries({ queryKey: ["flamme"] });
  };

  const terminer = (score: number, total: number, saisies: ReponseSaisie[] = reponses) => {
    const secondes = debut ? Math.round((Date.now() - debut) / 1000) : 0;
    setDureeFinale(secondes);
    setTermine(true);
    void enregistrer(total, score, secondes, saisies);
  };

  // Chronomètre
  useEffect(() => {
    if (!demarre || termine || !debut) return;
    const id = setInterval(() => {
      const reste = dureeMinutes * 60 - Math.round((Date.now() - debut) / 1000);
      setRestant(reste);
      if (reste <= 0) terminer(bonnes, liste.length || nombreQuestions);
    }, 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [demarre, termine, debut, dureeMinutes, bonnes, liste.length]);

  const suivant = (choix: string[], estCorrecte: boolean) => {
    const question = liste[indice]!;
    const saisies = [
      ...reponses,
      { question_id: question.id, reponse_donnee: choix, est_correcte: estCorrecte },
    ];
    setReponses(saisies);
    const score = bonnes + (estCorrecte ? 1 : 0);
    setBonnes(score);
    if (indice + 1 >= liste.length) terminer(score, liste.length, saisies);
    else setIndice(indice + 1);
  };

  const relancer = () => {
    setDemarre(false);
    setIndice(0);
    setBonnes(0);
    setTermine(false);
    setReponses([]);
    setDebut(null);
    setRestant(dureeMinutes * 60);
    queryClient.removeQueries({ queryKey: ["examen"] });
  };

  // Écran d'accueil
  if (!demarre) {
    return (
      <div className="space-y-4">
        <Card className="shadow-card">
          <CardContent className="space-y-4 p-6 text-center">
            <Timer className="mx-auto h-10 w-10 text-primary" />
            <h1 className="text-xl font-bold">Examen blanc chronométré</h1>
            <p className="text-sm text-muted-foreground">
              {nombreQuestions} questions en {dureeMinutes} minutes. Aucune correction n'est
              affichée pendant l'épreuve : le résultat s'affiche à la fin.
            </p>
            <p className="text-sm text-muted-foreground">
              Seuil de réussite : <span className="font-semibold">{seuil}%</span>
            </p>
            {quotaAtteint ? (
              <InvitationPremium
                message={`La version Découverte donne droit à ${quotaGratuit} examen(s) blanc(s). Passez à l'accès complet pour continuer.`}
              />
            ) : (
              <Button
                size="lg"
                className="w-full"
                disabled={chargeParam}
                onClick={() => {
                  setDebut(Date.now());
                  setRestant(dureeMinutes * 60);
                  setDemarre(true);
                }}
              >
                Démarrer l'examen
              </Button>
            )}
            <Button asChild variant="outline" className="w-full">
              <Link to="/tableau-de-bord">Retour au tableau de bord</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) return <p className="text-sm text-muted-foreground">Préparation de l'examen…</p>;

  if (!termine && liste.length === 0) {
    return (
      <Card className="shadow-card">
        <CardContent className="space-y-3 p-5 text-center">
          <p className="font-semibold">Aucune question disponible pour le moment</p>
          <p className="text-sm text-muted-foreground">
            L'examen blanc sera disponible dès que l'auto-école aura validé des questions.
          </p>
          <Button variant="outline" onClick={relancer}>
            Retour
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (termine) {
    const total = liste.length || nombreQuestions;
    const taux = total > 0 ? Math.round((bonnes / total) * 100) : 0;
    const reussi = taux >= seuil;
    return (
      <div className="space-y-4">
        <Card className="shadow-card">
          <CardContent className="space-y-3 p-6 text-center">
            {reussi ? (
              <Trophy className="mx-auto h-10 w-10 text-success" />
            ) : (
              <XCircle className="mx-auto h-10 w-10 text-destructive" />
            )}
            <h1 className="text-xl font-bold">{reussi ? "Examen réussi" : "Examen échoué"}</h1>
            <p className="text-3xl font-bold text-primary">
              {bonnes} / {total}
            </p>
            <p className="text-sm text-muted-foreground">
              {taux}% de bonnes réponses — seuil requis : {seuil}%
            </p>
            <p className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" /> Temps : {formatDuree(dureeFinale)}
            </p>
            <div className="flex flex-col gap-2 pt-2">
              <Button onClick={relancer}>Nouvel examen blanc</Button>
              <Button variant="outline" onClick={() => navigate({ to: "/tableau-de-bord" })}>
                Retour au tableau de bord
              </Button>
            </div>
          </CardContent>
        </Card>
        {!complet && (
          <InvitationPremium message="Passez à l'accès complet pour enchaîner les examens blancs sans limite." />
        )}
      </div>
    );
  }

  const question = liste[indice]!;
  const alerte = restant <= 60;

  return (
    <div className="space-y-4">
      <div>
        <div className="mb-2 flex items-center justify-between text-sm">
          <span
            className={
              alerte
                ? "flex items-center gap-1.5 font-bold text-destructive"
                : "flex items-center gap-1.5 font-semibold"
            }
          >
            <Clock className="h-4 w-4" /> {formatDuree(Math.max(0, restant))}
          </span>
          <span className="flex items-center gap-1 text-muted-foreground">
            <CheckCircle2 className="h-3.5 w-3.5" /> {indice} répondue(s) / {liste.length}
          </span>
        </div>
        <Progress value={(indice / liste.length) * 100} className="h-1.5" />
      </div>

      <CarteQuestion
        key={question.id}
        question={question}
        index={indice}
        total={liste.length}
        correctionImmediate={false}
        utilisateurId={utilisateur?.id ?? ""}
        onSuivant={suivant}
      />
    </div>
  );
}
