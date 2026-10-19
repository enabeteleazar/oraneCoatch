import { json, lireJson } from "../_lib/http.js";
import {
  FENETRE_ECHECS_S,
  MAX_ECHECS,
  MIN_LONGUEUR_MOT_DE_PASSE,
  attendre,
  cleEchecs,
  cookieSession,
  creerJeton,
  motDePasseConfigure,
  origineValide,
  sessionValide,
  verifierMotDePasse,
} from "../_lib/auth.js";
import { incrementer, lireCompteur, modeStockage, supprimer } from "../_lib/store.js";

/** État de la session : sert à afficher le formulaire de connexion ou le tableau de bord. */
export async function GET(request: Request) {
  return json({
    configure: motDePasseConfigure() !== null,
    authentifie: sessionValide(request),
    stockage: modeStockage(),
  });
}

/** Connexion. */
export async function POST(request: Request) {
  if (!origineValide(request)) return json({ erreur: "Origine non autorisée." }, { status: 403 });

  const motDePasse = motDePasseConfigure();
  if (!motDePasse) {
    return json(
      { erreur: `La variable ADMIN_PASSWORD n'est pas définie sur le serveur (${MIN_LONGUEUR_MOT_DE_PASSE} caractères minimum).` },
      { status: 503 },
    );
  }

  const corps = (await lireJson(request, 1000)) as { motDePasse?: unknown } | undefined;
  const saisi = typeof corps?.motDePasse === "string" ? corps.motDePasse : "";
  if (saisi.length === 0 || saisi.length > 200) return json({ erreur: "Saisissez votre mot de passe." }, { status: 400 });

  const cle = cleEchecs(request);
  try {
    if ((await lireCompteur(cle)) >= MAX_ECHECS) {
      return json(
        { erreur: "Trop de tentatives. Réessayez dans quelques minutes." },
        { status: 429, headers: { "Retry-After": String(FENETRE_ECHECS_S) } },
      );
    }
  } catch (erreur) {
    console.error("Compteur de tentatives indisponible", erreur);
  }

  if (verifierMotDePasse(saisi)) {
    try {
      await supprimer(cle);
    } catch {
      /* sans conséquence */
    }
    return json({ authentifie: true }, { headers: { "Set-Cookie": cookieSession(request, creerJeton(motDePasse)) } });
  }

  try {
    await incrementer(cle, FENETRE_ECHECS_S);
  } catch (erreur) {
    console.error("Compteur de tentatives indisponible", erreur);
  }
  await attendre(600);
  return json({ erreur: "Mot de passe incorrect." }, { status: 401 });
}

/** Déconnexion. */
export async function DELETE(request: Request) {
  if (!origineValide(request)) return json({ erreur: "Origine non autorisée." }, { status: 403 });
  return json({ authentifie: false }, { headers: { "Set-Cookie": cookieSession(request, null) } });
}