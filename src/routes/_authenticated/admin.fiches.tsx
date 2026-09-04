import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Pencil, Plus, Trash2, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ImageQuestion } from "@/components/ImageQuestion";
import { useToutesFiches, type Fiche } from "@/lib/fiches";
import { useCategories } from "@/lib/parametres";

export const Route = createFileRoute("/_authenticated/admin/fiches")({
  component: AdminFiches,
});

type Brouillon = {
  id?: string;
  titre: string;
  contenu: string;
  categorie_id: string;
  source: string;
  image_url: string | null;
  ordre_affichage: number;
  publiee: boolean;
};

const vide: Brouillon = {
  titre: "",
  contenu: "",
  categorie_id: "",
  source: "",
  image_url: null,
  ordre_affichage: 0,
  publiee: false,
};

function AdminFiches() {
  const { data: fiches } = useToutesFiches();
  const { data: categories } = useCategories();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<Brouillon | null>(null);
  const [envoiImage, setEnvoiImage] = useState(false);

  const rafraichir = () => queryClient.invalidateQueries({ queryKey: ["fiches"] });

  const enregistrer = useMutation({
    mutationFn: async (f: Brouillon) => {
      if (!f.titre.trim() || f.contenu.trim().length < 10) {
        throw new Error("Titre requis et contenu d'au moins 10 caractères.");
      }
      const ligne = {
        titre: f.titre.trim(),
        contenu: f.contenu.trim(),
        categorie_id: f.categorie_id || null,
        source: f.source.trim() || null,
        image_url: f.image_url,
        ordre_affichage: f.ordre_affichage,
        statut_validation: (f.publiee ? "valide" : "brouillon") as "valide" | "brouillon",
      };
      const { error } = f.id
        ? await supabase.from("fiches").update(ligne).eq("id", f.id)
        : await supabase.from("fiches").insert(ligne);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Fiche enregistrée.");
      setForm(null);
      rafraichir();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const supprimer = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("fiches").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Fiche supprimée.");
      rafraichir();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const televerser = async (fichier: File) => {
    if (!form) return;
    setEnvoiImage(true);
    const chemin = `fiches/${crypto.randomUUID()}-${fichier.name.replace(/[^\w.-]/g, "_")}`;
    const { error } = await supabase.storage.from("questions").upload(chemin, fichier);
    setEnvoiImage(false);
    if (error) {
      toast.error("Envoi de l'image impossible.");
      return;
    }
    setForm({ ...form, image_url: chemin });
  };

  const editer = (f: Fiche) =>
    setForm({
      id: f.id,
      titre: f.titre,
      contenu: f.contenu,
      categorie_id: f.categorie_id ?? "",
      source: f.source ?? "",
      image_url: f.image_url,
      ordre_affichage: f.ordre_affichage,
      publiee: f.statut_validation === "valide",
    });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          Fiches pédagogiques et panneaux affichés aux élèves. Le contenu est rédigé par
          l'auto-école.
        </p>
        <Button size="sm" onClick={() => setForm({ ...vide })}>
          <Plus className="h-4 w-4" /> Nouvelle fiche
        </Button>
      </div>

      {form && (
        <Card className="shadow-card">
          <CardContent className="space-y-3 p-4">
            <div className="space-y-1.5">
              <Label>Titre</Label>
              <Input
                value={form.titre}
                onChange={(e) => setForm({ ...form, titre: e.target.value })}
                placeholder="Ex. : Les panneaux d'interdiction"
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Thème</Label>
                <Select
                  value={form.categorie_id || "aucun"}
                  onValueChange={(v) => setForm({ ...form, categorie_id: v === "aucun" ? "" : v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Thème" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="aucun">Général</SelectItem>
                    {(categories ?? []).map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.nom}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Ordre d'affichage</Label>
                <Input
                  type="number"
                  value={form.ordre_affichage}
                  onChange={(e) =>
                    setForm({ ...form, ordre_affichage: Number(e.target.value) || 0 })
                  }
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Contenu</Label>
              <Textarea
                rows={7}
                value={form.contenu}
                onChange={(e) => setForm({ ...form, contenu: e.target.value })}
                placeholder="Texte de la fiche, rédigé par l'auto-école."
              />
            </div>
            <div className="space-y-1.5">
              <Label>Source (facultatif)</Label>
              <Input
                value={form.source}
                onChange={(e) => setForm({ ...form, source: e.target.value })}
                placeholder="Ex. : Code de la route du Bénin, art. 12"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Illustration (facultatif)</Label>
              <Input
                type="file"
                accept="image/*"
                disabled={envoiImage}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) televerser(f);
                }}
              />
              {form.image_url && <ImageQuestion chemin={form.image_url} alt={form.titre} />}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                onClick={() => enregistrer.mutate({ ...form, publiee: false })}
                variant="outline"
                disabled={enregistrer.isPending}
              >
                Enregistrer en brouillon
              </Button>
              <Button
                onClick={() => enregistrer.mutate({ ...form, publiee: true })}
                disabled={enregistrer.isPending}
              >
                <Upload className="h-4 w-4" /> Publier
              </Button>
              <Button variant="ghost" onClick={() => setForm(null)}>
                Annuler
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        {(fiches ?? []).map((f) => (
          <Card key={f.id} className="shadow-card">
            <CardContent className="flex items-center justify-between gap-3 p-4">
              <div className="min-w-0">
                <p className="truncate font-medium">{f.titre}</p>
                <p className="truncate text-xs text-muted-foreground">{f.contenu}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Badge variant={f.statut_validation === "valide" ? "default" : "secondary"}>
                  {f.statut_validation === "valide" ? "Publiée" : "Brouillon"}
                </Badge>
                <Button size="icon" variant="ghost" onClick={() => editer(f)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => supprimer.mutate(f.id)}
                  aria-label="Supprimer"
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {(fiches ?? []).length === 0 && (
          <p className="text-sm text-muted-foreground">Aucune fiche pour le moment.</p>
        )}
      </div>
    </div>
  );
}
