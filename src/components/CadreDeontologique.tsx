import { motion } from "framer-motion";
import { ArrowUpRight, Check } from "lucide-react";

/**
 * ⚠️ À RELIRE ET À FAIRE VÔTRES avant mise en ligne.
 * Ces engagements sont des promesses faites au public : ne gardez que ceux que vous tenez
 * réellement, et reformulez-les avec vos mots si besoin.
 */
const AFFICHER_CADRE_DEONTOLOGIQUE = true;

// Si vous adhérez à une association ou à un code de déontologie (ex. d'une fédération de coachs),
// renseignez-le ici. Laissez `null` sinon : rien ne sera affiché.
const codeDeontologie: { nom: string; url?: string } | null = null;

const engagements = [
  {
    titre: "Confidentialité",
    texte: "Ce que vous confiez en séance reste entre nous. Rien n'est transmis à un tiers sans votre accord, sauf obligation légale ou situation de danger grave.",
  },
  {
    titre: "Respect de votre rythme et de votre liberté",
    texte: "Vous décidez du rythme, de ce dont nous parlons et de la poursuite de l'accompagnement. Vous pouvez l'arrêter à tout moment.",
  },
  {
    titre: "Une écoute sans jugement",
    texte: "Votre histoire et vos émotions ont leur place, sans avoir à vous justifier.",
  },
  {
    titre: "Honnêteté sur ce que j'apporte",
    texte: "Aucune promesse de résultat. L'accompagnement n'est pas un acte médical et ne remplace pas un suivi médical ou psychologique.",
  },
  {
    titre: "Savoir orienter",
    texte: "Si votre situation dépasse mon cadre, je vous le dis et je vous oriente vers un professionnel de santé adapté.",
  },
  {
    titre: "Transparence sur les tarifs",
    texte: "Les tarifs sont affichés clairement, la séance découverte est offerte et aucune formule ne vous est imposée.",
  },
];

const fade = {
  hidden: { opacity: 0, y: 22 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: "easeOut" as const } },
};

export default function CadreDeontologique() {
  if (!AFFICHER_CADRE_DEONTOLOGIQUE) return null;

  return (
    <section id="engagements" className="bg-[#efebde] py-20 md:py-28">
      <div className="mx-auto grid max-w-[1120px] gap-12 px-6 md:grid-cols-[.8fr_1.2fr] md:gap-20 md:px-10">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} variants={fade}>
          <p className="eyebrow mb-5 text-primary">Cadre déontologique</p>
          <h2 className="display-serif text-5xl leading-[1] md:text-[4rem]">
            Mes <span className="italic text-primary">engagements.</span>
          </h2>
          <p className="mt-6 text-base leading-[1.9] text-foreground/72">
            Vous confier demande de la confiance. Voici le cadre dans lequel se déroule chaque accompagnement.
          </p>
          {codeDeontologie && (
            <p className="mt-6 text-sm leading-[1.8] text-foreground/70">
              {codeDeontologie.url ? (
                <a href={codeDeontologie.url} target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-2 text-primary underline underline-offset-4">
                  {codeDeontologie.nom} <ArrowUpRight size={14} />
                </a>
              ) : (
                <span className="text-primary">{codeDeontologie.nom}</span>
              )}
            </p>
          )}
        </motion.div>

        <ul className="space-y-6">
          {engagements.map(({ titre, texte }, index) => (
            <motion.li
              key={titre}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-40px" }}
              variants={fade}
              transition={{ delay: index * 0.06 }}
              className="flex items-start gap-4 border-b border-primary/20 pb-6 last:border-b-0"
            >
              <span className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/15">
                <Check size={15} className="text-primary" aria-hidden="true" />
              </span>
              <div>
                <h3 className="display-serif text-2xl leading-tight">{titre}</h3>
                <p className="mt-2 text-sm leading-[1.85] text-foreground/70">{texte}</p>
              </div>
            </motion.li>
          ))}
        </ul>
      </div>
    </section>
  );
}