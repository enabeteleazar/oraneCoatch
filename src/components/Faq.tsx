import type { ReactNode } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Phone, Plus } from "lucide-react";
import { Tarif, useTarifs, type TarifsAffichage } from "@/lib/tarifs";

/**
 * ⚠️ À RELIRE avant mise en ligne.
 * Les réponses reprennent ce que le site dit déjà (tarifs, durée, visites à domicile, séance
 * découverte) et les engagements de la section « Mes engagements ». Retirez ou reformulez toute
 * réponse qui ne correspond pas à votre pratique. Les tarifs ne sont pas répétés ici : ils restent
 * définis une seule fois, dans la section « Formules ».
 */
const AFFICHER_FAQ = true;

const telephone = "06 86 54 47 66";
const telephoneHref = "tel:+33686544766";

const lien = "text-primary underline underline-offset-4";

const construireQuestions = (t: TarifsAffichage): { question: string; reponse: ReactNode }[] => [
  {
    question: "À qui s'adresse cet accompagnement ?",
    reponse: (
      <p>
        À toute personne qui traverse un moment difficile : fatigue, impression d'être dépassé(e) ou de ne pas être
        compris(e). Vous n'avez pas besoin de savoir ce que vous cherchez pour commencer.
      </p>
    ),
  },
  {
    question: "Comment prendre rendez-vous ?",
    reponse: (
      <p>
        Par téléphone au <a href={telephoneHref} className={lien}>{telephone}</a>. Un premier échange, sans engagement,
        permet de fixer un moment qui vous convient.
      </p>
    ),
  },
  {
    question: "Que se passe-t-il lors de la séance découverte ?",
    reponse: (
      <p>
        C'est un temps de <Tarif pret={t.pret}>{t.decouverte.duree}</Tarif>,{" "}
        <Tarif pret={t.pret}>{t.decouverte.offerte ? "offert" : `au tarif de ${t.decouverte.prix}`}</Tarif>, pour faire
        connaissance, dire ce qui vous amène si vous le souhaitez et poser vos questions. Vous voyez ensuite si cet accompagnement vous convient. Le déroulé complet est détaillé
        dans <a href="#deroule" className={lien}>« Une séance, pas à pas »</a>.
      </p>
    ),
  },
  {
    question: "Combien de temps dure une séance, et combien coûte-t-elle ?",
    reponse: (
      <p>
        Une séance individuelle dure <Tarif pret={t.pret}>{t.seance.duree}</Tarif>. Le détail des tarifs (séance à l'unité, packs de 5 et de 10 séances) se
        trouve dans la section <a href="#formules" className={lien}>Formules</a>, et peut être adapté après discussion.
      </p>
    ),
  },
  {
    question: "Les séances peuvent-elles avoir lieu à mon domicile ?",
    reponse: (
      <p>
        <Tarif pret={t.pret}>{t.domicile.reponse}</Tarif>
      </p>
    ),
  },
  {
    question: "Est-ce une thérapie ? Cela remplace-t-il un suivi médical ou psychologique ?",
    reponse: (
      <p>
        Non. ORANE propose un accompagnement par l'écoute : ce n'est pas un acte médical et cela ne remplace ni un
        diagnostic, ni un traitement, ni le suivi d'un médecin ou d'un psychologue. Si votre situation dépasse ce cadre,
        je vous le dis et je vous oriente vers un professionnel de santé adapté.
      </p>
    ),
  },
  {
    question: "Ce que je confie reste-t-il confidentiel ?",
    reponse: (
      <p>
        Oui. Ce que vous partagez en séance reste entre nous, sauf obligation légale ou situation de danger grave.
        Pour en savoir plus sur vos données personnelles, consultez la{" "}
        <Link href="/politique-de-confidentialite" className={lien}>politique de confidentialité</Link>.
      </p>
    ),
  },
  {
    question: "Puis-je arrêter quand je veux ?",
    reponse: (
      <p>
        Oui. Vous décidez du rythme, de ce dont nous parlons et de la poursuite de l'accompagnement. Aucune formule ne
        vous est imposée.
      </p>
    ),
  },
  {
    question: "Quel est le rôle d'ADOMSAP ?",
    reponse: (
      <p>
        ORANE propose son accompagnement en partenariat avec ADOMSAP, une coopérative de services à la personne.
        Tout est expliqué sur la page{" "}
        <Link href="/partenariat-adomsap" className={lien}>Partenariat avec ADOMSAP</Link>.
      </p>
    ),
  },
  {
    question: "Que faire si je suis en danger ou en grande détresse ?",
    reponse: (
      <p>
        ORANE n'est pas un service d'urgence. Appelez sans attendre le <a href="tel:3114" className={lien}>3114</a>{" "}
        (prévention du suicide, gratuit, 24 h/24 et 7 j/7), le <a href="tel:15" className={lien}>15</a> (SAMU) ou le{" "}
        <a href="tel:112" className={lien}>112</a>. Ces numéros sont aussi rappelés{" "}
        <a href="#urgence" className={lien}>en bas de page</a>.
      </p>
    ),
  },
];

const fade = {
  hidden: { opacity: 0, y: 22 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: "easeOut" as const } },
};

export default function Faq() {
  const tarifs = useTarifs();
  if (!AFFICHER_FAQ) return null;
  const questions = construireQuestions(tarifs);

  return (
    <section id="faq" aria-labelledby="faq-titre" className="bg-[#f7f4ec] py-20 md:py-28">
      <div className="mx-auto grid max-w-[1120px] gap-12 px-6 md:grid-cols-[.8fr_1.2fr] md:gap-20 md:px-10">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} variants={fade} className="md:sticky md:top-28 md:self-start">
          <p className="eyebrow mb-5 text-primary">Questions fréquentes</p>
          <h2 id="faq-titre" className="display-serif text-5xl leading-[1] md:text-[4rem]">
            Vous vous <span className="italic text-primary">demandez…</span>
          </h2>
          <p className="mt-6 max-w-[360px] text-base leading-[1.9] text-foreground/72">
            Vous ne trouvez pas votre réponse ? Appelez, nous en parlerons simplement.
          </p>
          <a
            href={telephoneHref}
            className="group mt-7 inline-flex min-h-[48px] items-center gap-3 rounded-full border border-primary/40 px-6 text-sm font-medium text-primary transition-colors hover:bg-primary hover:text-primary-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
          >
            <Phone size={15} /> {telephone}
          </a>
        </motion.div>

        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-40px" }} variants={fade} className="border-t border-primary/20">
          {questions.map(({ question, reponse }) => (
            <details key={question} className="group border-b border-primary/20">
              <summary className="flex cursor-pointer list-none items-start justify-between gap-6 py-5 text-left transition-colors hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary [&::-webkit-details-marker]:hidden">
                <span className="display-serif text-xl leading-snug md:text-2xl">{question}</span>
                <Plus size={20} strokeWidth={1.5} aria-hidden="true" className="mt-1 shrink-0 text-primary transition-transform duration-300 group-open:rotate-45" />
              </summary>
              <div className="pb-6 pr-10 text-[.97rem] leading-[1.85] text-foreground/72">{reponse}</div>
            </details>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
