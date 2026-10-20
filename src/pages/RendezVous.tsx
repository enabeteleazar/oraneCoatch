import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { Link } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, CalendarCheck, CalendarX, Check, Leaf, Phone } from "lucide-react";
import { LIBELLE_TYPE, TELEPHONE_CONTACT, cleJour, formaterHeure, formaterJour, type Creneau, type TypeCreneau } from "../../shared/rdv";
import { appeler, messageErreur } from "@/lib/api";
import { Tarif, useTarifs } from "@/lib/tarifs";
import EncartUrgence from "@/components/EncartUrgence";

const telHref = "tel:+33686544766";
const JOURS_AFFICHES = 8;

type Confirmation = { jour: string; heure: string; type: TypeCreneau; emailEnvoye: boolean; email: string };

async function chargerCreneaux(): Promise<Creneau[]> {
  const r = await appeler("rdv");
  if (r.status === 404) return []; // pas d'API (hébergement statique)
  if (!r.ok) throw new Error(messageErreur(r, "Créneaux indisponibles"));
  return (r.data?.creneaux as Creneau[]) ?? [];
}

const champ =
  "h-12 w-full rounded-xl border border-primary/25 bg-[#fbf9f3] px-4 text-base outline-none transition-colors focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/30";
const bouton =
  "inline-flex min-h-[52px] items-center justify-center gap-2 rounded-full bg-primary px-8 text-sm font-medium text-primary-foreground transition duration-300 hover:-translate-y-0.5 hover:bg-[#4f5940] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary disabled:pointer-events-none disabled:opacity-60";

