import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Link } from "wouter";
import { ArrowUpRight, CalendarDays, Euro, Leaf, LogOut, AlertTriangle } from "lucide-react";
import { appeler, messageErreur } from "@/lib/api";
import AdminTarifs from "@/components/admin/AdminTarifs";
import AdminCreneaux from "@/components/admin/AdminCreneaux";
import { boutonCss, champCss, type Session } from "@/components/admin/commun";

type Onglet = "rdv" | "tarifs";

export default function Admin() {
  const [session, setSession] = useState<Session | null>(null);
  const [erreurReseau, setErreurReseau] = useState(false);
  const [onglet, setOnglet] = useState<Onglet>("rdv");

  const [motDePasse, setMotDePasse] = useState("");
  const [connexionEnCours, setConnexionEnCours] = useState(false);
  const [erreurConnexion, setErreurConnexion] = useState("");

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

  const chargerSession = useCallback(async () => {
    const r = await appeler("admin/session");
    if (!r.ok || !r.data) {
      setErreurReseau(true);
      return;
    }
    setErreurReseau(false);
    setSession(r.data as unknown as Session);
  }, []);

  useEffect(() => {
    void chargerSession();
  }, [chargerSession]);

  const sessionExpiree = useCallback(() => {
    setSession((s) => (s ? { ...s, authentifie: false } : s));
    setErreurConnexion("Votre session a expiré. Reconnectez-vous : vos dernières modifications n'ont peut-être pas été enregistrées.");
  }, []);

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
      setErreurConnexion(messageErreur(r, "Connexion impossible. Vérifiez votre connexion et réessayez."));
    }
  }

  async function seDeconnecter() {
    await appeler("admin/session", { method: "DELETE" });
    setSession((s) => (s ? { ...s, authentifie: false } : s));
  }

  const ongletCss = (actif: boolean) =>
    `inline-flex items-center gap-2 border-b-2 px-1 pb-3 text-sm font-medium transition-colors ${
      actif ? "border-primary text-primary" : "border-transparent text-foreground/60 hover:text-primary"
    }`;

  return (
    <div className="site-shell min-h-[100dvh] bg-[#f7f4ec] text-foreground">
      <header className="border-b border-primary/15">
        <div className="mx-auto flex max-w-[920px] items-center justify-between px-5 py-5 md:px-8">
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

      <main className="mx-auto max-w-[920px] px-5 py-12 md:px-8 md:py-16">
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
              Définissez la variable d'environnement <code>ADMIN_PASSWORD</code> (10 caractères minimum) dans Vercel, puis redéployez. En
              local, mettez-la dans <code>.env.local</code>.
            </p>
          </div>
        )}

        {session?.configure && !session.authentifie && (
          <form onSubmit={seConnecter} className="mx-auto max-w-[420px]">
            <h1 className="display-serif text-4xl leading-tight">Espace administrateur</h1>
            <p className="mt-3 text-sm leading-[1.8] text-foreground/70">Saisissez le mot de passe pour gérer les rendez-vous et les tarifs du site.</p>
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
            {erreurConnexion && <p role="alert" className="mt-3 text-sm text-destructive">{erreurConnexion}</p>}
            <button type="submit" disabled={connexionEnCours} className={`${boutonCss} mt-6 w-full`}>
              {connexionEnCours ? "Connexion…" : "Se connecter"}
            </button>
          </form>
        )}

        {session?.configure && session.authentifie && (
          <>
            <h1 className="sr-only">Administration</h1>
            <div role="tablist" aria-label="Sections de l'administration" className="mb-10 flex gap-8 border-b border-primary/20">
              <button role="tab" type="button" id="onglet-rdv" aria-selected={onglet === "rdv"} aria-controls="panneau-rdv" onClick={() => setOnglet("rdv")} className={ongletCss(onglet === "rdv")}>
                <CalendarDays size={16} /> Rendez-vous
              </button>
              <button role="tab" type="button" id="onglet-tarifs" aria-selected={onglet === "tarifs"} aria-controls="panneau-tarifs" onClick={() => setOnglet("tarifs")} className={ongletCss(onglet === "tarifs")}>
                <Euro size={16} /> Tarifs
              </button>
            </div>
            {onglet === "rdv" ? (
              <div role="tabpanel" id="panneau-rdv" aria-labelledby="onglet-rdv">
                <AdminCreneaux session={session} onSessionExpiree={sessionExpiree} />
              </div>
            ) : (
              <div role="tabpanel" id="panneau-tarifs" aria-labelledby="onglet-tarifs">
                <AdminTarifs session={session} onSessionExpiree={sessionExpiree} />
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
