import { Link, useNavigate } from "@tanstack/react-router";
import { BookMarked, CloudOff, GraduationCap, LogOut, RefreshCw, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useEstAdmin } from "@/hooks/useAuth";
import { useBranding } from "@/lib/branding";
import { useSynchronisation } from "@/lib/hors-ligne";

export function EnTete() {
  const { data: estAdmin } = useEstAdmin();
  const { nom, logo } = useBranding();
  const { enLigne, enAttente } = useSynchronisation();
  const navigate = useNavigate();



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
          {!enLigne && (
            <span className="flex items-center gap-1 rounded-full border border-warning/40 bg-warning/10 px-2 py-1 text-[11px] font-medium text-warning">
              <CloudOff className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Hors ligne</span>
            </span>
          )}
          {enLigne && enAttente > 0 && (
            <span className="flex items-center gap-1 rounded-full border border-border bg-secondary px-2 py-1 text-[11px] font-medium text-muted-foreground">
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              {enAttente}
            </span>
          )}

          <Button asChild variant="ghost" size="sm">
            <Link to="/fiches">
              <BookMarked className="h-4 w-4" />
              <span className="hidden sm:inline">Fiches</span>
            </Link>
          </Button>
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
