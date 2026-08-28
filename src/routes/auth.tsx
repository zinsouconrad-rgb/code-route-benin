import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Eye, EyeOff, GraduationCap, Mail } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Connexion — Code de la route LE MAGNIFICAT" },
      {
        name: "description",
        content:
          "Connectez-vous ou créez votre compte pour vous entraîner au Code de la route béninois avec l'auto-école LE MAGNIFICAT.",
      },
      { property: "og:title", content: "Connexion — Code de la route LE MAGNIFICAT" },
      {
        property: "og:description",
        content: "Accédez à votre entraînement au Code de la route béninois.",
      },
    ],
  }),
  component: PageAuth,
});

const schemaInscription = z.object({
  nom_complet: z.string().trim().min(2, "Nom trop court").max(100),
  telephone: z.string().trim().min(8, "Numéro invalide").max(20),
  email: z.string().trim().email("Adresse e-mail invalide").max(255),
  motDePasse: z.string().min(6, "6 caractères minimum").max(72),
});

/**
 * Traduit une erreur Supabase en message utile. Auparavant toute erreur
 * affichait « identifiants incorrects », ce qui masquait les causes les plus
 * fréquentes : réseau coupé (courant en 3G) et e-mail non confirmé.
 */
function messageErreurAuth(erreur: {
  message?: string | undefined;
  status?: number | undefined;
}): string {
  const m = (erreur.message ?? "").toLowerCase();
  const horsLigne = typeof navigator !== "undefined" && navigator.onLine === false;
  if (horsLigne || m.includes("failed to fetch") || m.includes("network") || m.includes("fetch")) {
    return "Pas de connexion Internet. Vérifiez votre réseau, puis réessayez.";
  }
  if (m.includes("not confirmed")) {
    return "Votre adresse e-mail n'est pas encore confirmée. Ouvrez le lien reçu par e-mail.";
  }
  if (erreur.status === 429 || m.includes("rate limit") || m.includes("too many")) {
    return "Trop de tentatives. Patientez quelques minutes avant de réessayer.";
  }
  if (m.includes("invalid login") || m.includes("invalid credentials")) {
    return "E-mail ou mot de passe incorrect.";
  }
  if (m.includes("already")) {
    return "Un compte existe déjà avec cette adresse.";
  }
  return "Opération impossible pour le moment. Réessayez.";
}

