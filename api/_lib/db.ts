/**
 * Accès à la base Postgres.
 * - Production : Neon (variable DATABASE_URL), via le pilote HTTP serverless.
 * - Développement sans DATABASE_URL : base locale embarquée (PGlite) dans `.data/pglite`.
 * Les tables sont créées automatiquement au premier appel (voir aussi db/schema.sql).
 */

export type Ligne = Record<string, unknown>;
type Executeur = (texte: string, params: unknown[]) => Promise<Ligne[]>;

export type ModeBase = "neon" | "local" | "aucune";

export function modeBase(): ModeBase {
  if (process.env.DATABASE_URL) return "neon";
  if (!process.env.VERCEL && process.env.NODE_ENV !== "production") return "local";
  return "aucune";
}

const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS booking_slots (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    starts_at     timestamptz NOT NULL,
    ends_at       timestamptz NOT NULL,
    slot_type     text NOT NULL CHECK (slot_type IN ('decouverte', 'seance')),
    claimed_until timestamptz,
    created_at    timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT booking_slots_ordre CHECK (ends_at > starts_at),
    CONSTRAINT booking_slots_pas_de_chevauchement EXCLUDE USING gist (tstzrange(starts_at, ends_at) WITH &&)
  )`,
  `CREATE INDEX IF NOT EXISTS booking_slots_starts_at_idx ON booking_slots (starts_at)`,
  `CREATE TABLE IF NOT EXISTS site_settings (
    key        text PRIMARY KEY,
    value      jsonb NOT NULL,
    updated_at timestamptz NOT NULL DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS rate_limits (
    key        text PRIMARY KEY,
    count      integer NOT NULL,
    expires_at timestamptz NOT NULL
  )`,
];

let executeur: Promise<Executeur> | null = null;
let schemaPret: Promise<void> | null = null;

async function creerExecuteur(): Promise<Executeur> {
  const url = process.env.DATABASE_URL;
  if (url) {
    const { neon } = await import("@neondatabase/serverless");
    const sql = neon(url);
    return async (texte, params) => (await sql.query(texte, params)) as Ligne[];
  }
  if (modeBase() === "local") {
    const nomPaquet = "@electric-sql/pglite"; // nom en variable : jamais embarqué dans les fonctions Vercel
    const { PGlite } = await import(/* @vite-ignore */ nomPaquet);
    const dossier = process.env.PGLITE_DIR ?? ".data/pglite";
    const { mkdir } = await import("node:fs/promises");
    const { dirname } = await import("node:path");
    await mkdir(dirname(dossier), { recursive: true });
    const base = new PGlite(dossier);
    await base.waitReady;
    return async (texte, params) => (await base.query(texte, params)).rows as Ligne[];
  }
  throw new Error("DATABASE_URL n'est pas défini");
}

async function creerSchema(exec: Executeur): Promise<void> {
  for (const instruction of SCHEMA) {
    try {
      await exec(instruction, []);
    } catch (erreur) {
      // Deux démarrages simultanés peuvent se disputer la création : on réessaie une fois.
      await exec(instruction, []).catch(() => {
        throw erreur;
      });
    }
  }
}

/** Exécute une requête paramétrée ($1, $2…) et renvoie les lignes. */
export async function requete(texte: string, params: unknown[] = []): Promise<Ligne[]> {
  executeur ??= creerExecuteur();
  const exec = await executeur.catch((erreur) => {
    executeur = null;
    throw erreur;
  });
  schemaPret ??= creerSchema(exec).catch((erreur) => {
    schemaPret = null;
    throw erreur;
  });
  await schemaPret;
  return exec(texte, params);
}

export const enIso = (v: unknown): string => new Date(v as string | number | Date).toISOString();
