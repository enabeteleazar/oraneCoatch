# ORANE — Coach thérapeutique

Site React/Vite avec fonctions API Vercel, base PostgreSQL Neon et intégration
Google Agenda.

## Développement et vérifications

```bash
pnpm install
pnpm dev
pnpm test
pnpm typecheck
pnpm build
```

Le serveur Vite local sert aussi les routes de `api/`. Sans `DATABASE_URL`, il
utilise la base locale PGlite dans `.data/`.

## Configuration

Copier `.env.example` vers `.env.local`. Sur Vercel, définir les variables dans
les bons environnements et redéployer après une modification.

Variables principales :

| Variable | Usage |
| --- | --- |
| `DATABASE_URL` | Connexion PostgreSQL/Neon ; indispensable en production. |
| `ADMIN_PASSWORD` | Mot de passe de `/admin` (10 caractères minimum). |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_PRIVATE_KEY` | Accès serveur à Google Agenda. |
| `GOOGLE_CALENDAR_ID` ou `GOOGLE_CALENDAR_NAME` | Calendrier des rendez-vous. |
| `BOOKING_TIME_ZONE` | Fuseau des créneaux, par défaut `Europe/Paris`. |
| `VITE_FORMSPREE_ENDPOINT`, `VITE_WHATSAPP_PHONE` | Fonctions publiques du site ; valeurs intégrées au navigateur. |
| `VITE_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY` | Protection anti-robot, clé publique et clé secrète respectivement. |

Les autres intégrations (Resend, alertes WhatsApp/ntfy) sont facultatives.
Ne jamais placer de secret dans une variable `VITE_*` : ces variables sont
publiées dans le bundle client. La liste complète et les exemples sont dans
[`.env.example`](./.env.example).

## Créneaux et réservations

- `booking_slots` est la table principale, utilisée par `/admin`, `/api/rdv`
  et le parcours de réservation associé.
- `booking_slots_legacy` est conservée pour l’ancienne API `/api/admin/booking-slots`
  et les routes `/api/bookings`.
- À la première requête API, le schéma historique est archivé et ses créneaux
  compatibles sont migrés vers la table principale. Les deux tables restent
  disponibles ; les modifications ultérieures dans une table ne sont pas
  répliquées dans l’autre.

Pour tester un déploiement Preview sans toucher aux données de production,
configurer une base Neon distincte pour l’environnement Preview.
