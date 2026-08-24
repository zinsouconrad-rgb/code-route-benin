import { Link } from "@tanstack/react-router";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatFcfa, useTarifs } from "@/lib/parametres";

export function InvitationPremium({ message }: { message?: string }) {
  const { data: tarifs } = useTarifs();

  return (
    <Card className="border-primary/30 shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Lock className="h-5 w-5 text-primary" />
          Limite de la version Découverte atteinte
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          {message ??
            "Vous avez terminé les questions offertes. Passez à l'accès complet pour continuer à vous entraîner sans limite."}
        </p>
        <div className="grid gap-3">
          {(tarifs ?? [])
            .filter((t) => t.actif)
            .map((t) => (
              <div
                key={t.id}
                className="flex items-center justify-between rounded-lg border border-border p-3"
              >
                <div>
                  <p className="font-semibold">{t.libelle}</p>
                  <p className="text-xs text-muted-foreground">
                    Accès complet pendant {t.duree_jours} jours
                  </p>
                </div>
                <span className="font-bold text-primary">{formatFcfa(t.prix_fcfa)}</span>
              </div>
            ))}
        </div>
        <p className="text-xs text-muted-foreground">
          Élève inscrit chez LE MAGNIFICAT ? Votre accès complet est offert : saisissez votre code
          d'inscription dans « Mon accès ».
        </p>
        <Button asChild className="w-full">
          <Link to="/mon-acces">Voir mon accès</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
