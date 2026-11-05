import { queryDatabase } from "./_database.js";

const BOOKING_SLOT_COLUMNS = `
  id,
  slot_date::text AS slot_date,
  start_time::text AS start_time,
  end_time::text AS end_time,
  enabled
`;

const DEFAULT_TIME_ZONE = "Europe/Paris";

// Seuls les créneaux actifs à partir d'aujourd'hui (dans le fuseau du coach)
// sont proposés. Les créneaux d'aujourd'hui déjà commencés sont filtrés
// ensuite à la minute près dans buildAvailability().
const ACTIVE_SLOTS_QUERY = `
  SELECT ${BOOKING_SLOT_COLUMNS}
  FROM booking_slots_legacy
  WHERE enabled = true
    AND slot_date >= (now() AT TIME ZONE $1::text)::date
  ORDER BY slot_date ASC, start_time ASC
`;

function sanitize(value) {
  return typeof value === "string" ? value.trim() : "";
}

function getBookingTimeZone() {
  return sanitize(process.env.BOOKING_TIME_ZONE) || DEFAULT_TIME_ZONE;
}

function toDateKey(value) {
  if (value instanceof Date) {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: DEFAULT_TIME_ZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(value);
    const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));

    return `${values.year}-${values.month}-${values.day}`;
  }

  const stringValue = sanitize(String(value ?? ""));
  const match = /^(\d{4}-\d{2}-\d{2})/.exec(stringValue);
  return match ? match[1] : "";
}

function toTimeKey(value) {
  if (value instanceof Date) {
    return value.toISOString().slice(11, 16);
  }

  const stringValue = sanitize(String(value ?? ""));
  const match = /^(\d{2}:\d{2})/.exec(stringValue);
  return match ? match[1] : "";
}

function timeToMinutes(time) {
  const [hour, minute] = time.split(":").map(Number);
  return hour * 60 + minute;
}

function isValidDate(date) {
  return /^\d{4}-\d{2}-\d{2}$/.test(date);
}

function isValidTime(time) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(time);
}

function mapSlot(row) {
  return {
    id: String(row.id),
    date: toDateKey(row.slot_date),
    startTime: toTimeKey(row.start_time),
    endTime: toTimeKey(row.end_time),
    enabled: Boolean(row.enabled),
  };
}

function normalizeSlotInput(payload, { partial = false } = {}) {
  const date = toDateKey(payload?.date ?? payload?.slot_date);
  const startTime = toTimeKey(payload?.startTime ?? payload?.start_time);
  const endTime = toTimeKey(payload?.endTime ?? payload?.end_time);
  const enabled =
    typeof payload?.enabled === "boolean" ? payload.enabled : payload?.enabled;

  const value = {};

  if (date || !partial) {
    if (!isValidDate(date)) {
      return { error: "La date du créneau est invalide." };
    }
    value.date = date;
  }

  if (startTime || !partial) {
    if (!isValidTime(startTime)) {
      return { error: "L'heure de début est invalide." };
    }
    value.startTime = startTime;
  }

  if (endTime || !partial) {
    if (!isValidTime(endTime)) {
      return { error: "L'heure de fin est invalide." };
    }
    value.endTime = endTime;
  }

  const finalStartTime = value.startTime ?? toTimeKey(payload?.currentStartTime);
  const finalEndTime = value.endTime ?? toTimeKey(payload?.currentEndTime);

  if (
    finalStartTime &&
    finalEndTime &&
    timeToMinutes(finalStartTime) >= timeToMinutes(finalEndTime)
  ) {
    return { error: "L'heure de fin doit être après l'heure de début." };
  }

  if (enabled !== undefined) {
    if (enabled === true || enabled === false) {
      value.enabled = enabled;
    } else {
      return { error: "Le statut du créneau est invalide." };
    }
  }

  return { value };
}

// `query` permet d'exécuter la lecture sur une connexion déjà ouverte
// (par exemple celle qui détient le verrou de réservation).
export async function getActiveBookingSlots(query = queryDatabase) {
  const { rows } = await query(ACTIVE_SLOTS_QUERY, [getBookingTimeZone()]);
  return rows.map(mapSlot);
}

export async function countActiveBookingSlots() {
  const { rows } = await queryDatabase(
    `
      SELECT COUNT(*)::int AS count
      FROM booking_slots_legacy
      WHERE enabled = true
        AND slot_date >= (now() AT TIME ZONE $1::text)::date
    `,
    [getBookingTimeZone()],
  );
  return Number(rows[0]?.count ?? 0);
}

export async function getBookingSlots() {
  const { rows } = await queryDatabase(`
    SELECT ${BOOKING_SLOT_COLUMNS}
    FROM booking_slots_legacy
    ORDER BY slot_date ASC, start_time ASC
  `);
  return rows.map(mapSlot);
}

export async function createBookingSlot(payload) {
  const normalized = normalizeSlotInput(payload);

  if (normalized.error) {
    return { error: normalized.error };
  }

  const { date, startTime, endTime, enabled = true } = normalized.value;
  const { rows } = await queryDatabase(
    `
      INSERT INTO booking_slots_legacy (slot_date, start_time, end_time, enabled)
      VALUES ($1::date, $2::time, $3::time, $4::boolean)
      RETURNING ${BOOKING_SLOT_COLUMNS}
    `,
    [date, startTime, endTime, enabled],
  );

  return { value: mapSlot(rows[0]) };
}

export async function updateBookingSlot(id, payload) {
  const slotId = sanitize(id);
  if (!/^[1-9]\d*$/.test(slotId)) {
    return { error: "L'identifiant du créneau est invalide." };
  }

  const { rows: existingRows } = await queryDatabase(
    `SELECT ${BOOKING_SLOT_COLUMNS} FROM booking_slots_legacy WHERE id = $1`,
    [Number(slotId)],
  );
  if (!existingRows[0]) {
    return { error: "Le créneau est introuvable.", statusCode: 404 };
  }
  const existing = mapSlot(existingRows[0]);
  const normalized = normalizeSlotInput(
    {
      ...payload,
      currentStartTime: existing.startTime,
      currentEndTime: existing.endTime,
    },
    { partial: true },
  );

  if (normalized.error) {
    return { error: normalized.error };
  }

  if (Object.keys(normalized.value).length === 0) {
    return { error: "Aucune modification n'a été fournie." };
  }

  const date = normalized.value.date ?? existing.date;
  const startTime = normalized.value.startTime ?? existing.startTime;
  const endTime = normalized.value.endTime ?? existing.endTime;
  const enabled = normalized.value.enabled ?? existing.enabled;
  const { rows } = await queryDatabase(
    `
      UPDATE booking_slots_legacy
      SET slot_date = $1::date,
          start_time = $2::time,
          end_time = $3::time,
          enabled = $4::boolean
      WHERE id = $5
      RETURNING ${BOOKING_SLOT_COLUMNS}
    `,
    [date, startTime, endTime, enabled, Number(slotId)],
  );

  if (!rows[0]) {
    return { error: "Le créneau est introuvable.", statusCode: 404 };
  }

  return { value: mapSlot(rows[0]) };
}

export async function deleteBookingSlot(id) {
  const slotId = sanitize(id);
  if (!/^[1-9]\d*$/.test(slotId)) {
    return { error: "L'identifiant du créneau est invalide." };
  }

  const { rowCount } = await queryDatabase("DELETE FROM booking_slots_legacy WHERE id = $1", [
    Number(slotId),
  ]);

  if (rowCount === 0) {
    return { error: "Le créneau est introuvable.", statusCode: 404 };
  }

  return { value: { success: true } };
}
