/** Contact : Formspree (formulaire et notifications) et WhatsApp, configurés par variables d'environnement Vite. */

const endpoint = (import.meta.env.VITE_FORMSPREE_ENDPOINT as string | undefined)?.trim();

export const formspreeConfigure = () => Boolean(endpoint && (/^https:\/\//.test(endpoint) || /^http:\/\/localhost(:\d+)?\//.test(endpoint)));

export type ResultatEnvoi = { ok: true } | { ok: false; erreur: string };

/** Envoie des champs à Formspree (réponse JSON, sans quitter la page). */
export async function envoyerFormspree(champs: Record<string, string>): Promise<ResultatEnvoi> {
  if (!endpoint || !formspreeConfigure()) return { ok: false, erreur: "L'envoi de messages n'est pas configuré." };
  try {
    const reponse = await fetch(endpoint, {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify(champs),
      signal: AbortSignal.timeout(10_000),
    });
    if (reponse.ok) return { ok: true };
    const data = (await reponse.json().catch(() => null)) as { errors?: { message?: string }[]; error?: string } | null;
    const detail = data?.errors?.map((e) => e.message).filter(Boolean).join(" ") || data?.error;
    return { ok: false, erreur: detail || "L'envoi a échoué. Réessayez dans un instant." };
  } catch {
    return { ok: false, erreur: "Connexion impossible. Vérifiez votre connexion et réessayez." };
  }
}

/** Lien WhatsApp (https://wa.me/…) construit avec VITE_WHATSAPP_PHONE (format international sans « + », ex. 33686544766). */
export function whatsappUrl(message = "Bonjour, je souhaite prendre contact avec ORANE."): string | null {
  const chiffres = ((import.meta.env.VITE_WHATSAPP_PHONE as string | undefined) ?? "").replace(/\D/g, "");
  if (chiffres.length < 9 || chiffres.length > 15) return null;
  return `https://wa.me/${chiffres}?text=${encodeURIComponent(message)}`;
}
