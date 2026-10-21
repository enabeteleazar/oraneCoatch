# ORANE : site de coaching

Site vitrine (React + Vite + Tailwind) avec :
- page d'accueil, mentions légales, politique de confidentialité, page ADOMSAP ;
- prise de rendez-vous en ligne (`/rendez-vous`) reliée à Google Agenda ;
- espace d'administration (`/admin`) protégé par mot de passe : tarifs du site et créneaux de rendez-vous.

## Démarrer en local

```bash
pnpm install
cp .env.example .env.local     # puis renseignez au minimum ADMIN_PASSWORD (10 caractères minimum)
pnpm dev                       # http://localhost:5173
```

Autres commandes : `pnpm typecheck` (vérification TypeScript), `pnpm build` (production, dossier `dist/public`).
Prérequis : Node 20.19 ou plus récent, et pnpm.

## Où est quoi

| Dossier / fichier | Rôle |
|---|---|
| `src/pages/` | Pages : `Home.tsx` (accueil), `RendezVous.tsx`, `Admin.tsx`, `not-found.tsx` |
| `src/components/` | Sections du site (À propos, FAQ, témoignages, engagements, urgence…) et pages légales |
| `src/components/admin/` | Onglets de l'administration (tarifs, créneaux) |
| `src/lib/` | Tarifs affichés sur le site (`tarifs.tsx`), appels à l'API (`api.ts`) |
| `shared/` | Code commun site + serveur : tarifs, créneaux, validations |
| `api/` | Fonctions serveur Vercel (réservation, administration, tarifs). **`api/_lib` garde son underscore** |
| `vercel.json` | Configuration de déploiement Vercel |
| `.env.example` | Liste des variables d'environnement à définir |

## Textes à compléter avant la mise en ligne

Recherchez `[À compléter` dans le code : `src/components/mentionLegale.tsx`, `politiqueConfidentialite.tsx`
(SIRET, adresse, hébergeur, etc.). Les sections « À propos » (`APropos.tsx`) et « Témoignages » (`Temoignages.tsx`)
restent masquées tant qu'elles sont vides. Votre photo va dans `public/images/` (puis `photo: "images/..."` dans `APropos.tsx`).

## Services utilisés

| Service | Rôle | Variables |
|---|---|---|
| **Neon** (Postgres) | Créneaux proposés (`booking_slots`), tarifs, limitation des tentatives. Aucune donnée de visiteur. | `DATABASE_URL` |
| **Google Agenda** | Source des réservations : un événement par rendez-vous dans le calendrier `rdv-coach` | `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_PRIVATE_KEY`, `GOOGLE_CALENDAR_ID` ou `GOOGLE_CALENDAR_NAME`, `BOOKING_TIME_ZONE` |
| **Formspree** | Formulaire de contact et e-mail de notification de chaque rendez-vous | `VITE_FORMSPREE_ENDPOINT` |
| **WhatsApp** | Bouton de la rubrique Contact | `VITE_WHATSAPP_PHONE` |
| Resend (facultatif) | Confirmation par e-mail avec date et invitation `.ics` | `RESEND_API_KEY`, `EMAIL_FROM`, `NOTIFY_EMAIL` |

Le détail de chaque variable, avec la marche à suivre, est dans `.env.example`.
Sans `DATABASE_URL`, une base locale embarquée est utilisée en développement (dossier `.data/`, ignoré par Git).

## Comment fonctionnent les rendez-vous

1. Dans `/admin` > Rendez-vous, vous créez des plages horaires, découpées en créneaux (durée prise dans les tarifs).
2. La page `/rendez-vous` affiche les créneaux libres : ceux qui ne chevauchent aucun événement de Google Agenda.
3. La personne choisit un créneau et laisse ses coordonnées : un événement est créé dans le calendrier `rdv-coach`
   (nom, téléphone, e-mail et message dans l'événement), et vous êtes prévenu(e) par e-mail via Formspree.
4. Pour annuler : `/admin` > Rendez-vous > « Annuler le rendez-vous » (supprime l'événement et rouvre le créneau).

## Déploiement sur Vercel

1. Importer le dépôt dans Vercel (la configuration est dans `vercel.json`).
2. Créer la base Neon (Vercel > Storage > Neon, ou neon.tech) et définir toutes les variables de `.env.example`.
3. Partager le calendrier `rdv-coach` avec l'adresse du compte de service Google, puis redéployer.
