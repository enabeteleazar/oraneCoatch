import { useEffect, type ReactNode } from "react";
import { Link } from "wouter";
import { ArrowLeft, Leaf } from "lucide-react";

/**
 * ⚠️ À COMPLÉTER / À VALIDER avant mise en ligne.
 * - Les valeurs "[À compléter]" sont des informations que seul l'exploitant connaît.
 * - Les durées de conservation sont des valeurs usuelles proposées : à confirmer.
 * - Les polices sont auto-hébergées : aucun élément externe n'est chargé par le site.
 *   Si un service tiers est ajouté un jour (statistiques, carte, vidéo, etc.), mettre à jour
 *   l'article 3 et ajouter un article dédié.
 */
const infos = {
  responsable: "ORANE – Coach thérapeutique",
  exploitant: "[À compléter : nom et prénom de l'exploitant]",
  adresse: "[À compléter : adresse professionnelle]",
  email: "[À compléter : adresse e-mail de contact]",
  telephone: "06 86 54 47 66",
  telephoneHref: "tel:+33686544766",
  hebergeur: "[À compléter : nom de l'hébergeur]",
  partenaire: "[À compléter : indiquer si des données sont partagées avec ADOMSAP et dans quel cadre, ou supprimer cette phrase]",
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

const strong = "font-medium text-foreground";
const ext = "text-primary underline underline-offset-4";

export default function PolitiqueConfidentialite() {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = "Politique de confidentialité | ORANE – Coach thérapeutique";
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
          <p className="eyebrow mb-5 text-primary">Vos données, votre confiance</p>
          <h1 className="display-serif text-5xl leading-[1] md:text-[4.5rem]">
            Politique de <span className="italic text-primary">confidentialité</span>
          </h1>
          <p className="mt-6 text-sm text-muted-foreground">Dernière mise à jour : {infos.miseAJour}</p>
          <p className="mt-8 text-[1.02rem] leading-[1.9] text-foreground/75">
            Vous confiez parfois des choses personnelles à ORANE. Cette page explique, simplement, quelles données
            sont recueillies, pourquoi, combien de temps elles sont conservées et comment exercer vos droits.
          </p>

          <div className="mt-12">
            <Section title="1. Qui est responsable de vos données ?">
              <p>
                Le responsable du traitement est <strong className={strong}>{infos.responsable}</strong>, exploité
                par {infos.exploitant}.
              </p>
              <ul className="space-y-1">
                <li><strong className={strong}>Adresse :</strong> {infos.adresse}</li>
                <li><strong className={strong}>E-mail :</strong> {infos.email}</li>
                <li>
                  <strong className={strong}>Téléphone :</strong>{" "}
                  <a href={infos.telephoneHref} className={ext}>{infos.telephone}</a>
                </li>
              </ul>
              <p>
                Les informations complètes sur l'éditeur figurent dans les{" "}
                <Link href="/mentions-legales" className={ext}>mentions légales</Link>.
              </p>
            </Section>

            <Section title="2. Quelles données, pour quoi faire ?">
              <p>Les données ne sont recueillies que lorsque vous prenez contact ou que vous êtes accompagné(e).</p>
              <ul className="list-disc space-y-3 pl-5">
                <li>
                  <strong className={strong}>Prise de contact.</strong> Par le formulaire du site : nom, adresse e-mail et
                  message. Par téléphone, e-mail ou WhatsApp : les informations que vous communiquez. Finalité : vous
                  répondre et organiser un rendez-vous. Base légale : mesures précontractuelles prises à votre
                  demande.
                </li>
                <li>
                  <strong className={strong}>Réservation en ligne.</strong> Lorsque vous réservez un créneau sur ce
                  site : nom, téléphone, adresse e-mail, message facultatif et créneau choisi. Finalité : enregistrer
                  votre rendez-vous dans l'agenda de l'exploitant et le prévenir. Base légale : mesures
                  précontractuelles prises à votre demande.
                </li>
                <li>
                  <strong className={strong}>Accompagnement.</strong> Informations utiles au suivi de vos séances
                  (dates, éléments que vous choisissez de partager). Finalité : assurer l'accompagnement. Base
                  légale : exécution du contrat.
                </li>
                <li>
                  <strong className={strong}>Facturation et comptabilité.</strong> Identité, adresse, montants des
                  séances. Base légale : obligation légale.
                </li>
                <li>
                  <strong className={strong}>Témoignages (facultatif).</strong> Si vous acceptez de publier un
                  témoignage sur ce site : votre prénom ou initiale et le texte que vous avez validé. Base légale :
                  votre consentement, que vous pouvez retirer à tout moment en nous écrivant, ce qui entraîne le
                  retrait du témoignage.
                </li>
              </ul>
              <p>
                Au cours des séances, vous pouvez être amené(e) à évoquer des éléments très personnels, notamment
                votre état de santé ou votre vie privée. Ce sont des données dites sensibles. Elles ne sont
                recueillies que si vous les partagez volontairement, avec votre accord, et uniquement pour
                l'accompagnement. Vous êtes libre de ne rien dire que vous ne souhaitez pas partager.
              </p>
            </Section>

            <Section title="3. Ce que ce site ne fait pas">
              <p>
                Hormis le formulaire de contact et le formulaire de réservation d'un rendez-vous, ce site ne
                contient aucun formulaire de collecte. Il n'utilise aucun outil de mesure d'audience, aucune publicité et ne dépose aucun cookie
                de suivi. Les polices de caractères sont hébergées avec le site : votre
                navigateur ne contacte aucun service tiers pour les afficher. Vous n'avez donc aucun bandeau de
                consentement à renseigner.
              </p>
            </Section>

            <Section title="4. Qui peut accéder à vos données ?">
              <p>
                Vos données sont destinées à l'exploitant du site. Elles ne sont ni vendues, ni louées, ni cédées à
                des fins commerciales.
              </p>
              <p>
                Seul l'hébergeur technique du site ({infos.hebergeur}) peut y avoir accès, au titre de sa mission
                d'hébergement.
              </p>
              <p>
                Le fonctionnement du site s'appuie sur des prestataires techniques qui traitent des données pour le
                compte de l'exploitant : Google (Google Agenda, où sont enregistrés les rendez-vous), Neon (base de
                données des créneaux proposés et des tarifs : aucune donnée personnelle de visiteur n'y est
                enregistrée), Formspree (réception du formulaire de contact et des notifications de rendez-vous par
                e-mail), et, si ce service est activé, Resend (envoi des e-mails de confirmation). Si vous cliquez sur
                le bouton WhatsApp, votre échange est ensuite soumis aux conditions de WhatsApp. Certains de ces
                prestataires peuvent traiter des données hors de l'Union européenne, dans le cadre des garanties
                prévues par le RGPD. [À compléter : vérifier la région d'hébergement choisie pour chacun.]
              </p>
              <p>{infos.partenaire}</p>
            </Section>

            <Section title="5. Combien de temps sont-elles conservées ?">
              <ul className="list-disc space-y-2 pl-5">
                <li><strong className={strong}>Demande de contact sans suite :</strong> 3 ans après le dernier échange.</li>
                <li><strong className={strong}>Réservation en ligne :</strong> l'événement inscrit à l'agenda de l'exploitant est conservé [À compléter : durée].</li>
                <li><strong className={strong}>Messages reçus par le formulaire de contact :</strong> [À compléter : durée de conservation dans la messagerie de l'exploitant et chez Formspree].</li>
                <li><strong className={strong}>Données de suivi d'accompagnement :</strong> pendant la durée de l'accompagnement, puis [À compléter : durée] après la dernière séance.</li>
                <li><strong className={strong}>Pièces comptables (factures) :</strong> 10 ans, conformément à la loi.</li>
              </ul>
              <p>À l'issue de ces délais, les données sont supprimées ou anonymisées.</p>
            </Section>

            <Section title="6. Comment sont-elles protégées ?">
              <p>
                L'exploitant met en œuvre des mesures raisonnables pour protéger vos données contre l'accès, la
                perte ou la divulgation non autorisés [À vérifier et compléter : accès restreint, appareils
                protégés par mot de passe, site servi en HTTPS, etc.]. Les échanges de séance sont tenus
                confidentiels.
              </p>
            </Section>

            <Section title="7. Quels sont vos droits ?">
              <p>Vous disposez à tout moment des droits suivants sur vos données :</p>
              <ul className="list-disc space-y-1 pl-5">
                <li>accès et copie de vos données ;</li>
                <li>rectification des informations inexactes ;</li>
                <li>effacement, dans les conditions prévues par la loi ;</li>
                <li>limitation du traitement et opposition, pour des motifs légitimes ;</li>
                <li>portabilité des données que vous avez fournies ;</li>
                <li>retrait de votre consentement, à tout moment, lorsque le traitement repose dessus ;</li>
                <li>définition de directives sur le sort de vos données après votre décès.</li>
              </ul>
              <p>
                Pour exercer ces droits, écrivez à {infos.email} ou à l'adresse postale indiquée à l'article 1. Une
                réponse vous est apportée dans un délai d'un mois. Un justificatif d'identité peut être demandé en
                cas de doute raisonnable.
              </p>
              <p>
                Si vous estimez que vos droits ne sont pas respectés, vous pouvez introduire une réclamation auprès
                de la CNIL :{" "}
                <a href="https://www.cnil.fr/fr/plaintes" target="_blank" rel="noreferrer" className={ext}>cnil.fr/fr/plaintes</a>
                {" "}(Commission nationale de l'informatique et des libertés, 3 place de Fontenoy, TSA 80715,
                75334 Paris Cedex 07).
              </p>
            </Section>

            <Section title="8. Évolution de cette politique">
              <p>
                Cette politique peut être mise à jour, notamment si le site évolue (par exemple l'ajout d'un
                formulaire de contact). La date de dernière mise à jour figure en haut de cette page.
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
