import { TARIFS_PAR_DEFAUT, validerTarifs } from "../shared/tarifs.js";
import { sessionValide, origineValide } from "./_lib/auth.js";
import { json, lireJson } from "./_lib/http.js";
import { ecrireTarifs, lireTarifs, modeStockage } from "./_lib/store.js";

/** Tarifs publics : renvoie les tarifs enregistrés, ou ceux par défaut. */
export async function GET() {
  const enregistrement = await lireTarifs();
  return json({
    tarifs: enregistrement?.tarifs ?? TARIFS_PAR_DEFAUT,
    updatedAt: enregistrement?.updatedAt || null,
    source: enregistrement ? "serveur" : "defaut",
  });
}

/** Enregistrement des tarifs, réservé à une session administrateur valide. */
export async function PUT(request: Request) {
  if (!origineValide(request)) return json({ erreur: "Origine non autorisée." }, { status: 403 });
  if (!sessionValide(request)) return json({ erreur: "Authentification requise." }, { status: 401 });
  if (modeStockage() === "aucun") {
    return json({ erreur: "Aucun stockage configuré." }, { status: 503 });
  }

  const corps = (await lireJson(request)) as { tarifs?: unknown } | undefined;
  const validation = validerTarifs(corps?.tarifs);
  if (validation.ok === false) return json({ erreur: validation.erreur }, { status: 400 });

  try {
    const enregistrement = await ecrireTarifs(validation.tarifs);
    return json({ tarifs: enregistrement.tarifs, updatedAt: enregistrement.updatedAt });
  } catch (erreur) {
    console.error("Enregistrement des tarifs impossible", erreur);
    return json({ erreur: "L'enregistrement des tarifs a échoué." }, { status: 500 });
  }
}