function ChampMotDePasse({
  id,
  autoComplete,
  minLength,
}: {
  id: string;
  autoComplete: string;
  minLength?: number;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <Input
        id={id}
        name="motDePasse"
        type={visible ? "text" : "password"}
        required
        minLength={minLength}
        autoComplete={autoComplete}
        className="pr-10"
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Masquer le mot de passe" : "Afficher le mot de passe"}
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground hover:text-foreground"
      >
        {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

function PageAuth() {
  const navigate = useNavigate();
  const [enCours, setEnCours] = useState(false);
  const [reinitOuverte, setReinitOuverte] = useState(false);
  const [emailReinit, setEmailReinit] = useState("");
  const [envoiReinit, setEnvoiReinit] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/tableau-de-bord" });
    });
  }, [navigate]);

  const connexion = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setEnCours(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email: String(f.get("email")).trim(),
      password: String(f.get("motDePasse")),
    });
    setEnCours(false);
    if (error) {
      toast.error(messageErreurAuth(error));
      return;
    }
    if (!data.session) {
      toast.error("Connexion incomplète. Réessayez.");
      return;
    }
    navigate({ to: "/tableau-de-bord" });
  };

  const inscription = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const parse = schemaInscription.safeParse({
      nom_complet: f.get("nom_complet"),
      telephone: f.get("telephone"),
      email: f.get("email"),
      motDePasse: f.get("motDePasse"),
    });
    if (!parse.success) {
      toast.error(parse.error.issues[0]?.message ?? "Formulaire invalide");
      return;
    }
    setEnCours(true);
    const { data, error } = await supabase.auth.signUp({
      email: parse.data.email,
      password: parse.data.motDePasse,
      options: {
        emailRedirectTo: `${window.location.origin}/tableau-de-bord`,
        data: { nom_complet: parse.data.nom_complet, telephone: parse.data.telephone },
      },
    });
    setEnCours(false);
    if (error) {
      toast.error(messageErreurAuth(error));
      return;
    }
    // Si la confirmation d'e-mail est activée dans Supabase, signUp ne renvoie
    // aucune session : rediriger vers l'espace candidat renverrait aussitôt
    // l'élève ici sans explication. On l'informe et on reste sur la page.
    if (!data.session) {
      toast.success(
        `Compte créé ! Un e-mail de confirmation a été envoyé à ${parse.data.email}. Ouvrez le lien reçu pour activer votre accès.`,
        { duration: 10000 },
      );
      return;
    }
    toast.success("Compte créé. Bienvenue !");
    navigate({ to: "/tableau-de-bord" });
  };

  const reinitialiser = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = emailReinit.trim();
    if (!z.string().email().safeParse(email).success) {
      toast.error("Adresse e-mail invalide");
      return;
    }
    setEnvoiReinit(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setEnvoiReinit(false);
    if (error) {
      toast.error("Envoi impossible pour le moment. Réessayez.");
      return;
    }
    toast.success("E-mail envoyé ! Cliquez sur le lien reçu pour choisir un nouveau mot de passe.");
    setReinitOuverte(false);
    setEmailReinit("");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <span className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-xl bg-brand text-primary-foreground">
            <GraduationCap className="h-7 w-7" />
          </span>
          <h1 className="text-2xl font-bold">LE MAGNIFICAT</h1>
          <p className="text-sm text-muted-foreground">Entraînement au Code de la route</p>
        </div>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Votre espace candidat</CardTitle>
            <CardDescription>Connectez-vous ou créez un compte gratuitement.</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="connexion">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="connexion">Connexion</TabsTrigger>
                <TabsTrigger value="inscription">Inscription</TabsTrigger>
              </TabsList>

              <TabsContent value="connexion">
                <form onSubmit={connexion} className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="c-email">Adresse e-mail</Label>
                    <Input id="c-email" name="email" type="email" required autoComplete="email" />
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="c-mdp">Mot de passe</Label>
                      <Dialog open={reinitOuverte} onOpenChange={setReinitOuverte}>
                        <DialogTrigger asChild>
                          <button
                            type="button"
                            className="text-xs font-medium text-primary hover:underline"
                          >
                            Mot de passe oublié ?
                          </button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                              <Mail className="h-5 w-5 text-primary" /> Réinitialiser le mot de
                              passe
                            </DialogTitle>
                            <DialogDescription>
                              Saisissez l'adresse e-mail de votre compte. Vous recevrez un lien pour
                              choisir un nouveau mot de passe.
                            </DialogDescription>
                          </DialogHeader>
                          <form onSubmit={reinitialiser} className="space-y-3">
                            <div className="space-y-1.5">
                              <Label htmlFor="reinit-email">Adresse e-mail</Label>
                              <Input
                                id="reinit-email"
                                type="email"
                                required
                                value={emailReinit}
                                onChange={(e) => setEmailReinit(e.target.value)}
                                placeholder="vous@exemple.com"
                                autoComplete="email"
                              />
                            </div>
                            <Button type="submit" className="w-full" disabled={envoiReinit}>
                              {envoiReinit ? "Envoi en cours…" : "Envoyer le lien"}
                            </Button>
                          </form>
                        </DialogContent>
                      </Dialog>
                    </div>
                    <ChampMotDePasse id="c-mdp" autoComplete="current-password" />
                  </div>
                  <Button type="submit" className="w-full" size="lg" disabled={enCours}>
                    Se connecter
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="inscription">
                <form onSubmit={inscription} className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="i-nom">Nom complet</Label>
                    <Input id="i-nom" name="nom_complet" required maxLength={100} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="i-tel">Téléphone</Label>
                    <Input id="i-tel" name="telephone" type="tel" required maxLength={20} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="i-email">Adresse e-mail</Label>
                    <Input id="i-email" name="email" type="email" required maxLength={255} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="i-mdp">Mot de passe</Label>
                    <ChampMotDePasse id="i-mdp" autoComplete="new-password" minLength={6} />
                  </div>
                  <Button type="submit" className="w-full" size="lg" disabled={enCours}>
                    Créer mon compte
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
