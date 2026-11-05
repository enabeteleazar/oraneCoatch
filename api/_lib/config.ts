import { definirFuseau } from "../../shared/rdv.js";

/** Importé pour son effet : applique BOOKING_TIME_ZONE (défaut Europe/Paris) à tous les calculs d'horaires. */
definirFuseau(process.env.BOOKING_TIME_ZONE);
