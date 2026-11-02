import { createSign } from "node:crypto";
import { fuseauActuel, localVersUtc } from "../../shared/rdv.js";
import "./config.js";

/**
 * Google Agenda via un compte de service : c'est la source de vérité des réservations.
 * Chaque réservation crée un événement dans le calendrier du coach (GOOGLE_CALENDAR_ID, ou recherche par nom
 * avec GOOGLE_CALENDAR_NAME, « rdv-coach » par défaut). Un créneau est réservé dès qu'un événement chevauche son horaire.
 * Le calendrier doit être partagé avec l'adresse du compte de service (droit « Apporter des modifications aux événements »).
 */

const URL_JETON = process.env.GOOGLE_TOKEN_URL ?? "https://oauth2.googleapis.com/token";
const URL_API = process.env.GOOGLE_API_URL ?? "https://www.googleapis.com/calendar/v3";
const PORTEE = [
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/calendar.freebusy",
  "https://www.googleapis.com/auth/calendar.calendarlist.readonly",
].join(" ");

type Config = { email: string; cle: string };

/** Accepte la clé collée avec ou sans guillemets, avec de vrais retours à la ligne ou des « \n » littéraux. */
function nettoyerCle(brute: string): string {
  return brute.trim().replace(/^["']|["']$/g, "").replace(/\\n/g, "\n");
}

function config(): Config | null {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL ?? process.env.GOOGLE_CLIENT_EMAIL;
  const cle = process.env.GOOGLE_PRIVATE_KEY;
  return email && cle ? { email: email.trim(), cle: nettoyerCle(cle) } : null;
}

export const agendaConfigure = () => config() !== null;

let jetonEnCache: { valeur: string; expire: number } | null = null;
let agendaEnCache: { id: string; cleConfig: string } | null = null;

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

/** Identifiant du calendrier : GOOGLE_CALENDAR_ID, sinon recherche par nom parmi les calendriers partagés avec le compte. */
async function idAgenda(): Promise<string> {
  const direct = process.env.GOOGLE_CALENDAR_ID?.trim();
  if (direct) return direct;

  const nom = (process.env.GOOGLE_CALENDAR_NAME ?? "rdv-coach").trim().toLowerCase();
  if (agendaEnCache?.cleConfig === nom) return agendaEnCache.id;

  const reponse = await appeler("/users/me/calendarList?maxResults=250&minAccessRole=writer");
  if (!reponse.ok) throw new Error(`Google calendarList HTTP ${reponse.status}`);
  const data = (await reponse.json()) as { items?: { id: string; summary?: string; summaryOverride?: string }[] };
  const trouve = data.items?.find((a) => (a.summaryOverride ?? a.summary ?? "").trim().toLowerCase() === nom);
  if (!trouve) {
    throw new Error(`Calendrier « ${process.env.GOOGLE_CALENDAR_NAME ?? "rdv-coach"} » introuvable : partagez-le avec le compte de service (ou définissez GOOGLE_CALENDAR_ID)`);
  }
  agendaEnCache = { id: trouve.id, cleConfig: nom };
  return trouve.id;
}

/* ------------------------------------------------------------------ */
/* Disponibilités                                                       */
/* ------------------------------------------------------------------ */

export type Occupation = { debut: number; fin: number };

/** Périodes occupées de l'agenda (tout événement non « libre » compte). */
export async function occupations(debutIso: string, finIso: string): Promise<Occupation[]> {
  const id = await idAgenda();
  const reponse = await appeler("/freeBusy", {
    method: "POST",
    body: JSON.stringify({ timeMin: debutIso, timeMax: finIso, timeZone: fuseauActuel(), items: [{ id }] }),
  });
  if (!reponse.ok) throw new Error(`Google freeBusy HTTP ${reponse.status}`);
  const data = (await reponse.json()) as { calendars?: Record<string, { busy?: { start: string; end: string }[]; errors?: unknown[] }> };
  const agenda = data.calendars?.[id];
  if (!agenda || agenda.errors?.length) throw new Error("Google freeBusy : agenda inaccessible (partage ?)");
  return (agenda.busy ?? []).map((b) => ({ debut: Date.parse(b.start), fin: Date.parse(b.end) }));
}

export const chevauche = (o: Occupation, debutIso: string, finIso: string) => o.debut < Date.parse(finIso) && o.fin > Date.parse(debutIso);

/* ------------------------------------------------------------------ */
/* Événements                                                           */
/* ------------------------------------------------------------------ */

export type Client = { nom: string; telephone: string; email: string; message: string };

export type EvenementAgenda = {
  id: string;
  titre: string;
  debut: number;
  fin: number;
  creneauId: string | null;
  client: (Client & { creeLe: string }) | null;
};

type EvenementGoogle = {
  id: string;
  status?: string;
  transparency?: string;
  summary?: string;
  created?: string;
  start?: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
  extendedProperties?: { private?: Record<string, string> };
};

function versEvenement(e: EvenementGoogle): EvenementAgenda | null {
  if (e.status === "cancelled" || e.transparency === "transparent") return null;
  const lire = (p?: { dateTime?: string; date?: string }) =>
    p?.dateTime ? Date.parse(p.dateTime) : p?.date ? localVersUtc(p.date, "00:00") : null;
  const debut = lire(e.start);
  const fin = lire(e.end);
  if (debut === null || fin === null) return null;

  const p = e.extendedProperties?.private ?? {};
  return {
    id: e.id,
    titre: e.summary ?? "(sans titre)",
    debut,
    fin,
    creneauId: p.creneauId ?? null,
    client: p.creneauId
      ? { nom: p.clientNom ?? "", telephone: p.clientTelephone ?? "", email: p.clientEmail ?? "", message: p.clientMessage ?? "", creeLe: e.created ?? "" }
      : null,
  };
}

/** Événements de l'agenda dans une période (pour l'administration). */
export async function evenements(debutIso: string, finIso: string): Promise<EvenementAgenda[]> {
  const id = await idAgenda();
  const resultat: EvenementAgenda[] = [];
  let page: string | undefined;
  do {
    const params = new URLSearchParams({ timeMin: debutIso, timeMax: finIso, singleEvents: "true", orderBy: "startTime", maxResults: "250", timeZone: fuseauActuel() });
    if (page) params.set("pageToken", page);
    const reponse = await appeler(`/calendars/${encodeURIComponent(id)}/events?${params}`);
    if (!reponse.ok) throw new Error(`Google Agenda (liste) HTTP ${reponse.status}`);
    const data = (await reponse.json()) as { items?: EvenementGoogle[]; nextPageToken?: string };
    for (const e of data.items ?? []) {
      const v = versEvenement(e);
      if (v) resultat.push(v);
    }
    page = data.nextPageToken;
  } while (page);
  return resultat;
}

/** Événement créé pour un créneau donné (propriété privée « creneauId »). */
export async function evenementDuCreneau(creneauId: string): Promise<EvenementAgenda | null> {
  const id = await idAgenda();
  const params = new URLSearchParams({ privateExtendedProperty: `creneauId=${creneauId}`, singleEvents: "true", maxResults: "5" });
  const reponse = await appeler(`/calendars/${encodeURIComponent(id)}/events?${params}`);
  if (!reponse.ok) throw new Error(`Google Agenda (recherche) HTTP ${reponse.status}`);
  const data = (await reponse.json()) as { items?: EvenementGoogle[] };
  for (const e of data.items ?? []) {
    const v = versEvenement(e);
    if (v) return v;
  }
  return null;
}

export type EvenementEntree = { titre: string; description: string; debutIso: string; finIso: string; lieu?: string; creneauId: string; client: Client };

export async function creerEvenement(e: EvenementEntree): Promise<string> {
  const id = await idAgenda();
  const reponse = await appeler(`/calendars/${encodeURIComponent(id)}/events`, {
    method: "POST",
    body: JSON.stringify({
      summary: e.titre,
      description: e.description,
      location: e.lieu,
      start: { dateTime: e.debutIso, timeZone: fuseauActuel() },
      end: { dateTime: e.finIso, timeZone: fuseauActuel() },
      reminders: { useDefault: true },
      extendedProperties: {
        private: {
          creneauId: e.creneauId,
          clientNom: e.client.nom,
          clientTelephone: e.client.telephone,
          clientEmail: e.client.email,
          clientMessage: e.client.message,
        },
      },
    }),
  });
  if (!reponse.ok) throw new Error(`Google Agenda (création) HTTP ${reponse.status}`);
  const data = (await reponse.json()) as { id?: string };
  if (!data.id) throw new Error("Google Agenda : identifiant d'événement manquant");
  return data.id;
}

export async function supprimerEvenement(eventId: string): Promise<void> {
  const id = await idAgenda();
  const reponse = await appeler(`/calendars/${encodeURIComponent(id)}/events/${encodeURIComponent(eventId)}`, { method: "DELETE" });
  if (!reponse.ok && reponse.status !== 404 && reponse.status !== 410) {
    throw new Error(`Google Agenda (suppression) HTTP ${reponse.status}`);
  }
}
