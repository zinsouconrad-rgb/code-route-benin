import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useCategories } from "@/lib/parametres";

export const Route = createFileRoute("/_authenticated/admin/categories")({
  head: () => ({
    meta: [
      { title: "Thèmes — Back-office LE MAGNIFICAT" },
      {
        name: "description",
        content: "Créez et organisez les thèmes du Code de la route utilisés par l'entraînement.",
      },
      { property: "og:title", content: "Thèmes — Back-office" },
      { property: "og:description", content: "Gestion des thèmes de questions." },
    ],
  }),
  component: Categories,
});

type Brouillon = { id?: string; nom: string; description: string; ordre_affichage: number };
const VIDE: Brouillon = { nom: "", description: "", ordre_affichage: 0 };

function Categories() {
  const { data: categories, isLoading } = useCategories();
  const queryClient = useQueryClient();
  const [brouillon, setBrouillon] = useState<Brouillon>(VIDE);

  const rafraichir = () => queryClient.invalidateQueries({ queryKey: ["categories"] });

  const enregistrer = useMutation({
    mutationFn: async (b: Brouillon) => {
      const valeurs = {
        nom: b.nom.trim(),
        description: b.description.trim() || null,
        ordre_affichage: Number(b.ordre_affichage) || 0,
      };
      if (!valeurs.nom) throw new Error("nom");
      if (b.id) {
        const { error } = await supabase.from("categories").update(valeurs).eq("id", b.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("categories").insert(valeurs);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Thème enregistré.");
      setBrouillon(VIDE);
      void rafraichir();
    },
    onError: () => toast.error("Enregistrement impossible (nom manquant ou déjà utilisé)."),
  });

  const supprimer = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("categories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Thème supprimé.");
      void rafraichir();
    },
    onError: () => toast.error("Suppression impossible : des questions utilisent ce thème."),
  });

  return (
    <div className="space-y-4">
      <Card className="shadow-card">
        <CardContent className="space-y-3 p-4">
          <h2 className="text-sm font-semibold">
            {brouillon.id ? "Modifier le thème" : "Nouveau thème"}
          </h2>
          <div className="space-y-1.5">
            <Label htmlFor="nom">Nom</Label>
            <Input
              id="nom"
              value={brouillon.nom}
              onChange={(e) => setBrouillon({ ...brouillon, nom: e.target.value })}
              placeholder="Panneaux de signalisation"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="desc">Description</Label>
            <Textarea
              id="desc"
              value={brouillon.description}
              onChange={(e) => setBrouillon({ ...brouillon, description: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ordre">Ordre d'affichage</Label>
            <Input
              id="ordre"
              type="number"
              value={brouillon.ordre_affichage}
              onChange={(e) =>
                setBrouillon({ ...brouillon, ordre_affichage: Number(e.target.value) })
              }
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={() => enregistrer.mutate(brouillon)} disabled={enregistrer.isPending}>
              <Plus className="h-4 w-4" /> Enregistrer
            </Button>
            {brouillon.id && (
              <Button variant="outline" onClick={() => setBrouillon(VIDE)}>
                Annuler
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Chargement…</p>
      ) : (
        <div className="space-y-2">
          {(categories ?? []).map((c) => (
            <Card key={c.id} className="shadow-card">
              <CardContent className="flex items-center gap-3 p-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{c.nom}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {c.description || "Sans description"}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  aria-label="Modifier"
                  onClick={() =>
                    setBrouillon({
                      id: c.id,
                      nom: c.nom,
                      description: c.description ?? "",
                      ordre_affichage: c.ordre_affichage,
                    })
                  }
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  aria-label="Supprimer"
                  onClick={() => supprimer.mutate(c.id)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
