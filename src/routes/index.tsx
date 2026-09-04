import { createFileRoute, Link } from "@tanstack/react-router";
import {
  BookMarked,
  BookOpen,
  Check,
  Flame,
  GraduationCap,
  Minus,
  ShieldCheck,
  Timer,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useBranding } from "@/lib/branding";
import { formatFcfa, useTarifs } from "@/lib/parametres";
import { BoutonWhatsApp } from "@/components/BoutonWhatsApp";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Code de la route Bénin — Auto-école LE MAGNIFICAT" },
      {
        name: "description",
        content:
          "Entraînez-vous au Code de la route béninois : séries par thème, examens blancs chronométrés, fiches sur les panneaux et suivi de progression.",
      },
      { property: "og:title", content: "Code de la route Bénin — LE MAGNIFICAT" },
      {
        property: "og:description",
        content:
          "Séries par thème, examens blancs et fiches pédagogiques préparées par les moniteurs de l'auto-école.",
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
    titre: "Examen blanc chronométré",
    texte: "Simulez les conditions réelles : nombre de questions, durée et seuil de réussite.",
  },
  {
    icone: Flame,
    titre: "Objectif quotidien et flamme",
    texte: "Quelques minutes par jour suffisent : gardez votre série de révisions.",
  },
  {
    icone: BookMarked,
    titre: "Fiches et panneaux",
    texte: "Des fiches illustrées rédigées par les moniteurs pour comprendre, pas seulement réviser.",
  },
  {
    icone: ShieldCheck,
    titre: "Contenu vérifié",
    texte: "Chaque question est saisie puis validée par l'auto-école — jamais générée automatiquement.",
  },
];

const gratuit = [
  { texte: "Quelques questions par thème", inclus: true },
  { texte: "Un examen blanc d'essai", inclus: true },
  { texte: "Suivi de progression de base", inclus: true },
  { texte: "Toutes les questions publiées", inclus: false },
  { texte: "Examens blancs illimités", inclus: false },
];

const premium = [
  { texte: "Toutes les questions publiées", inclus: true },
  { texte: "Examens blancs illimités", inclus: true },
  { texte: "Révision des erreurs et favoris", inclus: true },
  { texte: "Statistiques détaillées", inclus: true },
  { texte: "Fiches et panneaux", inclus: true },
];

const faq = [
  {
    q: "Les questions correspondent-elles à l'examen béninois ?",
    r: "Le contenu est saisi et validé par les moniteurs de l'auto-école. Les questions d'exemple fournies au démarrage sont clairement marquées comme non officielles.",
  },
  {
    q: "Puis-je réviser sans connexion ?",
    r: "Oui. Les questions déjà consultées sont conservées sur votre téléphone et vos résultats hors ligne sont synchronisés dès le retour du réseau.",
  },
  {
    q: "Je suis élève de l'auto-école, dois-je payer ?",
    r: "Non. Saisissez le code élève communiqué par l'auto-école dans « Mon accès » pour débloquer gratuitement l'accès complet.",
  },
  {
    q: "Comment payer si je ne suis pas élève ?",
    r: "Le paiement Mobile Money est en cours de mise en place. En attendant, contactez l'auto-école pour activer votre accès.",
  },
];

function Accueil() {
  const { nom, logo } = useBranding();
  const { data: tarifs } = useTarifs();
  const tarifActif = (tarifs ?? []).find((t) => t.actif);

  return (
    <main className="min-h-screen bg-background">
      <section className="bg-brand px-5 py-12 text-primary-foreground">
        <div className="mx-auto max-w-md space-y-4">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">
            {logo ? (
              <img src={logo} alt={nom} className="h-4 w-4 rounded object-contain" />
            ) : (
              <GraduationCap className="h-4 w-4" />
            )}
            Auto-école {nom}
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
              <Link to="/auth">Créer mon compte gratuitement</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="bg-transparent">
              <Link to="/tableau-de-bord">J'ai déjà un compte</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-md space-y-3 px-5 py-8">
        <h2 className="text-lg font-bold">Tout pour préparer l'examen</h2>
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
      </section>

      <section className="mx-auto max-w-md space-y-3 px-5 pb-8">
        <h2 className="text-lg font-bold">Deux formules</h2>
        <div className="grid gap-3">
          <Offre titre="Découverte" prix="Gratuit" lignes={gratuit} />
          <Offre
            titre="Accès complet"
            prix={tarifActif ? formatFcfa(tarifActif.prix_fcfa) : "Sur demande"}
            detail={
              tarifActif
                ? `pour ${tarifActif.duree_jours} jours — offert aux élèves de l'auto-école`
                : "offert aux élèves de l'auto-école"
            }
            lignes={premium}
            miseEnAvant
          />
        </div>
      </section>

      <section className="mx-auto max-w-md space-y-3 px-5 pb-12">
        <h2 className="text-lg font-bold">Questions fréquentes</h2>
        <Accordion type="single" collapsible className="rounded-xl border border-border bg-card px-4">
          {faq.map((f) => (
            <AccordionItem key={f.q} value={f.q}>
              <AccordionTrigger className="text-left text-sm">{f.q}</AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground">{f.r}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
        <p className="pt-2 text-center text-xs text-muted-foreground">
          Accès complet offert aux élèves inscrits chez {nom}.
        </p>
      </section>

      <BoutonWhatsApp />
    </main>
  );
}

function Offre({
  titre,
  prix,
  detail,
  lignes,
  miseEnAvant,
}: {
  titre: string;
  prix: string;
  detail?: string;
  lignes: { texte: string; inclus: boolean }[];
  miseEnAvant?: boolean;
}) {
  return (
    <Card className={miseEnAvant ? "border-primary shadow-card" : "shadow-card"}>
      <CardContent className="space-y-3 p-4">
        <div>
          <p className="font-semibold">{titre}</p>
          <p className="text-2xl font-bold text-primary">{prix}</p>
          {detail && <p className="text-xs text-muted-foreground">{detail}</p>}
        </div>
        <ul className="space-y-1.5 text-sm">
          {lignes.map((l) => (
            <li key={l.texte} className="flex items-start gap-2">
              {l.inclus ? (
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
              ) : (
                <Minus className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              )}
              <span className={l.inclus ? "" : "text-muted-foreground"}>{l.texte}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
