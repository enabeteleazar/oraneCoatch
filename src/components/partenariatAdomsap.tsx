import { useEffect } from "react";
import { Link } from "wouter";
import { ArrowLeft, ArrowRight, ArrowUpRight, Handshake, HeartHandshake, Leaf, Phone, ShieldCheck, Users } from "lucide-react";

/**
 * ⚠️ À COMPLÉTER / À VALIDER avant mise en ligne.
 *
 * - Les passages "[À compléter]" sont des informations que seul l'exploitant connaît
 *   (nature exacte du partenariat, modalités de facturation).
 * - La section "Qui est ADOMSAP ?" reprend ce que la coopérative indique publiquement sur
 *   https://www.adomsap.fr/ (consulté le 18 octobre 2026) : à relire avant publication.
 * - `avantageFiscal` : laissez `null` tant que vous n'avez pas confirmé que VOS prestations
 *   ouvrent droit au crédit d'impôt « services à la personne ». Tant que la valeur est `null`,
 *   aucun avantage fiscal n'est annoncé sur le site.
 * - L'engagement de confidentialité (3e carte) est à confirmer par l'exploitant.
 */
const infos = {
  telephone: "06 86 54 47 66",
  telephoneHref: "tel:+33686544766",
  siteAdomsap: "https://www.adomsap.fr/",
  natureDuPartenariat:
    "[À compléter : en une ou deux phrases, ce que le partenariat représente concrètement (ex. cadre administratif, facturation, réseau).]",
  facturation:
    "[À compléter : comment se passent la facturation et le règlement des séances (ex. facture émise via la coopérative).]",
  avantageFiscal: null as string | null,
  miseAJour: "18 octobre 2026",
};

const reperes = [
  { icon: Users, titre: "Une coopérative", texte: "Des professionnels indépendants qui partagent un cadre administratif commun." },
  { icon: ShieldCheck, titre: "Un cadre déclaré", texte: "Une structure déclarée organisme de services à la personne." },
  { icon: HeartHandshake, titre: "Une logique d'entraide", texte: "Mutualisation des moyens et simplification des démarches." },
];

const garanties = [
  {
    icon: Handshake,
    titre: "Un cadre clair",
    texte: infos.facturation,
  },
  {
    icon: Leaf,
    titre: "Un accompagnement qui reste personnel",
    texte: "Chaque rencontre part de vous : votre rythme, vos besoins, vos choix. Le partenariat ne change pas la façon dont nous travaillons ensemble.",
  },
  {
    icon: ShieldCheck,
    titre: "Des échanges confidentiels",
    texte: "Le contenu de vos séances reste entre vous et ORANE. Il n'est pas communiqué à la coopérative.",
  },
];

