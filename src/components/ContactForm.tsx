import { useState, type FormEvent } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Check, CheckCircle2, Send } from "lucide-react";
import { envoyerFormspree, formspreeConfigure } from "@/lib/contact";

const champ =
  "h-12 w-full rounded-xl border border-primary/25 bg-[#fbf9f3] px-4 text-base outline-none transition-colors focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/30";

const fade = {
  hidden: { opacity: 0, y: 22 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: "easeOut" as const } },
};

/** Formulaire de contact : les messages sont envoyés par Formspree (variable VITE_FORMSPREE_ENDPOINT). Masqué sans cette variable. */
export default function ContactForm() {
  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [consentement, setConsentement] = useState(false);
  const [piege, setPiege] = useState("");
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState("");
  const [envoye, setEnvoye] = useState(false);

  if (!formspreeConfigure()) return null;

  async function envoyer(e: FormEvent) {
    e.preventDefault();
    setEnvoi(true);
    setErreur("");
    const resultat = await envoyerFormspree({
      _subject: `Message de ${nom.trim()} (site ORANE)`,
      name: nom.trim(),
      email: email.trim(),
      message: message.trim(),
      _gotcha: piege, // champ piège : doit rester vide
    });
    setEnvoi(false);
    if (resultat.ok) {
      setEnvoye(true);
      setNom("");
      setEmail("");
      setMessage("");
      setConsentement(false);
    } else {
      setErreur(resultat.erreur);
    }
  }

  return (
    <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-70px" }} variants={fade} className="mx-auto max-w-[760px] rounded-[2rem] border border-[#d7d2c1] bg-[#f8f5ed] p-7 md:p-10">
      <p className="eyebrow mb-4 text-primary">Écrire à ORANE</p>
      <h3 className="display-serif text-4xl leading-[1.05] md:text-5xl">
        Vous préférez <span className="italic text-primary">écrire ?</span>
      </h3>

      {envoye ? (
        <div role="status" className="mt-7 flex gap-4 rounded-2xl border border-primary/25 bg-[#f1eee3] p-6">
          <CheckCircle2 size={26} strokeWidth={1.4} className="mt-0.5 shrink-0 text-primary" aria-hidden="true" />
          <div className="text-sm leading-[1.85] text-foreground/78">
            <p className="font-medium text-foreground">Merci, votre message est bien parti.</p>
            <p className="mt-1">Vous recevrez une réponse par e-mail.</p>
            <button type="button" onClick={() => setEnvoye(false)} className="mt-3 text-primary underline underline-offset-4">Écrire un autre message</button>
          </div>
        </div>
      ) : (
        <form onSubmit={envoyer} className="mt-6">
          <p className="max-w-[520px] text-sm leading-[1.85] text-foreground/72">
            Laissez quelques mots, ORANE vous répond par e-mail. Inutile de détailler votre situation : nous en parlerons ensemble.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="contact-nom" className="block text-sm font-medium">Nom</label>
              <input id="contact-nom" autoComplete="name" required minLength={2} maxLength={100} value={nom} onChange={(e) => setNom(e.target.value)} className={`${champ} mt-1.5`} />
            </div>
            <div>
              <label htmlFor="contact-email" className="block text-sm font-medium">E-mail</label>
              <input id="contact-email" type="email" autoComplete="email" required maxLength={254} value={email} onChange={(e) => setEmail(e.target.value)} className={`${champ} mt-1.5`} />
            </div>
          </div>
          <label htmlFor="contact-message" className="mt-4 block text-sm font-medium">Message</label>
          <textarea
            id="contact-message"
            rows={5}
            required
            minLength={5}
            maxLength={2000}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-primary/25 bg-[#fbf9f3] px-4 py-3 text-base outline-none transition-colors focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/30"
          />

          {/* Champ piège pour les robots : invisible et hors du parcours clavier. */}
          <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
            <label htmlFor="contact-gotcha">Ne pas remplir</label>
            <input id="contact-gotcha" name="_gotcha" tabIndex={-1} autoComplete="off" value={piege} onChange={(e) => setPiege(e.target.value)} />
          </div>

          <label className="mt-5 flex cursor-pointer items-start gap-3 text-sm leading-[1.7] text-foreground/78">
            <input type="checkbox" required checked={consentement} onChange={(e) => setConsentement(e.target.checked)} className="peer sr-only" />
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border border-primary/50 bg-[#fbf9f3] text-primary-foreground peer-checked:bg-primary peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-primary">
              {consentement && <Check size={14} aria-hidden="true" />}
            </span>
            <span>
              J'accepte que ces informations soient utilisées pour répondre à mon message (voir la{" "}
              <Link href="/politique-de-confidentialite" className="text-primary underline underline-offset-4">politique de confidentialité</Link>).
            </span>
          </label>

          {erreur && <p role="alert" className="mt-4 text-sm leading-[1.7] text-destructive">{erreur}</p>}

          <button
            type="submit"
            disabled={envoi}
            className="mt-6 inline-flex min-h-[52px] items-center justify-center gap-2 rounded-full bg-primary px-8 text-sm font-medium text-primary-foreground transition duration-300 hover:-translate-y-0.5 hover:bg-[#4f5940] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary disabled:pointer-events-none disabled:opacity-60"
          >
            <Send size={15} /> {envoi ? "Envoi…" : "Envoyer le message"}
          </button>
        </form>
      )}
    </motion.div>
  );
}
