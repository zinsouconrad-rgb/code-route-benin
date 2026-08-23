import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CarteQuestion } from "@/components/CarteQuestion";
import { supabase } from "@/integrations/supabase/client";
import { useBasculerFavori, useFavoris } from "@/lib/favoris";
import { enregistrerReponses, type ReponseSaisie } from "@/lib/reponses";
import type { Question } from "@/lib/questions";

type Props = {
  titre: string;
  questions: Question[];
  utilisateurId: string;
  /** Enregistre une session d'entraînement à la fin de la série. */
  enregistrerSession?: boolean;
  onRejouer?: () => void;
};

/** Lecteur de série réutilisable (révision des erreurs, favoris). */
export function SerieQuestions({
  titre,
  questions,
  utilisateurId,
  enregistrerSession = true,
  onRejouer,
}: Props) {
  const [indice, setIndice] = useState(0);
  const [bonnes, setBonnes] = useState(0);
  const [termine, setTermine] = useState(false);
  const [saisies, setSaisies] = useState<ReponseSaisie[]>([]);
  const [debut] = useState(() => Date.now());
  const queryClient = useQueryClient();
  const { data: favoris } = useFavoris();
  const basculer = useBasculerFavori();

  const cloturer = async (liste: ReponseSaisie[], score: number) => {
    setTermine(true);
    if (!enregistrerSession || !utilisateurId) return;
    const { data } = await supabase
      .from("sessions_examen")
      .insert({
        user_id: utilisateurId,
        mode: "entrainement",
        categorie_id: null,
        score,
        nombre_questions: questions.length,
        duree_secondes: Math.round((Date.now() - debut) / 1000),
        reussi: questions.length > 0 && score === questions.length,
      })
      .select("id")
      .maybeSingle();
    if (data?.id) await enregistrerReponses(data.id, liste);
    queryClient.invalidateQueries({ queryKey: ["questions-ratees"] });
    queryClient.invalidateQueries({ queryKey: ["progression"] });
  };

  const suivant = async (choix: string[], estCorrecte: boolean) => {
    const question = questions[indice]!;
    const liste = [
      ...saisies,
      { question_id: question.id, reponse_donnee: choix, est_correcte: estCorrecte },
    ];
    setSaisies(liste);
    const score = bonnes + (estCorrecte ? 1 : 0);
    setBonnes(score);
    if (indice + 1 >= questions.length) await cloturer(liste, score);
    else setIndice(indice + 1);
  };

  if (termine) {
    const taux = questions.length > 0 ? Math.round((bonnes / questions.length) * 100) : 0;
    return (
      <Card className="shadow-card">
        <CardContent className="space-y-3 p-6 text-center">
          <Trophy className="mx-auto h-10 w-10 text-primary" />
          <h2 className="text-xl font-bold">Série terminée</h2>
          <p className="text-3xl font-bold text-primary">
            {bonnes} / {questions.length}
          </p>
          <p className="text-sm text-muted-foreground">{taux}% de bonnes réponses</p>
          {onRejouer && (
            <Button
              className="w-full"
              onClick={() => {
                setIndice(0);
                setBonnes(0);
                setSaisies([]);
                setTermine(false);
                onRejouer();
              }}
            >
              Relancer une série
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  const question = questions[indice]!;

  return (
    <div className="space-y-4">
      <div>
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-semibold">{titre}</span>
          <span className="flex items-center gap-1 text-muted-foreground">
            <CheckCircle2 className="h-3.5 w-3.5 text-success" /> {bonnes}
          </span>
        </div>
        <Progress value={(indice / questions.length) * 100} className="h-1.5" />
      </div>
      <CarteQuestion
        key={question.id}
        question={question}
        index={indice}
        total={questions.length}
        utilisateurId={utilisateurId}
        favori={favoris?.includes(question.id) ?? false}
        onBasculerFavori={() =>
          basculer.mutate({ questionId: question.id, actif: !!favoris?.includes(question.id) })
        }
        onSuivant={suivant}
      />
    </div>
  );
}
