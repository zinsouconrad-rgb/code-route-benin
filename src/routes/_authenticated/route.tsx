import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { EnTete } from "@/components/EnTete";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    // getSession() lit la session en local : instantané, et fonctionne hors
    // ligne. getUser() faisait un aller-retour réseau à chaque navigation —
    // lent en 3G, et hors ligne il échouait, ce qui renvoyait vers /auth qui
    // renvoyait ici : boucle de redirection infinie.
    // La vraie protection des données reste les politiques RLS côté Supabase.
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw redirect({ to: "/auth" });
    return { user: data.session.user };
  },
  component: () => (
    <div className="min-h-screen bg-background">
      <EnTete />
      <main className="mx-auto max-w-4xl px-4 py-5 pb-16">
        <Outlet />
      </main>
    </div>
  ),
});
