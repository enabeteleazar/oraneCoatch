import { motion } from "framer-motion";
import { ArrowUpRight, Quote } from "lucide-react";

/**
 * ⚠️ À COMPLÉTER : la section reste invisible tant qu'il n'y a ni témoignage validé ni lien Google.
 *
 * Règles à respecter (personnes accompagnées = public en situation de fragilité) :
 * - Ne publiez un témoignage qu'avec l'accord ÉCRIT de son auteur (e-mail ou SMS suffisent) :
 *   gardez la preuve et mettez `consentement: true`. Un témoignage sans accord n'est jamais affiché.
 * - Prénom ou initiale uniquement, jamais de nom complet, de ville ou de détail permettant
 *   de reconnaître la personne.
 * - Ne retouchez pas le sens d'un témoignage. Aucune contrepartie (remise, cadeau) en échange d'un avis.
 * - Évitez les témoignages qui évoquent un état de santé précis ou une « guérison ».
 * - Une personne peut demander le retrait de son témoignage à tout moment : supprimez alors l'entrée.
 * - Avis Google : ils ne sont pas récupérés automatiquement (voir note dans la réponse). Pour en
 *   reprendre un ici, demandez d'abord l'accord de son auteur, puis mettez `source: "google"`.
 */
const AFFICHER_TEMOIGNAGES = true;

// Lien vers votre fiche Google (« Voir tous les avis »). Laissez `null` pour ne rien afficher.
const lienAvisGoogle: string | null = null;
// Lien « Laisser un avis » de votre fiche Google. Laissez `null` pour ne rien afficher.
const lienDeposerAvis: string | null = null;

type Temoignage = {
  prenom: "Janine Haddad (Janouche)"; // ex. "Marie" ou "M."
  texte: "Je recommande.";
  date?: "Septembre 2026"; // ex. "mars 2026"
  source: "google";
  consentement: true; // true seulement si vous avez l'accord écrit de la personne
};

const temoignages: Temoignage[] = [
  // {
  //   prenom: "Marie",
  //   texte: "…",
  //   date: "mars 2026",
  //   source: "direct",
  //   consentement: true,
  // },
];

const fade = {
  hidden: { opacity: 0, y: 22 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: "easeOut" as const } },
};

export default function Temoignages() {
  if (!AFFICHER_TEMOIGNAGES) return null;

  const valides = temoignages.filter((t) => t.consentement);
  if (valides.length === 0 && !lienAvisGoogle && !lienDeposerAvis) return null;

  return (
    <section id="temoignages" className="bg-[#f7f4ec] py-20 md:py-28">
      <div className="mx-auto max-w-[1120px] px-6 md:px-10">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} variants={fade} className="max-w-[680px]">
          <p className="eyebrow mb-5 text-primary">Témoignages</p>
          <h2 className="display-serif text-5xl leading-[1] md:text-[4.2rem]">
            Ils en parlent, <span className="italic text-primary">avec leurs mots.</span>
          </h2>
        </motion.div>

        {valides.length > 0 && (
          <>
            <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {valides.map((t, index) => (
                <motion.figure
                  key={`${t.prenom}-${index}`}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: "-40px" }}
                  variants={fade}
                  transition={{ delay: index * 0.08 }}
                  className="flex flex-col rounded-2xl border border-primary/20 bg-[#f1eee3] p-6"
                >
                  <Quote size={20} strokeWidth={1.4} className="text-primary/70" aria-hidden="true" />
                  <blockquote className="mt-4 flex-1 text-[.97rem] leading-[1.85] text-foreground/78">{t.texte}</blockquote>
                  <figcaption className="mt-5 border-t border-primary/15 pt-4 text-xs text-foreground/65">
                    <span className="font-medium text-foreground">{t.prenom}</span>
                    {t.date && <span> · {t.date}</span>}
                    {t.source === "google" && <span> · Avis publié sur Google</span>}
                  </figcaption>
                </motion.figure>
              ))}
            </div>
            <p className="mt-6 text-xs leading-relaxed text-muted-foreground">
              Témoignages publiés avec l'accord de leurs auteurs. Ils peuvent être retirés à tout moment sur simple demande.
            </p>
          </>
        )}

        {(lienAvisGoogle || lienDeposerAvis) && (
          <div className="mt-8 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:gap-8">
            {lienAvisGoogle && (
              <a
                href={lienAvisGoogle}
                target="_blank"
                rel="noreferrer noopener"
                className="group inline-flex items-center gap-3 border-b border-primary/40 pb-2 text-sm font-medium text-primary transition-colors hover:border-primary hover:text-[#4f5940]"
              >
                Voir les avis sur Google <ArrowUpRight size={15} className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </a>
            )}
            {lienDeposerAvis && (
              <a
                href={lienDeposerAvis}
                target="_blank"
                rel="noreferrer noopener"
                className="group inline-flex items-center gap-3 border-b border-primary/40 pb-2 text-sm font-medium text-primary transition-colors hover:border-primary hover:text-[#4f5940]"
              >
                Laisser un avis <ArrowUpRight size={15} className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </a>
            )}
          </div>
        )}
      </div>
    </section>
  );
}