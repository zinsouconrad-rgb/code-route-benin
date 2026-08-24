import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { accesComplet, type Profil } from "@/hooks/useAuth";

export const Route = createFileRoute("/_authenticated/admin/eleves")({
  head: () => ({
    meta: [
      { title: "Élèves — Back-office LE MAGNIFICAT" },
      {
        name: "description",
        content:
          "Gérez les comptes des candidats : accès élève de l'auto-école et accès complet payant.",
      },
      { property: "og:title", content: "Élèves — Back-office" },
      { property: "og:description", content: "Gestion des accès des candidats." },
    ],
  }),
  component: Eleves,
});

function Eleves() {
  const queryClient = useQueryClient();
  const [recherche, setRecherche] = useState("");

  const { data: profils, isLoading } = useQuery({
    queryKey: ["admin-profils"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profils")
        .select("*")
        .order("date_inscription", { ascending: false });
      if (error) throw error;
      return data as Profil[];
    },
  });

  const majProfil = useMutation({
    mutationFn: async ({ id, valeurs }: { id: string; valeurs: Partial<Profil> }) => {
      const { error } = await supabase.from("profils").update(valeurs).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Accès mis à jour.");
      queryClient.invalidateQueries({ queryKey: ["admin-profils"] });
    },
    onError: () => toast.error("Mise à jour impossible."),
  });

  const filtres = (profils ?? []).filter((p) =>
    `${p.nom_complet} ${p.telephone ?? ""}`.toLowerCase().includes(recherche.toLowerCase()),
  );

  return (
    <div className="space-y-3">
      <Input
        placeholder="Rechercher un élève (nom ou téléphone)"
        value={recherche}
        onChange={(e) => setRecherche(e.target.value)}
      />
      {isLoading && <p className="text-sm text-muted-foreground">Chargement…</p>}
      {filtres.map((p) => {
        const complet = accesComplet(p);
        return (
          <Card key={p.id} className="shadow-card">
            <CardContent className="space-y-3 p-4">
              <div className="flex items-center gap-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">
                    {p.nom_complet || "Candidat sans nom"}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {p.telephone || "Téléphone non renseigné"}
                  </p>
                </div>
                <Badge variant={complet ? "default" : "secondary"}>
                  {complet ? "Accès complet" : "Découverte"}
                </Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Élève LE MAGNIFICAT</span>
                <Switch
                  checked={p.eleve_magnificat}
                  aria-label="Élève de l'auto-école"
                  onCheckedChange={(eleve_magnificat) =>
                    majProfil.mutate({
                      id: p.id,
                      valeurs: {
                        eleve_magnificat,
                        offre: eleve_magnificat ? "magnificat" : "aucune",
                      },
                    })
                  }
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    majProfil.mutate({
                      id: p.id,
                      valeurs: {
                        acces: "premium",
                        offre: "mensuel",
                        acces_debut: new Date().toISOString(),
                        acces_expiration: new Date(
                          Date.now() + 30 * 24 * 3600 * 1000,
                        ).toISOString(),
                      },
                    })
                  }
                >
                  Accorder 30 jours
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    majProfil.mutate({
                      id: p.id,
                      valeurs: {
                        acces: "gratuit",
                        offre: "aucune",
                        acces_debut: null,
                        acces_expiration: null,
                      },
                    })
                  }
                >
                  Révoquer l'accès payant
                </Button>
              </div>
              {p.acces_expiration && (
                <p className="text-xs text-muted-foreground">
                  Expire le {new Date(p.acces_expiration).toLocaleDateString("fr-FR")}
                </p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
