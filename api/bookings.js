import { getClientIp } from "./_clientIp.js";
import {
  checkDatabaseAccess,
  isDatabaseConfigured,
  withTransaction,
} from "./_database.js";
import { countActiveBookingSlots } from "./_bookingSlots.js";
import {
  BOOKING_ACTION,
  getExpectedHostnames,
  verifyTurnstileToken,
} from "./_turnstile.js";
import {
  buildAvailability,
  createBooking,
  findSlot,
  getCalendarId,
  getGoogleEventsCount,
  isGoogleCalendarConfigured,
  json,
  parseBody,
  sanitize,
} from "./_googleCalendar.js";

const BOOKING_ROUTE_PARAM = "__booking_route";
const BOOKING_LOCK_KEY = "equilibre-coaching:booking";
const BOOKING_LOCK_TIMEOUT = "15s";
const LOCK_TIMEOUT_ERROR_CODE = "55P03";

class SlotUnavailableError extends Error {}

function getRoute(req) {
  const url = new URL(req.url ?? "/", "http://localhost");
  const rewrittenRoute = url.searchParams.get(BOOKING_ROUTE_PARAM);

  if (rewrittenRoute === "availability" || rewrittenRoute === "health") {
    return rewrittenRoute;
  }

  switch (url.pathname) {
    case "/api/bookings":
      return "bookings";
    case "/api/bookings/availability":
      return "availability";
    case "/api/bookings/health":
      return "health";
    default:
      return null;
  }
}

function validatePayload(payload) {
  const name = sanitize(payload?.name);
  const phone = sanitize(payload?.phone);
  const start = sanitize(payload?.start);
  const end = sanitize(payload?.end);
  const website = sanitize(payload?.website);
  const turnstileToken = sanitize(payload?.turnstileToken);

  if (website) {
    return { error: "La réservation n'a pas pu être validée." };
  }

  if (name.length < 2) {
    return { error: "Veuillez indiquer votre nom complet." };
  }

  if (phone.length < 6) {
    return { error: "Veuillez indiquer un numéro de téléphone valide." };
  }

  if (!start || !end) {
    return { error: "Veuillez sélectionner un créneau." };
  }

  const startTime = Date.parse(start);
  const endTime = Date.parse(end);

  if (Number.isNaN(startTime) || Number.isNaN(endTime) || endTime <= startTime) {
    return { error: "Le créneau sélectionné est invalide." };
  }

  if (startTime <= Date.now()) {
    return {
      error: "Ce créneau est déjà passé. Choisissez un autre horaire.",
      statusCode: 409,
    };
  }

  return { value: { name, phone, start, end, turnstileToken } };
}

async function handleBooking(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return json(res, 405, { error: "Méthode non autorisée." });
  }

  let payload;

  try {
    payload = await parseBody(req);
  } catch {
    return json(res, 400, { error: "La requête est invalide." });
  }

  const validation = validatePayload(payload);

  if (validation.error) {
    return json(res, validation.statusCode ?? 400, { error: validation.error });
  }

  const { name, phone, start, end, turnstileToken } = validation.value;

  try {
    const captcha = await verifyTurnstileToken(turnstileToken, {
      remoteIp: getClientIp(req),
      expectedAction: BOOKING_ACTION,
      expectedHostnames: getExpectedHostnames(req),
    });

    if (!captcha.success) {
      return json(res, 403, {
        error: "La vérification anti-robot a échoué. Rechargez la page et réessayez.",
      });
    }
  } catch (error) {
    console.error("[bookings] Turnstile injoignable:", error);
    return json(res, 503, {
      error: "La vérification anti-robot est indisponible. Réessayez dans un instant.",
    });
  }

  try {
    await withTransaction(async (client) => {
      await client.query(`SET LOCAL lock_timeout = '${BOOKING_LOCK_TIMEOUT}'`);
      await client.query("SELECT pg_advisory_xact_lock(hashtext($1))", [
        BOOKING_LOCK_KEY,
      ]);

      const availability = await buildAvailability({
        query: (text, params) => client.query(text, params),
      });
      const slot = findSlot(availability, start, end);

      if (!slot || slot.status !== "available") {
        throw new SlotUnavailableError();
      }

      await createBooking({ name, phone, start, end });
    });

    return json(res, 200, { success: true });
  } catch (error) {
    if (error instanceof SlotUnavailableError) {
      return json(res, 409, {
        error: "Ce créneau n'est plus disponible. Choisissez un autre horaire.",
      });
    }

    if (error?.code === LOCK_TIMEOUT_ERROR_CODE) {
      return json(res, 503, {
        error: "Le service de réservation est occupé. Réessayez dans un instant.",
      });
    }

    console.error("[bookings]", error);
    return json(res, 500, {
      error:
        error instanceof Error
          ? error.message
          : "La réservation n'a pas pu être validée.",
    });
  }
}

async function handleAvailability(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return json(res, 405, { error: "Méthode non autorisée." });
  }

  try {
    const availability = await buildAvailability();
    return json(res, 200, availability);
  } catch (error) {
    console.error("[bookings/availability]", error);
    return json(res, 500, {
      error:
        error instanceof Error
          ? error.message
          : "Les disponibilités n'ont pas pu être chargées.",
    });
  }
}

async function handleHealth(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return json(res, 405, { error: "Méthode non autorisée." });
  }

  const databaseConfigured = isDatabaseConfigured();
  let databaseAccess = false;
  let databaseSlotsCount = 0;

  if (databaseConfigured) {
    try {
      await checkDatabaseAccess();
      databaseSlotsCount = await countActiveBookingSlots();
      databaseAccess = true;
    } catch (error) {
      console.error("[bookings/health] Postgres inaccessible:", {
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  const googleCalendarConfigured = isGoogleCalendarConfigured();
  let googleCalendarAccess = false;
  let googleEventsCount = 0;

  if (googleCalendarConfigured) {
    try {
      if (databaseAccess) {
        googleEventsCount = await getGoogleEventsCount();
      } else {
        await getCalendarId();
      }
      googleCalendarAccess = true;
    } catch (error) {
      console.error("[bookings/health] Google Calendar inaccessible:", {
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return json(res, 200, {
    database_configured: databaseConfigured,
    database_access: databaseAccess,
    database_slots_count: databaseSlotsCount,
    google_calendar_configured: googleCalendarConfigured,
    google_calendar_access: googleCalendarAccess,
    google_events_count: googleEventsCount,
  });
}

export default async function handler(req, res) {
  switch (getRoute(req)) {
    case "bookings":
      return handleBooking(req, res);
    case "availability":
      return handleAvailability(req, res);
    case "health":
      return handleHealth(req, res);
    default:
      return json(res, 404, { error: "Ressource introuvable." });
  }
}
