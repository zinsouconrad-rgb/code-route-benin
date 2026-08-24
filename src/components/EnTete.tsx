import { Link, useNavigate } from "@tanstack/react-router";
import { GraduationCap, LogOut, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useEstAdmin } from "@/hooks/useAuth";
import { useParametres } from "@/lib/parametres";

export function EnTete() {
  const { data: estAdmin } = useEstAdmin();
  const { data: parametres } = useParametres();
  const navigate = useNavigate();
  const nom = parametres?.["nom_etablissement"] || "LE MAGNIFICAT";
  const logo = parametres?.["logo_url"];

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-4xl items-center gap-3 px-4">
        <Link to="/tableau-de-bord" className="flex min-w-0 items-center gap-2">
          {logo ? (
            <img src={logo} alt={nom} className="h-8 w-8 rounded object-contain" />
          ) : (
            <span className="flex h-8 w-8 items-center justify-center rounded bg-brand text-primary-foreground">
              <GraduationCap className="h-5 w-5" />
            </span>
          )}
          <span className="truncate text-sm font-bold tracking-tight">{nom}</span>
        </Link>
        <div className="ml-auto flex items-center gap-1">
          {estAdmin && (
            <Button asChild variant="ghost" size="sm">
              <Link to="/admin">
                <Shield className="h-4 w-4" />
                <span className="hidden sm:inline">Admin</span>
              </Link>
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={async () => {
              await supabase.auth.signOut();
              navigate({ to: "/auth" });
            }}
            aria-label="Se déconnecter"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
