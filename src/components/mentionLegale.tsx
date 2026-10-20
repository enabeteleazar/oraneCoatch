import { useEffect, type ReactNode } from "react";
import { Link } from "wouter";
import { ArrowLeft, Leaf } from "lucide-react";

/**
 * ⚠️ À COMPLÉTER avant mise en ligne.
 * Toutes les valeurs "[À compléter]" doivent être remplacées par les
 * informations réelles de l'exploitant du site (obligation légale LCEN).
 */
const infos = {
  marque: "ORANE – Coach thérapeutique",
  statut: "[À compléter : ex. entrepreneur individuel / micro-entreprise / société]",
  nom: "[À compléter : nom et prénom de l'exploitant]",
  siret: "[À compléter : numéro SIRET]",
  adresse: "[À compléter : adresse professionnelle]",
  telephone: "06 86 54 47 66",
  telephoneHref: "tel:+33686544766",
  email: "[À compléter : adresse e-mail de contact]",
  directeurPublication: "[À compléter : nom du directeur de la publication]",
  hebergeurNom: "[À compléter : nom de l'hébergeur]",
  hebergeurAdresse: "[À compléter : adresse de l'hébergeur]",
  hebergeurContact: "[À compléter : site ou téléphone de l'hébergeur]",
  mediateur: "[À compléter : nom et coordonnées du médiateur de la consommation]",
  site: "orane-coach-therapeutique.fr",
  siteHref: "https://orane-coach-therapeutique.fr",
  miseAJour: "18 octobre 2026",
};

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="border-t border-primary/20 py-8 first:border-t-0 first:pt-0">
      <h2 className="display-serif text-2xl md:text-[2rem]">{title}</h2>
      <div className="mt-4 space-y-3 text-[.97rem] leading-[1.85] text-foreground/75">{children}</div>
    </section>
  );
}

