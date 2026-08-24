import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin/stats")({
  head: () => ({
    meta: [
      { title: "Statistiques — Back-office LE MAGNIFICAT" },
      {
        name: "description",
        content:
          "Suivez l'activité de l'auto-école : élèves inscrits, questions publiées et questions les plus ratées.",
      },
      { property: "og:title", content: "Statistiques — Back-office" },
      { property: "og:description", content: "Activité et qualité du contenu pédagogique." },
    ],
  }),
  component: Stats,
});

function Stats() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const compter = async (table: "profils" | "sessions_examen" | "signalements") => {
        const { count } = await supabase.from(table).select("id", { count: "exact", head: true });
        return count ?? 0;
      };
      const [eleves, sessions, signalements] = await Promise.all([
        compter("profils"),
        compter("sessions_examen"),
        compter("signalements"),
      ]);
      const { count: validees } = await supabase
        .from("questions")
        .select("id", { count: "exact", head: true })
        .eq("statut_validation", "valide");
      const { count: aValider } = await supabase
        .from("questions")
        .select("id", { count: "exact", head: true })
        .eq("statut_validation", "a_valider");

      const { data: reponses } = await supabase
        .from("reponses_utilisateur")
        .select("question_id, est_correcte, questions(enonce)")
        .order("date", { ascending: false })
        .limit(1000);

      const stats = new Map<string, { enonce: string; total: number; ratees: number }>();
      for (const r of reponses ?? []) {
        const enonce = (r.questions as { enonce: string } | null)?.enonce ?? "Question";
        const s = stats.get(r.question_id) ?? { enonce, total: 0, ratees: 0 };
        s.total += 1;
        if (!r.est_correcte) s.ratees += 1;
        stats.set(r.question_id, s);
      }
      const difficiles = [...stats.values()]
        .filter((s) => s.total >= 2 && s.ratees > 0)
        .sort((a, b) => b.ratees / b.total - a.ratees / a.total)
        .slice(0, 8);

      return {
        eleves,
        sessions,
        signalements,
        validees: validees ?? 0,
        aValider: aValider ?? 0,
        difficiles,
      };
    },
  });

  if (isLoading || !data) return <p className="text-sm text-muted-foreground">Chargement…</p>;

  const cartes = [
    { label: "Élèves inscrits", valeur: data.eleves },
    { label: "Sessions jouées", valeur: data.sessions },
    { label: "Questions publiées", valeur: data.validees },
    { label: "En attente de validation", valeur: data.aValider },
    { label: "Signalements", valeur: data.signalements },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {cartes.map((c) => (
          <Card key={c.label} className="shadow-card">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{c.label}</p>
              <p className="mt-1 text-2xl font-bold">{c.valeur}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="text-base">Questions les plus ratées</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {data.difficiles.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Pas encore assez de réponses d'élèves pour établir un classement.
            </p>
          ) : (
            data.difficiles.map((d) => (
              <div key={d.enonce} className="flex gap-3 text-sm">
                <span className="min-w-0 flex-1 truncate">{d.enonce}</span>
                <span className="shrink-0 font-semibold text-destructive">
                  {Math.round((d.ratees / d.total) * 100)}%
                </span>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
