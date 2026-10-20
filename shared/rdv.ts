export const FUSEAU = "Europe/Paris";
export const TELEPHONE_CONTACT = "06 86 54 47 66";
export const DELAI_MIN_RESERVATION_HEURES = 24;

export const TYPES_CRENEAU = ["decouverte", "seance"] as const;
export type TypeCreneau = (typeof TYPES_CRENEAU)[number];

export const LIBELLE_TYPE: Record<TypeCreneau, string> = {
  decouverte: "Séance découverte",
  seance: "Séance individuelle",
};

export type Creneau = {
  id: string;
  debut: string;
  fin: string;
  type: TypeCreneau;
};

export type Reservation = {
  creneauId: string;
  nom: string;
  telephone: string;
  email: string;
  message: string;
  creeLe: string;
  eventId?: string;
};

type ChampsDate = { year: number; month: number; day: number; hour: number; minute: number };

const dateFormat = new Intl.DateTimeFormat("fr-FR", {
  timeZone: FUSEAU,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

function champsDate(date: Date): ChampsDate {
  const parts = dateFormat.formatToParts(date);
  const valeur = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((p) => p.type === type)?.value);
  return {
    year: valeur("year"),
    month: valeur("month"),
    day: valeur("day"),
    hour: valeur("hour"),
    minute: valeur("minute"),
  };
}

function enDateLocale(date: Date): number {
  const p = champsDate(date);
  return Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute);
}

function versInstant(date: string, heure: string): number | null {
  const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  const heureMatch = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(heure);
  if (!dateMatch || !heureMatch) return null;
  const [, y, m, d] = dateMatch;
  const [, h, min] = heureMatch;
  const annee = Number(y);
  const mois = Number(m);
  const jour = Number(d);
  const heureNum = Number(h);
  const minute = Number(min);
  const cibleLocale = Date.UTC(annee, mois - 1, jour, heureNum, minute);
  const verif = new Date(cibleLocale);
  if (verif.getUTCFullYear() !== annee || verif.getUTCMonth() + 1 !== mois || verif.getUTCDate() !== jour) return null;

  let instant = cibleLocale;
  for (let i = 0; i < 3; i++) instant += cibleLocale - enDateLocale(new Date(instant));
  const p = champsDate(new Date(instant));
  return p.year === annee && p.month === mois && p.day === jour && p.hour === heureNum && p.minute === minute ? instant : null;
}

export function cleJour(iso: string): string {
  const p = champsDate(new Date(iso));
  return `${p.year}-${String(p.month).padStart(2, "0")}-${String(p.day).padStart(2, "0")}`;
}

export function formaterHeure(iso: string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    timeZone: FUSEAU,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(new Date(iso));
}

export function formaterJour(iso: string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    timeZone: FUSEAU,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(iso));
}

export function formaterJourComplet(iso: string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    timeZone: FUSEAU,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(iso));
}

export type GenerationCreneaux =
  | { ok: true; creneaux: { debut: number; fin: number }[] }
  | { ok: false; erreur: string };

export function genererCreneaux(input: {
  date: string;
  debut: string;
  fin: string;
  dureeMinutes: number;
  pauseMinutes: number;
  semaines: number;
}): GenerationCreneaux {
  const { date, debut, fin, dureeMinutes, pauseMinutes, semaines } = input;
  if (!Number.isInteger(dureeMinutes) || dureeMinutes < 1 || dureeMinutes > 480) {
    return { ok: false, erreur: "La durée de séance est invalide." };
  }
  if (!Number.isInteger(pauseMinutes) || pauseMinutes < 0 || pauseMinutes > 240) {
    return { ok: false, erreur: "La pause doit être un nombre entier entre 0 et 240 minutes." };
  }
  if (!Number.isInteger(semaines) || semaines < 1 || semaines > 52) {
    return { ok: false, erreur: "Le nombre de semaines doit être compris entre 1 et 52." };
  }

  const creneaux: { debut: number; fin: number }[] = [];
  for (let semaine = 0; semaine < semaines; semaine++) {
    const jour = new Date(`${date}T12:00:00Z`);
    if (Number.isNaN(jour.getTime())) return { ok: false, erreur: "Choisissez une date valide." };
    jour.setUTCDate(jour.getUTCDate() + semaine * 7);
    const dateSemaine = `${jour.getUTCFullYear()}-${String(jour.getUTCMonth() + 1).padStart(2, "0")}-${String(jour.getUTCDate()).padStart(2, "0")}`;
    const debutMs = versInstant(dateSemaine, debut);
    const finMs = versInstant(dateSemaine, fin);
    if (debutMs === null || finMs === null) {
      return { ok: false, erreur: "L'heure ou la date est invalide (les heures inexistantes lors du changement d'heure ne sont pas acceptées)." };
    }
    if (finMs <= debutMs) return { ok: false, erreur: "L'heure de fin doit être après l'heure de début." };

    const pas = (dureeMinutes + pauseMinutes) * 60_000;
    for (let debutCreneau = debutMs; debutCreneau + dureeMinutes * 60_000 <= finMs; debutCreneau += pas) {
      creneaux.push({ debut: debutCreneau, fin: debutCreneau + dureeMinutes * 60_000 });
      if (creneaux.length > 500) return { ok: false, erreur: "Cette plage génère trop de créneaux." };
    }
  }
  if (creneaux.length === 0) return { ok: false, erreur: "La plage est trop courte pour créer un créneau." };
  return { ok: true, creneaux };
}

export type DemandeReservation = {
  creneauId: string;
  nom: string;
  telephone: string;
  email: string;
  message: string;
  consentement: boolean;
  site: string;
};

export type ValidationReservation =
  | { ok: true; demande: DemandeReservation }
  | { ok: false; erreur: string };

export function validerReservation(entree: unknown): ValidationReservation {
  if (typeof entree !== "object" || entree === null || Array.isArray(entree)) {
    return { ok: false, erreur: "Le formulaire est invalide." };
  }
  const o = entree as Record<string, unknown>;
  const texte = (valeur: unknown) => (typeof valeur === "string" ? valeur.trim() : "");
  const creneauId = texte(o.creneauId);
  const nom = texte(o.nom);
  const telephone = texte(o.telephone);
  const email = texte(o.email);
  const message = texte(o.message);
  const site = texte(o.site);

  if (!creneauId || creneauId.length > 64) return { ok: false, erreur: "Choisissez un créneau valide." };
  if (nom.length < 2 || nom.length > 100) return { ok: false, erreur: "Le nom doit contenir entre 2 et 100 caractères." };
  if (telephone.length < 8 || telephone.length > 30 || !/^[+\d().\s-]+$/.test(telephone)) {
    return { ok: false, erreur: "Saisissez un numéro de téléphone valide." };
  }
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, erreur: "Saisissez une adresse e-mail valide." };
  }
  if (message.length > 500) return { ok: false, erreur: "Le message ne peut pas dépasser 500 caractères." };
  if (o.consentement !== true) return { ok: false, erreur: "Veuillez accepter le traitement des données pour confirmer votre demande." };
  return { ok: true, demande: { creneauId, nom, telephone, email, message, consentement: true, site } };
}
