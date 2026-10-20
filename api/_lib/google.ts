import { createSign } from "node:crypto";
import { FUSEAU } from "../../shared/rdv.js";

/**
 * Google Agenda via un compte de service (aucune connexion Google à faire sur le site).
 * Mise en place : voir .env.example. Les rendez-vous sont ajoutés à l'agenda indiqué par GOOGLE_CALENDAR_ID,
 * qui doit être partagé avec l'adresse du compte de service (droit « Apporter des modifications aux événements »).
 */

const URL_JETON = process.env.GOOGLE_TOKEN_URL ?? "https://oauth2.googleapis.com/token";
const URL_API = process.env.GOOGLE_API_URL ?? "https://www.googleapis.com/calendar/v3";
const PORTEE = "https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/calendar.freebusy";

type Config = { email: string; cle: string; agenda: string };

function config(): Config | null {
  const email = process.env.GOOGLE_CLIENT_EMAIL;
  const cle = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  const agenda = process.env.GOOGLE_CALENDAR_ID;
  return email && cle && agenda ? { email, cle, agenda } : null;
}

export const agendaConfigure = () => config() !== null;

let jetonEnCache: { valeur: string; expire: number } | null = null;

const base64url = (v: string | Buffer) => Buffer.from(v).toString("base64url");

async function jetonAcces(c: Config): Promise<string> {
  if (jetonEnCache && jetonEnCache.expire > Date.now() + 60_000) return jetonEnCache.valeur;

  const maintenant = Math.floor(Date.now() / 1000);
  const entete = base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const corps = base64url(JSON.stringify({ iss: c.email, scope: PORTEE, aud: URL_JETON, iat: maintenant, exp: maintenant + 3600 }));
  const signature = createSign("RSA-SHA256").update(`${entete}.${corps}`).sign(c.cle, "base64url");

  const reponse = await fetch(URL_JETON, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: `${entete}.${corps}.${signature}` }),
    signal: AbortSignal.timeout(8000),
  });
  if (!reponse.ok) throw new Error(`Google OAuth HTTP ${reponse.status}`);
  const data = (await reponse.json()) as { access_token?: string; expires_in?: number };
  if (!data.access_token) throw new Error("Google OAuth : jeton manquant");
  jetonEnCache = { valeur: data.access_token, expire: Date.now() + (data.expires_in ?? 3600) * 1000 };
  return data.access_token;
}

async function appeler(chemin: string, init: RequestInit = {}): Promise<Response> {
  const c = config();
  if (!c) throw new Error("Google Agenda non configuré");
  const jeton = await jetonAcces(c);
  return fetch(`${URL_API}${chemin}`, {
    ...init,
    headers: { Authorization: `Bearer ${jeton}`, "Content-Type": "application/json", ...init.headers },
    signal: AbortSignal.timeout(8000),
  });
}

/** Vrai si l'agenda contient déjà un événement sur cette période. */
export async function periodeOccupee(debutIso: string, finIso: string): Promise<boolean> {
  const c = config();
  if (!c) return false;
  const reponse = await appeler("/freeBusy", {
    method: "POST",
    body: JSON.stringify({ timeMin: debutIso, timeMax: finIso, timeZone: FUSEAU, items: [{ id: c.agenda }] }),
  });
  if (!reponse.ok) throw new Error(`Google freeBusy HTTP ${reponse.status}`);
  const data = (await reponse.json()) as { calendars?: Record<string, { busy?: unknown[]; errors?: unknown[] }> };
  const agenda = data.calendars?.[c.agenda];
  if (agenda?.errors?.length) throw new Error("Google freeBusy : agenda inaccessible (partage ?)");
  return (agenda?.busy?.length ?? 0) > 0;
}

export type EvenementEntree = { titre: string; description: string; debutIso: string; finIso: string; lieu?: string; creneauId: string };

export async function creerEvenement(e: EvenementEntree): Promise<string> {
  const c = config();
  if (!c) throw new Error("Google Agenda non configuré");
  const reponse = await appeler(`/calendars/${encodeURIComponent(c.agenda)}/events`, {
    method: "POST",
    body: JSON.stringify({
      summary: e.titre,
      description: e.description,
      location: e.lieu,
      start: { dateTime: e.debutIso, timeZone: FUSEAU },
      end: { dateTime: e.finIso, timeZone: FUSEAU },
      reminders: { useDefault: true },
      extendedProperties: { private: { creneauId: e.creneauId } },
    }),
  });
  if (!reponse.ok) throw new Error(`Google Agenda (création) HTTP ${reponse.status}`);
  const data = (await reponse.json()) as { id?: string };
  if (!data.id) throw new Error("Google Agenda : identifiant d'événement manquant");
  return data.id;
}

export async function supprimerEvenement(eventId: string): Promise<void> {
  const c = config();
  if (!c) return;
  const reponse = await appeler(`/calendars/${encodeURIComponent(c.agenda)}/events/${encodeURIComponent(eventId)}`, { method: "DELETE" });
  if (!reponse.ok && reponse.status !== 404 && reponse.status !== 410) {
    throw new Error(`Google Agenda (suppression) HTTP ${reponse.status}`);
  }
}
