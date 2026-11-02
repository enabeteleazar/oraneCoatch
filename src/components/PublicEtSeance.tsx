import { motion } from "framer-motion";
import { Link } from "wouter";
import { ArrowRight, Battery, CalendarDays, Compass, Ear } from "lucide-react";
import { Tarif, useTarifs, type TarifsAffichage } from "@/lib/tarifs";

/**
 * ⚠️ À RELIRE / À COMPLÉTER avant mise en ligne.
 * Le contenu s'appuie uniquement sur ce que le site dit déjà (écoute, rythme libre, séance
 * découverte offerte de 30 min, séance individuelle de 1 h 30, packs, visites à domicile).
 * Les champs ci-dessous à `null` sont masqués : renseignez-les pour les afficher.
 */
const infos = {
  telephone: "06 86 54 47 66",
  telephoneHref: "tel:+33686544766",
  // Ex. : "Je reçois des adultes, en individuel." (à ne renseigner que si c'est exact)
  precisionPublic: null as string | null,
  // Ex. : "Les séances ont lieu à [ville / cabinet], ou à votre domicile (+ 10 €)."
  lieu: null as string | null,
};

const fade = {
  hidden: { opacity: 0, y: 22 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: "easeOut" as const } },
};

const profils = [
  { icon: Battery, titre: "Épuisé(e)", texte: "L'énergie manque, et tout semble demander un effort de plus." },
  { icon: Compass, titre: "Dépassé(e)", texte: "Les choses s'accumulent et vous ne savez plus par où commencer." },
  { icon: Ear, titre: "Incompris(e)", texte: "Vous aimeriez être entendu(e), sans avoir à vous justifier." },
];

const construireEtapes = (t: TarifsAffichage) => [
  {
    numero: "01",
    titre: "Un premier contact",
    texte: "Vous choisissez un créneau en ligne ou vous appelez ORANE, simplement. Pas besoin d'expliquer tout de suite ce qui vous amène.",
    meta: "En ligne ou par téléphone",
  },
  {
    numero: "02",
    titre: "La séance découverte",
    texte: "Un temps pour faire connaissance, dire ce qui vous amène si vous le souhaitez et poser vos questions. Vous voyez ensuite si cet accompagnement vous convient.",
    meta: `${t.decouverte.duree} · ${t.decouverte.offerte ? "offerte" : t.decouverte.prix}`,
  },
  {
    numero: "03",
    titre: "La séance individuelle",
    texte: "Un temps d'écoute pour déposer ce qui pèse, faire émerger vos propres repères et choisir le pas suivant. Il n'y a ni parcours imposé ni bonne façon de faire.",
    meta: t.seance.duree,
  },
  {
    numero: "04",
    titre: "Et ensuite ?",
    texte: "À votre rythme : une séance isolée, un pack de 5 ou de 10 séances, ou une pause. Vous décidez, et nous en parlons simplement.",
    meta: "Votre choix",
  },
];

export default function PublicEtSeance() {
  const tarifs = useTarifs();
  const etapes = construireEtapes(tarifs);
  return (
    <section id="deroule" className="bg-[#f7f4ec] py-20 md:py-28">
      <div className="mx-auto max-w-[1120px] px-6 md:px-10">
        {/* Pour qui */}
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} variants={fade} className="max-w-[680px]">
          <p className="eyebrow mb-5 text-primary">Pour qui ?</p>
          <h2 className="display-serif text-5xl leading-[1] md:text-[4.2rem]">
            Peut-être que <span className="italic text-primary">vous vous reconnaissez.</span>
          </h2>
          <p className="mt-6 max-w-[540px] text-base leading-[1.9] text-foreground/72">
            Cet accompagnement s'adresse à celles et ceux qui traversent un moment difficile. Vous n'avez pas besoin
            de savoir ce que vous cherchez, ni de tout raconter dès la première fois.
          </p>
          {infos.precisionPublic && <p className="mt-3 max-w-[540px] text-base leading-[1.9] text-foreground/72">{infos.precisionPublic}</p>}
        </motion.div>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {profils.map(({ icon: Icon, titre, texte }, index) => (
            <motion.article
              key={titre}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-40px" }}
              variants={fade}
              transition={{ delay: index * 0.08 }}
              className="rounded-2xl border border-primary/20 bg-[#f1eee3] p-6"
            >
              <Icon size={21} strokeWidth={1.4} className="text-primary" aria-hidden="true" />
              <h3 className="display-serif mt-5 text-3xl">{titre}</h3>
              <p className="mt-2 text-sm leading-[1.8] text-foreground/70">{texte}</p>
            </motion.article>
          ))}
        </div>

        <p className="mt-6 max-w-[680px] border-l-2 border-primary/35 pl-5 text-sm leading-[1.8] text-foreground/70">
          L'accompagnement ne remplace pas un suivi médical ou psychologique. Si vous êtes en danger ou en grande
          détresse, utilisez{" "}
          <a href="#urgence" className="text-primary underline underline-offset-4">les numéros d'urgence</a>.
        </p>

        {/* Déroulé */}
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} variants={fade} className="mt-20 max-w-[680px] md:mt-28">
          <p className="eyebrow mb-5 text-primary">Le déroulé</p>
          <h2 className="display-serif text-5xl leading-[1] md:text-[4.2rem]">
            Une séance, <span className="italic text-primary">pas à pas.</span>
          </h2>
        </motion.div>

        <ol className="mt-10 grid gap-px border-y border-primary/20 sm:grid-cols-2 lg:grid-cols-4">
          {etapes.map(({ numero, titre, texte, meta }, index) => (
            <motion.li
              key={numero}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-40px" }}
              variants={fade}
              transition={{ delay: index * 0.08 }}
              className="border-b border-primary/20 py-8 sm:px-6 sm:odd:border-r lg:border-b-0 lg:border-r lg:px-7 lg:first:pl-0 lg:last:border-r-0"
            >
              <span className="font-serif text-2xl italic text-primary/70">{numero}</span>
              <h3 className="display-serif mt-6 text-3xl leading-tight">{titre}</h3>
              <p className="mt-2 text-xs font-medium tracking-[.08em] text-primary"><Tarif pret={tarifs.pret}>{meta}</Tarif></p>
              <p className="mt-3 text-sm leading-[1.85] text-foreground/70">{texte}</p>
            </motion.li>
          ))}
        </ol>

        {infos.lieu && <p className="mt-6 max-w-[680px] text-sm leading-[1.8] text-foreground/70">{infos.lieu}</p>}

        <div className="mt-8 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
          <Link
            href="/rendez-vous"
            className="group inline-flex min-h-[50px] items-center gap-3 rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground transition duration-300 hover:-translate-y-0.5 hover:bg-[#4f5940] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
          >
            <CalendarDays size={15} /> Prendre rendez-vous <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
          </Link>
          <a href="#formules" className="inline-flex items-center gap-2 px-2 py-3 text-sm text-foreground/75 transition-colors hover:text-primary">
            Voir les formules et tarifs
          </a>
        </div>
      </div>
    </section>
  );
}
