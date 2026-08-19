import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useCategories } from "@/lib/parametres";
import { libelleStatut, libelleType, type Question } from "@/lib/questions";
import { useSession } from "@/hooks/useAuth";

export const Route = createFileRoute("/_authenticated/admin/questions")({
  component: AdminQuestions,
});

type Brouillon = {
  id?: string;
  categorie_id: string;
  enonce: string;
  type: "choix_unique" | "choix_multiple" | "vrai_faux";
  difficulte: "facile" | "moyen" | "difficile";
  explication: string;
  source: string;
  statut_validation: "brouillon" | "a_valider" | "valide";
  reponses: { id?: string; texte: string; est_correcte: boolean }[];
};

const vide = (): Brouillon => ({
  categorie_id: "",
  enonce: "",
  type: "choix_unique",
  difficulte: "moyen",
  explication: "",
  source: "",
  statut_validation: "brouillon",
  reponses: [
    { texte: "", est_correcte: true },
    { texte: "", est_correcte: false },
  ],
});

const schema = z.object({
  categorie_id: z.string().uuid({ message: "Choisissez un thème" }),
  enonce: z.string().trim().min(5, "Énoncé trop court").max(1000),
  explication: z.string().trim().max(2000),
  source: z.string().trim().max(200),
  reponses: z
    .array(z.object({ texte: z.string().trim().min(1, "Réponse vide"), est_correcte: z.boolean() }))
    .min(2, "Au moins deux réponses")
    .refine((r) => r.some((x) => x.est_correcte), "Indiquez au moins une bonne réponse"),
});