export default function MentionLegale() {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = "Mentions légales | ORANE – Coach thérapeutique";
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

      <main className="bg-[#f7f4ec] py-16 md:py-24">
        <div className="mx-auto max-w-[820px] px-6 md:px-10">
          <p className="eyebrow mb-5 text-primary">Informations légales</p>
          <h1 className="display-serif text-5xl leading-[1] md:text-[4.5rem]">
            Mentions <span className="italic text-primary">légales</span>
          </h1>
          <p className="mt-6 text-sm text-muted-foreground">Dernière mise à jour : {infos.miseAJour}</p>

          <div className="mt-12">
            <Section title="1. Éditeur du site">
              <p>Le site <a href={infos.siteHref} target="_blank" rel="noreferrer" className="text-primary underline underline-offset-4">{infos.site}</a> est édité par :</p>
              <ul className="space-y-1">
                <li><strong className="font-medium text-foreground">Nom commercial :</strong> {infos.marque}</li>
                <li><strong className="font-medium text-foreground">Statut juridique :</strong> {infos.statut}</li>
                <li><strong className="font-medium text-foreground">Exploitant :</strong> {infos.nom}</li>
                <li><strong className="font-medium text-foreground">SIRET :</strong> {infos.siret}</li>
                <li><strong className="font-medium text-foreground">Adresse :</strong> {infos.adresse}</li>
                <li>
                  <strong className="font-medium text-foreground">Téléphone :</strong>{" "}
                  <a href={infos.telephoneHref} className="text-primary underline underline-offset-4">{infos.telephone}</a>
                </li>
                <li><strong className="font-medium text-foreground">E-mail :</strong> {infos.email}</li>
              </ul>
            </Section>

            <Section title="2. Directeur de la publication">
              <p>{infos.directeurPublication}</p>
            </Section>

            <Section title="3. Hébergement">
              <p>Le site est hébergé par :</p>
              <ul className="space-y-1">
                <li><strong className="font-medium text-foreground">Hébergeur :</strong> {infos.hebergeurNom}</li>
                <li><strong className="font-medium text-foreground">Adresse :</strong> {infos.hebergeurAdresse}</li>
                <li><strong className="font-medium text-foreground">Contact :</strong> {infos.hebergeurContact}</li>
              </ul>
            </Section>

            <Section title="4. Nature des services">
              <p>
                ORANE propose un accompagnement par l'écoute et le coaching. Ces séances ne constituent pas un acte
                médical, ne remplacent ni un diagnostic, ni un traitement, ni le suivi d'un médecin ou d'un
                psychologue.
              </p>
              <p>
                En cas d'urgence ou de détresse, contactez le 15 (SAMU), le 112, ou le 3114 (numéro national de
                prévention du suicide, gratuit, 24 h/24 et 7 j/7).
              </p>
            </Section>

            <Section title="5. Propriété intellectuelle">
              <p>
                L'ensemble des contenus de ce site (textes, images, logo, graphismes, structure) est protégé par le
                droit de la propriété intellectuelle. Toute reproduction, représentation, modification ou
                exploitation, totale ou partielle, sans autorisation écrite préalable de l'éditeur est interdite.
              </p>
            </Section>

            <Section title="6. Données personnelles">
              <p>
                Ce site ne dépose aucun cookie de mesure d'audience ou de publicité. Les données que vous
                communiquez en réservant un rendez-vous en ligne, par téléphone ou par e-mail (nom, coordonnées,
                objet de votre demande) sont utilisées uniquement pour répondre à votre demande et organiser un
                rendez-vous. Elles ne sont ni vendues ni cédées à des fins commerciales.
              </p>
              <p>
                Conformément au Règlement général sur la protection des données (RGPD) et à la loi
                « Informatique et Libertés », vous disposez d'un droit d'accès, de rectification, d'effacement,
                d'opposition, de limitation et de portabilité de vos données. Pour l'exercer, contactez l'éditeur à
                l'adresse indiquée à l'article 1. Pour plus de détails, consultez la{" "}
                <Link href="/politique-de-confidentialite" className="text-primary underline underline-offset-4">politique de confidentialité</Link>.
                Vous pouvez également introduire une réclamation auprès de la CNIL
                (<a href="https://www.cnil.fr" target="_blank" rel="noreferrer" className="text-primary underline underline-offset-4">cnil.fr</a>).
              </p>
            </Section>

            <Section title="7. Liens externes">
              <p>
                Ce site peut contenir des liens vers des sites tiers. L'éditeur n'exerce aucun contrôle sur leur
                contenu et décline toute responsabilité quant aux informations qui y figurent.
              </p>
            </Section>

            <Section title="8. Responsabilité">
              <p>
                L'éditeur s'efforce de fournir des informations exactes et à jour, sans pouvoir garantir
                l'absence d'erreur ou d'omission. Il ne saurait être tenu responsable d'une indisponibilité
                temporaire du site ni de l'usage qui est fait des informations qu'il contient.
              </p>
            </Section>

            <Section title="9. Médiation de la consommation">
              <p>
                Conformément aux articles L.611-1 et suivants du Code de la consommation, tout consommateur a le
                droit de recourir gratuitement à un médiateur de la consommation en vue de la résolution amiable
                d'un litige.
              </p>
              <p>Médiateur : {infos.mediateur}</p>
            </Section>

            <Section title="10. Droit applicable">
              <p>
                Les présentes mentions légales sont régies par le droit français. En cas de litige, et à défaut de
                résolution amiable, les tribunaux français seront seuls compétents.
              </p>
            </Section>
          </div>

          <Link
            href="/"
            className="group mt-6 inline-flex items-center gap-3 border-b border-primary/40 pb-2 text-sm font-medium text-primary transition-colors hover:border-primary hover:text-[#4f5940]"
          >
            <ArrowLeft size={15} className="transition-transform group-hover:-translate-x-1" /> Retour à l'accueil
          </Link>
        </div>
      </main>
    </div>
  );
}
