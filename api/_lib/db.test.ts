import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const VARIABLES = ["DATABASE_URL", "PGLITE_DIR", "VERCEL", "BOOKING_TIME_ZONE"] as const;
const environnementOriginal = new Map(VARIABLES.map((cle) => [cle, process.env[cle]]));
let dossier: string;

beforeEach(async () => {
  dossier = await mkdtemp(join(tmpdir(), "orane-db-migration-"));
  const base = new PGlite(dossier);
  await base.waitReady;
  await base.query(`
    CREATE TABLE booking_slots (
      id serial PRIMARY KEY,
      slot_date date NOT NULL,
      start_time time NOT NULL,
      end_time time NOT NULL,
      enabled boolean NOT NULL,
      created_at timestamp NOT NULL DEFAULT now()
    )
  `);
  await base.query(
    `INSERT INTO booking_slots (slot_date, start_time, end_time, enabled)
     VALUES ($1, $2, $3, true), ($1, $4, $5, false)`,
    ["2099-06-15", "10:00", "11:00", "12:00", "13:00"],
  );
  await base.close();

  delete process.env.DATABASE_URL;
  delete process.env.VERCEL;
  process.env.PGLITE_DIR = dossier;
  process.env.BOOKING_TIME_ZONE = "Europe/Paris";
  vi.resetModules();
});

afterEach(async () => {
  for (const [cle, valeur] of environnementOriginal) {
    if (valeur === undefined) delete process.env[cle];
    else process.env[cle] = valeur;
  }
  vi.resetModules();
  await rm(dossier, { recursive: true, force: true });
});

describe("migration des anciens créneaux", () => {
  it("conserve l’ancienne table et migre une seule fois les horaires vers la nouvelle", async () => {
    const { requete } = await import("./db");

    await requete("SELECT 1");
    const tables = await requete(
      `SELECT table_name FROM information_schema.tables
       WHERE table_schema = 'public' AND table_name IN ($1, $2)
       ORDER BY table_name`,
      ["booking_slots", "booking_slots_legacy"],
    );
    const creneaux = await requete(
      `SELECT starts_at, ends_at, enabled, slot_type FROM booking_slots ORDER BY starts_at`,
    );
    const anciens = await requete("SELECT count(*)::int AS count FROM booking_slots_legacy");

    expect(tables.map((ligne) => ligne.table_name)).toEqual([
      "booking_slots",
      "booking_slots_legacy",
    ]);
    expect(creneaux).toEqual([
      {
        starts_at: new Date("2099-06-15T08:00:00.000Z"),
        ends_at: new Date("2099-06-15T09:00:00.000Z"),
        enabled: true,
        slot_type: "seance",
      },
      {
        starts_at: new Date("2099-06-15T10:00:00.000Z"),
        ends_at: new Date("2099-06-15T11:00:00.000Z"),
        enabled: false,
        slot_type: "seance",
      },
    ]);
    expect(anciens[0].count).toBe(2);

    await requete("SELECT 1");
    const nombreApresNouvelleRequete = await requete(
      "SELECT count(*)::int AS count FROM booking_slots",
    );
    expect(nombreApresNouvelleRequete[0].count).toBe(2);
  });
});
