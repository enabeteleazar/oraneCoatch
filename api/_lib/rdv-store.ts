import { TYPES_CRENEAU, type Creneau, type TypeCreneau } from "../../shared/rdv.js";
import "./config.js";
import { enIso, requete, type Ligne } from "./db.js";

/** Créneaux proposés par le coach (table booking_slots). Les réservations, elles, vivent dans Google Agenda. */

const versCreneau = (l: Ligne): Creneau => ({
  id: String(l.id),
  debut: enIso(l.starts_at),
  fin: enIso(l.ends_at),
  type: (TYPES_CRENEAU.includes(l.slot_type as TypeCreneau) ? l.slot_type : "seance") as TypeCreneau,
});

const COLONNES = "id, starts_at, ends_at, slot_type";

/** Créneaux commençant entre deux instants (ISO), triés par date. `libresDeVerrou` masque ceux en cours de réservation. */
export async function lireCreneauxEntre(debutIso: string, finIso: string, libresDeVerrou = false): Promise<Creneau[]> {
  const lignes = await requete(
    `SELECT ${COLONNES} FROM booking_slots
     WHERE starts_at >= $1 AND starts_at < $2 ${libresDeVerrou ? "AND (claimed_until IS NULL OR claimed_until < now())" : ""}
     ORDER BY starts_at`,
    [debutIso, finIso],
  );
  return lignes.map(versCreneau);
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const idValide = (id: string) => UUID.test(id);

export async function lireCreneau(id: string): Promise<Creneau | null> {
  if (!idValide(id)) return null;
  const lignes = await requete(`SELECT ${COLONNES} FROM booking_slots WHERE id = $1`, [id]);
  return lignes[0] ? versCreneau(lignes[0]) : null;
}

/** Insère les créneaux ; ceux qui chevauchent un créneau existant sont ignorés (contrainte d'exclusion). */
export async function creerCreneaux(plages: { debut: number; fin: number }[], type: TypeCreneau): Promise<{ crees: number; ignores: number }> {
  const debuts = plages.map((p) => new Date(p.debut).toISOString());
  const fins = plages.map((p) => new Date(p.fin).toISOString());
  const lignes = await requete(
    `INSERT INTO booking_slots (starts_at, ends_at, slot_type)
     SELECT s, e, $3 FROM unnest($1::timestamptz[], $2::timestamptz[]) AS t(s, e)
     ON CONFLICT DO NOTHING
     RETURNING id`,
    [debuts, fins, type],
  );
  return { crees: lignes.length, ignores: plages.length - lignes.length };
}

export async function supprimerCreneau(id: string): Promise<boolean> {
  if (!idValide(id)) return false;
  return (await requete(`DELETE FROM booking_slots WHERE id = $1 RETURNING id`, [id])).length > 0;
}

/** Supprime les créneaux terminés depuis plus de 7 jours. */
export async function purgerAnciensCreneaux(): Promise<void> {
  await requete(`DELETE FROM booking_slots WHERE ends_at < now() - interval '7 days'`);
}

/**
 * Verrou de 60 secondes pris pendant une réservation (vérification Google + création de l'événement) :
 * deux visiteurs ne peuvent pas réserver le même créneau en même temps. Renvoie false s'il est déjà pris.
 */
export async function prendreVerrou(id: string, secondes = 60): Promise<boolean> {
  if (!idValide(id)) return false;
  const lignes = await requete(
    `UPDATE booking_slots SET claimed_until = now() + make_interval(secs => $2)
     WHERE id = $1 AND (claimed_until IS NULL OR claimed_until < now()) RETURNING id`,
    [id, secondes],
  );
  return lignes.length > 0;
}

export async function libererVerrou(id: string): Promise<void> {
  if (idValide(id)) await requete(`UPDATE booking_slots SET claimed_until = NULL WHERE id = $1`, [id]);
}