function AdminQuestions() {
  const queryClient = useQueryClient();
  const { data: categories } = useCategories();
  const { utilisateur } = useSession();
  const [filtre, setFiltre] = useState<string>("tous");
  const [ouvert, setOuvert] = useState(false);
  const [brouillon, setBrouillon] = useState<Brouillon>(vide());

  const { data: questions, isLoading } = useQuery({
    queryKey: ["admin-questions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("questions")
        .select("*, reponses(*)")
        .order("date_creation", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Question[];
    },
  });

  const liste = useMemo(
    () =>
      (questions ?? []).filter((q) => filtre === "tous" || q.statut_validation === filtre),
    [questions, filtre],
  );

  const enregistrer = useMutation({
    mutationFn: async (b: Brouillon) => {
      const parsed = schema.parse(b);
      const charge = {
        categorie_id: parsed.categorie_id,
        enonce: parsed.enonce,
        type: b.type,
        difficulte: b.difficulte,
        explication: parsed.explication || null,
        source: parsed.source || null,
        statut_validation: b.statut_validation,
        cree_par: utilisateur?.id ?? null,
      };
      let questionId = b.id;
      if (questionId) {
        const { error } = await supabase.from("questions").update(charge).eq("id", questionId);
        if (error) throw error;
        await supabase.from("reponses").delete().eq("question_id", questionId);
      } else {
        const { data, error } = await supabase
          .from("questions")
          .insert(charge)
          .select("id")
          .single();
        if (error) throw error;
        questionId = data.id;
      }
      const { error: err2 } = await supabase.from("reponses").insert(
        parsed.reponses.map((r, i) => ({
          question_id: questionId!,
          texte: r.texte,
          est_correcte: r.est_correcte,
          ordre: i,
        })),
      );
      if (err2) throw err2;
    },
    onSuccess: () => {
      toast.success("Question enregistrée");
      setOuvert(false);
      queryClient.invalidateQueries({ queryKey: ["admin-questions"] });
    },
    onError: (e: unknown) => {
      const msg = e instanceof z.ZodError ? e.issues[0]?.message : "Enregistrement impossible";
      toast.error(msg ?? "Erreur");
    },
  });

  const supprimer = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("questions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Question supprimée");
      queryClient.invalidateQueries({ queryKey: ["admin-questions"] });
    },
    onError: () => toast.error("Suppression impossible"),
  });

  const editer = (q: Question) => {
    setBrouillon({
      id: q.id,
      categorie_id: q.categorie_id ?? "",
      enonce: q.enonce,
      type: q.type,
      difficulte: q.difficulte,
      explication: q.explication ?? "",
      source: q.source ?? "",
      statut_validation: q.statut_validation,
      reponses: [...q.reponses]
        .sort((a, b) => a.ordre - b.ordre)
        .map((r) => ({ id: r.id, texte: r.texte, est_correcte: r.est_correcte })),
    });
    setOuvert(true);
  };

  const majReponse = (i: number, champs: Partial<Brouillon["reponses"][number]>) =>
    setBrouillon((b) => ({
      ...b,
      reponses: b.reponses.map((r, idx) => (idx === i ? { ...r, ...champs } : r)),
    }));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Select value={filtre} onValueChange={setFiltre}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="tous">Tous les statuts</SelectItem>
            <SelectItem value="brouillon">Brouillons</SelectItem>
            <SelectItem value="a_valider">À valider</SelectItem>
            <SelectItem value="valide">Validées</SelectItem>
          </SelectContent>
        </Select>
        <Button
          className="ml-auto"
          onClick={() => {
            setBrouillon(vide());
            setOuvert(true);
          }}
        >
          <Plus className="h-4 w-4" /> Nouvelle question
        </Button>
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Chargement…</p>}
      {!isLoading && liste.length === 0 && (
        <Card className="shadow-card">
          <CardContent className="p-5 text-center text-sm text-muted-foreground">
            Aucune question pour ce filtre.
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {liste.map((q) => (
          <Card key={q.id} className="shadow-card">
            <CardContent className="space-y-2 p-4">
              <p className="text-sm font-medium">{q.enonce}</p>
              <div className="flex flex-wrap gap-1.5">
                <Badge variant="outline">{libelleType[q.type]}</Badge>
                <Badge variant={q.statut_validation === "valide" ? "default" : "secondary"}>
                  {libelleStatut[q.statut_validation]}
                </Badge>
                <Badge variant="outline">{q.difficulte}</Badge>
              </div>
              <div className="flex gap-2 pt-1">
                <Button size="sm" variant="outline" onClick={() => editer(q)}>
                  <Pencil className="h-3.5 w-3.5" /> Modifier
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => supprimer.mutate(q.id)}
                  className="text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Supprimer
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={ouvert} onOpenChange={setOuvert}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{brouillon.id ? "Modifier la question" : "Nouvelle question"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Thème</Label>
              <Select
                value={brouillon.categorie_id}
                onValueChange={(v) => setBrouillon({ ...brouillon, categorie_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choisir un thème" />
                </SelectTrigger>
                <SelectContent>
                  {(categories ?? []).map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="enonce">Énoncé</Label>
              <Textarea
                id="enonce"
                value={brouillon.enonce}
                maxLength={1000}
                onChange={(e) => setBrouillon({ ...brouillon, enonce: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Type</Label>
                <Select
                  value={brouillon.type}
                  onValueChange={(v) => setBrouillon({ ...brouillon, type: v as Brouillon["type"] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="choix_unique">Choix unique</SelectItem>
                    <SelectItem value="choix_multiple">Choix multiple</SelectItem>
                    <SelectItem value="vrai_faux">Vrai / Faux</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Difficulté</Label>
                <Select
                  value={brouillon.difficulte}
                  onValueChange={(v) =>
                    setBrouillon({ ...brouillon, difficulte: v as Brouillon["difficulte"] })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="facile">Facile</SelectItem>
                    <SelectItem value="moyen">Moyen</SelectItem>
                    <SelectItem value="difficile">Difficile</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Réponses</Label>
              {brouillon.reponses.map((r, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Checkbox
                    checked={r.est_correcte}
                    onCheckedChange={(v) => majReponse(i, { est_correcte: v === true })}
                    aria-label="Bonne réponse"
                  />
                  <Input
                    value={r.texte}
                    maxLength={300}
                    placeholder={`Réponse ${i + 1}`}
                    onChange={(e) => majReponse(i, { texte: e.target.value })}
                  />
                  {brouillon.reponses.length > 2 && (
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() =>
                        setBrouillon({
                          ...brouillon,
                          reponses: brouillon.reponses.filter((_, idx) => idx !== i),
                        })
                      }
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  setBrouillon({
                    ...brouillon,
                    reponses: [...brouillon.reponses, { texte: "", est_correcte: false }],
                  })
                }
              >
                <Plus className="h-3.5 w-3.5" /> Ajouter une réponse
              </Button>
              <p className="text-xs text-muted-foreground">
                Cochez la ou les bonnes réponses.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="explication">Explication (affichée après correction)</Label>
              <Textarea
                id="explication"
                value={brouillon.explication}
                maxLength={2000}
                onChange={(e) => setBrouillon({ ...brouillon, explication: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="source">Source (référence officielle)</Label>
              <Input
                id="source"
                value={brouillon.source}
                maxLength={200}
                onChange={(e) => setBrouillon({ ...brouillon, source: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Statut</Label>
              <Select
                value={brouillon.statut_validation}
                onValueChange={(v) =>
                  setBrouillon({
                    ...brouillon,
                    statut_validation: v as Brouillon["statut_validation"],
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="brouillon">Brouillon</SelectItem>
                  <SelectItem value="a_valider">À valider</SelectItem>
                  <SelectItem value="valide">Validée (publiée)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              className="w-full"
              disabled={enregistrer.isPending}
              onClick={() => enregistrer.mutate(brouillon)}
            >
              Enregistrer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}