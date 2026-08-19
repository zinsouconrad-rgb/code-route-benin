import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { GraduationCap } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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

function PageAuth() {
  const navigate = useNavigate();
  const [enCours, setEnCours] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/tableau-de-bord" });
    });
  }, [navigate]);

  const connexion = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setEnCours(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: String(f.get("email")).trim(),
      password: String(f.get("motDePasse")),
    });
    setEnCours(false);
    if (error) {
      toast.error("Connexion impossible : identifiants incorrects.");
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
    const { error } = await supabase.auth.signUp({
      email: parse.data.email,
      password: parse.data.motDePasse,
      options: {
        emailRedirectTo: window.location.origin,
        data: { nom_complet: parse.data.nom_complet, telephone: parse.data.telephone },
      },
    });
    setEnCours(false);
    if (error) {
      toast.error(
        error.message.includes("already")
          ? "Un compte existe déjà avec cette adresse."
          : "Inscription impossible pour le moment.",
      );
      return;
    }
    toast.success("Compte créé. Bienvenue !");
    navigate({ to: "/tableau-de-bord" });
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
                    <Label htmlFor="c-mdp">Mot de passe</Label>
                    <Input
                      id="c-mdp"
                      name="motDePasse"
                      type="password"
                      required
                      autoComplete="current-password"
                    />
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
                    <Input
                      id="i-mdp"
                      name="motDePasse"
                      type="password"
                      required
                      minLength={6}
                      autoComplete="new-password"
                    />
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