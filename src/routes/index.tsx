import { createFileRoute, Link } from "@tanstack/react-router";
import { BookOpen, GraduationCap, ShieldCheck, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Code de la route Bénin — Auto-école LE MAGNIFICAT" },
      {
        name: "description",
        content:
          "Entraînez-vous au Code de la route béninois avec l'auto-école LE MAGNIFICAT : séries par thème, corrections expliquées et suivi de progression.",
      },
      { property: "og:title", content: "Code de la route Bénin — LE MAGNIFICAT" },
      {
        property: "og:description",
        content: "Entraînement au Code de la route béninois par l'auto-école LE MAGNIFICAT.",
      },
    ],
  }),
  component: Accueil,
});

const atouts = [
  {
    icone: BookOpen,
    titre: "Entraînement par thème",
    texte: "Panneaux, priorités, conduite, sécurité : révisez thème par thème.",
  },
  {
    icone: Timer,
    titre: "Examen blanc",
    texte: "Simulez les conditions réelles de l'examen (bientôt disponible).",
  },
  {
    icone: ShieldCheck,
    titre: "Contenu vérifié",
    texte: "Chaque question est saisie puis validée par les moniteurs de l'auto-école.",
  },
];

function Accueil() {
  return (
    <main className="min-h-screen bg-background">
      <section className="bg-brand px-5 py-12 text-primary-foreground">
        <div className="mx-auto max-w-md space-y-4">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">
            <GraduationCap className="h-4 w-4" /> Auto-école LE MAGNIFICAT
          </span>
          <h1 className="text-3xl font-bold leading-tight">
            Réussissez le Code de la route béninois
          </h1>
          <p className="text-sm opacity-90">
            Entraînez-vous depuis votre téléphone, avec des questions préparées et validées par vos
            moniteurs.
          </p>
          <div className="flex flex-col gap-2 pt-2">
            <Button asChild variant="secondary" size="lg">
              <Link to="/auth">Créer mon compte</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="bg-transparent">
              <Link to="/tableau-de-bord">J'ai déjà un compte</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-md space-y-3 px-5 py-8">
        {atouts.map((a) => (
          <Card key={a.titre} className="shadow-card">
            <CardContent className="flex gap-3 p-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary">
                <a.icone className="h-5 w-5" />
              </span>
              <div>
                <p className="font-semibold">{a.titre}</p>
                <p className="text-sm text-muted-foreground">{a.texte}</p>
              </div>
            </CardContent>
          </Card>
        ))}
        <p className="pt-2 text-center text-xs text-muted-foreground">
          Accès complet offert aux élèves inscrits chez LE MAGNIFICAT.
        </p>
      </section>
    </main>
  );
}
