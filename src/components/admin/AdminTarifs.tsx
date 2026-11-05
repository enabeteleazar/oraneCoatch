import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Save } from "lucide-react";
import { TARIFS_PAR_DEFAUT, validerTarifs, type Tarifs } from "../../../shared/tarifs";
import { construireAffichage } from "@/lib/tarifs";
import { appeler, messageErreur } from "@/lib/api";
import { boutonCss, champCss, type Session } from "./commun";

type Champs = Record<string, string>;

const GROUPES: { titre: string; champs: { cle: string; label: string; unite: string; aide?: string }[] }[] = [
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

export default function AdminTarifs({ session, onSessionExpiree }: { session: Session; onSessionExpiree: () => void }) {
  const queryClient = useQueryClient();
  const [champs, setChamps] = useState<Champs>(versChamps(TARIFS_PAR_DEFAUT));
  const [majLe, setMajLe] = useState<string | null>(null);
  const [source, setSource] = useState<"serveur" | "defaut" | null>(null);
  const [enregistrement, setEnregistrement] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "erreur"; texte: string } | null>(null);

  const charger = useCallback(async () => {
    const r = await appeler("tarifs");
    const data = r.data as { tarifs?: unknown; updatedAt?: string | null; source?: "serveur" | "defaut" } | null;
    const v = r.ok && data ? validerTarifs(data.tarifs) : null;
    if (v && v.ok === true) {
      setChamps(versChamps(v.tarifs));
      setMajLe(data?.updatedAt ?? null);
      setSource(data?.source ?? null);
    }
  }, []);

  useEffect(() => {
    void charger();
  }, [charger]);

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
      setMajLe((r.data as { updatedAt?: string } | null)?.updatedAt ?? null);
      setSource("serveur");
      setMessage({ type: "ok", texte: "Tarifs enregistrés. Le site est à jour." });
      await queryClient.invalidateQueries({ queryKey: ["tarifs"] });
    } else if (r.status === 401) {
      onSessionExpiree();
    } else {
      setMessage({ type: "erreur", texte: messageErreur(r, "L'enregistrement a échoué. Réessayez dans un instant.") });
    }
  }

  const dateMaj = majLe ? new Intl.DateTimeFormat("fr-FR", { dateStyle: "long", timeStyle: "short" }).format(new Date(majLe)) : null;

  return (
    <form onSubmit={enregistrer}>
      <h2 className="display-serif text-3xl leading-tight md:text-4xl">Tarifs du site</h2>
      <p className="mt-3 max-w-[560px] text-sm leading-[1.8] text-foreground/70">
        Ces valeurs s'affichent partout sur le site : formules, questions fréquentes, déroulé d'une séance, engagements et
        prise de rendez-vous. La durée des séances détermine aussi la longueur des créneaux créés.
      </p>
      {dateMaj && <p className="mt-2 text-xs text-muted-foreground">Dernière modification : {dateMaj}</p>}
      {source === "defaut" && (
        <p className="mt-2 text-xs text-muted-foreground">Aucun tarif enregistré pour l'instant : le site utilise les valeurs d'origine.</p>
      )}

      {session.stockage === "aucune" && (
        <p role="alert" className="mt-6 rounded-2xl border border-destructive/40 bg-destructive/5 p-5 text-sm leading-[1.8]">
          <strong className="font-medium">Base de données non configurée.</strong> Les modifications ne pourront pas être enregistrées.
          Définissez la variable <code>DATABASE_URL</code> (connexion Neon), puis redéployez.
        </p>
      )}
      {session.stockage === "local" && (
        <p className="mt-6 rounded-2xl border border-primary/25 bg-[#f1eee3] p-4 text-xs leading-[1.8]">
          Mode développement : les données sont enregistrées dans une base locale (<code>.data/pglite</code>).
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
                    <p id={`${champ.cle}-aide`} className="mt-1 text-xs text-muted-foreground">
                      {champ.aide}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </fieldset>
        ))}
      </div>

      <section aria-labelledby="apercu" className="mt-8 rounded-2xl border border-primary/20 p-5">
        <h3 id="apercu" className="display-serif text-2xl">Aperçu sur le site</h3>
        {apercu ? (
          <ul className="mt-3 space-y-1.5 text-sm text-foreground/80">
            <li>{apercu.decouverte.titre} : {apercu.decouverte.duree} · {apercu.decouverte.prix}</li>
            <li>Séance individuelle : {apercu.seance.duree} · {apercu.seance.prix}</li>
            <li>Pack 5 séances : {apercu.pack5.prix}</li>
            <li>Pack 10 séances : {apercu.pack10.prix}</li>
            <li>{apercu.domicile.phrase}</li>
          </ul>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">{validation.ok === false ? validation.erreur : ""}</p>
        )}
      </section>

      <div className="mt-6 flex flex-wrap items-center gap-4">
        <button type="submit" disabled={enregistrement || validation.ok === false || session.stockage === "aucune"} className={boutonCss}>
          <Save size={16} /> {enregistrement ? "Enregistrement…" : "Enregistrer les tarifs"}
        </button>
        <p role="status" aria-live="polite" className={`text-sm ${message?.type === "erreur" ? "text-destructive" : "text-primary"}`}>
          {message?.type === "ok" && <CheckCircle2 size={16} className="mr-1.5 inline align-[-3px]" />}
          {message?.texte}
        </p>
      </div>
    </form>
  );
}
