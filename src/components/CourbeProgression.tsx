import { useQuery } from "@tanstack/react-query";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

type Point = { jour: string; taux: number; questions: number };

/** Évolution du taux de réussite sur les 30 derniers jours. */
export function CourbeProgression({ userId }: { userId?: string | undefined }) {
  const { data, isLoading } = useQuery({
    queryKey: ["courbe-progression", userId],
    enabled: !!userId,
    queryFn: async (): Promise<Point[]> => {
      const depuis = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString();
      const { data, error } = await supabase
        .from("sessions_examen")
        .select("date, score, nombre_questions")
        .eq("user_id", userId!)
        .gte("date", depuis)
        .order("date", { ascending: true });
      if (error) throw error;

      const parJour = new Map<string, { bonnes: number; total: number }>();
      for (const s of data ?? []) {
        const jour = new Date(s.date).toISOString().slice(0, 10);
        const cumul = parJour.get(jour) ?? { bonnes: 0, total: 0 };
        cumul.bonnes += s.score;
        cumul.total += s.nombre_questions;
        parJour.set(jour, cumul);
      }
      return [...parJour.entries()].map(([jour, c]) => ({
        jour: new Date(jour).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" }),
        taux: c.total > 0 ? Math.round((c.bonnes / c.total) * 100) : 0,
        questions: c.total,
      }));
    },
    staleTime: 60 * 1000,
  });

  if (isLoading || !data || data.length < 2) return null;

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle className="text-base">Votre progression (30 derniers jours)</CardTitle>
      </CardHeader>
      <CardContent className="h-56 pl-0">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 12, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="jour" tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
            <YAxis
              domain={[0, 100]}
              width={34}
              tick={{ fontSize: 11 }}
              stroke="var(--muted-foreground)"
              unit="%"
            />
            <Tooltip
              contentStyle={{
                background: "var(--card)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                fontSize: 12,
              }}
              formatter={(v: number, nom) =>
                nom === "taux" ? [`${v}%`, "Taux de réussite"] : [v, "Questions"]
              }
            />
            <Line
              type="monotone"
              dataKey="taux"
              stroke="var(--primary)"
              strokeWidth={2}
              dot={{ r: 3 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
