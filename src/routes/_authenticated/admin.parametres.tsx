import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { formatFcfa, useTarifs } from "@/lib/parametres";

export const Route = createFileRoute("/_authenticated/admin/parametres")({
  head: () => ({
    meta: [
      { title: "Réglages et tarifs — Back-office LE MAGNIFICAT" },
      {
        name: "description",
        content:
          "Réglez l'examen blanc, les quotas gratuits, le branding de l'auto-école et les tarifs d'accès.",
      },
      { property: "og:title", content: "Réglages et tarifs — Back-office" },
      { property: "og:description", content: "Paramétrage de l'application et des offres." },
    ],
  }),
  component: Parametres,
});

function Parametres() {
  const queryClient = useQueryClient();
  const [valeurs, setValeurs] = useState<Record<string, string>>({});

  const { data: lignes, isLoading } = useQuery({
    queryKey: ["admin-parametres"],
    queryFn: async () => {
      const { data, error } = await supabase.from("parametres").select("*").order("cle");
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (lignes) setValeurs(Object.fromEntries(lignes.map((l) => [l.cle, l.valeur])));
  }, [lignes]);

  const enregistrer = useMutation({
    mutationFn: async () => {
      const maj = new Date().toISOString();
      for (const ligne of lignes ?? []) {
        const valeur = valeurs[ligne.cle] ?? ligne.valeur;
        if (valeur === ligne.valeur) continue;
        const { error } = await supabase
          .from("parametres")
          .update({ valeur, maj })
          .eq("cle", ligne.cle);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Réglages enregistrés.");
      queryClient.invalidateQueries({ queryKey: ["admin-parametres"] });
      queryClient.invalidateQueries({ queryKey: ["parametres"] });
    },
    onError: () => toast.error("Enregistrement impossible."),
  });

  return (
    <div className="space-y-4">
      <Card className="shadow-card">
        <CardContent className="space-y-3 p-4">
          <h2 className="text-sm font-semibold">Réglages de l'application</h2>
          {isLoading && <p className="text-sm text-muted-foreground">Chargement…</p>}
          {(lignes ?? []).map((l) => (
            <div key={l.cle} className="space-y-1.5">
              <Label htmlFor={l.cle}>{l.libelle || l.cle}</Label>
              <Input
                id={l.cle}
                value={valeurs[l.cle] ?? ""}
                onChange={(e) => setValeurs({ ...valeurs, [l.cle]: e.target.value })}
              />
            </div>
          ))}
          <Button onClick={() => enregistrer.mutate()} disabled={enregistrer.isPending}>
            Enregistrer les réglages
          </Button>
        </CardContent>
      </Card>

      <TarifsAdmin />
    </div>
  );
}

function TarifsAdmin() {
  const { data: tarifs } = useTarifs();
  const queryClient = useQueryClient();
  const [edition, setEdition] = useState<Record<string, { prix: string; duree: string }>>({});

  const majTarif = useMutation({
    mutationFn: async ({
      id,
      valeurs,
    }: {
      id: string;
      valeurs: { prix_fcfa?: number; duree_jours?: number; actif?: boolean };
    }) => {
      const { error } = await supabase.from("tarifs").update(valeurs).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Tarif mis à jour.");
      queryClient.invalidateQueries({ queryKey: ["tarifs"] });
    },
    onError: () => toast.error("Mise à jour impossible."),
  });

  return (
    <Card className="shadow-card">
      <CardContent className="space-y-4 p-4">
        <h2 className="text-sm font-semibold">Tarifs d'accès</h2>
        {(tarifs ?? []).map((t) => {
          const ed = edition[t.id] ?? {
            prix: String(t.prix_fcfa),
            duree: String(t.duree_jours),
          };
          return (
            <div key={t.id} className="space-y-2 rounded-lg border border-border p-3">
              <div className="flex items-center gap-2">
                <p className="flex-1 text-sm font-semibold">{t.libelle}</p>
                <Switch
                  checked={t.actif}
                  onCheckedChange={(actif) => majTarif.mutate({ id: t.id, valeurs: { actif } })}
                  aria-label="Tarif actif"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Actuellement : {formatFcfa(t.prix_fcfa)} pour {t.duree_jours} jours
              </p>
              <div className="flex gap-2">
                <Input
                  type="number"
                  value={ed.prix}
                  aria-label="Prix en FCFA"
                  onChange={(e) => setEdition({ ...edition, [t.id]: { ...ed, prix: e.target.value } })}
                />
                <Input
                  type="number"
                  value={ed.duree}
                  aria-label="Durée en jours"
                  onChange={(e) =>
                    setEdition({ ...edition, [t.id]: { ...ed, duree: e.target.value } })
                  }
                />
                <Button
                  variant="outline"
                  onClick={() =>
                    majTarif.mutate({
                      id: t.id,
                      valeurs: {
                        prix_fcfa: Number(ed.prix) || 0,
                        duree_jours: Number(ed.duree) || 30,
                      },
                    })
                  }
                >
                  Ok
                </Button>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