export default function PartenariatAdomsap() {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = "Partenariat avec ADOMSAP | ORANE – Coach thérapeutique";
    window.scrollTo(0, 0);
    return () => {
      document.title = previousTitle;
    };
  }, []);

  return (
    <div className="site-shell min-h-[100dvh] bg-background text-foreground">
      <header className="border-b border-primary/15 bg-[#f7f4ec]">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between px-5 py-5 md:px-10 lg:px-[7.2%]">
          <Link href="/" aria-label="ORANE, retour à l'accueil" className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full border border-primary/35 text-primary">
              <Leaf size={19} strokeWidth={1.3} />
            </span>
            <span className="leading-none">
              <span className="block text-[1.18rem] font-medium tracking-[.28em]">ORANE</span>
              <span className="mt-1.5 block text-[.52rem] tracking-[.19em] text-muted-foreground">COACH THÉRAPEUTIQUE</span>
            </span>
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-foreground/75 transition-colors hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
          >
            <ArrowLeft size={15} /> Retour au site
          </Link>
        </div>
      </header>

      <main>
        {/* Introduction */}
        <section className="relative overflow-hidden bg-[#e9e7dc] py-16 md:py-24">
          <div className="pointer-events-none absolute -right-24 top-[-90px] h-[360px] w-[360px] rounded-full border border-primary/15 md:h-[520px] md:w-[520px]" />
          <div className="pointer-events-none absolute -right-8 top-[-42px] h-[260px] w-[260px] rounded-full border border-primary/15 md:h-[410px] md:w-[410px]" />
          <div className="relative mx-auto max-w-[1020px] px-6 md:px-10">
            <p className="eyebrow mb-5 text-primary">Un partenariat de confiance</p>
            <h1 className="display-serif max-w-[760px] text-5xl leading-[1] md:text-[4.8rem]">
              ORANE et <span className="italic text-primary">ADOMSAP</span>
            </h1>
            <p className="mt-7 max-w-[600px] text-[1.04rem] leading-[1.9] text-foreground/75">
              ORANE propose son accompagnement en partenariat avec ADOMSAP. Cette page vous explique simplement ce
              que cela signifie, qui est ADOMSAP et ce que cela change, ou non, pour vous.
            </p>
            <p className="mt-5 max-w-[600px] text-[1.04rem] leading-[1.9] text-foreground/75">{infos.natureDuPartenariat}</p>
          </div>
        </section>

        {/* Qui est ADOMSAP */}
        <section className="bg-[#f7f4ec] py-16 md:py-24">
          <div className="mx-auto grid max-w-[1020px] gap-12 px-6 md:grid-cols-[.9fr_1.1fr] md:gap-16 md:px-10">
            <div>
              <p className="eyebrow mb-5 text-primary">Présentation</p>
              <h2 className="display-serif text-4xl leading-[1.05] md:text-[3.2rem]">
                Qui est <span className="italic text-primary">ADOMSAP&nbsp;?</span>
              </h2>
            </div>
            <div className="space-y-5 text-[1rem] leading-[1.9] text-foreground/75">
              <p>
                ADOMSAP est une coopérative de services à la personne. Elle réunit des professionnels indépendants,
                par exemple pour le jardinage, l'entretien de la maison, l'assistance informatique, les cours à
                domicile ou le bricolage, autour d'un cadre administratif et réglementaire partagé.
              </p>
              <p>
                Le principe : chaque professionnel garde sa liberté d'organisation, tandis que la coopérative prend en
                charge une partie des démarches, comme la facturation, pour simplifier le quotidien des intervenants
                comme celui des particuliers.
              </p>
              <p>
                La coopérative est déclarée organisme de services à la personne. Pour en savoir plus sur son
                fonctionnement, vous pouvez consulter son site.
              </p>
              <a
                href={infos.siteAdomsap}
                target="_blank"
                rel="noreferrer noopener"
                className="group inline-flex items-center gap-3 border-b border-primary/40 pb-2 text-sm font-medium text-primary transition-colors hover:border-primary hover:text-[#4f5940]"
              >
                Visiter le site d'ADOMSAP <ArrowUpRight size={15} className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </a>
            </div>
          </div>
          <div className="mx-auto mt-14 grid max-w-[1020px] gap-px border-y border-primary/20 px-6 sm:grid-cols-3 md:px-10">
            {reperes.map(({ icon: Icon, titre, texte }) => (
              <article key={titre} className="border-b border-primary/20 py-8 last:border-b-0 sm:border-b-0 sm:border-r sm:px-6 sm:first:pl-0 sm:last:border-r-0">
                <Icon size={22} strokeWidth={1.35} className="text-primary" aria-hidden="true" />
                <h3 className="display-serif mt-5 text-2xl">{titre}</h3>
                <p className="mt-2 text-sm leading-[1.8] text-foreground/68">{texte}</p>
              </article>
            ))}
          </div>
        </section>

        {/* Ce que cela change pour vous */}
        <section className="bg-[#e9e7dc] py-16 md:py-24">
          <div className="mx-auto max-w-[1020px] px-6 md:px-10">
            <p className="eyebrow mb-5 text-primary">Concrètement</p>
            <h2 className="display-serif max-w-[640px] text-4xl leading-[1.05] md:text-[3.2rem]">
              Ce que cela change <span className="italic text-primary">pour vous.</span>
            </h2>
            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {garanties.map(({ icon: Icon, titre, texte }) => (
                <article key={titre} className="rounded-2xl border border-primary/20 bg-[#f7f4ec] p-6">
                  <Icon size={21} strokeWidth={1.4} className="text-primary" aria-hidden="true" />
                  <h3 className="display-serif mt-5 text-2xl leading-tight">{titre}</h3>
                  <p className="mt-3 text-sm leading-[1.85] text-foreground/70">{texte}</p>
                </article>
              ))}
            </div>
            {infos.avantageFiscal && (
              <p className="mt-6 border-l-2 border-primary/35 pl-5 text-sm leading-[1.8] text-foreground/70">{infos.avantageFiscal}</p>
            )}
            <p className="mt-8 max-w-[640px] text-xs leading-relaxed text-muted-foreground">
              L'accompagnement proposé par ORANE n'est pas un acte médical et ne remplace pas un suivi médical ou
              psychologique. Voir les{" "}
              <Link href="/mentions-legales" className="text-primary underline underline-offset-4">mentions légales</Link>.
            </p>
          </div>
        </section>

        {/* Pour commencer */}
        <section className="relative overflow-hidden bg-[#747b5c] px-6 py-16 text-[#f8f5eb] md:px-10 md:py-20">
          <div className="pointer-events-none absolute -right-20 -top-28 hidden h-[460px] w-[460px] rounded-full border border-[#efeddf]/25 md:block" />
          <div className="relative mx-auto flex max-w-[1020px] flex-col gap-8 md:flex-row md:items-center md:justify-between">
            <div className="max-w-[560px]">
              <p className="eyebrow mb-4 text-[#e0dfca]">Le premier pas peut être simple</p>
              <h2 className="display-serif text-4xl leading-tight md:text-[3rem]">
                Une question ? <span className="italic">Parlons-en.</span>
              </h2>
              <p className="mt-4 text-sm leading-[1.9] text-[#f0eedf]/85">
                Un premier échange, à votre façon, pour faire connaissance et répondre à vos questions sur
                l'accompagnement et le partenariat.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row md:flex-col">
              <a
                href={infos.telephoneHref}
                className="group inline-flex min-h-[52px] items-center justify-center gap-3 rounded-full bg-[#f8f5eb] px-7 text-sm font-medium text-primary transition duration-300 hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#f8f5eb]"
              >
                <Phone size={16} /> {infos.telephone}
              </a>
              <Link
                href="/rendez-vous"
                className="group inline-flex min-h-[52px] items-center justify-center gap-3 rounded-full border border-[#e5e3d1]/55 px-7 text-sm text-[#fbf8ef] transition-colors hover:bg-[#f8f5eb] hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#f8f5eb]"
              >
                Prendre rendez-vous <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-[#e7e4d8]">
        <div className="mx-auto flex max-w-[1020px] flex-col gap-4 px-6 py-8 text-xs text-foreground/65 sm:flex-row sm:items-center sm:justify-between md:px-10">
          <span>Dernière mise à jour : {infos.miseAJour}</span>
          <div className="flex flex-col gap-3 sm:flex-row sm:gap-7">
            <Link href="/mentions-legales" className="transition-colors hover:text-primary">Mentions légales</Link>
            <Link href="/politique-de-confidentialite" className="transition-colors hover:text-primary">Politique de confidentialité</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
