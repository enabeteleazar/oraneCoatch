import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, ArrowUpRight, CheckCircle2, Leaf, LogOut, Save } from "lucide-react";
import { TARIFS_PAR_DEFAUT, validerTarifs, type Tarifs } from "../../shared/tarifs";
import { construireAffichage } from "@/lib/tarifs";

type Stockage = "redis" | "fichier" | "aucun";
type Session = { configure: boolean; authentifie: boolean; stockage: Stockage };
type Champs = Record<string, string>;

const api = (chemin: string) => `${import.meta.env.BASE_URL}api/${chemin}`;

async function appeler(chemin: string, init?: RequestInit) {
  try {
    const reponse = await fetch(api(chemin), {
      credentials: "same-origin",
      cache: "no-store",
      ...init,
      headers: { Accept: "application/json", "Content-Type": "application/json", ...init?.headers },
    });
    let data: Record<string, unknown> | null = null;
    try {
      data = (await reponse.json()) as Record<string, unknown>;
    } catch {
      /* corps vide ou non JSON */
    }
    return { ok: reponse.ok, status: reponse.status, data };
  } catch {
    return { ok: false, status: 0, data: null };
  }
}

const GROUPES: { titre: string; aide?: string; champs: { cle: string; label: string; unite: string; aide?: string }[] }[] = [
  {
    titre: "Séance découverte",
    champs: [
      { cle: "decouverte.dureeMinutes", label: "Durée", unite: "minutes" },
      { cle: "decouverte.prix", label: "Prix", unite: "€", aide: "0 = séance offerte" },
    ],
  },
  {
    titre: "Séance individuelle",
    champs: [
      { cle: "seance.dureeMinutes", label: "Durée", unite: "minutes", aide: "90 = 1 h 30" },
      { cle: "seance.prix", label: "Prix", unite: "€" },
    ],
  },
  { titre: "Pack 5 séances", champs: [{ cle: "pack5.prix", label: "Prix du pack", unite: "€" }] },
  { titre: "Pack 10 séances", champs: [{ cle: "pack10.prix", label: "Prix du pack", unite: "€" }] },
  {
    titre: "Visite à domicile",
    champs: [{ cle: "domicile.supplement", label: "Supplément par séance", unite: "€", aide: "0 = sans supplément" }],
  },
];

function versChamps(t: Tarifs): Champs {
  return {
    "decouverte.dureeMinutes": String(t.decouverte.dureeMinutes),
    "decouverte.prix": String(t.decouverte.prix),
    "seance.dureeMinutes": String(t.seance.dureeMinutes),
    "seance.prix": String(t.seance.prix),
    "pack5.prix": String(t.pack5.prix),
    "pack10.prix": String(t.pack10.prix),
    "domicile.supplement": String(t.domicile.supplement),
  };
}

const nombre = (v: string) => (v.trim() === "" ? Number.NaN : Number(v.trim().replace(",", ".")));

function versTarifs(c: Champs) {
  return validerTarifs({
    decouverte: { dureeMinutes: nombre(c["decouverte.dureeMinutes"]), prix: nombre(c["decouverte.prix"]) },
    seance: { dureeMinutes: nombre(c["seance.dureeMinutes"]), prix: nombre(c["seance.prix"]) },
    pack5: { prix: nombre(c["pack5.prix"]) },
    pack10: { prix: nombre(c["pack10.prix"]) },
    domicile: { supplement: nombre(c["domicile.supplement"]) },
  });
}

const champCss =
  "h-12 w-full rounded-xl border border-primary/25 bg-[#fbf9f3] px-4 text-base outline-none transition-colors focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/30";
const boutonCss =
  "inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full bg-primary px-7 text-sm font-medium text-primary-foreground transition duration-300 hover:-translate-y-0.5 hover:bg-[#4f5940] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary disabled:pointer-events-none disabled:opacity-60";

