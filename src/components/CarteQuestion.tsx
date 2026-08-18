import { useState } from "react";
import { AlertTriangle, Check, Flag, Star, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ImageQuestion } from "@/components/ImageQuestion";
import { supabase } from "@/integrations/supabase/client";
import { libelleType, reponseExacte, type Question } from "@/lib/questions";
import { cn } from "@/lib/utils";

type Props = {
  question: Question;
  index: number;
  total: number;
  /** false pendant un examen blanc : aucune correction affichée */
  correctionImmediate?: boolean;
  utilisateurId: string;
  favori?: boolean;
  onBasculerFavori?: () => void;
  onSuivant: (choix: string[], estCorrecte: boolean) => void;
};

export function CarteQuestion({
  question,
  index,
  total,
  correctionImmediate = true,
  utilisateurId,
  favori,
  onBasculerFavori,
  onSuivant,
}: Props) {
  const [choix, setChoix] = useState<string[]>([]);
  const [valide, setValide] = useState(false);
  const multiple = question.type === "choix_multiple";
  const correcte = reponseExacte(question, choix);

  const basculer = (id: string) => {
    if (valide) return;
    setChoix((c) => (multiple ? (c.includes(id) ? c.filter((x) => x !== id) : [...c, id]) : [id]));
  };

  const valider = () => {
    if (choix.length === 0) return;
    if (correctionImmediate) setValide(true);
    else onSuivant(choix, correcte);
  };

  return (
    <Card className="shadow-card">
      <CardContent className="space-y-4 p-4">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <Badge variant="secondary">
            Question {index + 1} / {total}
          </Badge>
          <Badge variant="outline">{libelleType[question.type]}</Badge>
          {multiple && (
            <span className="text-muted-foreground">Cochez toutes les bonnes réponses</span>
          )}
          <div className="ml-auto flex gap-1">
            {onBasculerFavori && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onBasculerFavori}
                aria-label="Ajouter aux favoris"
              >
                <Star className={cn("h-4 w-4", favori && "fill-warning text-warning")} />
              </Button>
            )}
            <DialogueSignalement questionId={question.id} utilisateurId={utilisateurId} />
          </div>
        </div>

        <h2 className="text-base leading-relaxed font-semibold">{question.enonce}</h2>
        {question.image_url && <ImageQuestion chemin={question.image_url} alt="Illustration" />}

        <div className="space-y-2">
          {question.reponses.map((r) => {
            const selectionne = choix.includes(r.id);
            const etat = valide
              ? r.est_correcte
                ? "bonne"
                : selectionne
                  ? "mauvaise"
                  : "neutre"
              : selectionne
                ? "selection"
                : "neutre";
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => basculer(r.id)}
                disabled={valide}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg border p-3 text-left text-sm transition-colors",
                  etat === "neutre" && "border-border bg-card hover:bg-secondary",
                  etat === "selection" && "border-primary bg-primary/10",
                  etat === "bonne" && "border-success bg-success/15",
                  etat === "mauvaise" && "border-destructive bg-destructive/15",
                )}
              >
                {multiple && !valide && <Checkbox checked={selectionne} className="shrink-0" />}
                <span className="flex-1">{r.texte}</span>
                {etat === "bonne" && <Check className="h-4 w-4 shrink-0 text-success" />}
                {etat === "mauvaise" && <X className="h-4 w-4 shrink-0 text-destructive" />}
              </button>
            );
          })}
        </div>

        {valide && (
          <div
            className={cn(
              "rounded-lg border p-3 text-sm",
              correcte ? "border-success bg-success/10" : "border-destructive bg-destructive/10",
            )}
          >
            <p className="font-semibold">{correcte ? "Bonne réponse !" : "Réponse incorrecte"}</p>
            {question.explication && (
              <p className="mt-1 text-muted-foreground">{question.explication}</p>
            )}
            {question.source && (
              <p className="mt-2 text-xs text-muted-foreground">Source : {question.source}</p>
            )}
          </div>
        )}

        {valide ? (
          <Button className="w-full" size="lg" onClick={() => onSuivant(choix, correcte)}>
            Continuer
          </Button>
        ) : (
          <Button className="w-full" size="lg" onClick={valider} disabled={choix.length === 0}>
            Valider ma réponse
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

function DialogueSignalement({
  questionId,
  utilisateurId,
}: {
  questionId: string;
  utilisateurId: string;
}) {
  const [ouvert, setOuvert] = useState(false);
  const [motif, setMotif] = useState("");
  const [envoi, setEnvoi] = useState(false);

  const envoyer = async () => {
    if (motif.trim().length < 5) {
      toast.error("Merci de préciser le problème (5 caractères minimum).");
      return;
    }
    setEnvoi(true);
    const { error } = await supabase.from("signalements").insert({
      question_id: questionId,
      user_id: utilisateurId,
      motif: motif.trim().slice(0, 500),
    });
    setEnvoi(false);
    if (error) {
      toast.error("Envoi impossible pour le moment.");
      return;
    }
    toast.success("Merci, votre signalement a été transmis à l'auto-école.");
    setMotif("");
    setOuvert(false);
  };

  return (
    <Dialog open={ouvert} onOpenChange={setOuvert}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" aria-label="Signaler une erreur">
          <Flag className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-warning" />
            Signaler une erreur
          </DialogTitle>
        </DialogHeader>
        <Textarea
          value={motif}
          maxLength={500}
          placeholder="Décrivez le problème (réponse incorrecte, image illisible, faute...)"
          onChange={(e) => setMotif(e.target.value)}
        />
        <DialogFooter>
          <Button onClick={envoyer} disabled={envoi}>
            Envoyer le signalement
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}