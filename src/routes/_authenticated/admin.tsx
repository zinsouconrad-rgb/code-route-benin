import { createFileRoute, Link, Outlet, useLocation } from "@tanstack/react-router";
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
  { to: "/admin/eleves", label: "Élèves" },
  { to: "/admin/parametres", label: "Réglages" },
  { to: "/admin/stats", label: "Stats" },
] as const;


function AdminLayout() {
  const { data: estAdmin, isLoading } = useEstAdmin();
  const { pathname } = useLocation();

  if (isLoading) return <p className="text-sm text-muted-foreground">Vérification des droits…</p>;

  if (!estAdmin) {
    return (
      <Card className="shadow-card">
        <CardContent className="p-5 text-center text-sm text-muted-foreground">
          Cet espace est réservé aux administrateurs de l'auto-école.
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