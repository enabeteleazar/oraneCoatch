import { DELAI_MIN_RESERVATION_HEURES, LIBELLE_TYPE, TELEPHONE_CONTACT, formaterHeure, formaterJourComplet, validerReservation, type Reservation } from "../shared/rdv.js";
import { json, lireJson } from "./_lib/http.js";
import { cleIp, origineValide } from "./_lib/auth.js";
import { agendaConfigure, creerEvenement, periodeOccupee } from "./_lib/google.js";
import { adresseNotification, envoyerEmail } from "./_lib/email.js";
import { emailConfirmation, emailNotification } from "./_lib/emails-rdv.js";
import { incrementer, lireCompteur, modeStockage } from "./_lib/store.js";
import { libererCreneau, lireCreneaux, lireReservations, mettreAJourReservation, reserverCreneau } from "./_lib/rdv-store.js";

const MAX_DEMANDES_PAR_HEURE = 8;
const delaiMs = () => DELAI_MIN_RESERVATION_HEURES * 3_600_000;
const APPELER = `appelez le ${TELEPHONE_CONTACT}`;

/** Public : créneaux libres et réservables en ligne. */
export async function GET() {
  try {
    if (modeStockage() === "aucun") return json({ creneaux: [], delaiMinHeures: DELAI_MIN_RESERVATION_HEURES });
    const limite = Date.now() + delaiMs();
    const futurs = (await lireCreneaux()).filter((c) => Date.parse(c.debut) > limite);
    const reservations = await lireReservations(futurs.map((c) => c.id));
    const libres = futurs.filter((c) => !reservations.has(c.id)).slice(0, 300);
    return json({ creneaux: libres, delaiMinHeures: DELAI_MIN_RESERVATION_HEURES });
  } catch (erreur) {
    console.error("Lecture des créneaux impossible", erreur);
    return json({ erreur: `Les créneaux sont momentanément indisponibles : ${APPELER}.` }, { status: 503 });
  }
}

/** Public : réservation d'un créneau. */
export async function POST(request: Request) {
  if (!origineValide(request)) return json({ erreur: "Origine non autorisée." }, { status: 403 });

  const validation = validerReservation(await lireJson(request, 3000));
  if (validation.ok === false) return json({ erreur: validation.erreur }, { status: 400 });
  const demande = validation.demande;

  // Champ piège : un robot le remplit, une personne ne le voit pas. Faux succès, rien n'est enregistré.
  if (demande.site) return json({ ok: true });

  if (modeStockage() === "aucun") return json({ erreur: `La réservation en ligne est indisponible : ${APPELER}.` }, { status: 503 });

  const cleLimite = cleIp(request, "rdv");
  try {
    if ((await lireCompteur(cleLimite)) >= MAX_DEMANDES_PAR_HEURE) {
      return json({ erreur: "Trop de demandes. Réessayez plus tard ou appelez-nous." }, { status: 429, headers: { "Retry-After": "3600" } });
    }
    await incrementer(cleLimite, 3600);
  } catch (erreur) {
    console.error("Compteur de demandes indisponible", erreur);
  }

  try {
    const creneau = (await lireCreneaux()).find((c) => c.id === demande.creneauId);
    if (!creneau) return json({ erreur: "Ce créneau n'existe plus. Choisissez-en un autre." }, { status: 404 });
    if (Date.parse(creneau.debut) <= Date.now() + delaiMs()) {
      return json({ erreur: `Ce créneau est trop proche pour être réservé en ligne : ${APPELER}.` }, { status: 409 });
    }

    // L'agenda peut contenir un événement ajouté depuis la création du créneau.
    if (agendaConfigure() && (await periodeOccupee(creneau.debut, creneau.fin))) {
      return json({ erreur: "Ce créneau n'est plus disponible. Choisissez-en un autre." }, { status: 409 });
    }

    const reservation: Reservation = {
      creneauId: creneau.id,
      nom: demande.nom,
      telephone: demande.telephone,
      email: demande.email,
      message: demande.message,
      creeLe: new Date().toISOString(),
    };

    // Réservation atomique : un seul visiteur peut obtenir le créneau.
    if (!(await reserverCreneau(creneau, reservation))) {
      return json({ erreur: "Ce créneau vient d'être réservé par quelqu'un d'autre. Choisissez-en un autre." }, { status: 409 });
    }

    // Google Agenda : si l'événement ne peut pas être créé, on annule tout (jamais de rendez-vous « fantôme »).
    if (agendaConfigure()) {
      try {
        reservation.eventId = await creerEvenement({
          titre: `ORANE : ${demande.nom} (${LIBELLE_TYPE[creneau.type]})`,
          description: [
            `Rendez-vous réservé sur le site.`,
            `Nom : ${demande.nom}`,
            `Téléphone : ${demande.telephone}`,
            `E-mail : ${demande.email}`,
            ...(demande.message ? [`Message : ${demande.message}`] : []),
          ].join("\n"),
          debutIso: creneau.debut,
          finIso: creneau.fin,
          lieu: process.env.RDV_LIEU || undefined,
          creneauId: creneau.id,
        });
        await mettreAJourReservation(creneau, reservation);
      } catch (erreur) {
        console.error("Création de l'événement Google Agenda impossible", erreur);
        await libererCreneau(creneau.id);
        return json({ erreur: `La réservation n'a pas pu être enregistrée : ${APPELER}.` }, { status: 502 });
      }
    }

    // E-mails : un échec n'annule pas le rendez-vous (il est déjà enregistré).
    const notification = adresseNotification();
    const [emailEnvoye] = await Promise.all([
      envoyerEmail({ ...emailConfirmation(creneau, reservation), a: reservation.email, repondreA: notification }),
      notification ? envoyerEmail({ ...emailNotification(creneau, reservation), a: notification, repondreA: reservation.email }) : Promise.resolve(false),
    ]);

    return json({
      ok: true,
      rdv: { debut: creneau.debut, fin: creneau.fin, type: creneau.type, jour: formaterJourComplet(creneau.debut), heure: formaterHeure(creneau.debut) },
      emailEnvoye,
    });
  } catch (erreur) {
    console.error("Réservation impossible", erreur);
    return json({ erreur: `La réservation a échoué : ${APPELER}.` }, { status: 502 });
  }
}

