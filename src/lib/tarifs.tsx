import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { TARIFS_PAR_DEFAUT, formaterDuree, formaterPrix, validerTarifs, type Tarifs } from "../../shared/tarifs";

/** Textes prêts à afficher. Tous les tarifs et durées du site passent par ici. */
export type TarifsAffichage = {
  /** false pendant le chargement : les montants sont masqués pour éviter d'afficher un ancien prix. */
  pret: boolean;
  decouverte: { titre: string; duree: string; prix: string; offerte: boolean };
  seance: { duree: string; prix: string };
  pack5: { prix: string };
  pack10: { prix: string };
  domicile: { supplement: string; phrase: string; reponse: string };
};

const SUR_DEMANDE = "Sur demande";

/**
 * `fiable = false` : l'API de tarifs est en panne. On n'affiche alors aucun montant
 * (« Sur demande ») plutôt qu'un prix possiblement obsolète.
 */
export function construireAffichage(t: Tarifs, fiable = true, pret = true): TarifsAffichage {
  const prix = (n: number) => (fiable ? formaterPrix(n) : SUR_DEMANDE);
  const offerte = fiable && t.decouverte.prix === 0;
  const supplement = fiable ? t.domicile.supplement : null;

  return {
    pret,
    decouverte: {
      titre: offerte ? "Séance découverte offerte" : "Séance découverte",
      duree: formaterDuree(t.decouverte.dureeMinutes),
      prix: offerte ? "Offerte" : prix(t.decouverte.prix),
      offerte,
    },
    seance: { duree: formaterDuree(t.seance.dureeMinutes), prix: prix(t.seance.prix) },
    pack5: { prix: prix(t.pack5.prix) },
    pack10: { prix: prix(t.pack10.prix) },
    domicile: {
      supplement: supplement === null ? SUR_DEMANDE : supplement === 0 ? "Sans supplément" : formaterPrix(supplement),
      phrase:
        supplement === null
          ? "Visites à domicile : supplément sur demande."
          : supplement === 0
            ? "Visites à domicile sans supplément."
            : `Visites à domicile : + ${formaterPrix(supplement)} par séance.`,
      reponse:
        supplement === null
          ? "Oui, des visites à domicile sont possibles : le supplément éventuel vous sera communiqué sur demande."
          : supplement === 0
            ? "Oui, des visites à domicile sont possibles, sans supplément."
            : `Oui, des visites à domicile sont possibles, avec un supplément de ${formaterPrix(supplement)} par séance.`,
    },
  };
}

export type ReponseTarifs = { tarifs: Tarifs; updatedAt: string | null; source: "serveur" | "defaut" };

const urlApi = (chemin: string) => `${import.meta.env.BASE_URL}api/${chemin}`;

/** Renvoie `null` quand il n'y a pas d'API (hébergement statique, `pnpm dev` sans serveur) : valeurs par défaut. */
async function charger(): Promise<ReponseTarifs | null> {
  const reponse = await fetch(urlApi("tarifs"), { headers: { Accept: "application/json" } });
  if (reponse.status === 404) return null;
  if (!reponse.ok) throw new Error(`Tarifs HTTP ${reponse.status}`);
  if (!(reponse.headers.get("content-type") ?? "").includes("application/json")) return null;

  const data = (await reponse.json()) as { tarifs?: unknown; updatedAt?: unknown; source?: unknown };
  const validation = validerTarifs(data.tarifs);
  if (validation.ok === false) throw new Error("Tarifs invalides");
  return {
    tarifs: validation.tarifs,
    updatedAt: typeof data.updatedAt === "string" ? data.updatedAt : null,
    source: data.source === "serveur" ? "serveur" : "defaut",
  };
}

export function useTarifs(): TarifsAffichage {
  const requete = useQuery({
    queryKey: ["tarifs"],
    queryFn: charger,
    staleTime: 60_000,
    retry: 1,
    refetchOnWindowFocus: false,
  });
  const tarifs = requete.data?.tarifs ?? TARIFS_PAR_DEFAUT;
  return construireAffichage(tarifs, !requete.isError, !requete.isPending);
}

/** Masque (sans décaler la mise en page) un montant tant que les vrais tarifs ne sont pas chargés. */
export function Tarif({ pret, children }: { pret: boolean; children: ReactNode }) {
  return <span className={pret ? undefined : "invisible"}>{children}</span>;
}
