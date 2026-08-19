import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { EnTete } from "@/components/EnTete";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    return { user: data.user };
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