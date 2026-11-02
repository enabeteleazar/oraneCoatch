import { requireAdmin, sendAdminError } from "../_adminAuth.js";
import {
  createPricingPlan,
  deactivatePricingPlan,
  getPricingPlans,
  updatePricingPlan,
} from "../_pricingPlans.js";
import { json, parseBody } from "../_googleCalendar.js";

const COLLECTION_PATH = "/api/admin/pricing-plans";
const ROUTE_PARAM = "__admin_route";
const ID_PARAM = "__admin_id";

function getQueryValue(req, url, key) {
  if (url.searchParams.has(key)) {
    return url.searchParams.get(key);
  }

  const value = req.query?.[key];
  return Array.isArray(value) ? value[0] : value;
}

function getRoute(req) {
  const url = new URL(req.url ?? "/", "http://localhost");
  const pathname =
    url.pathname.length > 1 ? url.pathname.replace(/\/+$/, "") : url.pathname;

  if (pathname === COLLECTION_PATH) {
    if (getQueryValue(req, url, ROUTE_PARAM) === "item") {
      const id = getQueryValue(req, url, ID_PARAM);
      return id ? { type: "item", id } : null;
    }

    return { type: "collection" };
  }

  const prefix = `${COLLECTION_PATH}/`;
  if (!pathname.startsWith(prefix)) {
    return null;
  }

  const segments = pathname.slice(prefix.length).split("/");
  if (segments.length !== 1 || !segments[0]) {
    return null;
  }

  try {
    return { type: "item", id: decodeURIComponent(segments[0]) };
  } catch {
    return null;
  }
}

async function handleCollection(req, res) {
  if (req.method === "GET") {
    const plans = await getPricingPlans();
    return json(res, 200, { plans });
  }

  if (req.method === "POST") {
    const payload = await parseBody(req, 64 * 1024);
    const result = await createPricingPlan(payload);

    if (result.error) {
      return json(res, 400, { error: result.error });
    }

    return json(res, 201, { plan: result.value });
  }

  res.setHeader("Allow", "GET, POST");
  return json(res, 405, { error: "Méthode non autorisée." });
}

async function handleItem(req, res, id) {
  if (req.method === "PATCH" || req.method === "PUT") {
    const payload = await parseBody(req, 64 * 1024);
    const result = await updatePricingPlan(id, payload);

    if (result.error) {
      return json(res, result.statusCode ?? 400, { error: result.error });
    }

    return json(res, 200, { plan: result.value });
  }

  if (req.method === "DELETE") {
    const result = await deactivatePricingPlan(id);

    if (result.error) {
      return json(res, result.statusCode ?? 400, { error: result.error });
    }

    return json(res, 200, { plan: result.value });
  }

  res.setHeader("Allow", "PATCH, PUT, DELETE");
  return json(res, 405, { error: "Méthode non autorisée." });
}

export default async function handler(req, res) {
  const route = getRoute(req);
  if (!route) {
    return json(res, 404, { error: "Ressource introuvable." });
  }

  const admin = await requireAdmin(req);
  if (!admin.ok) {
    return sendAdminError(res, admin);
  }

  try {
    return route.type === "collection"
      ? await handleCollection(req, res)
      : await handleItem(req, res, route.id);
  } catch (error) {
    console.error(
      route.type === "collection"
        ? "[admin/pricing-plans]"
        : "[admin/pricing-plans/:id]",
      error,
    );
    return json(res, 500, {
      error:
        error instanceof Error
          ? error.message
          : route.type === "collection"
            ? "Les tarifs n'ont pas pu être chargés."
            : "Le tarif n'a pas pu être modifié.",
    });
  }
}
