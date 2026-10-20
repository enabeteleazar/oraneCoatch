import type { Creneau, Reservation } from "../../shared/rdv.js";
import { TYPES_CRENEAU } from "../../shared/rdv.js";
import { ecrireCle, ecrireSiAbsent, lireCle, lireCles, supprimerCle } from "./store.js";

const CLE_CRENEAUX = "orane:creneaux";
const cleResa = (creneauId: string) => `orane:resa:${creneauId}`;

/** Les données personnelles d'une réservation sont supprimées automatiquement 6 mois après le rendez-vous. */
export const CONSERVATION_JOURS = 180;
const JOUR_MS = 86_400_000;

function creneauValide(c: unknown): c is Creneau {
  if (typeof c !== "object" || c === null) return false;
  const o = c as Record<string, unknown>;
  return (
    typeof o.id === "string" &&
    typeof o.debut === "string" &&
    typeof o.fin === "string" &&
    !Number.isNaN(Date.parse(o.debut)) &&
    !Number.isNaN(Date.parse(o.fin)) &&
    TYPES_CRENEAU.includes(o.type as Creneau["type"])
  );
}

export async function lireCreneaux(): Promise<Creneau[]> {
  const brut = await lireCle(CLE_CRENEAUX);
  if (!brut) return [];
  try {
    const liste = JSON.parse(brut) as unknown;
    return Array.isArray(liste) ? liste.filter(creneauValide).sort((a, b) => Date.parse(a.debut) - Date.parse(b.debut)) : [];
  } catch {
    return [];
  }
}

/** Enregistre la liste en supprimant les créneaux terminés depuis plus de 7 jours. */
export async function ecrireCreneaux(liste: Creneau[]): Promise<void> {
  const limite = Date.now() - 7 * JOUR_MS;
  const utiles = liste.filter((c) => Date.parse(c.fin) > limite).sort((a, b) => Date.parse(a.debut) - Date.parse(b.debut));
  await ecrireCle(CLE_CRENEAUX, JSON.stringify(utiles));
}

export const ttlReservation = (c: Creneau) =>
  Math.max(3600, Math.ceil((Date.parse(c.fin) - Date.now()) / 1000) + CONSERVATION_JOURS * 86_400);

export async function lireReservations(ids: string[]): Promise<Map<string, Reservation>> {
  const valeurs = await lireCles(ids.map(cleResa));
  const resultat = new Map<string, Reservation>();
  valeurs.forEach((v, i) => {
    if (!v) return;
    try {
      resultat.set(ids[i], JSON.parse(v) as Reservation);
    } catch {
      /* enregistrement illisible : ignoré */
    }
  });
  return resultat;
}

/** Réserve le créneau de façon atomique. Renvoie false s'il est déjà pris. */
export const reserverCreneau = (c: Creneau, r: Reservation) => ecrireSiAbsent(cleResa(c.id), JSON.stringify(r), ttlReservation(c));
export const mettreAJourReservation = (c: Creneau, r: Reservation) => ecrireCle(cleResa(c.id), JSON.stringify(r), ttlReservation(c));
export const libererCreneau = (creneauId: string) => supprimerCle(cleResa(creneauId));
