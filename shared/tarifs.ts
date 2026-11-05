/**
 * Tarifs du site : source unique partagée entre le site (navigateur) et l'API (serveur).
 * Aucune dépendance : ce fichier doit rester du TypeScript pur.
 */

export type Seance = { dureeMinutes: number; prix: number };

export type Tarifs = {
  decouverte: Seance;
  seance: Seance;
  pack5: { prix: number };
  pack10: { prix: number };
  domicile: { supplement: number };
};

/** Valeurs utilisées tant qu'aucun tarif n'a été enregistré depuis /admin. */
export const TARIFS_PAR_DEFAUT: Tarifs = {
  decouverte: { dureeMinutes: 30, prix: 0 },
  seance: { dureeMinutes: 90, prix: 60 },
  pack5: { prix: 280 },
  pack10: { prix: 560 },
  domicile: { supplement: 10 },
};

export const BORNES = {
  prixMax: 5000,
  supplementMax: 500,
  dureeMin: 5,
  dureeMax: 480,
} as const;

export type Validation = { ok: true; tarifs: Tarifs } | { ok: false; erreur: string };

function estObjet(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function montant(v: unknown, max: number, etiquette: string): number | string {
  if (typeof v !== "number" || !Number.isFinite(v)) return `${etiquette} : saisissez un nombre.`;
  if (v < 0 || v > max) return `${etiquette} : le montant doit être compris entre 0 et ${max} €.`;
  if (Math.round(v * 100) / 100 !== v) return `${etiquette} : 2 décimales maximum.`;
  return v;
}

function duree(v: unknown, etiquette: string): number | string {
  if (typeof v !== "number" || !Number.isFinite(v)) return `${etiquette} : saisissez un nombre de minutes.`;
  if (!Number.isInteger(v) || v < BORNES.dureeMin || v > BORNES.dureeMax) {
    return `${etiquette} : la durée doit être un nombre entier de minutes entre ${BORNES.dureeMin} et ${BORNES.dureeMax}.`;
  }
  return v;
}

/** Vérifie une entrée inconnue et renvoie des tarifs propres (champs inconnus ignorés). */
export function validerTarifs(entree: unknown): Validation {
  if (!estObjet(entree)) return { ok: false, erreur: "Format de tarifs invalide." };
  const lire = (cle: string): Record<string, unknown> => (estObjet(entree[cle]) ? (entree[cle] as Record<string, unknown>) : {});

  const d = lire("decouverte");
  const s = lire("seance");
  const p5 = lire("pack5");
  const p10 = lire("pack10");
  const dom = lire("domicile");

  const champs = [
    duree(d.dureeMinutes, "Séance découverte (durée)"),
    montant(d.prix, BORNES.prixMax, "Séance découverte (prix)"),
    duree(s.dureeMinutes, "Séance individuelle (durée)"),
    montant(s.prix, BORNES.prixMax, "Séance individuelle (prix)"),
    montant(p5.prix, BORNES.prixMax, "Pack 5 séances (prix)"),
    montant(p10.prix, BORNES.prixMax, "Pack 10 séances (prix)"),
    montant(dom.supplement, BORNES.supplementMax, "Visite à domicile (supplément)"),
  ];
  const erreur = champs.find((c): c is string => typeof c === "string");
  if (erreur) return { ok: false, erreur };

  const [dd, dp, sd, sp, p5p, p10p, ds] = champs as number[];
  return {
    ok: true,
    tarifs: {
      decouverte: { dureeMinutes: dd, prix: dp },
      seance: { dureeMinutes: sd, prix: sp },
      pack5: { prix: p5p },
      pack10: { prix: p10p },
      domicile: { supplement: ds },
    },
  };
}

/** 60 → « 60 € », 62.5 → « 62,50 € » (espace insécable avant le symbole). */
export function formaterPrix(n: number): string {
  const decimales = Number.isInteger(n) ? 0 : 2;
  const texte = new Intl.NumberFormat("fr-FR", { minimumFractionDigits: decimales, maximumFractionDigits: decimales }).format(n);
  return `${texte}\u00a0€`;
}

/** 30 → « 30 minutes », 60 → « 1 h », 90 → « 1 h 30 », 65 → « 1 h 05 ». */
export function formaterDuree(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} minutes`;
  if (m === 0) return `${h} h`;
  return `${h} h ${String(m).padStart(2, "0")}`;
}
