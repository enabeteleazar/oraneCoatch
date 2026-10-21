import { LIBELLE_TYPE, TELEPHONE_CONTACT, formaterHeure, formaterJourComplet, type Creneau } from "../../shared/rdv.js";
import { creerIcs } from "../../shared/ics.js";
import "./config.js";
import { formaterDuree } from "../../shared/tarifs.js";
import type { EmailEntree } from "./email.js";
import type { Client } from "./google.js";

const lieu = () => process.env.RDV_LIEU || undefined;
const echapper = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const duree = (c: Creneau) => formaterDuree(Math.round((Date.parse(c.fin) - Date.parse(c.debut)) / 60_000));
const minuscule = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);
const quand = (c: Creneau) => `${minuscule(formaterJourComplet(c.debut))} à ${formaterHeure(c.debut)}`;

function habillage(titre: string, corpsHtml: string): string {
  return `<!doctype html><html lang="fr"><body style="margin:0;background:#f4f1e8;font-family:Arial,Helvetica,sans-serif;color:#2f3a2a">
<div style="max-width:560px;margin:0 auto;padding:32px 20px">
<p style="letter-spacing:.28em;font-size:18px;margin:0 0 4px">ORANE</p>
<p style="letter-spacing:.18em;font-size:10px;margin:0 0 24px;color:#6b7060">COACH THÉRAPEUTIQUE</p>
<div style="background:#fbf9f3;border:1px solid #ddd8c6;border-radius:16px;padding:28px">
<h1 style="font-family:Georgia,serif;font-weight:normal;font-size:26px;margin:0 0 16px">${titre}</h1>
${corpsHtml}</div>
<p style="font-size:12px;color:#6b7060;margin:20px 0 0">Une question ? Appelez le ${TELEPHONE_CONTACT}.</p>
</div></body></html>`;
}

const ligne = (libelle: string, valeur: string) =>
  `<tr><td style="padding:6px 16px 6px 0;color:#6b7060;vertical-align:top">${libelle}</td><td style="padding:6px 0"><strong>${echapper(valeur)}</strong></td></tr>`;

/** E-mail envoyé à la personne qui réserve (avec invitation .ics). */
export function emailConfirmation(c: Creneau, r: Client): Omit<EmailEntree, "a" | "repondreA"> {
  const type = LIBELLE_TYPE[c.type];
  const detail = [
    ["Rendez-vous", type],
    ["Date", formaterJourComplet(c.debut)],
    ["Heure", `${formaterHeure(c.debut)} (durée ${duree(c)})`],
    ...(lieu() ? [["Lieu", lieu() as string]] : []),
  ];
  const texte = [
    `Bonjour ${r.nom},`,
    "",
    "Votre rendez-vous est confirmé.",
    "",
    ...detail.map(([a, b]) => `${a} : ${b}`),
    "",
    `Pour modifier ou annuler, appelez le ${TELEPHONE_CONTACT}.`,
    "",
    "À très bientôt,",
    "ORANE",
  ].join("\n");
  const html = habillage(
    "Votre rendez-vous est confirmé",
    `<p style="margin:0 0 16px;line-height:1.6">Bonjour ${echapper(r.nom)},<br>nous vous attendons&nbsp;:</p>
<table style="border-collapse:collapse;font-size:15px">${detail.map(([a, b]) => ligne(a, b)).join("")}</table>
<p style="margin:20px 0 0;line-height:1.6;font-size:14px">Pour modifier ou annuler, appelez le <strong>${TELEPHONE_CONTACT}</strong>.<br>Une invitation calendrier est jointe à ce message.</p>`,
  );
  return {
    sujet: `Votre rendez-vous du ${minuscule(formaterJourComplet(c.debut))} à ${formaterHeure(c.debut)}`,
    texte,
    html,
    pieceJointe: {
      nom: "rendez-vous-orane.ics",
      contenu: creerIcs({
        uid: c.id,
        debutIso: c.debut,
        finIso: c.fin,
        titre: `${type} : ORANE`,
        description: `Rendez-vous avec ORANE. Pour modifier ou annuler : ${TELEPHONE_CONTACT}.`,
        lieu: lieu(),
      }),
    },
  };
}

/** E-mail envoyé à l'exploitant à chaque nouvelle réservation. */
export function emailNotification(c: Creneau, r: Client): Omit<EmailEntree, "a" | "repondreA"> {
  const type = LIBELLE_TYPE[c.type];
  const detail = [
    ["Rendez-vous", `${type}, ${quand(c)} (${duree(c)})`],
    ["Nom", r.nom],
    ["Téléphone", r.telephone],
    ["E-mail", r.email],
    ...(r.message ? [["Message", r.message]] : []),
  ];
  return {
    sujet: `Nouveau rendez-vous : ${r.nom}, ${minuscule(formaterJourComplet(c.debut))} ${formaterHeure(c.debut)}`,
    texte: ["Nouveau rendez-vous réservé sur le site.", "", ...detail.map(([a, b]) => `${a} : ${b}`)].join("\n"),
    html: habillage("Nouveau rendez-vous", `<table style="border-collapse:collapse;font-size:15px">${detail.map(([a, b]) => ligne(a, b)).join("")}</table>`),
  };
}

/** E-mail envoyé quand l'exploitant annule un rendez-vous. */
export function emailAnnulation(c: Creneau, r: Client): Omit<EmailEntree, "a" | "repondreA"> {
  return {
    sujet: `Annulation de votre rendez-vous du ${minuscule(formaterJourComplet(c.debut))}`,
    texte: [
      `Bonjour ${r.nom},`,
      "",
      `Votre rendez-vous du ${quand(c)} a dû être annulé. Je suis désolé(e) pour la gêne occasionnée.`,
      `N'hésitez pas à reprendre rendez-vous sur le site ou à m'appeler au ${TELEPHONE_CONTACT}.`,
      "",
      "ORANE",
    ].join("\n"),
    html: habillage(
      "Votre rendez-vous est annulé",
      `<p style="margin:0;line-height:1.6">Bonjour ${echapper(r.nom)},<br>votre rendez-vous du <strong>${echapper(quand(c))}</strong> a dû être annulé. Je suis désolé(e) pour la gêne occasionnée.<br><br>N'hésitez pas à reprendre rendez-vous sur le site ou à appeler le <strong>${TELEPHONE_CONTACT}</strong>.</p>`,
    ),
  };
}

