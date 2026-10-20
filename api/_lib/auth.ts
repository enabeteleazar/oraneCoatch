import { createHash, createHmac, timingSafeEqual } from "node:crypto";

/**
 * Authentification de l'espace /admin.
 * - Le mot de passe est celui de la variable d'environnement ADMIN_PASSWORD (jamais envoyé au navigateur).
 * - La session est un cookie signé (HMAC) : `<expiration>.<signature>`, sans stockage serveur.
 *   Changer ADMIN_PASSWORD invalide toutes les sessions en cours.
 */

const NOM_COOKIE = "orane_admin";
export const DUREE_SESSION_S = 60 * 60 * 8;
export const MIN_LONGUEUR_MOT_DE_PASSE = 10;
export const MAX_ECHECS = 5;
export const FENETRE_ECHECS_S = 15 * 60;

export function motDePasseConfigure(): string | null {
  const p = process.env.ADMIN_PASSWORD;
  return p && p.length >= MIN_LONGUEUR_MOT_DE_PASSE ? p : null;
}

function empreinte(valeur: string): Buffer {
  return createHash("sha256").update(valeur).digest();
}

function egaux(a: string, b: string): boolean {
  return timingSafeEqual(empreinte(a), empreinte(b));
}

function signer(expiration: number, motDePasse: string): string {
  const cle = empreinte(`orane-admin-session|${motDePasse}`);
  return createHmac("sha256", cle).update(String(expiration)).digest("base64url");
}

export function verifierMotDePasse(saisi: string): boolean {
  const p = motDePasseConfigure();
  return p !== null && egaux(saisi, p);
}

export function creerJeton(motDePasse: string): string {
  const expiration = Math.floor(Date.now() / 1000) + DUREE_SESSION_S;
  return `${expiration}.${signer(expiration, motDePasse)}`;
}

export function sessionValide(request: Request): boolean {
  const p = motDePasseConfigure();
  if (!p) return false;
  const entree = (request.headers.get("cookie") ?? "")
    .split(";")
    .map((s) => s.trim())
    .find((s) => s.startsWith(`${NOM_COOKIE}=`));
  if (!entree) return false;
  const [expStr, signature] = entree.slice(NOM_COOKIE.length + 1).split(".");
  const expiration = Number(expStr);
  if (!signature || !Number.isInteger(expiration) || expiration < Date.now() / 1000) return false;
  return egaux(signature, signer(expiration, p));
}

function estHttps(request: Request): boolean {
  return new URL(request.url).protocol === "https:" || request.headers.get("x-forwarded-proto") === "https";
}

/** En-tête Set-Cookie : `jeton` pour ouvrir la session, `null` pour la fermer. */
export function cookieSession(request: Request, jeton: string | null): string {
  const attributs = ["Path=/api", "HttpOnly", "SameSite=Strict"];
  if (estHttps(request)) attributs.push("Secure");
  return jeton
    ? `${NOM_COOKIE}=${jeton}; ${attributs.join("; ")}; Max-Age=${DUREE_SESSION_S}`
    : `${NOM_COOKIE}=; ${attributs.join("; ")}; Max-Age=0`;
}

/** Protection CSRF : les requêtes qui modifient quelque chose doivent venir du site lui-même. */
export function origineValide(request: Request): boolean {
  const origine = request.headers.get("origin");
  const hote = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (!origine || !hote) return false;
  try {
    return new URL(origine).host === hote;
  } catch {
    return false;
  }
}

/** Clé de compteur basée sur une empreinte de l'IP (l'adresse n'est pas stockée en clair). */
export function cleIp(request: Request, prefixe: string): string {
  const ip =
    (request.headers.get("x-vercel-forwarded-for") ?? request.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() ||
    "inconnue";
  return `orane:${prefixe}:${createHash("sha256").update(ip).digest("hex").slice(0, 32)}`;
}

export const cleEchecs = (request: Request) => cleIp(request, "echecs");

/**
 * Garde commune des routes d'administration. Renvoie une réponse d'erreur à retourner telle quelle,
 * ou `null` si la requête est autorisée. `modifie` : true pour POST / PUT / DELETE (contrôle de l'origine).
 */
export function exigerAdmin(request: Request, modifie: boolean): Response | null {
  if (modifie && !origineValide(request)) {
    return new Response(JSON.stringify({ erreur: "Origine non autorisée." }), { status: 403, headers: ENTETES_JSON });
  }
  if (!sessionValide(request)) {
    return new Response(JSON.stringify({ erreur: "Session expirée : reconnectez-vous." }), { status: 401, headers: ENTETES_JSON });
  }
  return null;
}

const ENTETES_JSON = { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" };

export const attendre = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
