import { validerTarifs, type Tarifs } from "../../shared/tarifs.js";
import { modeBase, requete, enIso, type ModeBase } from "./db.js";

/** Réglages du site (tarifs) et compteurs de limitation, stockés dans Postgres (Neon). */

export type Enregistrement = { tarifs: Tarifs; updatedAt: string };
export type ModeStockage = ModeBase;
export const modeStockage = (): ModeStockage => modeBase();

/* ---------- Tarifs ---------- */

export async function lireTarifs(): Promise<Enregistrement | null> {
  if (modeStockage() === "aucune") return null;
  const lignes = await requete(`SELECT value, updated_at FROM site_settings WHERE key = 'tarifs'`);
  const ligne = lignes[0];
  if (!ligne) return null;
  const valeur = typeof ligne.value === "string" ? safeJson(ligne.value) : ligne.value;
  const v = validerTarifs((valeur as { tarifs?: unknown } | null)?.tarifs ?? valeur);
  return v.ok === true ? { tarifs: v.tarifs, updatedAt: enIso(ligne.updated_at) } : null;
}

export async function ecrireTarifs(tarifs: Tarifs): Promise<Enregistrement> {
  const lignes = await requete(
    `INSERT INTO site_settings (key, value, updated_at) VALUES ('tarifs', $1::jsonb, now())
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()
     RETURNING updated_at`,
    [JSON.stringify({ tarifs })],
  );
  return { tarifs, updatedAt: enIso(lignes[0].updated_at) };
}

function safeJson(texte: string): unknown {
  try {
    return JSON.parse(texte);
  } catch {
    return null;
  }
}

/* ---------- Compteurs (limitation des tentatives) ---------- */

export async function lireCompteur(cle: string): Promise<number> {
  const lignes = await requete(`SELECT count FROM rate_limits WHERE key = $1 AND expires_at > now()`, [cle]);
  return Number(lignes[0]?.count ?? 0) || 0;
}

export async function incrementer(cle: string, ttlSecondes: number): Promise<void> {
  await requete(
    `INSERT INTO rate_limits (key, count, expires_at) VALUES ($1, 1, now() + make_interval(secs => $2))
     ON CONFLICT (key) DO UPDATE SET
       count = CASE WHEN rate_limits.expires_at <= now() THEN 1 ELSE rate_limits.count + 1 END,
       expires_at = CASE WHEN rate_limits.expires_at <= now() THEN now() + make_interval(secs => $2) ELSE rate_limits.expires_at END`,
    [cle, ttlSecondes],
  );
  if (Math.random() < 0.02) await requete(`DELETE FROM rate_limits WHERE expires_at < now() - interval '1 day'`);
}

export async function supprimer(cle: string): Promise<void> {
  await requete(`DELETE FROM rate_limits WHERE key = $1`, [cle]);
}
