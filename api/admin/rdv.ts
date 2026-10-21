import "../_lib/config.js";
import { json } from "../_lib/http.js";
import { exigerAdmin } from "../_lib/auth.js";
import { modeStockage } from "../_lib/store.js";
import { agendaConfigure, evenementDuCreneau, supprimerEvenement } from "../_lib/google.js";
import { envoyerEmail } from "../_lib/email.js";
import { emailAnnulation } from "../_lib/emails-rdv.js";
import { libererVerrou, lireCreneau } from "../_lib/rdv-store.js";

/** Annule un rendez-vous (?id=<id du créneau>) : supprime l'événement Google Agenda et rouvre le créneau. */
export async function DELETE(request: Request) {
  const refus = exigerAdmin(request, true);
  if (refus) return refus;
  if (modeStockage() === "aucune" || !agendaConfigure()) return json({ erreur: "Base de données ou Google Agenda non configurés." }, { status: 503 });

  const id = new URL(request.url).searchParams.get("id") ?? "";
  if (!id || id.length > 64) return json({ erreur: "Créneau inconnu." }, { status: 400 });

  try {
    const evenement = await evenementDuCreneau(id);
    if (!evenement) return json({ erreur: "Aucun rendez-vous sur ce créneau." }, { status: 404 });

    await supprimerEvenement(evenement.id);
    await libererVerrou(id);

    // Prévenir la personne par e-mail n'est possible que si un service d'envoi (Resend) est configuré.
    const creneau = await lireCreneau(id);
    const emailEnvoye =
      creneau && evenement.client?.email ? await envoyerEmail({ ...emailAnnulation(creneau, evenement.client), a: evenement.client.email }) : false;
    return json({ ok: true, agendaSupprime: true, emailEnvoye });
  } catch (erreur) {
    console.error("Annulation impossible", erreur);
    return json({ erreur: "L'annulation a échoué (Google Agenda injoignable ?). Réessayez dans un instant." }, { status: 502 });
  }
}
