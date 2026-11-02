-- Schéma de la base Neon (Postgres).
-- Les tables sont créées automatiquement au premier appel de l'API : ce fichier sert de référence
-- (ou pour les créer à la main depuis la console SQL de Neon).

-- Créneaux proposés par le coach. Les réservations réelles vivent dans Google Agenda :
-- un créneau est « réservé » lorsqu'un événement de l'agenda chevauche son horaire.
CREATE TABLE IF NOT EXISTS booking_slots (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  starts_at     timestamptz NOT NULL,
  ends_at       timestamptz NOT NULL,
  slot_type     text NOT NULL CHECK (slot_type IN ('decouverte', 'seance')),
  claimed_until timestamptz,                 -- verrou de 60 s pendant une réservation en cours
  created_at    timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT booking_slots_ordre CHECK (ends_at > starts_at),
  CONSTRAINT booking_slots_pas_de_chevauchement EXCLUDE USING gist (tstzrange(starts_at, ends_at) WITH &&)
);
CREATE INDEX IF NOT EXISTS booking_slots_starts_at_idx ON booking_slots (starts_at);

-- Réglages du site (tarifs modifiables depuis /admin).
CREATE TABLE IF NOT EXISTS site_settings (
  key        text PRIMARY KEY,
  value      jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Limitation des tentatives (connexion admin, réservations). Aucune adresse IP en clair : empreintes seulement.
CREATE TABLE IF NOT EXISTS rate_limits (
  key        text PRIMARY KEY,
  count      integer NOT NULL,
  expires_at timestamptz NOT NULL
);