export default function Admin() {
  const queryClient = useQueryClient();
  const [session, setSession] = useState<Session | null>(null);
  const [erreurReseau, setErreurReseau] = useState(false);

  const [motDePasse, setMotDePasse] = useState("");
  const [connexionEnCours, setConnexionEnCours] = useState(false);
  const [erreurConnexion, setErreurConnexion] = useState("");

  const [champs, setChamps] = useState<Champs>(versChamps(TARIFS_PAR_DEFAUT));
  const [majLe, setMajLe] = useState<string | null>(null);
  const [source, setSource] = useState<"serveur" | "defaut" | null>(null);
  const [enregistrement, setEnregistrement] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "erreur"; texte: string } | null>(null);

  useEffect(() => {
    const ancienTitre = document.title;
    document.title = "Administration | ORANE";
    const meta = document.createElement("meta");
    meta.name = "robots";
    meta.content = "noindex, nofollow";
    document.head.appendChild(meta);
    window.scrollTo(0, 0);
    return () => {
      document.title = ancienTitre;
      meta.remove();
    };
  }, []);

  const chargerTarifs = useCallback(async () => {
    const r = await appeler("tarifs");
    const data = r.data as { tarifs?: unknown; updatedAt?: string | null; source?: "serveur" | "defaut" } | null;
    const v = r.ok && data ? validerTarifs(data.tarifs) : null;
    if (v && v.ok === true) {
      setChamps(versChamps(v.tarifs));
      setMajLe(data?.updatedAt ?? null);
      setSource(data?.source ?? null);
    }
  }, []);

  const chargerSession = useCallback(async () => {
    const r = await appeler("admin/session");
    if (!r.ok || !r.data) {
      setErreurReseau(true);
      return;
    }
    setErreurReseau(false);
    const s = r.data as unknown as Session;
    setSession(s);
    if (s.authentifie) await chargerTarifs();
  }, [chargerTarifs]);

  useEffect(() => {
    void chargerSession();
  }, [chargerSession]);

  async function seConnecter(e: FormEvent) {
    e.preventDefault();
    setConnexionEnCours(true);
    setErreurConnexion("");
    const r = await appeler("admin/session", { method: "POST", body: JSON.stringify({ motDePasse }) });
    setConnexionEnCours(false);
    if (r.ok) {
      setMotDePasse("");
      await chargerSession();
    } else {
      setErreurConnexion(
        typeof r.data?.erreur === "string" ? r.data.erreur : "Connexion impossible. Vérifiez votre connexion et réessayez.",
      );
    }
  }

  async function seDeconnecter() {
    await appeler("admin/session", { method: "DELETE" });
    setMessage(null);
    setSession((s) => (s ? { ...s, authentifie: false } : s));
  }

  const validation = useMemo(() => versTarifs(champs), [champs]);
  const apercu = validation.ok === true ? construireAffichage(validation.tarifs) : null;

  async function enregistrer(e: FormEvent) {
    e.preventDefault();
    setMessage(null);
    if (validation.ok === false) {
      setMessage({ type: "erreur", texte: validation.erreur });
      return;
    }
    setEnregistrement(true);
    const r = await appeler("tarifs", { method: "PUT", body: JSON.stringify({ tarifs: validation.tarifs }) });
    setEnregistrement(false);

    if (r.ok) {
      const data = r.data as { updatedAt?: string } | null;
      setMajLe(data?.updatedAt ?? null);
      setSource("serveur");
      setMessage({ type: "ok", texte: "Tarifs enregistrés. Le site est à jour." });
      await queryClient.invalidateQueries({ queryKey: ["tarifs"] });
    } else if (r.status === 401) {
      setSession((s) => (s ? { ...s, authentifie: false } : s));
      setErreurConnexion("Votre session a expiré. Reconnectez-vous : vos modifications n'ont pas été enregistrées.");
    } else {
      setMessage({
        type: "erreur",
        texte: typeof r.data?.erreur === "string" ? r.data.erreur : "L'enregistrement a échoué. Réessayez dans un instant.",
      });
    }
  }

  const dateMaj = majLe
    ? new Intl.DateTimeFormat("fr-FR", { dateStyle: "long", timeStyle: "short" }).format(new Date(majLe))
    : null;

  return (
    <div className="site-shell min-h-[100dvh] bg-[#f7f4ec] text-foreground">
      <header className="border-b border-primary/15">
        <div className="mx-auto flex max-w-[880px] items-center justify-between px-5 py-5 md:px-8">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full border border-primary/35 text-primary">
              <Leaf size={19} strokeWidth={1.3} />
            </span>
            <span className="leading-none">
              <span className="block text-[1.1rem] font-medium tracking-[.28em]">ORANE</span>
              <span className="mt-1.5 block text-[.55rem] tracking-[.19em] text-muted-foreground">ADMINISTRATION</span>
            </span>
          </div>
          <div className="flex items-center gap-5 text-sm">
            <Link href="/" className="inline-flex items-center gap-1.5 text-foreground/75 transition-colors hover:text-primary">
              Voir le site <ArrowUpRight size={14} />
            </Link>
            {session?.authentifie && (
              <button type="button" onClick={seDeconnecter} className="inline-flex items-center gap-1.5 text-foreground/75 transition-colors hover:text-primary">
                <LogOut size={14} /> Se déconnecter
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[880px] px-5 py-12 md:px-8 md:py-16">
        {erreurReseau && (
          <p role="alert" className="rounded-2xl border border-destructive/40 bg-destructive/5 p-5 text-sm leading-[1.8]">
            L'API n'est pas joignable. Sur Vercel, vérifiez que le dossier <code>api/</code> a bien été déployé. En local, lancez{" "}
            <code>pnpm dev</code> (ou <code>vercel dev</code>).
          </p>
        )}

        {!erreurReseau && session === null && <p className="text-sm text-muted-foreground">Chargement…</p>}

        {session && !session.configure && (
          <div role="alert" className="rounded-2xl border border-destructive/40 bg-destructive/5 p-6 text-sm leading-[1.85]">
            <p className="flex items-center gap-2 font-medium">
              <AlertTriangle size={17} /> Accès administrateur non configuré
            </p>
            <p className="mt-2">
              Définissez la variable d'environnement <code>ADMIN_PASSWORD</code> (10 caractères minimum) dans Vercel, puis
              redéployez. En local, mettez-la dans <code>.env.local</code>.
            </p>
          </div>
        )}

        {session?.configure && !session.authentifie && (
          <form onSubmit={seConnecter} className="mx-auto max-w-[420px]">
            <h1 className="display-serif text-4xl leading-tight">Espace administrateur</h1>
            <p className="mt-3 text-sm leading-[1.8] text-foreground/70">Saisissez le mot de passe pour modifier les tarifs du site.</p>
            <label htmlFor="mdp" className="mt-8 block text-sm font-medium">Mot de passe</label>
            <input
              id="mdp"
              type="password"
              autoComplete="current-password"
              required
              value={motDePasse}
              onChange={(e) => setMotDePasse(e.target.value)}
              className={`${champCss} mt-2`}
            />
            {erreurConnexion && (
              <p role="alert" className="mt-3 text-sm text-destructive">{erreurConnexion}</p>
            )}
            <button type="submit" disabled={connexionEnCours} className={`${boutonCss} mt-6 w-full`}>
              {connexionEnCours ? "Connexion…" : "Se connecter"}
            </button>
          </form>
        )}

        {session?.configure && session.authentifie && (
          <form onSubmit={enregistrer}>
            <h1 className="display-serif text-4xl leading-tight md:text-5xl">Tarifs du site</h1>
            <p className="mt-3 max-w-[560px] text-sm leading-[1.8] text-foreground/70">
              Ces valeurs s'affichent partout sur le site : formules, questions fréquentes, déroulé d'une séance et
              engagements.
            </p>
            {dateMaj && <p className="mt-2 text-xs text-muted-foreground">Dernière modification : {dateMaj}</p>}
            {source === "defaut" && (
              <p className="mt-2 text-xs text-muted-foreground">Aucun tarif enregistré pour l'instant : le site utilise les valeurs d'origine.</p>
            )}

            {session.stockage === "aucun" && (
              <p role="alert" className="mt-6 rounded-2xl border border-destructive/40 bg-destructive/5 p-5 text-sm leading-[1.8]">
                <strong className="font-medium">Stockage non configuré.</strong> Les modifications ne pourront pas être enregistrées. Dans Vercel :
                Storage → Marketplace → Upstash Redis, puis redéployez.
              </p>
            )}
            {session.stockage === "fichier" && (
              <p className="mt-6 rounded-2xl border border-primary/25 bg-[#f1eee3] p-4 text-xs leading-[1.8]">
                Mode développement : les tarifs sont enregistrés dans le fichier local <code>.data/store.json</code>.
              </p>
            )}

            <div className="mt-8 grid gap-4 md:grid-cols-2">
              {GROUPES.map((groupe) => (
                <fieldset key={groupe.titre} className="rounded-2xl border border-primary/20 bg-[#f1eee3] p-5">
                  <legend className="display-serif px-1 text-2xl">{groupe.titre}</legend>
                  <div className="mt-2 space-y-4">
                    {groupe.champs.map((champ) => (
                      <div key={champ.cle}>
                        <label htmlFor={champ.cle} className="block text-sm font-medium">
                          {champ.label} <span className="font-normal text-muted-foreground">({champ.unite})</span>
                        </label>
                        <input
                          id={champ.cle}
                          inputMode="decimal"
                          autoComplete="off"
                          value={champs[champ.cle]}
                          onChange={(e) => setChamps((c) => ({ ...c, [champ.cle]: e.target.value }))}
                          aria-describedby={champ.aide ? `${champ.cle}-aide` : undefined}
                          className={`${champCss} mt-1.5`}
                        />
                        {champ.aide && (
                          <p id={`${champ.cle}-aide`} className="mt-1 text-xs text-muted-foreground">{champ.aide}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </fieldset>
              ))}
            </div>

            <section aria-labelledby="apercu" className="mt-8 rounded-2xl border border-primary/20 p-5">
              <h2 id="apercu" className="display-serif text-2xl">Aperçu sur le site</h2>
              {apercu ? (
                <ul className="mt-3 space-y-1.5 text-sm text-foreground/80">
                  <li>{apercu.decouverte.titre} : {apercu.decouverte.duree} · {apercu.decouverte.prix}</li>
                  <li>Séance individuelle : {apercu.seance.duree} · {apercu.seance.prix}</li>
                  <li>Pack 5 séances : {apercu.pack5.prix}</li>
                  <li>Pack 10 séances : {apercu.pack10.prix}</li>
                  <li>{apercu.domicile.phrase}</li>
                </ul>
              ) : (
                <p className="mt-3 text-sm text-muted-foreground">
                  {validation.ok === false ? validation.erreur : ""}
                </p>
              )}
            </section>

            <div className="mt-6 flex flex-wrap items-center gap-4">
              <button type="submit" disabled={enregistrement || validation.ok === false || session.stockage === "aucun"} className={boutonCss}>
                <Save size={16} /> {enregistrement ? "Enregistrement…" : "Enregistrer les tarifs"}
              </button>
              <p role="status" aria-live="polite" className={`text-sm ${message?.type === "erreur" ? "text-destructive" : "text-primary"}`}>
                {message?.type === "ok" && <CheckCircle2 size={16} className="mr-1.5 inline align-[-3px]" />}
                {message?.texte}
              </p>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}
