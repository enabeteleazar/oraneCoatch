/**
 * Envoi d'e-mails via Resend (API REST, aucune dépendance).
 * Variables : RESEND_API_KEY, EMAIL_FROM (adresse d'un domaine vérifié chez Resend), NOTIFY_EMAIL (facultatif).
 */

const URL_API = process.env.RESEND_API_URL ?? "https://api.resend.com/emails";

export const emailConfigure = () => Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);
export const adresseNotification = () => process.env.NOTIFY_EMAIL || null;

export type PieceJointe = { nom: string; contenu: string };
export type EmailEntree = { a: string; sujet: string; texte: string; html: string; repondreA?: string | null; pieceJointe?: PieceJointe };

/** Renvoie true si l'e-mail est parti, false sinon (jamais d'exception : un e-mail raté ne doit pas annuler un rendez-vous). */
export async function envoyerEmail(e: EmailEntree): Promise<boolean> {
  if (!emailConfigure()) {
    if (process.env.NODE_ENV !== "production" && !process.env.VERCEL) {
      console.log(`[e-mail non envoyé : Resend non configuré]\nÀ : ${e.a}\nObjet : ${e.sujet}\n${e.texte}\n`);
    }
    return false;
  }
  try {
    const reponse = await fetch(URL_API, {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM,
        to: [e.a],
        subject: e.sujet,
        text: e.texte,
        html: e.html,
        ...(e.repondreA ? { reply_to: e.repondreA } : {}),
        ...(e.pieceJointe ? { attachments: [{ filename: e.pieceJointe.nom, content: Buffer.from(e.pieceJointe.contenu).toString("base64") }] } : {}),
      }),
      signal: AbortSignal.timeout(8000),
    });
    if (!reponse.ok) console.error(`Resend HTTP ${reponse.status}`);
    return reponse.ok;
  } catch (erreur) {
    console.error("Envoi d'e-mail impossible", erreur);
    return false;
  }
}
