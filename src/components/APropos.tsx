import { motion } from "framer-motion";
import { Award, Check, GraduationCap, Leaf } from "lucide-react";

/**
 * ⚠️ À COMPLÉTER : cette section s'affiche dès qu'au moins un champ ci-dessous est renseigné.
 * Tant que tout vaut `null` / `[]`, elle reste invisible sur le site.
 *
 * Règles à respecter (page publique, public en situation de fragilité) :
 * - N'indiquez que des informations exactes et vérifiables (diplômes, organismes, années).
 * - Ne mentionnez « psychologue » ou « psychothérapeute » que si vous détenez réellement le titre
 *   (psychothérapeute : inscription au registre national de l'ARS).
 * - Photo : déposez le fichier (WebP ou JPG, < 200 Ko) dans `public/images/` et renseignez
 *   `photo: "images/nom-du-fichier.webp"`. N'utilisez pas d'image générée ou d'archive à la place.
 */
/**
 * Interrupteur de la section : `true` l'affiche (si au moins un champ de `profil` est renseigné),
 * `false` la masque complètement, même si `profil` est rempli.
 */
const AFFICHER_A_PROPOS = true;

const profil = {
  nom: null as string | null, // ex. "Prénom Nom"
  titre: null as string | null, // ex. l'intitulé exact de votre activité
  photo: null as string | null, // ex. "images/orane.webp"
  photoAlt: "Portrait de votre accompagnante ou accompagnant",
  bio: [] as string[], // un ou deux courts paragraphes : parcours, ce qui vous a menée ou mené ici
  formations: [] as string[], // ex. "Intitulé du diplôme, organisme, année"
  certifications: [] as string[], // ex. "Intitulé de la certification, organisme, année"
  // Votre façon de travailler : une liste de principes (titre + courte phrase)
  methode: [
    { titre: "Écoute", texte: "Une présence attentive sans jugement." },
    { titre: "Accompagnement", texte: "Un guide à vos côtés, pas à pas." },
    { titre: "Confiance", texte: "Un espace sûr pour vous exprimer." },
    { titre: "Progression", texte: "Avancer à votre rythme vers vos objectifs." },
    { titre: "Équilibre de vie", texte: "Harmoniser vos différentes sphères de vie." },
  ] as { titre: string; texte: string }[],
};

const fade = {
  hidden: { opacity: 0, y: 22 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: "easeOut" as const } },
};

function Liste({ titre, items, icon: Icon }: { titre: string; items: string[]; icon: typeof Award }) {
  if (items.length === 0) return null;
  return (
    <div>
      <h3 className="flex items-center gap-2 text-sm font-medium tracking-[.04em] text-primary">
        <Icon size={16} strokeWidth={1.5} aria-hidden="true" /> {titre}
      </h3>
      <ul className="mt-3 space-y-2 border-l border-primary/25 pl-5 text-sm leading-[1.75] text-foreground/75">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

export default function APropos() {
  if (!AFFICHER_A_PROPOS) return null;

  const aDuContenu =
    Boolean(profil.nom || profil.titre || profil.photo) ||
    profil.bio.length > 0 ||
    profil.formations.length > 0 ||
    profil.certifications.length > 0 ||
    profil.methode.length > 0;

  if (!aDuContenu) return null;

  const photoSrc = profil.photo ? `${import.meta.env.BASE_URL}${profil.photo.replace(/^\//, "")}` : null;

  return (
    <section id="a-propos" className="bg-[#e9e7dc] py-20 md:py-28">
      <div className={`mx-auto grid gap-12 px-6 md:px-10 ${photoSrc ? "max-w-[1120px] md:grid-cols-[.8fr_1.2fr] md:items-start md:gap-20" : "max-w-[820px]"}`}>
        {photoSrc && (
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} variants={fade} className="relative mx-auto w-full max-w-[420px] md:mx-0">
            <div className="absolute -inset-3 rotate-[-2deg] rounded-[48%_48%_4px_4px] bg-[#dedbca]" />
            <img src={photoSrc} alt={profil.photoAlt} loading="lazy" className="relative aspect-[.85] w-full rounded-[48%_48%_4px_4px] object-cover" />
          </motion.div>
        )}

        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} variants={fade}>
          <p className="eyebrow mb-5 flex items-center gap-2 text-primary">
            <Leaf size={14} strokeWidth={1.5} aria-hidden="true" /> À propos
          </p>
          <h2 className="display-serif text-5xl leading-[1] md:text-[4rem]">
            {profil.nom ? (
              <>
                {profil.nom}
              </>
            ) : (
              <>
                Qui vous <span className="italic text-primary">accompagne.</span>
              </>
            )}
          </h2>
          {profil.titre && <p className="mt-3 text-sm font-medium tracking-[.06em] text-primary">{profil.titre}</p>}

          {profil.bio.length > 0 && (
            <div className="mt-7 space-y-4 text-base leading-[1.9] text-foreground/75">
              {profil.bio.map((paragraphe) => (
                <p key={paragraphe}>{paragraphe}</p>
              ))}
            </div>
          )}

          {(profil.formations.length > 0 || profil.certifications.length > 0) && (
            <div className="mt-9 grid gap-8 sm:grid-cols-2">
              <Liste titre="Formation" items={profil.formations} icon={GraduationCap} />
              <Liste titre="Certifications" items={profil.certifications} icon={Award} />
            </div>
          )}

          {profil.methode.length > 0 && (
            <div className="mt-10 border-t border-primary/20 pt-8">
              <h3 className="display-serif text-3xl">Ma façon de travailler</h3>
              <ul className="mt-6 space-y-4">
                {profil.methode.map(({ titre, texte }) => (
                  <li key={titre} className="flex items-start gap-3">
                    <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/15">
                      <Check size={14} className="text-primary" aria-hidden="true" />
                    </span>
                    <p className="text-base leading-[1.75] text-foreground/75">
                      <strong className="font-medium text-foreground">{titre}</strong>
                      <span className="ml-2">{texte}</span>
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </motion.div>
      </div>
    </section>
  );
}
