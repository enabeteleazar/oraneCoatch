/**
 * Prise de rendez-vous : types, fuseau horaire et validations partagés entre le site
 * (navigateur) et l'API (serveur). TypeScript pur, sans dépendance.
 */

export const FUSEAU_PAR_DEFAUT = "Europe/Paris";
let fuseau = FUSEAU_PAR_DEFAUT;
/** Fuseau horaire des rendez-vous (variable BOOKING_TIME_ZONE côté serveur, VITE_BOOKING_TIME_ZONE côté site). */
export const fuseauActuel = () => fuseau;
export function definirFuseau(tz?: string | null): void {
  if (!tz) return;
  try {
    new Intl.DateTimeFormat("en", { timeZone: tz });
    fuseau = tz;
  } catch {
    /* fuseau inconnu : on garde la valeur actuelle */
  }
}

const formateurs = new Map<string, Intl.DateTimeFormat>();
function formateur(locale: string, options: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
  const cle = `${fuseau}|${locale}|${JSON.stringify(options)}`;
  let f = formateurs.get(cle);
  if (!f) {
    f = new Intl.DateTimeFormat(locale, { ...options, timeZone: fuseau });
    formateurs.set(cle, f);
  }
  return f;
}
export const TELEPHONE_CONTACT = "06 86 54 47 66";

export type TypeCreneau = "decouverte" | "seance";
export const TYPES_CRENEAU: TypeCreneau[] = ["decouverte", "seance"];
export const LIBELLE_TYPE: Record<TypeCreneau, string> = {
  decouverte: "Séance découverte",
  seance: "Séance individuelle",
};

/** Dates stockées en ISO UTC (ex. « 2026-11-03T13:30:00.000Z »). */
export type Creneau = { id: string; debut: string; fin: string; type: TypeCreneau };

export type Reservation = {
  creneauId: string;
  nom: string;
  telephone: string;
  email: string;
  message: string;
  creeLe: string;
  eventId?: string;
};

/** Un créneau n'est réservable en ligne que s'il commence dans plus de N heures. */
export const DELAI_MIN_RESERVATION_HEURES = 12;

/* ------------------------------------------------------------------ */
/* Heure de Paris <-> UTC (sans bibliothèque)                           */
/* ------------------------------------------------------------------ */

