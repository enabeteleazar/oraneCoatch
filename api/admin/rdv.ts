import { json } from "../_lib/http.js";
import { exigerAdmin } from "../_lib/auth.js";
import { modeStockage } from "../_lib/store.js";
import { supprimerEvenement } from "../_lib/google.js";
import { envoyerEmail } from "../_lib/email.js";
import { emailAnnulation } from "../_lib/emails-rdv.js";
import { libererCreneau, lireCreneaux, lireReservations } from "../_lib/rdv-store.js";

/** Annule un rendez-vous (?id=<id du créneau>) : supprime l'événement Google Agenda, prévient la personne, rouvre le créneau. */
export async function DELETE(request: Request) {
  const refus = exigerAdmin(request, true);
  if (refus) return refus;
  if (modeStockage() === "aucun") return json({ erreur: "Aucun stockage configuré." }, { status: 503 });

  const id = new URL(request.url).searchParams.get("id") ?? "";
  if (!id || id.length > 64) return json({ erreur: "Créneau inconnu." }, { status: 400 });

  try {
    const creneau = (await lireCreneaux()).find((c) => c.id === id);
    const reservation = (await lireReservations([id])).get(id);
    if (!creneau || !reservation) return json({ erreur: "Aucun rendez-vous sur ce créneau." }, { status: 404 });

    let agendaSupprime = true;
    if (reservation.eventId) {
      try {
        await supprimerEvenement(reservation.eventId);
      } catch (erreur) {
        console.error("Suppression de l'événement Google Agenda impossible", erreur);
        agendaSupprime = false;
      }
    }

    await libererCreneau(id);
    const emailEnvoye = await envoyerEmail({ ...emailAnnulation(creneau, reservation), a: reservation.email });
    return json({ ok: true, agendaSupprime, emailEnvoye });
  } catch (erreur) {
    console.error("Annulation impossible", erreur);
    return json({ erreur: "L'annulation a échoué. Réessayez dans un instant." }, { status: 502 });
  }
}
