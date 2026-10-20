import { validerTarifs, type Tarifs } from "../../shared/tarifs.js";

const CLE_TARIFS = "orane:tarifs";
const FICHIER_LOCAL = ".data/store.json";
const cleExpiration = (cle: string) => `__expire:${cle}`;

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

async function fichierLocal() {
  const fs = await import("node:fs/promises");
  const path = await import("node:path");
  const fichier = path.join(process.cwd(), FICHIER_LOCAL);
  return {
    async lire(): Promise<Record<string, string>> {
      try {
        const contenu = await fs.readFile(fichier, "utf8");
        const donnees: unknown = JSON.parse(contenu);
        if (typeof donnees !== "object" || donnees === null || Array.isArray(donnees)) {
          throw new Error("Le fichier de stockage local doit contenir un objet JSON.");
        }
        return donnees as Record<string, string>;
      } catch (erreur) {
        if (typeof erreur === "object" && erreur !== null && "code" in erreur && erreur.code === "ENOENT") return {};
        throw erreur;
      }
    },
    async ecrire(donnees: Record<string, string>) {
      await fs.mkdir(path.dirname(fichier), { recursive: true });
      await fs.writeFile(fichier, JSON.stringify(donnees, null, 2));
    },
  };
}

let fileQueue: Promise<void> = Promise.resolve();

function transactionLocale<T>(operation: () => Promise<T>): Promise<T> {
  const resultat = fileQueue.then(operation, operation);
  fileQueue = resultat.then(
    () => undefined,
    () => undefined,
  );
  return resultat;
}

export async function lireCle(cle: string): Promise<string | null> {
  if (configRedis()) {
    const resultat = await redis(["GET", cle]);
    return typeof resultat === "string" ? resultat : null;
  }
  if (modeStockage() === "fichier") {
    const donnees = await (await fichierLocal()).lire();
    const expiration = Number(donnees[cleExpiration(cle)]);
    if (Number.isFinite(expiration) && expiration <= Date.now()) return null;
    return donnees[cle] ?? null;
  }
  return null;
}

export async function lireCles(cles: string[]): Promise<(string | null)[]> {
  if (cles.length === 0) return [];
  if (configRedis()) {
    const resultat = await redis(["MGET", ...cles]);
    if (!Array.isArray(resultat)) throw new Error("Réponse Redis MGET invalide");
    return cles.map((_, index) => (typeof resultat[index] === "string" ? resultat[index] : null));
  }
  if (modeStockage() === "fichier") {
    const donnees = await (await fichierLocal()).lire();
    return cles.map((cle) => {
      const expiration = Number(donnees[cleExpiration(cle)]);
      return Number.isFinite(expiration) && expiration <= Date.now() ? null : donnees[cle] ?? null;
    });
  }
  return cles.map(() => null);
}

export async function ecrireCle(cle: string, valeur: string, ttlSecondes?: number): Promise<void> {
  if (configRedis()) {
    const commande: (string | number)[] = ["SET", cle, valeur];
    if (ttlSecondes !== undefined) commande.push("EX", Math.max(1, Math.ceil(ttlSecondes)));
    await redis(commande);
    return;
  }
  if (modeStockage() !== "fichier") throw new Error("Aucun stockage configuré");
  await transactionLocale(async () => {
    const fichier = await fichierLocal();
    const donnees = await fichier.lire();
    donnees[cle] = valeur;
    if (ttlSecondes === undefined) delete donnees[cleExpiration(cle)];
    else donnees[cleExpiration(cle)] = String(Date.now() + Math.max(1, Math.ceil(ttlSecondes)) * 1000);
    await fichier.ecrire(donnees);
  });
}

export async function ecrireSiAbsent(cle: string, valeur: string, ttlSecondes: number): Promise<boolean> {
  if (configRedis()) {
    const resultat = await redis(["SET", cle, valeur, "EX", Math.max(1, Math.ceil(ttlSecondes)), "NX"]);
    return resultat === "OK";
  }
  if (modeStockage() !== "fichier") throw new Error("Aucun stockage configuré");
  return transactionLocale(async () => {
    const fichier = await fichierLocal();
    const donnees = await fichier.lire();
    const expiration = Number(donnees[cleExpiration(cle)]);
    if (donnees[cle] !== undefined && (!Number.isFinite(expiration) || expiration > Date.now())) return false;
    donnees[cle] = valeur;
    donnees[cleExpiration(cle)] = String(Date.now() + Math.max(1, Math.ceil(ttlSecondes)) * 1000);
    await fichier.ecrire(donnees);
    return true;
  });
}

export async function supprimerCle(cle: string): Promise<void> {
  if (configRedis()) {
    await redis(["DEL", cle]);
    return;
  }
  if (modeStockage() !== "fichier") throw new Error("Aucun stockage configuré");
  await transactionLocale(async () => {
    const fichier = await fichierLocal();
    const donnees = await fichier.lire();
    delete donnees[cle];
    delete donnees[cleExpiration(cle)];
    await fichier.ecrire(donnees);
  });
}

export async function lireTarifs(): Promise<Enregistrement | null> {
  if (modeStockage() === "aucun") return null;
  const brut = await lireCle(CLE_TARIFS);
  if (brut === null) return null;
  try {
    const enregistrement = JSON.parse(brut) as { tarifs?: unknown; updatedAt?: unknown };
    const validation = validerTarifs(enregistrement.tarifs);
    if (validation.ok === false) return null;
    return {
      tarifs: validation.tarifs,
      updatedAt: typeof enregistrement.updatedAt === "string" ? enregistrement.updatedAt : "",
    };
  } catch {
    return null;
  }
}

export async function ecrireTarifs(tarifs: Tarifs): Promise<Enregistrement> {
  const enregistrement = { tarifs, updatedAt: new Date().toISOString() };
  await ecrireCle(CLE_TARIFS, JSON.stringify(enregistrement));
  return enregistrement;
}

const compteursMemoire = new Map<string, { n: number; expire: number }>();

export async function lireCompteur(cle: string): Promise<number> {
  if (configRedis()) return Number((await redis(["GET", cle])) ?? 0) || 0;
  const compteur = compteursMemoire.get(cle);
  return compteur && compteur.expire > Date.now() ? compteur.n : 0;
}

export async function incrementer(cle: string, ttlSecondes: number): Promise<void> {
  if (configRedis()) {
    const nombre = Number(await redis(["INCR", cle]));
    if (nombre === 1) await redis(["EXPIRE", cle, ttlSecondes]);
    return;
  }
  const compteur = compteursMemoire.get(cle);
  if (compteur && compteur.expire > Date.now()) compteur.n += 1;
  else compteursMemoire.set(cle, { n: 1, expire: Date.now() + ttlSecondes * 1000 });
}

export async function supprimer(cle: string): Promise<void> {
  if (configRedis()) {
    await redis(["DEL", cle]);
    return;
  }
  compteursMemoire.delete(cle);
}
