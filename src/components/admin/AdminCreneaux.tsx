import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { AlertTriangle, CalendarPlus, Mail, Phone, Trash2, XCircle } from "lucide-react";
import { TARIFS_PAR_DEFAUT, validerTarifs, type Tarifs } from "../../../shared/tarifs";
import {
  LIBELLE_TYPE,
  cleJour,
  formaterHeure,
  formaterJour,
  genererCreneaux,
  type Creneau,
  type TypeCreneau,
} from "../../../shared/rdv";
import { appeler, messageErreur } from "@/lib/api";
import { boutonCss, boutonDiscretCss, champCss, type Session } from "./commun";

type CreneauAdmin = Creneau & {
  reservation: { nom: string; telephone: string; email: string; message: string; creeLe: string } | null;
};

const aujourdhui = () => cleJour(new Date().toISOString());

export default function AdminCreneaux({ session, onSessionExpiree }: { session: Session; onSessionExpiree: () => void }) {
  const [creneaux, setCreneaux] = useState<CreneauAdmin[] | null>(null);
  const [tarifs, setTarifs] = useState<Tarifs>(TARIFS_PAR_DEFAUT);
  const [erreurListe, setErreurListe] = useState("");

  const [type, setType] = useState<TypeCreneau>("seance");
  const [date, setDate] = useState(aujourdhui());
  const [debut, setDebut] = useState("14:00");
  const [fin, setFin] = useState("17:30");
  const [pause, setPause] = useState("15");
  const [semaines, setSemaines] = useState("1");
  const [creation, setCreation] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "erreur"; texte: string } | null>(null);
  const [actionEnCours, setActionEnCours] = useState<string | null>(null);

  const charger = useCallback(async () => {
    const [liste, t] = await Promise.all([appeler("admin/creneaux"), appeler("tarifs")]);
    if (liste.status === 401) return onSessionExpiree();
    if (liste.ok) {
      setCreneaux((liste.data?.creneaux as CreneauAdmin[]) ?? []);
      setErreurListe("");
    } else {
      setErreurListe(messageErreur(liste, "Impossible de charger les créneaux."));
    }
    const v = t.ok ? validerTarifs((t.data as { tarifs?: unknown } | null)?.tarifs) : null;
    if (v && v.ok === true) setTarifs(v.tarifs);
  }, [onSessionExpiree]);

  useEffect(() => {
    void charger();
  }, [charger]);

  const dureeMinutes = type === "decouverte" ? tarifs.decouverte.dureeMinutes : tarifs.seance.dureeMinutes;

  const apercu = useMemo(
    () => genererCreneaux({ date, debut, fin, dureeMinutes, pauseMinutes: Number(pause), semaines: Number(semaines) }),
    [date, debut, fin, dureeMinutes, pause, semaines],
  );

  async function creer(e: FormEvent) {
    e.preventDefault();
    setMessage(null);
    setCreation(true);
    const r = await appeler("admin/creneaux", {
      method: "POST",
      body: JSON.stringify({ type, date, debut, fin, pauseMinutes: Number(pause), semaines: Number(semaines) }),
    });
    setCreation(false);
    if (r.status === 401) return onSessionExpiree();
    if (r.ok) {
      const d = r.data as { crees: number; passes: number; chevauchements: number };
      const ignores = d.passes + d.chevauchements;
      setMessage({
        type: "ok",
        texte: `${d.crees} créneau${d.crees > 1 ? "x" : ""} créé${d.crees > 1 ? "s" : ""}${
          ignores > 0 ? ` (${ignores} ignoré${ignores > 1 ? "s" : ""} : passé ou déjà occupé)` : ""
        }.`,
      });
      await charger();
    } else {
      setMessage({ type: "erreur", texte: messageErreur(r, "La création a échoué.") });
    }
  }

  async function supprimer(c: CreneauAdmin) {
    if (!window.confirm(`Supprimer le créneau du ${formaterJour(c.debut)} à ${formaterHeure(c.debut)} ?`)) return;
    setActionEnCours(c.id);
    const r = await appeler(`admin/creneaux?id=${encodeURIComponent(c.id)}`, { method: "DELETE" });
    setActionEnCours(null);
    if (r.status === 401) return onSessionExpiree();
    setMessage(r.ok ? { type: "ok", texte: "Créneau supprimé." } : { type: "erreur", texte: messageErreur(r, "La suppression a échoué.") });
    await charger();
  }

  async function annuler(c: CreneauAdmin) {
    const nom = c.reservation?.nom ?? "cette personne";
    if (!window.confirm(`Annuler le rendez-vous de ${nom} (${formaterJour(c.debut)} à ${formaterHeure(c.debut)}) ?\n\nL'événement sera retiré de Google Agenda, la personne sera prévenue par e-mail et le créneau redeviendra libre.`)) return;
    setActionEnCours(c.id);
    const r = await appeler(`admin/rdv?id=${encodeURIComponent(c.id)}`, { method: "DELETE" });
    setActionEnCours(null);
    if (r.status === 401) return onSessionExpiree();
    if (r.ok) {
      const d = r.data as { agendaSupprime: boolean; emailEnvoye: boolean };
      const avertissements = [
        d.agendaSupprime ? "" : "L'événement Google Agenda n'a pas pu être supprimé : supprimez-le à la main.",
        d.emailEnvoye ? "" : "Aucun e-mail d'annulation n'a pu être envoyé : prévenez la personne par téléphone.",
      ].filter(Boolean);
      setMessage({ type: avertissements.length ? "erreur" : "ok", texte: ["Rendez-vous annulé.", ...avertissements].join(" ") });
    } else {
      setMessage({ type: "erreur", texte: messageErreur(r, "L'annulation a échoué.") });
    }
    await charger();
  }

  // regroupement par jour (heure de Paris)
  const jours = useMemo(() => {
    const groupes = new Map<string, CreneauAdmin[]>();
    for (const c of creneaux ?? []) {
      const cle = cleJour(c.debut);
      groupes.set(cle, [...(groupes.get(cle) ?? []), c]);
    }
    return [...groupes.entries()];
  }, [creneaux]);

  const reserves = (creneaux ?? []).filter((c) => c.reservation && Date.parse(c.fin) > Date.now()).length;

  return (
    <div>
      <h2 className="display-serif text-3xl leading-tight md:text-4xl">Rendez-vous</h2>
      <p className="mt-3 max-w-[600px] text-sm leading-[1.8] text-foreground/70">
        Créez les plages où vous êtes disponible : elles sont découpées en créneaux que les visiteurs peuvent réserver sur la
        page « Prendre rendez-vous ».
      </p>

      {session.stockage === "aucun" && (
        <p role="alert" className="mt-5 rounded-2xl border border-destructive/40 bg-destructive/5 p-4 text-sm leading-[1.8]">
          <strong className="font-medium">Stockage non configuré :</strong> ajoutez Upstash Redis (Vercel → Storage → Marketplace).
        </p>
      )}
      {!session.agenda && (
        <p className="mt-4 flex gap-2 rounded-2xl border border-primary/30 bg-[#f1eee3] p-4 text-xs leading-[1.8]">
          <AlertTriangle size={15} className="mt-0.5 shrink-0 text-primary" aria-hidden="true" />
          <span>
            <strong className="font-medium">Google Agenda non configuré :</strong> les rendez-vous seront enregistrés ici mais n'apparaîtront pas
            dans votre agenda. Variables à définir : <code>GOOGLE_CLIENT_EMAIL</code>, <code>GOOGLE_PRIVATE_KEY</code>, <code>GOOGLE_CALENDAR_ID</code>.
          </span>
        </p>
      )}
      {!session.email && (
        <p className="mt-4 flex gap-2 rounded-2xl border border-primary/30 bg-[#f1eee3] p-4 text-xs leading-[1.8]">
          <AlertTriangle size={15} className="mt-0.5 shrink-0 text-primary" aria-hidden="true" />
          <span>
            <strong className="font-medium">E-mails non configurés :</strong> aucune confirmation ne sera envoyée aux personnes qui réservent.
            Variables à définir : <code>RESEND_API_KEY</code>, <code>EMAIL_FROM</code> (et <code>NOTIFY_EMAIL</code> pour être prévenu(e)).
          </span>
        </p>
      )}

      <form onSubmit={creer} className="mt-8 rounded-2xl border border-primary/20 bg-[#f1eee3] p-5 md:p-6">
        <h3 className="display-serif text-2xl">Ajouter des créneaux</h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="sm:col-span-2 lg:col-span-3">
            <label htmlFor="type" className="block text-sm font-medium">Type de séance</label>
            <select id="type" value={type} onChange={(e) => setType(e.target.value as TypeCreneau)} className={`${champCss} mt-1.5`}>
              <option value="seance">{LIBELLE_TYPE.seance} ({tarifs.seance.dureeMinutes} min)</option>
              <option value="decouverte">{LIBELLE_TYPE.decouverte} ({tarifs.decouverte.dureeMinutes} min)</option>
            </select>
          </div>
          <div>
            <label htmlFor="date" className="block text-sm font-medium">Date</label>
            <input id="date" type="date" required min={aujourdhui()} value={date} onChange={(e) => setDate(e.target.value)} className={`${champCss} mt-1.5`} />
          </div>
          <div>
            <label htmlFor="debut" className="block text-sm font-medium">De</label>
            <input id="debut" type="time" required value={debut} onChange={(e) => setDebut(e.target.value)} className={`${champCss} mt-1.5`} />
          </div>
          <div>
            <label htmlFor="fin" className="block text-sm font-medium">À</label>
            <input id="fin" type="time" required value={fin} onChange={(e) => setFin(e.target.value)} className={`${champCss} mt-1.5`} />
          </div>
          <div>
            <label htmlFor="pause" className="block text-sm font-medium">Pause entre deux créneaux <span className="font-normal text-muted-foreground">(minutes)</span></label>
            <input id="pause" inputMode="numeric" value={pause} onChange={(e) => setPause(e.target.value)} className={`${champCss} mt-1.5`} />
          </div>
          <div>
            <label htmlFor="semaines" className="block text-sm font-medium">Répéter chaque semaine pendant <span className="font-normal text-muted-foreground">(semaines)</span></label>
            <input id="semaines" inputMode="numeric" value={semaines} onChange={(e) => setSemaines(e.target.value)} className={`${champCss} mt-1.5`} />
          </div>
        </div>

        <p className="mt-4 text-sm text-foreground/75" aria-live="polite">
          {apercu.ok === true ? (
            <>
              <strong className="font-medium">
                {apercu.creneaux.length} créneau{apercu.creneaux.length > 1 ? "x" : ""}
              </strong>{" "}
              :{" "}
              {apercu.creneaux
                .slice(0, Math.min(apercu.creneaux.length, Math.ceil(apercu.creneaux.length / Math.max(1, Number(semaines) || 1))))
                .map((c) => `${formaterHeure(new Date(c.debut).toISOString())}–${formaterHeure(new Date(c.fin).toISOString())}`)
                .join(", ")}
              {Number(semaines) > 1 ? ` (chaque semaine, ${semaines} fois)` : ""}
            </>
          ) : (
            <span className="text-muted-foreground">{apercu.erreur}</span>
          )}
        </p>

        <div className="mt-5 flex flex-wrap items-center gap-4">
          <button type="submit" disabled={creation || apercu.ok === false || session.stockage === "aucun"} className={boutonCss}>
            <CalendarPlus size={16} /> {creation ? "Création…" : "Créer les créneaux"}
          </button>
        </div>
      </form>

      <p role="status" aria-live="polite" className={`mt-4 min-h-5 text-sm ${message?.type === "erreur" ? "text-destructive" : "text-primary"}`}>
        {message?.texte}
      </p>

      <section aria-labelledby="liste-creneaux" className="mt-6">
        <h3 id="liste-creneaux" className="display-serif text-2xl">
          Créneaux à venir{creneaux ? <span className="ml-2 text-base text-muted-foreground">({reserves} réservé{reserves > 1 ? "s" : ""})</span> : null}
        </h3>
        {erreurListe && <p role="alert" className="mt-3 text-sm text-destructive">{erreurListe}</p>}
        {creneaux === null && !erreurListe && <p className="mt-3 text-sm text-muted-foreground">Chargement…</p>}
        {creneaux !== null && jours.length === 0 && <p className="mt-3 text-sm text-muted-foreground">Aucun créneau pour l'instant.</p>}

        <div className="mt-4 space-y-6">
          {jours.map(([cle, liste]) => (
            <div key={cle}>
              <h4 className="text-sm font-medium tracking-[.04em] text-primary">{formaterJour(liste[0].debut)}</h4>
              <ul className="mt-2 divide-y divide-primary/15 rounded-2xl border border-primary/20">
                {liste.map((c) => (
                  <li key={c.id} className="p-4">
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                      <span className="font-medium tabular-nums">
                        {formaterHeure(c.debut)} – {formaterHeure(c.fin)}
                      </span>
                      <span className="text-xs text-muted-foreground">{LIBELLE_TYPE[c.type]}</span>
                      <span className={`rounded-full px-3 py-1 text-xs ${c.reservation ? "bg-primary/15 text-primary" : "bg-[#ece8da] text-foreground/65"}`}>
                        {c.reservation ? "Réservé" : "Libre"}
                      </span>
                      <span className="ml-auto">
                        {c.reservation ? (
                          <button type="button" disabled={actionEnCours === c.id} onClick={() => annuler(c)} className={boutonDiscretCss}>
                            <XCircle size={14} /> Annuler le rendez-vous
                          </button>
                        ) : (
                          <button type="button" disabled={actionEnCours === c.id} onClick={() => supprimer(c)} className={boutonDiscretCss}>
                            <Trash2 size={14} /> Supprimer
                          </button>
                        )}
                      </span>
                    </div>
                    {c.reservation && (
                      <div className="mt-3 rounded-xl bg-[#f1eee3] p-3 text-sm leading-[1.8]">
                        <p className="font-medium">{c.reservation.nom}</p>
                        <p className="mt-1 flex flex-wrap gap-x-5 gap-y-1 text-foreground/75">
                          <a href={`tel:${c.reservation.telephone.replace(/[^\d+]/g, "")}`} className="inline-flex items-center gap-1.5 text-primary underline underline-offset-4">
                            <Phone size={13} /> {c.reservation.telephone}
                          </a>
                          <a href={`mailto:${c.reservation.email}`} className="inline-flex items-center gap-1.5 text-primary underline underline-offset-4">
                            <Mail size={13} /> {c.reservation.email}
                          </a>
                        </p>
                        {c.reservation.message && <p className="mt-1 text-foreground/70">« {c.reservation.message} »</p>}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