/** Heure « murale » du fuseau des rendez-vous à l'instant `ms`, exprimée comme si elle était en UTC. */
function murale(ms: number): number {
  const p: Record<string, string> = {};
  const f = formateur("en-CA", { hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" });
  for (const part of f.formatToParts(ms)) p[part.type] = part.value;
  return Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second);
}

/** « 2026-11-03 » + « 14:30 » (heure locale du fuseau des rendez-vous) → millisecondes UTC, ou null si invalide / inexistante. */
export function localVersUtc(date: string, heure: string): number | null {
  const d = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  const h = /^(\d{2}):(\d{2})$/.exec(heure);
  if (!d || !h) return null;
  const [annee, mois, jour, hh, mm] = [+d[1], +d[2], +d[3], +h[1], +h[2]];
  if (mois < 1 || mois > 12 || jour < 1 || jour > 31 || hh > 23 || mm > 59) return null;

  const naif = Date.UTC(annee, mois - 1, jour, hh, mm);
  if (new Date(naif).getUTCDate() !== jour) return null; // ex. 31 février
  const essai1 = naif - (murale(naif) - naif);
  const essai2 = naif - (murale(essai1) - essai1);
  return murale(essai2) === naif ? essai2 : null; // null : heure inexistante (passage à l'heure d'été)
}

/** Ajoute des jours à une date « AAAA-MM-JJ » (calendrier, indépendant des fuseaux). */
export function ajouterJours(date: string, jours: number): string {
  const [a, m, j] = date.split("-").map(Number);
  return new Date(Date.UTC(a, m - 1, j + jours)).toISOString().slice(0, 10);
}

/** « AAAA-MM-JJ » (heure locale) d'un instant. */
export function cleJour(iso: string): string {
  return formateur("en-CA", { year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(iso));
}

export function formaterJour(iso: string): string {
  const texte = formateur("fr-FR", { weekday: "long", day: "numeric", month: "long" }).format(new Date(iso));
  return texte.charAt(0).toUpperCase() + texte.slice(1);
}

export function formaterJourComplet(iso: string): string {
  const texte = formateur("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(new Date(iso));
  return texte.charAt(0).toUpperCase() + texte.slice(1);
}

export function formaterHeure(iso: string): string {
  return formateur("fr-FR", { hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(new Date(iso));
}

/* ------------------------------------------------------------------ */
/* Génération de créneaux                                               */
/* ------------------------------------------------------------------ */

export const MAX_CRENEAUX_PAR_CREATION = 300;
export const MAX_SEMAINES = 26;

export type PlageEntree = {
  date: string; // « AAAA-MM-JJ », heure locale
  debut: string; // « HH:MM »
  fin: string; // « HH:MM »
  dureeMinutes: number;
  pauseMinutes: number;
  semaines: number;
};

export type PlageResultat = { ok: true; creneaux: { debut: number; fin: number }[] } | { ok: false; erreur: string };

/** Découpe chaque plage horaire en créneaux consécutifs ; répète la plage chaque semaine. */
export function genererCreneaux(p: PlageEntree): PlageResultat {
  if (!Number.isInteger(p.dureeMinutes) || p.dureeMinutes < 5) return { ok: false, erreur: "Durée de séance invalide." };
  if (!Number.isInteger(p.pauseMinutes) || p.pauseMinutes < 0 || p.pauseMinutes > 180) {
    return { ok: false, erreur: "La pause doit être comprise entre 0 et 180 minutes." };
  }
  if (!Number.isInteger(p.semaines) || p.semaines < 1 || p.semaines > MAX_SEMAINES) {
    return { ok: false, erreur: `Le nombre de semaines doit être compris entre 1 et ${MAX_SEMAINES}.` };
  }

  const creneaux: { debut: number; fin: number }[] = [];
  for (let semaine = 0; semaine < p.semaines; semaine++) {
    const jour = ajouterJours(p.date, 7 * semaine);
    const debutPlage = localVersUtc(jour, p.debut);
    const finPlage = localVersUtc(jour, p.fin);
    if (debutPlage === null || finPlage === null) {
      return { ok: false, erreur: `Date ou heure invalide pour le ${jour} (heure inexistante ?).` };
    }
    if (finPlage <= debutPlage) return { ok: false, erreur: "L'heure de fin doit être après l'heure de début." };

    let debut = debutPlage;
    while (debut + p.dureeMinutes * 60_000 <= finPlage) {
      creneaux.push({ debut, fin: debut + p.dureeMinutes * 60_000 });
      if (creneaux.length > MAX_CRENEAUX_PAR_CREATION) {
        return { ok: false, erreur: `Trop de créneaux d'un coup (maximum ${MAX_CRENEAUX_PAR_CREATION}).` };
      }
      debut += (p.dureeMinutes + p.pauseMinutes) * 60_000;
    }
  }
  if (creneaux.length === 0) {
    return { ok: false, erreur: "La plage est trop courte pour contenir un créneau de cette durée." };
  }
  return { ok: true, creneaux };
}

/* ------------------------------------------------------------------ */
/* Validation d'une réservation                                         */
/* ------------------------------------------------------------------ */

export type DemandeReservation = {
  creneauId: string;
  nom: string;
  telephone: string;
  email: string;
  message: string;
  consentement: true;
  /** Champ piège pour les robots : doit rester vide. */
  site: string;
};

export type ValidationReservation = { ok: true; demande: DemandeReservation } | { ok: false; erreur: string };

const sansControle = (s: string) => !/[\u0000-\u001f\u007f]/.test(s);

export function validerReservation(entree: unknown): ValidationReservation {
  if (typeof entree !== "object" || entree === null) return { ok: false, erreur: "Demande invalide." };
  const e = entree as Record<string, unknown>;
  const texte = (v: unknown) => (typeof v === "string" ? v.trim() : "");

  const creneauId = texte(e.creneauId);
  const nom = texte(e.nom).replace(/\s+/g, " ");
  const telephone = texte(e.telephone);
  const email = texte(e.email).toLowerCase();
  const message = typeof e.message === "string" ? e.message.trim() : "";
  const site = texte(e.site);

  if (!creneauId || creneauId.length > 64) return { ok: false, erreur: "Choisissez un créneau." };
  if (nom.length < 2 || nom.length > 100 || !sansControle(nom)) return { ok: false, erreur: "Indiquez votre nom (2 à 100 caractères)." };
  const chiffres = telephone.replace(/\D/g, "");
  if (!/^[0-9+\s().-]{9,25}$/.test(telephone) || chiffres.length < 9 || chiffres.length > 15) {
    return { ok: false, erreur: "Indiquez un numéro de téléphone valide." };
  }
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    return { ok: false, erreur: "Indiquez une adresse e-mail valide." };
  }
  if (message.length > 500) return { ok: false, erreur: "Le message est limité à 500 caractères." };
  if (e.consentement !== true) {
    return { ok: false, erreur: "Vous devez accepter l'utilisation de vos informations pour réserver." };
  }
  return { ok: true, demande: { creneauId, nom, telephone, email, message, consentement: true, site } };
}
