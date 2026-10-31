/**
 * Alertes envoyées à ORANE dès qu'un rendez-vous est réservé (côté serveur : ne dépendent pas du navigateur du visiteur).
 * Canaux facultatifs, activés par variables d'environnement :
 *  - WhatsApp (API officielle Meta, « Cloud API ») : WHATSAPP_CLOUD_TOKEN, WHATSAPP_PHONE_NUMBER_ID, NOTIFY_WHATSAPP_TO
 *  - ntfy (notification push sur le téléphone)      : NTFY_TOPIC (+ NTFY_SERVER, NTFY_TOKEN)
 * Par respect de la vie privée, aucune coordonnée du client n'est envoyée : seulement la date, l'heure et le type de séance.
 * Les détails se trouvent dans Google Agenda.
 */

export type Alerte = { jour: string; heure: string; type: string; lien?: string };
export type ResultatCanal = { canal: string; ok: boolean; erreur?: string };

const URL_WHATSAPP = process.env.WHATSAPP_API_URL ?? "https://graph.facebook.com/v21.0";

const whatsappConfigure = () => Boolean(process.env.WHATSAPP_CLOUD_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID && process.env.NOTIFY_WHATSAPP_TO);
const ntfyConfigure = () => Boolean(process.env.NTFY_TOPIC);

/** Noms des canaux d'alerte configurés. */
export function canauxAlerte(): string[] {
  return [...(whatsappConfigure() ? ["WhatsApp"] : []), ...(ntfyConfigure() ? ["ntfy"] : [])];
}

async function envoyerWhatsapp(a: Alerte): Promise<ResultatCanal> {
  try {
    const reponse = await fetch(`${URL_WHATSAPP}/${encodeURIComponent(process.env.WHATSAPP_PHONE_NUMBER_ID as string)}/messages`, {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.WHATSAPP_CLOUD_TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: (process.env.NOTIFY_WHATSAPP_TO as string).replace(/\D/g, ""),
        type: "template",
        template: {
          name: process.env.WHATSAPP_TEMPLATE_NAME || "nouveau_rdv",
          language: { code: process.env.WHATSAPP_TEMPLATE_LANG || "fr" },
          components: [
            {
              type: "body",
              parameters: [a.jour, a.heure, a.type].map((text) => ({ type: "text", text })),
            },
          ],
        },
      }),
      signal: AbortSignal.timeout(8000),
    });
    if (reponse.ok) return { canal: "WhatsApp", ok: true };
    const data = (await reponse.json().catch(() => null)) as { error?: { message?: string } } | null;
    return { canal: "WhatsApp", ok: false, erreur: data?.error?.message ?? `HTTP ${reponse.status}` };
  } catch (erreur) {
    return { canal: "WhatsApp", ok: false, erreur: erreur instanceof Error ? erreur.message : "Erreur réseau" };
  }
}

async function envoyerNtfy(a: Alerte): Promise<ResultatCanal> {
  try {
    const serveur = (process.env.NTFY_SERVER || "https://ntfy.sh").replace(/\/$/, "");
    const reponse = await fetch(serveur, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(process.env.NTFY_TOKEN ? { Authorization: `Bearer ${process.env.NTFY_TOKEN}` } : {}),
      },
      body: JSON.stringify({
        topic: process.env.NTFY_TOPIC,
        title: "Nouveau rendez-vous ORANE",
        message: `${a.jour} à ${a.heure} (${a.type})`,
        tags: ["calendar"],
        priority: 4,
        ...(a.lien ? { click: a.lien } : {}),
      }),
      signal: AbortSignal.timeout(8000),
    });
    return reponse.ok ? { canal: "ntfy", ok: true } : { canal: "ntfy", ok: false, erreur: `HTTP ${reponse.status}` };
  } catch (erreur) {
    return { canal: "ntfy", ok: false, erreur: erreur instanceof Error ? erreur.message : "Erreur réseau" };
  }
}

/** Envoie l'alerte sur tous les canaux configurés. Ne lève jamais d'exception : une alerte ratée n'annule pas un rendez-vous. */
export async function alerter(a: Alerte): Promise<ResultatCanal[]> {
  const envois: Promise<ResultatCanal>[] = [];
  if (whatsappConfigure()) envois.push(envoyerWhatsapp(a));
  if (ntfyConfigure()) envois.push(envoyerNtfy(a));
  const resultats = await Promise.all(envois);
  for (const r of resultats) if (!r.ok) console.error(`Alerte ${r.canal} échouée : ${r.erreur}`);
  return resultats;
}
