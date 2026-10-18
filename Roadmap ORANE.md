# Roadmap ORANE

Site ORANE – Coach thérapeutique · Mise à jour du 18 octobre 2026

Les phases 1 et 2 sont les plus importantes : sans informations légales complètes ni présentation de la personne, le site manque de crédibilité.

## Phase 1 : Légal et conformité

- [x] Créer la page de mentions légales avec lien dans le footer
- [ ] Compléter les informations manquantes dans `mentionLegale.tsx` (exploitant, SIRET, adresse, e-mail, hébergeur, directeur de publication, médiateur)
- [x] Rédiger une politique de confidentialité
- [x] Auto-héberger les polices (Instrument Serif, DM Sans, La Belle Aurore) et retirer l'`@import` Google Fonts
- [x] Ajouter un encart d'urgence avec le 3114 (et 15 / 112)

## Phase 2 : Confiance et contenu

- [ ] Ajouter une section « À propos » (nom, photo, formation, certifications, méthode)
- [x] Expliquer le partenariat ADOMSAP (ce que c'est, lien éventuel)
- [ ] Préciser le public cible et le déroulé d'une séance
- [ ] Confirmer la durée et le tarif de la séance individuelle (1 h 30 pour 60 € sur le site, 1 h dans l'ancien code)
- [ ] Ajouter une FAQ
- [ ] Ajouter de vrais témoignages (avec accord des personnes) et un cadre déontologique
- [ ] Ajouter un moyen de contact écrit (formulaire réel ou e-mail)
- [ ] Corriger la répétition de la valeur « Écoute » et l'alternance illogique des icônes Heart et Leaf

## Phase 3 : Nettoyage du dépôt

- [ ] Supprimer les 8 composants inutilisés (Navbar, Hero, About, Services, Pricing, Testimonials, Contact, Footer)
- [ ] Retirer `dist/`, `.tsbuildinfo` et les \~50 fichiers `*:Zone.Identifier` du dépôt
- [ ] Compléter le `.gitignore` (`dist`, `.tsbuildinfo`, `*:Zone.Identifier`)
- [ ] Renommer le package (`@workspace/equilibre-coaching`) et supprimer l'alias `@assets` vers `attached_assets`
- [ ] Remettre les dépendances de production dans `dependencies`
- [ ] Supprimer les composants shadcn/ui non utilisés (sidebar, chart, carousel, calendar, etc.)

## Phase 4 : SEO et technique

- [ ] Réparer le manifest PWA (chemin `/manifest.json`, chemins des icônes, nom « App »)
- [ ] Supprimer la balise `theme-color` en double
- [ ] Ajouter `og:image` (utiliser `public/opengraph.jpg`), `og:url` et `canonical`
- [ ] Ajouter les données structurées `LocalBusiness`
- [ ] Indiquer la ville ou la zone d'intervention, y compris les visites à domicile
- [ ] Créer un `sitemap.xml` et le référencer dans `robots.txt`

## Phase 5 : Performance et accessibilité

- [ ] Convertir `hero.png` en WebP ou AVIF
- [ ] Supprimer `about.png` si elle reste inutilisée (ou l'utiliser dans « À propos »)
- [ ] Remplacer la seconde utilisation de l'image hero par une image distincte
- [ ] Retirer `maximum-scale=1` du viewport
- [ ] Rendre l'en-tête fixe sur mobile
- [ ] Fermer le menu mobile avec Échap
- [ ] Traduire et restyler la page 404

## Phase 6 : Qualité

- [ ] Ajouter des tests
- [ ] Mettre en place une CI (typecheck + build)
