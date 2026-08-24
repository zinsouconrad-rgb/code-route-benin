import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { formatFcfa, useTarifs } from "@/lib/parametres";

export const Route = createFileRoute("/_authenticated/admin/parametres")({
  head: () => ({
    meta: [
      { title: "Réglages et tarifs — Back-office LE MAGNIFICAT" },
      {
        name: "description",
        content:
          "Réglez l'examen blanc, les quotas gratuits, le branding de l'auto-école et les tarifs d'accès.",
      },
      { property: "og:title", content: "Réglages et tarifs — Back-office" },
      { property: "og:description", content: "Paramétrage de l'application et des offres." },
    ],
  }),
  component: Parametres;
});

function Parametres() {
  return null;
}
