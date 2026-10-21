import { DELAI_MIN_RESERVATION_HEURES, LIBELLE_TYPE, TELEPHONE_CONTACT, formaterHeure, formaterJourComplet, validerReservation } from "../shared/rdv.js";
import "./_lib/config.js";
import { json, lireJson } from "./_lib/http.js";
import { cleIp, origineValide } from "./_lib/auth.js";
import { agendaConfigure, chevauche, creerEvenement, occupations } from "./_lib/google.js";
import { adresseNotification, envoyerEmail } from "./_lib/email.js";
import { emailConfirmation, emailNotification } from "./_lib/emails-rdv.js";
import { incrementer, lireCompteur, modeStockage } from "./_lib/store.js";
import { libererVerrou, lireCreneau, lireCreneauxEntre, prendreVerrou } from "./_lib/rdv-store.js";

const MAX_DEMANDES_PAR_HEURE = 8;
const HORIZON_JOURS = 60;
const delaiMs = () => DELAI_MIN_RESERVATION_HEURES * 3_600_000;
const APPELER = `appelez le ${TELEPHONE_CONTACT}`;

/** Public : créneaux libres. Un créneau est occupé dès qu'un événement Google Agenda chevauche son horaire. */
export async function GET() {
  const base = { delaiMinHeures: DELAI_MIN_RESERVATION_HEURES };
  if (modeStockage() === "aucune" || !agendaConfigure()) return json({ creneaux: [], reservationDisponible: false, ...base });

  try {
    const debut = new Date(Date.now() + delaiMs()).toISOString();
    const fin = new Date(Date.now() + HORIZON_JOURS * 86_400_000).toISOString();
    const creneaux = await lireCreneauxEntre(debut, fin, true);
    if (creneaux.length === 0) return json({ creneaux: [], reservationDisponible: true, ...base });

    const occupees = await occupations(creneaux[0].debut, creneaux[creneaux.length - 1].fin);
    const libres = creneaux.filter((c) => !occupees.some((o) => chevauche(o, c.debut, c.fin))).slice(0, 300);
    return json({ creneaux: libres, reservationDisponible: true, ...base });
  } catch (erreur) {
    console.error("Lecture des créneaux impossible", erreur);
    return json({ erreur: `Les créneaux sont momentanément indisponibles : ${APPELER}.` }, { status: 503 });
  }
}

/** Public : réservation d'un créneau (création d'un événement dans Google Agenda). */
export async function POST(request: Request) {
  if (!origineValide(request)) return json({ erreur: "Origine non autorisée." }, { status: 403 });

  const validation = validerReservation(await lireJson(request, 3000));
  if (validation.ok === false) return json({ erreur: validation.erreur }, { status: 400 });
  const demande = validation.demande;

  // Champ piège : un robot le remplit, une personne ne le voit pas. Faux succès, rien n'est enregistré.
  if (demande.site) return json({ ok: true });

  if (modeStockage() === "aucune" || !agendaConfigure()) {
    return json({ erreur: `La réservation en ligne est indisponible : ${APPELER}.` }, { status: 503 });
  }

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
    const creneau = await lireCreneau(demande.creneauId);
    if (!creneau) return json({ erreur: "Ce créneau n'existe plus. Choisissez-en un autre." }, { status: 404 });
    if (Date.parse(creneau.debut) <= Date.now() + delaiMs()) {
      return json({ erreur: `Ce créneau est trop proche pour être réservé en ligne : ${APPELER}.` }, { status: 409 });
    }

    // Verrou court : un seul visiteur à la fois peut réserver ce créneau.
    if (!(await prendreVerrou(creneau.id))) {
      return json({ erreur: "Ce créneau vient d'être réservé par quelqu'un d'autre. Choisissez-en un autre." }, { status: 409 });
    }

    const client = { nom: demande.nom, telephone: demande.telephone, email: demande.email, message: demande.message };

    try {
      // Google Agenda fait foi : si un événement occupe déjà ce créneau, il n'est plus disponible.
      const occupees = await occupations(creneau.debut, creneau.fin);
      if (occupees.some((o) => chevauche(o, creneau.debut, creneau.fin))) {
        await libererVerrou(creneau.id);
        return json({ erreur: "Ce créneau n'est plus disponible. Choisissez-en un autre." }, { status: 409 });
      }
      await creerEvenement({
        titre: `ORANE : ${demande.nom} (${LIBELLE_TYPE[creneau.type]})`,
        description: [
          "Rendez-vous réservé sur le site.",
          `Nom : ${demande.nom}`,
          `Téléphone : ${demande.telephone}`,
          `E-mail : ${demande.email}`,
          ...(demande.message ? [`Message : ${demande.message}`] : []),
        ].join("\n"),
        debutIso: creneau.debut,
        finIso: creneau.fin,
        lieu: process.env.RDV_LIEU || undefined,
        creneauId: creneau.id,
        client,
      });
    } catch (erreur) {
      console.error("Réservation Google Agenda impossible", erreur);
      await libererVerrou(creneau.id);
      return json({ erreur: `La réservation n'a pas pu être enregistrée : ${APPELER}.` }, { status: 502 });
    }
    // Le verrou n'est pas libéré : il expire seul (60 s), le temps que l'événement soit visible partout.

    // E-mails optionnels (Resend). Sans Resend, le site prévient ORANE via Formspree depuis le navigateur.
    const notification = adresseNotification();
    const [emailEnvoye] = await Promise.all([
      envoyerEmail({ ...emailConfirmation(creneau, client), a: client.email, repondreA: notification }),
      notification ? envoyerEmail({ ...emailNotification(creneau, client), a: notification, repondreA: client.email }) : Promise.resolve(false),
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
