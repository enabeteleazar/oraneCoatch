import "../_lib/config.js";
import { json } from "../_lib/http.js";
import { exigerAdmin } from "../_lib/auth.js";
import { alerter, canauxAlerte } from "../_lib/notifier.js";

/** Envoie une alerte de test sur les canaux configurés (WhatsApp, ntfy) pour vérifier la configuration. */
export async function POST(request: Request) {
  const refus = exigerAdmin(request, true);
  if (refus) return refus;
  if (canauxAlerte().length === 0) {
    return json({ erreur: "Aucun canal d'alerte configuré (WhatsApp ou ntfy). Voir .env.example." }, { status: 400 });
  }
  const origine = new URL(request.url).origin;
  const resultats = await alerter({ jour: "Mardi 10 novembre (test)", heure: "14:00", type: "Séance individuelle", lien: `${origine}/admin` });
  return json({ resultats });
}
