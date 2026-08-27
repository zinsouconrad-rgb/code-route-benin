import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Eye, EyeOff, KeyRound } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Nouveau mot de passe — LE MAGNIFICAT" },
      { name: "description", content: "Choisissez un nouveau mot de passe pour votre compte." },
    ],
  }),
  component: PageReinitialisation,
});

function PageReinitialisation() {
  const navigate = useNavigate();
  const [pret, setPret] = useState(false);
  const [lienInvalide, setLienInvalide] = useState(false);
  const [mdp, setMdp] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [visible, setVisible] = useState(false);
  const [enCours, setEnCours] = useState(false);

  useEffect(() => {
    // Supabase place type=recovery dans le hash et crée une session de récupération
    const hash = window.location.hash;
    if (!hash.includes("type=recovery")) {
      setLienInvalide(true);
      return;
    }
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setPret(true);
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setPret(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const valider = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mdp.length < 6) {
      toast.error("6 caractères minimum.");
      return;
    }
    if (mdp !== confirmation) {
      toast.error("Les deux mots de passe ne correspondent pas.");
      return;
    }
    setEnCours(true);
    const { error } = await supabase.auth.updateUser({ password: mdp });
    setEnCours(false);
    if (error) {
      toast.error("Mise à jour impossible. Le lien a peut-être expiré : recommencez.");
      return;
    }
    toast.success("Mot de passe mis à jour !");
    navigate({ to: "/tableau-de-bord" });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <Card className="w-full max-w-md shadow-card">
        <CardHeader className="text-center">
          <span className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-brand text-primary-foreground">
            <KeyRound className="h-6 w-6" />
          </span>
          <CardTitle>Nouveau mot de passe</CardTitle>
          <CardDescription>
            {lienInvalide
              ? "Ce lien est invalide ou a expiré."
              : "Choisissez un nouveau mot de passe pour votre compte."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {lienInvalide ? (
            <div className="space-y-3 text-center">
              <p className="text-sm text-muted-foreground">
                Demandez un nouveau lien depuis la page de connexion (« Mot de passe oublié »).
              </p>
              <Button asChild className="w-full">
                <Link to="/auth">Retour à la connexion</Link>
              </Button>
            </div>
          ) : !pret ? (
            <p className="text-center text-sm text-muted-foreground">Vérification du lien…</p>
          ) : (
            <form onSubmit={valider} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="mdp">Nouveau mot de passe</Label>
                <div className="relative">
                  <Input
                    id="mdp"
                    type={visible ? "text" : "password"}
                    required
                    minLength={6}
                    value={mdp}
                    onChange={(e) => setMdp(e.target.value)}
                    autoComplete="new-password"
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
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="mdp2">Confirmer le mot de passe</Label>
                <Input
                  id="mdp2"
                  type={visible ? "text" : "password"}
                  required
                  minLength={6}
                  value={confirmation}
                  onChange={(e) => setConfirmation(e.target.value)}
                  autoComplete="new-password"
                />
              </div>
              <Button type="submit" className="w-full" size="lg" disabled={enCours}>
                {enCours ? "Mise à jour…" : "Mettre à jour"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
