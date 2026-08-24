import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Affiche une image stockée dans le bucket privé "questions".
 * image_url peut être un chemin de stockage ou une URL absolue.
 */
export function ImageQuestion({ chemin, alt }: { chemin: string; alt: string }) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let actif = true;
    if (/^https?:\/\//.test(chemin)) {
      setUrl(chemin);
      return;
    }
    supabase.storage
      .from("questions")
      .createSignedUrl(chemin, 3600)
      .then(({ data }) => {
        if (actif) setUrl(data?.signedUrl ?? null);
      });
    return () => {
      actif = false;
    };
  }, [chemin]);

  if (!url) return <div className="h-40 w-full animate-pulse rounded-lg bg-muted" />;

  return (
    <img
      src={url}
      alt={alt}
      loading="lazy"
      decoding="async"
      className="max-h-72 w-full rounded-lg border border-border object-contain bg-card"
    />
  );
}
