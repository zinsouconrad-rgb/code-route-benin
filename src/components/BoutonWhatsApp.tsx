import { MessageCircle } from "lucide-react";
import { useBranding } from "@/lib/branding";

/** Bouton flottant d'assistance WhatsApp (numéro réglable en back-office). */
export function BoutonWhatsApp() {
  const { nom, whatsapp } = useBranding();
  if (!whatsapp) return null;

  const message = encodeURIComponent(
    `Bonjour ${nom}, j'ai une question sur l'application d'entraînement au Code de la route.`,
  );

  return (
    <a
      href={`https://wa.me/${whatsapp}?text=${message}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Contacter l'auto-école sur WhatsApp"
      className="fixed bottom-4 right-4 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-success text-success-foreground shadow-lg transition-transform hover:scale-105"
    >
      <MessageCircle className="h-6 w-6" />
    </a>
  );
}
