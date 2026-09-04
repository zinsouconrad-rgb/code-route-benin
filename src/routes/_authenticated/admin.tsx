import { useState } from "react";
import { createFileRoute, Link, Outlet, useLocation } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useEstAdmin } from "@/hooks/useAuth";


export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Back-office — LE MAGNIFICAT" },
      {
        name: "description",
        content:
          "Espace d'administration de l'auto-école : saisie, validation et publication des questions.",
      },
      { property: "og:title", content: "Back-office — LE MAGNIFICAT" },
      { property: "og:description", content: "Administration du contenu pédagogique." },
    ],
  }),
  component: AdminLayout,
});

const onglets = [
  { to: "/admin/questions", label: "Questions" },
  { to: "/admin/validation", label: "Validation" },
  { to: "/admin/signalements", label: "Signalements" },
  { to: "/admin/categories", label: "Thèmes" },
  { to: "/admin/fiches", label: "Fiches" },
  { to: "/admin/import", label: "Import CSV" },
  { to: "/admin/eleves", label: "Élèves" },
  { to: "/admin/parametres", label: "Réglages" },
  { to: "/admin/stats", label: "Stats" },
] as const;

function AdminLayout() {
  const { data: estAdmin, isLoading } = useEstAdmin();
  const { pathname } = useLocation();
  const queryClient = useQueryClient();
  const [envoi, setEnvoi] = useState(false);

  const reclamer = async () => {
    setEnvoi(true);
    const { data, error } = await supabase.rpc("reclamer_admin_initial");
    setEnvoi(false);
    if (error || !data) {
      toast.error("Impossible : un administrateur existe déjà pour cette application.");
      return;
    }
    toast.success("Vous êtes maintenant administrateur.");
    queryClient.invalidateQueries({ queryKey: ["role-admin"] });
  };

  if (isLoading) return <p className="text-sm text-muted-foreground">Vérification des droits…</p>;

  if (!estAdmin) {
    return (
      <Card className="shadow-card">
        <CardContent className="space-y-3 p-5 text-center text-sm text-muted-foreground">
          <p>Cet espace est réservé aux administrateurs de l'auto-école.</p>
          <p className="text-xs">
            Première configuration : si aucun administrateur n'existe encore, réclamez le rôle avec
            ce compte.
          </p>
          <Button onClick={reclamer} disabled={envoi}>
            Devenir administrateur
          </Button>
        </CardContent>
      </Card>
    );
  }


  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Back-office</h1>
      <nav className="flex gap-2 overflow-x-auto">
        {onglets.map((o) => (
          <Link
            key={o.to}
            to={o.to}
            className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
              pathname.startsWith(o.to)
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground"
            }`}
          >
            {o.label}
          </Link>
        ))}
      </nav>
      <Outlet />
    </div>
  );
}
