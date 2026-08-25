import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Download, FileUp } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/useAuth";
import { useCategories } from "@/lib/parametres";
import { MODELE_CSV, lignesEnObjets, parseCsv, type LigneImport } from "@/lib/csv";

export const Route = createFileRoute("/_authenticated/admin/import")({
  head: () => ({
    meta: [
      { title: "Import CSV — Back-office LE MAGNIFICAT" },
      {
        name: "description",
        content:
          "Importez en masse les questions du Code de la route béninois saisies par l'auto-école, au format CSV.",
      },
      { property: "og:title", content: "Import CSV des questions" },
      { property: "og:description", content: "Import en masse des questions du back-office." },
    ],
  }),
  component: ImportCsv,
});

const TYPES = ["choix_unique", "choix_multiple", "vrai_faux"] as const;
const DIFFICULTES = ["facile", "moyen", "difficile"] as const;
type TypeQuestion = (typeof TYPES)[number];
type Difficulte = (typeof DIFFICULTES)[number];

type LignePreparee = {
  numero: number;
  theme: string;
  enonce: string;
  type: TypeQuestion;
  difficulte: Difficulte;
  explication: string | null;
  source: string | null;
  reponses: { texte: string; est_correcte: boolean }[];
  erreurs: string[];
};

function preparer(lignes: LigneImport[]): LignePreparee[] {
  return lignes.map((l, i) => {
    const erreurs: string[] = [];
    const theme = l["theme"] ?? l["categorie"] ?? "";
    const enonce = l["enonce"] ?? l["question"] ?? "";
    const type = (l["type"] || "choix_unique") as TypeQuestion;
    const difficulte = (l["difficulte"] || "moyen") as Difficulte;

    const textes: string[] = [];
    for (let n = 1; n <= 6; n++) {
      const t = l[`reponse_${n}`] ?? "";
      if (t) textes.push(t);
    }
    const indices = (l["correctes"] ?? l["correcte"] ?? "")
      .split(/[,\s|]+/)
      .filter(Boolean)
      .map((v) => Number(v));

    if (!theme) erreurs.push("Thème manquant");
    if (enonce.length < 10) erreurs.push("Énoncé trop court");
    if (!TYPES.includes(type)) erreurs.push(`Type inconnu « ${type} »`);
    if (!DIFFICULTES.includes(difficulte)) erreurs.push(`Difficulté inconnue « ${difficulte} »`);
    if (textes.length < 2) erreurs.push("Au moins 2 réponses requises");
    if (indices.length === 0) erreurs.push("Colonne « correctes » vide");
    if (indices.some((n) => !Number.isInteger(n) || n < 1 || n > textes.length))
      erreurs.push("Index de réponse correcte hors limites");
    if (type !== "choix_multiple" && indices.length > 1)
      erreurs.push("Une seule réponse correcte pour ce type");

    return {
      numero: i + 2,
      theme,
      enonce,
      type,
      difficulte,
      explication: l["explication"] || null,
      source: l["source"] || null,
      reponses: textes.map((texte, idx) => ({ texte, est_correcte: indices.includes(idx + 1) })),
      erreurs,
    };
  });
}

