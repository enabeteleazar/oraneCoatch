import { TARIFS_PAR_DEFAUT } from "../../shared/tarifs.js";
import { TYPES_CRENEAU, genererCreneaux, type Creneau, type TypeCreneau } from "../../shared/rdv.js";
import { json, lireJson } from "../_lib/http.js";
import { exigerAdmin } from "../_lib/auth.js";
import { lireTarifs, modeStockage } from "../_lib/store.js";
import { ecrireCreneaux, lireCreneaux, lireReservations } from "../_lib/rdv-store.js";

const SANS_STOCKAGE = { erreur: "Aucun stockage n'est configuré sur le serveur : ajoutez Upstash Redis (Marketplace Vercel)." };

/** Liste des créneaux (libres et réservés) depuis hier. */
export async function GET(request: Request) {
  const refus = exigerAdmin(request, false);
  if (refus) return refus;
  if (modeStockage() === "aucun") return json(SANS_STOCKAGE, { status: 503 });

  try {
    const depuis = Date.now() - 24 * 3_600_000;
    const creneaux = (await lireCreneaux()).filter((c) => Date.parse(c.fin) > depuis);
    const reservations = await lireReservations(creneaux.map((c) => c.id));
    return json({
      creneaux: creneaux.map((c) => {
        const r = reservations.get(c.id);
        return { ...c, reservation: r ? { nom: r.nom, telephone: r.telephone, email: r.email, message: r.message, creeLe: r.creeLe } : null };
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
  if (modeStockage() === "aucun") return json(SANS_STOCKAGE, { status: 503 });

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

    const existants = await lireCreneaux();
    const maintenant = Date.now();
    let passes = 0;
    let chevauchements = 0;
    const nouveaux: Creneau[] = [];

    for (const c of plage.creneaux) {
      if (c.debut <= maintenant) {
        passes++;
        continue;
      }
      const occupe = [...existants, ...nouveaux].some((e) => Date.parse(e.debut) < c.fin && Date.parse(e.fin) > c.debut);
      if (occupe) {
        chevauchements++;
        continue;
      }
      nouveaux.push({ id: crypto.randomUUID(), debut: new Date(c.debut).toISOString(), fin: new Date(c.fin).toISOString(), type });
    }

    if (nouveaux.length === 0) {
      return json({ erreur: "Aucun créneau créé : ils sont tous dans le passé ou chevauchent des créneaux existants.", passes, chevauchements }, { status: 400 });
    }
    await ecrireCreneaux([...existants, ...nouveaux]);
    return json({ crees: nouveaux.length, passes, chevauchements });
  } catch (erreur) {
    console.error("Création des créneaux impossible", erreur);
    return json({ erreur: "La création des créneaux a échoué. Réessayez dans un instant." }, { status: 502 });
  }
}

/** Suppression d'un créneau libre (?id=…). */
export async function DELETE(request: Request) {
  const refus = exigerAdmin(request, true);
  if (refus) return refus;
  if (modeStockage() === "aucun") return json(SANS_STOCKAGE, { status: 503 });

  const id = new URL(request.url).searchParams.get("id") ?? "";
  if (!id || id.length > 64) return json({ erreur: "Créneau inconnu." }, { status: 400 });

  try {
    const existants = await lireCreneaux();
    if (!existants.some((c) => c.id === id)) return json({ erreur: "Créneau introuvable." }, { status: 404 });
    if ((await lireReservations([id])).has(id)) {
      return json({ erreur: "Ce créneau est réservé : annulez d'abord le rendez-vous." }, { status: 409 });
    }
    await ecrireCreneaux(existants.filter((c) => c.id !== id));
    return json({ ok: true });
  } catch (erreur) {
    console.error("Suppression du créneau impossible", erreur);
    return json({ erreur: "La suppression a échoué. Réessayez dans un instant." }, { status: 502 });
  }
}
