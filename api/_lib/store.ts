import { validerTarifs, type Tarifs } from "../../shared/tarifs.js";

/**
 * Stockage des tarifs.
 * - Production (Vercel) : Upstash Redis via l'API REST (Marketplace Vercel : variables
 *   KV_REST_API_URL / KV_REST_API_TOKEN, ou UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN).
 * - Développement local sans Redis : fichier `.data/store.json` (ignoré par Git).
 * - Sinon : aucun stockage, les tarifs par défaut du code restent affichés.
 */

const CLE_TARIFS = "orane:tarifs";

export type Enregistrement = { tarifs: Tarifs; updatedAt: string };
export type ModeStockage = "redis" | "fichier" | "aucun";

function configRedis(): { url: string; token: string } | null {
  const url = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;
  return url && token ? { url: url.replace(/\/$/, ""), token } : null;
}

export function modeStockage(): ModeStockage {
  if (configRedis()) return "redis";
  if (!process.env.VERCEL && process.env.NODE_ENV !== "production") return "fichier";
  return "aucun";
}

async function redis(commande: (string | number)[]): Promise<unknown> {
  const c = configRedis();
  if (!c) throw new Error("Redis non configuré");
  const reponse = await fetch(c.url, {
    method: "POST",
    headers: { Authorization: `Bearer ${c.token}`, "Content-Type": "application/json" },
    body: JSON.stringify(commande),
    signal: AbortSignal.timeout(5000),
  });
  if (!reponse.ok) throw new Error(`Redis HTTP ${reponse.status}`);
  const data = (await reponse.json()) as { result?: unknown; error?: string };
  if (data.error) throw new Error(`Redis : ${data.error}`);
  return data.result;
}

/* ---------- Fichier local (développement) ---------- */

async function fichierLocal() {
  const fs = await import("node:fs/promises");
  const path = await import("node:path");
  const dossier = path.join(process.cwd(), ".data");
  const fichier = path.join(dossier, "store.json");
  return {
    async lire(): Promise<Record<string, string>> {
      try {
        return JSON.parse(await fs.readFile(fichier, "utf8")) as Record<string, string>;
      } catch {
        return {};
      }
    },
    async ecrire(donnees: Record<string, string>) {
      await fs.mkdir(dossier, { recursive: true });
      await fs.writeFile(fichier, JSON.stringify(donnees, null, 2));
    },
  };
}

/* ---------- Tarifs ---------- */

export async function lireTarifs(): Promise<Enregistrement | null> {
  const mode = modeStockage();
  let brut: unknown = null;
  if (mode === "redis") brut = await redis(["GET", CLE_TARIFS]);
  else if (mode === "fichier") brut = (await (await fichierLocal()).lire())[CLE_TARIFS] ?? null;
  else return null;

  if (typeof brut !== "string") return null;
  try {
    const enreg = JSON.parse(brut) as { tarifs?: unknown; updatedAt?: unknown };
    const v = validerTarifs(enreg.tarifs);
    if (v.ok === false) return null;
    return { tarifs: v.tarifs, updatedAt: typeof enreg.updatedAt === "string" ? enreg.updatedAt : "" };
  } catch {
    return null;
  }
}

export async function ecrireTarifs(tarifs: Tarifs): Promise<Enregistrement> {
  const enreg: Enregistrement = { tarifs, updatedAt: new Date().toISOString() };
  const mode = modeStockage();
  if (mode === "redis") {
    await redis(["SET", CLE_TARIFS, JSON.stringify(enreg)]);
  } else if (mode === "fichier") {
    const f = await fichierLocal();
    await f.ecrire({ ...(await f.lire()), [CLE_TARIFS]: JSON.stringify(enreg) });
  } else {
    throw new Error("Aucun stockage configuré");
  }
  return enreg;
}

/* ---------- Compteurs (limitation des tentatives de connexion) ---------- */

const compteursMemoire = new Map<string, { n: number; expire: number }>();

export async function lireCompteur(cle: string): Promise<number> {
  if (configRedis()) return Number((await redis(["GET", cle])) ?? 0) || 0;
  const c = compteursMemoire.get(cle);
  return c && c.expire > Date.now() ? c.n : 0;
}

export async function incrementer(cle: string, ttlSecondes: number): Promise<void> {
  if (configRedis()) {
    const n = Number(await redis(["INCR", cle]));
    if (n === 1) await redis(["EXPIRE", cle, ttlSecondes]);
    return;
  }
  const c = compteursMemoire.get(cle);
  if (c && c.expire > Date.now()) c.n += 1;
  else compteursMemoire.set(cle, { n: 1, expire: Date.now() + ttlSecondes * 1000 });
}

export async function supprimer(cle: string): Promise<void> {
  if (configRedis()) await redis(["DEL", cle]);
  else compteursMemoire.delete(cle);
}
