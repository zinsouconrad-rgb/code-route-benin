import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useParametres } from "@/lib/parametres";

/**
 * Branding configurable de l'auto-école (nom, logo, WhatsApp), stocké dans la
 * table `parametres`. Le logo vit dans le bucket privé `branding` : on résout
 * une URL signée, sauf si l'admin a saisi une URL absolue.
 */
export function useBranding() {
  const { data: parametres } = useParametres();
  const nom = parametres?.["nom_etablissement"]?.trim() || "LE MAGNIFICAT";
  const whatsapp = (parametres?.["whatsapp_numero"] ?? "").replace(/[^0-9]/g, "");
  const chemin = parametres?.["logo_url"]?.trim() || "";
  const [logo, setLogo] = useState<string | null>(null);

  useEffect(() => {
    let actif = true;
    if (!chemin) {
      setLogo(null);
      return;
    }
    if (/^https?:\/\//.test(chemin)) {
      setLogo(chemin);
      return;
    }
    supabase.storage
      .from("branding")
      .createSignedUrl(chemin, 60 * 60 * 24)
      .then(({ data }) => {
        if (actif) setLogo(data?.signedUrl ?? null);
      });
    return () => {
      actif = false;
    };
  }, [chemin]);

  return { nom, logo, whatsapp };
}