export default function RendezVous() {
  const queryClient = useQueryClient();
  const tarifs = useTarifs();
  const formRef = useRef<HTMLFormElement>(null);

  const { data: creneaux, isPending, isError, refetch } = useQuery({
    queryKey: ["creneaux"],
    queryFn: chargerCreneaux,
    staleTime: 15_000,
    refetchOnWindowFocus: true,
    retry: 1,
  });

  const [filtre, setFiltre] = useState<TypeCreneau | "tous">("tous");
  const [joursVisibles, setJoursVisibles] = useState(JOURS_AFFICHES);
  const [choix, setChoix] = useState<string | null>(null);
  const [nom, setNom] = useState("");
  const [telephone, setTelephone] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [consentement, setConsentement] = useState(false);
  const [piege, setPiege] = useState("");
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState("");
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);

  useEffect(() => {
    const ancienTitre = document.title;
    document.title = "Prendre rendez-vous | ORANE – Coach thérapeutique";
    window.scrollTo(0, 0);
    return () => {
      document.title = ancienTitre;
    };
  }, []);

  const types = useMemo(() => [...new Set((creneaux ?? []).map((c) => c.type))], [creneaux]);
  const visibles = useMemo(() => (creneaux ?? []).filter((c) => filtre === "tous" || c.type === filtre), [creneaux, filtre]);
  const jours = useMemo(() => {
    const groupes = new Map<string, Creneau[]>();
    for (const c of visibles) groupes.set(cleJour(c.debut), [...(groupes.get(cleJour(c.debut)) ?? []), c]);
    return [...groupes.entries()];
  }, [visibles]);

  const creneauChoisi = (creneaux ?? []).find((c) => c.id === choix) ?? null;

  useEffect(() => {
    // si le créneau choisi n'est plus proposé (réservé entre-temps), on désélectionne
    if (choix && creneaux && !creneaux.some((c) => c.id === choix)) setChoix(null);
  }, [choix, creneaux]);

  const libelleType = (t: TypeCreneau) => (t === "decouverte" ? tarifs.decouverte.titre : LIBELLE_TYPE[t]);
  const detailType = (t: TypeCreneau) =>
    t === "decouverte" ? `${tarifs.decouverte.duree} · ${tarifs.decouverte.prix}` : `${tarifs.seance.duree} · ${tarifs.seance.prix}`;

  async function reserver(e: FormEvent) {
    e.preventDefault();
    if (!creneauChoisi) {
      setErreur("Choisissez d'abord un créneau.");
      return;
    }
    setEnvoi(true);
    setErreur("");
    const r = await appeler("rdv", {
      method: "POST",
      body: JSON.stringify({ creneauId: creneauChoisi.id, nom, telephone, email, message, consentement, site: piege }),
    });
    setEnvoi(false);

    if (r.ok && r.data?.rdv) {
      const rdv = r.data.rdv as { jour: string; heure: string; type: TypeCreneau };
      setConfirmation({ jour: rdv.jour, heure: rdv.heure, type: rdv.type, emailEnvoye: r.data.emailEnvoye === true, email });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      setErreur(messageErreur(r, `La réservation a échoué. Réessayez ou appelez le ${TELEPHONE_CONTACT}.`));
      if (r.status === 409 || r.status === 404) {
        setChoix(null);
        await queryClient.invalidateQueries({ queryKey: ["creneaux"] });
      }
    }
  }

  const entete = (
    <header className="border-b border-primary/15 bg-[#f7f4ec]">
      <div className="mx-auto flex max-w-[1120px] items-center justify-between px-5 py-5 md:px-10">
        <Link href="/" aria-label="ORANE, retour à l'accueil" className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full border border-primary/35 text-primary">
            <Leaf size={19} strokeWidth={1.3} />
          </span>
          <span className="leading-none">
            <span className="block text-[1.18rem] font-medium tracking-[.28em]">ORANE</span>
            <span className="mt-1.5 block text-[.52rem] tracking-[.19em] text-muted-foreground">COACH THÉRAPEUTIQUE</span>
          </span>
        </Link>
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-foreground/75 transition-colors hover:text-primary">
          <ArrowLeft size={15} /> Retour au site
        </Link>
      </div>
    </header>
  );

  if (confirmation) {
    return (
      <div className="site-shell min-h-[100dvh] bg-background text-foreground">
        {entete}
        <main className="bg-[#f7f4ec] py-16 md:py-24">
          <div className="mx-auto max-w-[640px] px-6 text-center md:px-10">
            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/15 text-primary">
              <CalendarCheck size={30} strokeWidth={1.4} aria-hidden="true" />
            </span>
            <h1 className="display-serif mt-6 text-5xl leading-[1.02] md:text-6xl" role="status">
              Rendez-vous <span className="italic text-primary">confirmé.</span>
            </h1>
            <div className="mx-auto mt-8 max-w-[420px] rounded-2xl border border-primary/20 bg-[#f1eee3] p-6">
              <p className="text-sm text-muted-foreground">{libelleType(confirmation.type)}</p>
              <p className="display-serif mt-1 text-3xl">{confirmation.jour}</p>
              <p className="mt-1 text-xl font-medium text-primary">{confirmation.heure}</p>
            </div>
            <p className="mx-auto mt-7 max-w-[480px] text-base leading-[1.9] text-foreground/75">
              {confirmation.emailEnvoye ? (
                <>
                  Un e-mail de confirmation vient d'être envoyé à <strong className="font-medium text-foreground">{confirmation.email}</strong>.
                  Pensez à vérifier vos courriers indésirables.
                </>
              ) : (
                <>
                  Nous n'avons pas pu vous envoyer l'e-mail de confirmation. Notez bien la date et l'heure ci-dessus : votre rendez-vous
                  est bien enregistré.
                </>
              )}
            </p>
            <p className="mt-4 text-sm leading-[1.8] text-foreground/65">
              Pour modifier ou annuler, appelez le{" "}
              <a href={telHref} className="text-primary underline underline-offset-4">{TELEPHONE_CONTACT}</a>.
            </p>
            <Link href="/" className={`${bouton} mt-9`}>Retour à l'accueil</Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="site-shell min-h-[100dvh] bg-background text-foreground">
      {entete}
      <main className="bg-[#f7f4ec] py-14 md:py-20">
        <div className="mx-auto max-w-[1120px] px-6 md:px-10">
          <p className="eyebrow mb-5 text-primary">Rendez-vous en ligne</p>
          <h1 className="display-serif text-5xl leading-[1] md:text-[4.6rem]">
            Prendre <span className="italic text-primary">rendez-vous.</span>
          </h1>
          <p className="mt-6 max-w-[560px] text-base leading-[1.9] text-foreground/72">
            Choisissez un créneau, puis laissez vos coordonnées. Vous recevrez un e-mail de confirmation. Vous préférez en parler d'abord ?
            Appelez le{" "}
            <a href={telHref} className="text-primary underline underline-offset-4">{TELEPHONE_CONTACT}</a>.
          </p>

          <div className="mt-12 grid gap-12 lg:grid-cols-[1.1fr_.9fr] lg:gap-16">
            {/* Étape 1 : créneaux */}
            <section aria-labelledby="etape-creneau">
              <h2 id="etape-creneau" className="display-serif text-3xl md:text-4xl">1. Choisissez un créneau</h2>

              {types.length > 1 && (
                <div role="group" aria-label="Type de séance" className="mt-5 flex flex-wrap gap-2">
                  {(["tous", ...types] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      aria-pressed={filtre === t}
                      onClick={() => setFiltre(t)}
                      className={`rounded-full border px-4 py-2 text-sm transition-colors ${
                        filtre === t ? "border-primary bg-primary text-primary-foreground" : "border-primary/30 text-primary hover:bg-primary/10"
                      }`}
                    >
                      {t === "tous" ? "Tous" : (
                        <>
                          {libelleType(t)} <span className="opacity-75">· <Tarif pret={tarifs.pret}>{detailType(t)}</Tarif></span>
                        </>
                      )}
                    </button>
                  ))}
                </div>
              )}
              {types.length === 1 && (
                <p className="mt-4 text-sm text-foreground/70">
                  {libelleType(types[0])} · <Tarif pret={tarifs.pret}>{detailType(types[0])}</Tarif>
                </p>
              )}

              {isPending && <p className="mt-8 text-sm text-muted-foreground">Chargement des créneaux…</p>}

              {isError && (
                <div role="alert" className="mt-8 rounded-2xl border border-destructive/40 bg-destructive/5 p-5 text-sm leading-[1.8]">
                  Les créneaux ne peuvent pas être affichés pour le moment.{" "}
                  <button type="button" onClick={() => refetch()} className="text-primary underline underline-offset-4">Réessayer</button>{" "}
                  ou appelez le <a href={telHref} className="text-primary underline underline-offset-4">{TELEPHONE_CONTACT}</a>.
                </div>
              )}

              {!isPending && !isError && jours.length === 0 && (
                <div className="mt-8 flex gap-4 rounded-2xl border border-primary/25 bg-[#f1eee3] p-6">
                  <CalendarX size={24} strokeWidth={1.4} className="mt-0.5 shrink-0 text-primary" aria-hidden="true" />
                  <div className="text-sm leading-[1.85] text-foreground/75">
                    <p className="font-medium text-foreground">Aucun créneau disponible pour le moment.</p>
                    <p className="mt-1">
                      De nouveaux créneaux sont régulièrement ajoutés. Vous pouvez aussi appeler le{" "}
                      <a href={telHref} className="text-primary underline underline-offset-4">{TELEPHONE_CONTACT}</a>.
                    </p>
                  </div>
                </div>
              )}

              <div className="mt-7 space-y-7">
                {jours.slice(0, joursVisibles).map(([cle, liste]) => (
                  <fieldset key={cle}>
                    <legend className="text-sm font-medium tracking-[.03em] text-primary">{formaterJour(liste[0].debut)}</legend>
                    <div className="mt-3 flex flex-wrap gap-2.5">
                      {liste.map((c) => (
                        <label key={c.id} className="cursor-pointer">
                          <input
                            type="radio"
                            name="creneau"
                            value={c.id}
                            checked={choix === c.id}
                            onChange={() => {
                              setChoix(c.id);
                              setErreur("");
                              window.setTimeout(() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
                            }}
                            className="peer sr-only"
                          />
                          <span className="inline-flex min-h-[48px] min-w-[84px] flex-col items-center justify-center rounded-xl border border-primary/30 bg-[#fbf9f3] px-4 py-2 text-center transition-colors hover:border-primary peer-checked:border-primary peer-checked:bg-primary peer-checked:text-primary-foreground peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-primary">
                            <span className="text-base font-medium tabular-nums">{formaterHeure(c.debut)}</span>
                            {filtre === "tous" && types.length > 1 && <span className="text-[.68rem] opacity-75">{c.type === "decouverte" ? "Découverte" : "Séance"}</span>}
                          </span>
                        </label>
                      ))}
                    </div>
                  </fieldset>
                ))}
              </div>

              {jours.length > joursVisibles && (
                <button type="button" onClick={() => setJoursVisibles((n) => n + JOURS_AFFICHES)} className="mt-7 text-sm font-medium text-primary underline underline-offset-4">
                  Afficher plus de dates
                </button>
              )}
            </section>

            {/* Étape 2 : coordonnées */}
            <section aria-labelledby="etape-coordonnees" className="lg:sticky lg:top-8 lg:self-start">
              <h2 id="etape-coordonnees" className="display-serif text-3xl md:text-4xl">2. Vos coordonnées</h2>

              <form ref={formRef} onSubmit={reserver} className="mt-5 scroll-mt-6 rounded-2xl border border-primary/20 bg-[#f1eee3] p-5 md:p-6" noValidate={false}>
                <div aria-live="polite" className="mb-5 rounded-xl border border-primary/25 bg-[#f8f5ed] p-4 text-sm">
                  {creneauChoisi ? (
                    <>
                      <span className="text-muted-foreground">Votre créneau</span>
                      <p className="mt-0.5 font-medium">
                        {formaterJour(creneauChoisi.debut)} à {formaterHeure(creneauChoisi.debut)}
                      </p>
                      <p className="text-xs text-foreground/65">{libelleType(creneauChoisi.type)}</p>
                    </>
                  ) : (
                    <span className="text-muted-foreground">Choisissez d'abord un créneau à gauche.</span>
                  )}
                </div>

                <label htmlFor="nom" className="block text-sm font-medium">Nom et prénom</label>
                <input id="nom" name="nom" autoComplete="name" required minLength={2} maxLength={100} value={nom} onChange={(e) => setNom(e.target.value)} className={`${champ} mt-1.5`} />

                <label htmlFor="tel" className="mt-4 block text-sm font-medium">Téléphone</label>
                <input id="tel" name="tel" type="tel" inputMode="tel" autoComplete="tel" required value={telephone} onChange={(e) => setTelephone(e.target.value)} className={`${champ} mt-1.5`} />

                <label htmlFor="email" className="mt-4 block text-sm font-medium">E-mail</label>
                <input id="email" name="email" type="email" autoComplete="email" required maxLength={254} value={email} onChange={(e) => setEmail(e.target.value)} className={`${champ} mt-1.5`} />

                <label htmlFor="message" className="mt-4 block text-sm font-medium">
                  Message <span className="font-normal text-muted-foreground">(facultatif)</span>
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={3}
                  maxLength={500}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  aria-describedby="message-aide"
                  className="mt-1.5 w-full rounded-xl border border-primary/25 bg-[#fbf9f3] px-4 py-3 text-base outline-none transition-colors focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/30"
                />
                <p id="message-aide" className="mt-1 text-xs text-muted-foreground">
                  Inutile de détailler votre situation ici : nous en parlerons ensemble.
                </p>

                {/* Champ piège pour les robots : invisible et hors du parcours clavier. */}
                <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
                  <label htmlFor="site">Ne pas remplir</label>
                  <input id="site" name="site" tabIndex={-1} autoComplete="off" value={piege} onChange={(e) => setPiege(e.target.value)} />
                </div>

                <label className="mt-5 flex cursor-pointer items-start gap-3 text-sm leading-[1.7] text-foreground/78">
                  <input type="checkbox" required checked={consentement} onChange={(e) => setConsentement(e.target.checked)} className="peer sr-only" />
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border border-primary/50 bg-[#fbf9f3] text-primary-foreground peer-checked:bg-primary peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-primary">
                    {consentement && <Check size={14} aria-hidden="true" />}
                  </span>
                  <span>
                    J'accepte que ces informations soient utilisées pour gérer mon rendez-vous (voir la{" "}
                    <Link href="/politique-de-confidentialite" className="text-primary underline underline-offset-4">politique de confidentialité</Link>).
                  </span>
                </label>

                {erreur && <p role="alert" className="mt-4 text-sm leading-[1.7] text-destructive">{erreur}</p>}

                <button type="submit" disabled={envoi || !creneauChoisi} className={`${bouton} mt-6 w-full`}>
                  {envoi ? "Réservation…" : "Confirmer le rendez-vous"}
                </button>
                <p className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                  <Phone size={13} aria-hidden="true" /> Une question ? <a href={telHref} className="text-primary underline underline-offset-4">{TELEPHONE_CONTACT}</a>
                </p>
              </form>
            </section>
          </div>
        </div>
      </main>
      <EncartUrgence />
    </div>
  );
}