function ImportCsv() {
  const { utilisateur } = useSession();
  const queryClient = useQueryClient();
  const { data: categories } = useCategories();
  const [texte, setTexte] = useState("");
  const [creerThemes, setCreerThemes] = useState(true);
  const [publierDirect, setPublierDirect] = useState(false);

  const preparees = useMemo(() => {
    if (!texte.trim()) return [];
    return preparer(lignesEnObjets(parseCsv(texte)));
  }, [texte]);

  const themesConnus = useMemo(
    () => new Map((categories ?? []).map((c) => [c.nom.trim().toLowerCase(), c.id])),
    [categories],
  );
  const themesManquants = useMemo(
    () =>
      Array.from(
        new Set(
          preparees
            .filter((p) => p.theme && !themesConnus.has(p.theme.trim().toLowerCase()))
            .map((p) => p.theme.trim()),
        ),
      ),
    [preparees, themesConnus],
  );

  const valides = preparees.filter(
    (p) => p.erreurs.length === 0 && (creerThemes || themesConnus.has(p.theme.trim().toLowerCase())),
  );
  const invalides = preparees.filter((p) => p.erreurs.length > 0);

  const importer = useMutation({
    mutationFn: async () => {
      const map = new Map(themesConnus);
      if (creerThemes && themesManquants.length > 0) {
        const { data, error } = await supabase
          .from("categories")
          .insert(themesManquants.map((nom) => ({ nom })))
          .select("id, nom");
        if (error) throw error;
        (data ?? []).forEach((c) => map.set(c.nom.trim().toLowerCase(), c.id));
      }

      let importees = 0;
      for (const p of valides) {
        const categorie_id = map.get(p.theme.trim().toLowerCase());
        if (!categorie_id) continue;
        const { data: question, error } = await supabase
          .from("questions")
          .insert({
            categorie_id,
            enonce: p.enonce,
            type: p.type,
            difficulte: p.difficulte,
            explication: p.explication,
            source: p.source,
            statut_validation: publierDirect ? "valide" : "a_valider",
            cree_par: utilisateur?.id ?? null,
            ...(publierDirect
              ? { valide_par: utilisateur?.id ?? null, date_validation: new Date().toISOString() }
              : {}),
          })
          .select("id")
          .single();
        if (error) throw error;
        const { error: err2 } = await supabase.from("reponses").insert(
          p.reponses.map((r, idx) => ({
            question_id: question.id,
            texte: r.texte,
            est_correcte: r.est_correcte,
            ordre: idx,
          })),
        );
        if (err2) throw err2;
        importees++;
      }
      return importees;
    },
    onSuccess: (n) => {
      toast.success(`${n} question(s) importée(s).`);
      setTexte("");
      queryClient.invalidateQueries({ queryKey: ["admin-questions"] });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["questions-a-valider"] });
    },
    onError: (e: unknown) =>
      toast.error(e instanceof Error ? e.message : "Import impossible."),
  });

  const chargerFichier = async (fichier: File | undefined) => {
    if (!fichier) return;
    setTexte(await fichier.text());
  };

  const telechargerModele = () => {
    const url = URL.createObjectURL(new Blob([MODELE_CSV], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "modele-questions.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="text-base">Import CSV des questions</CardTitle>
          <CardDescription>
            Colonnes attendues : theme, enonce, type, difficulte, explication, source, reponse_1 à
            reponse_6, correctes (numéros séparés par des virgules). Séparateur « ; » ou « , ».
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={telechargerModele}>
              <Download className="mr-1.5 h-4 w-4" /> Modèle CSV
            </Button>
            <Button variant="outline" size="sm" asChild>
              <label className="cursor-pointer">
                <FileUp className="mr-1.5 h-4 w-4" /> Choisir un fichier
                <input
                  type="file"
                  accept=".csv,text/csv"
                  className="sr-only"
                  onChange={(e) => chargerFichier(e.target.files?.[0])}
                />
              </label>
            </Button>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="csv">Ou collez le contenu CSV</Label>
            <Textarea
              id="csv"
              rows={8}
              value={texte}
              onChange={(e) => setTexte(e.target.value)}
              placeholder={MODELE_CSV}
              className="font-mono text-xs"
            />
          </div>
          <div className="flex items-center justify-between text-sm">
            <span>Créer automatiquement les thèmes inconnus</span>
            <Switch
              checked={creerThemes}
              aria-label="Créer les thèmes inconnus"
              onCheckedChange={setCreerThemes}
            />
          </div>
          <div className="flex items-center justify-between text-sm">
            <span>Publier directement (sinon « à valider »)</span>
            <Switch
              checked={publierDirect}
              aria-label="Publier directement"
              onCheckedChange={setPublierDirect}
            />
          </div>
        </CardContent>
      </Card>

      {preparees.length > 0 && (
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-base">Aperçu</CardTitle>
            <CardDescription>
              {valides.length} ligne(s) importable(s), {invalides.length} en erreur.
              {themesManquants.length > 0 &&
                ` Thèmes inconnus : ${themesManquants.join(", ")}.`}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {invalides.slice(0, 20).map((p) => (
              <div
                key={p.numero}
                className="flex gap-2 rounded-lg border border-destructive/40 p-2 text-xs"
              >
                <AlertTriangle className="h-4 w-4 shrink-0 text-destructive" />
                <span>
                  Ligne {p.numero} : {p.erreurs.join(" · ")}
                </span>
              </div>
            ))}
            {valides.slice(0, 10).map((p) => (
              <div key={p.numero} className="rounded-lg border border-border p-2 text-xs">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{p.theme}</Badge>
                  <span className="truncate">{p.enonce}</span>
                </div>
              </div>
            ))}
            {valides.length > 10 && (
              <p className="text-xs text-muted-foreground">
                … et {valides.length - 10} autre(s) ligne(s).
              </p>
            )}
            <Button
              onClick={() => importer.mutate()}
              disabled={valides.length === 0 || importer.isPending}
            >
              {importer.isPending ? "Import en cours…" : `Importer ${valides.length} question(s)`}
            </Button>
            <p className="text-xs text-muted-foreground">
              Le contenu importé provient exclusivement de vos fichiers : aucune question n'est
              générée automatiquement.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
