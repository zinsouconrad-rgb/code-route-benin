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

      const depuis30 = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString();
      const { data: sessions30 } = await supabase
        .from("sessions_examen")
        .select("date, user_id, mode, reussi")
        .gte("date", depuis30)
        .order("date", { ascending: true });

      const depuis7 = Date.now() - 7 * 24 * 3600 * 1000;
      const actifs7 = new Set(
        (sessions30 ?? []).filter((s) => new Date(s.date).getTime() >= depuis7).map((s) => s.user_id),
      ).size;
      const examens = (sessions30 ?? []).filter((s) => s.mode === "examen_blanc");
      const tauxExamens =
        examens.length > 0
          ? Math.round((examens.filter((s) => s.reussi).length / examens.length) * 100)
          : 0;

      const parJour = new Map<string, number>();
      for (const s of sessions30 ?? []) {
        const jour = new Date(s.date).toISOString().slice(0, 10);
        parJour.set(jour, (parJour.get(jour) ?? 0) + 1);
      }
      const activite = [...parJour.entries()].map(([jour, sessions]) => ({
        jour: new Date(jour).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" }),
        sessions,
      }));

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
        actifs7,
        tauxExamens,
        activite,
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
    { label: "Élèves actifs (7 j)", valeur: data.actifs7 },
    { label: "Réussite examens blancs", valeur: `${data.tauxExamens}%` },
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

      {data.activite.length > 1 && (
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-base">Activité (30 derniers jours)</CardTitle>
          </CardHeader>
          <CardContent className="h-56 pl-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.activite} margin={{ top: 5, right: 12, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="jour" tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
                <YAxis width={30} tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
                <Tooltip
                  contentStyle={{
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  formatter={(v: number) => [v, "Sessions"]}
                />
                <Bar dataKey="sessions" fill="var(--primary)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

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
