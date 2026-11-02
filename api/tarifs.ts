import { TARIFS_PAR_DEFAUT, validerTarifs } from "../shared/tarifs.js";
import { json, lireJson } from "./_lib/http.js";
import { origineValide, sessionValide } from "./_lib/auth.js";
import { ecrireTarifs, lireTarifs, modeStockage } from "./_lib/store.js";

/** Public : tarifs affichés sur le site. */
export async function GET() {
  try {
    const enreg = modeStockage() === "aucune" ? null : await lireTarifs();
    return json(
      {
        tarifs: enreg?.tarifs ?? TARIFS_PAR_DEFAUT,
        updatedAt: enreg?.updatedAt || null,
        source: enreg ? "serveur" : "defaut",
      },
      { headers: { "Cache-Control": "public, max-age=0, s-maxage=10, stale-while-revalidate=30" } },
    );
  } catch (erreur) {
    console.error("Lecture des tarifs impossible", erreur);
    return json({ erreur: "Tarifs momentanément indisponibles." }, { status: 503 });
  }
}

/** Réservé à l'administratrice ou l'administrateur connecté. */
export async function PUT(request: Request) {
  if (!origineValide(request)) return json({ erreur: "Origine non autorisée." }, { status: 403 });
  if (!sessionValide(request)) return json({ erreur: "Session expirée : reconnectez-vous." }, { status: 401 });
  if (modeStockage() === "aucune") {
    return json(
      { erreur: "La base de données n'est pas configurée sur le serveur : définissez DATABASE_URL (Neon)." },
      { status: 503 },
    );
  }

  const corps = (await lireJson(request)) as { tarifs?: unknown } | undefined;
  if (!corps) return json({ erreur: "Requête invalide." }, { status: 400 });

  const validation = validerTarifs(corps.tarifs);
  if (validation.ok === false) return json({ erreur: validation.erreur }, { status: 400 });

  try {
    const enreg = await ecrireTarifs(validation.tarifs);
    return json({ tarifs: enreg.tarifs, updatedAt: enreg.updatedAt, source: "serveur" });
  } catch (erreur) {
    console.error("Enregistrement des tarifs impossible", erreur);
    return json({ erreur: "L'enregistrement a échoué. Réessayez dans un instant." }, { status: 502 });
  }
}
