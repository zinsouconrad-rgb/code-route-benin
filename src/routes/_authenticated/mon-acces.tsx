import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { CalendarClock, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { accesComplet, useProfil } from "@/hooks/useAuth";
import { formatFcfa, useTarifs } from "@/lib/parametres";

export const Route = createFileRoute("/_authenticated/mon-acces")({
  head: () => ({
    meta: [
      { title: "Mon accès — Code de la route LE MAGNIFICAT" },
      {
        name: "description",
        content:
          "Consultez votre formule d'accès, sa date d'expiration et les tarifs de l'accès complet.",
      },
      { property: "og:title", content: "Mon accès — LE MAGNIFICAT" },
      { property: "og:description", content: "Formule d'accès et tarifs de l'application." },
    ],
  }),
  component: MonAcces,
});

const libelleOffre: Record<string, string> = {
  aucune: "Découverte (gratuit)",
  pack_permis: "Pack Permis",
  mensuel: "Abonnement mensuel",
  magnificat: "Élève LE MAGNIFICAT",
};

function MonAcces() {
  const { data: profil } = useProfil();
  const { data: tarifs } = useTarifs();
  const queryClient = useQueryClient();
  const [code, setCode] = useState("");
  const [envoi, setEnvoi] = useState(false);
  const complet = accesComplet(profil);

  const activerCode = async () => {
    if (code.trim().length < 3) return;
    setEnvoi(true);
    const { data, error } = await supabase.rpc("activer_code_magnificat", { _code: code.trim() });
    setEnvoi(false);
    if (error || !data) {
      toast.error("Code d'inscription invalide.");
      return;
    }
    toast.success("Accès LE MAGNIFICAT activé. Bon entraînement !");
    setCode("");
    queryClient.invalidateQueries({ queryKey: ["profil"] });
  };

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Mon accès</h1>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ShieldCheck className="h-5 w-5 text-primary" />
            {libelleOffre[profil?.offre ?? "aucune"]}
          </CardTitle>
          <CardDescription>
            {complet ? "Accès complet actif" : "Accès limité aux quotas de la version Découverte"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <Badge variant={complet ? "default" : "secondary"}>
            {complet ? "Illimité" : "Découverte"}
          </Badge>
          {profil?.acces_expiration && (
            <p className="flex items-center gap-1.5 text-muted-foreground">
              <CalendarClock className="h-4 w-4" />
              Expire le {new Date(profil.acces_expiration).toLocaleDateString("fr-FR")}
            </p>
          )}
        </CardContent>
      </Card>

      {!profil?.eleve_magnificat && (
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-base">Vous êtes élève chez LE MAGNIFICAT ?</CardTitle>
            <CardDescription>
              Saisissez le code d'inscription fourni par l'auto-école pour activer l'accès complet
              offert.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 sm:flex-row">
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="code" className="sr-only">
                Code d'inscription
              </Label>
              <Input
                id="code"
                value={code}
                maxLength={40}
                placeholder="Code d'inscription"
                onChange={(e) => setCode(e.target.value)}
              />
            </div>
            <Button onClick={activerCode} disabled={envoi}>
              Activer
            </Button>
          </CardContent>
        </Card>
      )}

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="text-base">Formules d'accès complet</CardTitle>
          <CardDescription>Paiement mobile money disponible prochainement.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {(tarifs ?? [])
            .filter((t) => t.actif)
            .map((t) => (
              <div
                key={t.id}
                className="flex items-center justify-between rounded-lg border border-border p-3"
              >
                <div>
                  <p className="font-semibold">{t.libelle}</p>
                  <p className="text-xs text-muted-foreground">{t.duree_jours} jours d'accès</p>
                </div>
                <span className="font-bold text-primary">{formatFcfa(t.prix_fcfa)}</span>
              </div>
            ))}
          <p className="text-xs text-muted-foreground">
            En attendant l'activation du paiement en ligne, contactez l'auto-école : un
            administrateur peut activer votre accès manuellement.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}