/** Fichier .ics (invitation calendrier) : joint à l'e-mail de confirmation et téléchargeable depuis le site. */

const horodatage = (iso: string) => new Date(iso).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
const echapper = (s: string) => s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");

export function creerIcs(e: { uid: string; debutIso: string; finIso: string; titre: string; description: string; lieu?: string }): string {
  const lignes = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//ORANE//Rendez-vous//FR",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${e.uid}@orane`,
    `DTSTAMP:${horodatage(new Date().toISOString())}`,
    `DTSTART:${horodatage(e.debutIso)}`,
    `DTEND:${horodatage(e.finIso)}`,
    `SUMMARY:${echapper(e.titre)}`,
    `DESCRIPTION:${echapper(e.description)}`,
    ...(e.lieu ? [`LOCATION:${echapper(e.lieu)}`] : []),
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return lignes.join("\r\n") + "\r\n";
}
