import { TARIFS_PAR_DEFAUT } from "../../shared/tarifs.js";
import { TYPES_CRENEAU, genererCreneaux, type Creneau, type TypeCreneau } from "../../shared/rdv.js";
import "../_lib/config.js";
import { json, lireJson } from "../_lib/http.js";
import { exigerAdmin } from "../_lib/auth.js";
import { lireTarifs, modeStockage } from "../_lib/store.js";
import { agendaConfigure, evenementDuCreneau, evenements, type EvenementAgenda } from "../_lib/google.js";
import { creerCreneaux, lireCreneauxEntre, purgerAnciensCreneaux, supprimerCreneau } from "../_lib/rdv-store.js";

const SANS_BASE = { erreur: "La base de données n'est pas configurée sur le serveur : définissez DATABASE_URL (Neon)." };

type EtatCreneau = "libre" | "reserve" | "occupe";

/** Liste des créneaux depuis hier, avec leur état d'après Google Agenda. */
export async function GET(request: Request) {
  const refus = exigerAdmin(request, false);
  if (refus) return refus;
  if (modeStockage() === "aucune") return json(SANS_BASE, { status: 503 });

  try {
    await purgerAnciensCreneaux().catch(() => undefined);
    const depuis = new Date(Date.now() - 24 * 3_600_000).toISOString();
    const jusqua = new Date(Date.now() + 180 * 86_400_000).toISOString();
    const creneaux = await lireCreneauxEntre(depuis, jusqua);

    let agenda: EvenementAgenda[] | null = null;
    let agendaErreur: string | null = null;
    if (agendaConfigure() && creneaux.length > 0) {
      try {
        agenda = await evenements(depuis, jusqua);
      } catch (erreur) {
        console.error("Lecture de Google Agenda impossible", erreur);
        agendaErreur = "Google Agenda est injoignable : l'état « libre / réservé » des créneaux n'est pas fiable pour le moment.";
      }
    }

    return json({
      agendaErreur,
      creneaux: creneaux.map((c) => {
        const e = agenda?.find((ev) => ev.debut < Date.parse(c.fin) && ev.fin > Date.parse(c.debut));
        const etat: EtatCreneau = !e ? "libre" : e.creneauId === c.id ? "reserve" : "occupe";
        return {
          ...c,
          etat,
          reservation: etat === "reserve" ? e?.client ?? null : null,
          evenement: etat === "occupe" && e ? { titre: e.titre } : null,
        };
      }),
    });
  } catch (erreur) {
    console.error("Lecture des créneaux impossible", erreur);
    return json({ erreur: "Lecture des créneaux impossible." }, { status: 502 });
  }
}

/** Création d'une plage horaire découpée en créneaux, éventuellement répétée chaque semaine. */
export async function POST(request: Request) {
  const refus = exigerAdmin(request, true);
  if (refus) return refus;
  if (modeStockage() === "aucune") return json(SANS_BASE, { status: 503 });

  const corps = (await lireJson(request, 2000)) as Record<string, unknown> | undefined;
  if (!corps) return json({ erreur: "Requête invalide." }, { status: 400 });

  const type = corps.type as TypeCreneau;
  if (!TYPES_CRENEAU.includes(type)) return json({ erreur: "Type de séance invalide." }, { status: 400 });

  try {
    const tarifs = (await lireTarifs())?.tarifs ?? TARIFS_PAR_DEFAUT;
    const plage = genererCreneaux({
      date: String(corps.date ?? ""),
      debut: String(corps.debut ?? ""),
      fin: String(corps.fin ?? ""),
      dureeMinutes: type === "decouverte" ? tarifs.decouverte.dureeMinutes : tarifs.seance.dureeMinutes,
      pauseMinutes: Number(corps.pauseMinutes),
      semaines: Number(corps.semaines),
    });
    if (plage.ok === false) return json({ erreur: plage.erreur }, { status: 400 });

    const maintenant = Date.now();
    const futurs = plage.creneaux.filter((c) => c.debut > maintenant);
    const passes = plage.creneaux.length - futurs.length;
    if (futurs.length === 0) return json({ erreur: "Aucun créneau créé : ils sont tous dans le passé.", passes, chevauchements: 0 }, { status: 400 });

    const { crees, ignores } = await creerCreneaux(futurs, type);
    if (crees === 0) {
      return json({ erreur: "Aucun créneau créé : ils chevauchent des créneaux existants.", passes, chevauchements: ignores }, { status: 400 });
    }
    return json({ crees, passes, chevauchements: ignores });
  } catch (erreur) {
    console.error("Création des créneaux impossible", erreur);
    return json({ erreur: "La création des créneaux a échoué. Réessayez dans un instant." }, { status: 502 });
  }
}

/** Suppression d'un créneau non réservé (?id=…). */
export async function DELETE(request: Request) {
  const refus = exigerAdmin(request, true);
  if (refus) return refus;
  if (modeStockage() === "aucune") return json(SANS_BASE, { status: 503 });

  const id = new URL(request.url).searchParams.get("id") ?? "";
  if (!id || id.length > 64) return json({ erreur: "Créneau inconnu." }, { status: 400 });

  try {
    if (agendaConfigure() && (await evenementDuCreneau(id))) {
      return json({ erreur: "Ce créneau est réservé : annulez d'abord le rendez-vous." }, { status: 409 });
    }
    return (await supprimerCreneau(id)) ? json({ ok: true }) : json({ erreur: "Créneau introuvable." }, { status: 404 });
  } catch (erreur) {
    console.error("Suppression du créneau impossible", erreur);
    return json({ erreur: "La suppression a échoué (Google Agenda injoignable ?). Réessayez dans un instant." }, { status: 502 });
  }
}

export type { Creneau };
