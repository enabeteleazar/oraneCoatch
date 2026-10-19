import { useEffect, useState } from "react";
import { Link } from "wouter";
import EncartUrgence from "@/components/EncartUrgence";
import PublicEtSeance from "@/components/PublicEtSeance";
import APropos from "@/components/APropos";
import CadreDeontologique from "@/components/CadreDeontologique";
import Temoignages from "@/components/Temoignages";
import Faq from "@/components/Faq";
import { Tarif, useTarifs } from "@/lib/tarifs";
import { motion } from "framer-motion";
import { ArrowDown, ArrowRight, ArrowUpRight, Ear, HandHeart, Heart, Leaf, Menu, Phone, Sprout, X } from "lucide-react";
import heroImg from "@/assets/images/hero.png";

const phone = "tel:+33686544766";
const externalSite = "https://orane-coach-therapeutique.fr";

const values = [
  { number: "01", title: "Écoute", text: "Un temps pour déposer ce qui pèse, avec une présence attentive et sans jugement.", icon: Ear },
  { number: "02", title: "Soutien", text: "Un espace où vous pouvez vous sentir accueilli(e), entendu(e) et accompagné(e).", icon: HandHeart },
  { number: "03", title: "Bienveillance", text: "Votre histoire, vos émotions et votre rythme ont toute leur place.", icon: Heart },
  { number: "04", title: "Évolution", text: "Pas à pas, trouver votre manière d'avancer, sans avoir à tout résoudre aujourd'hui.", icon: Sprout },
];

const fade = {
  hidden: { opacity: 0, y: 22 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: "easeOut" as const } },
};

export default function Home() {
  const tarifs = useTarifs();
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = () => setMenuOpen(false);
  useEffect(() => {
    const targetId = decodeURIComponent(window.location.hash.slice(1));
    if (!targetId) return;
    const frame = window.requestAnimationFrame(() => {
      document.getElementById(targetId)?.scrollIntoView({ block: "start" });
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);
  const navItems = [
    { href: "#approche", label: "L'approche" },
    { href: "#accompagnement", label: "L'accompagnement" },
    { href: "#formules", label: "Formules" },
    { href: "#partenariat", label: "Partenariat" },
    { href: "#contact", label: "Prendre rendez-vous" },
  ];

  return (
    <div className="site-shell min-h-[100dvh] bg-background text-foreground">
      <header className="absolute inset-x-0 top-0 z-50">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between px-5 py-5 md:px-10 lg:px-[7.2%]">
          <a href="#accueil" aria-label="ORANE, accueil" className="group flex items-center gap-3">
            <span className="relative flex h-10 w-10 items-center justify-center rounded-full border border-primary/35 text-primary transition-transform duration-300 group-hover:rotate-[-8deg]">
              <Leaf size={19} strokeWidth={1.3} />
              <span className="absolute -right-0.5 top-0 h-2 w-2 rounded-full bg-accent" />
            </span>
            <span className="leading-none">
              <span className="block text-[1.18rem] font-medium tracking-[.28em]">ORANE</span>
              <span className="mt-1.5 block text-[.52rem] tracking-[.19em] text-muted-foreground">COACH THÉRAPEUTIQUE</span>
            </span>
          </a>

          <nav aria-label="Navigation principale" className="hidden items-center gap-9 md:flex">
            {navItems.map((item) => <a key={item.href} href={item.href} className="nav-link text-[.78rem] tracking-[.025em] text-foreground/75 transition-colors hover:text-primary">{item.label}</a>)}
            <a href={phone} className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-[.76rem] font-medium text-primary-foreground transition duration-300 hover:-translate-y-0.5 hover:bg-[#4f5940] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary">
              <Phone size={14} /> Appeler ORANE
            </a>
          </nav>
          <button type="button" aria-label={menuOpen ? "Fermer le menu" : "Ouvrir le menu"} aria-expanded={menuOpen} onClick={() => setMenuOpen((open) => !open)} className="flex h-11 w-11 items-center justify-center rounded-full border border-primary/25 text-primary md:hidden">
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
        {menuOpen && <nav aria-label="Navigation mobile" className="mx-4 rounded-2xl border border-border bg-background/95 p-4 shadow-lg backdrop-blur-md md:hidden">
          {navItems.map((item) => <a key={item.href} href={item.href} onClick={closeMenu} className="block border-b border-border/70 px-3 py-4 text-sm last:border-0">{item.label}</a>)}
          <a href={phone} onClick={closeMenu} className="mt-3 flex items-center justify-center gap-2 rounded-full bg-primary px-4 py-3 text-sm text-primary-foreground"><Phone size={15} /> 06 86 54 47 66</a>
        </nav>}
      </header>

      <main>
        <section id="accueil" className="relative min-h-[760px] overflow-hidden bg-[#e9e4d8] pt-28 md:min-h-[820px]">
          <div className="absolute inset-0">
            <img src={heroImg} alt="Une pièce calme et lumineuse, ouverte sur la nature" className="hero-image h-full w-full object-cover object-center" />
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(245,241,231,.97)_0%,rgba(245,241,231,.91)_37%,rgba(245,241,231,.50)_65%,rgba(245,241,231,.08)_100%)] md:bg-[linear-gradient(90deg,rgba(245,241,231,.97)_0%,rgba(245,241,231,.9)_37%,rgba(245,241,231,.43)_62%,rgba(245,241,231,.02)_100%)]" />
            <div className="grain absolute inset-0" />
          </div>
          <div className="relative z-10 mx-auto flex min-h-[660px] max-w-[1440px] items-center px-6 pb-20 pt-16 md:min-h-[690px] md:px-10 lg:px-[11%]">
            <div className="max-w-[650px]">
              <motion.p initial="hidden" animate="visible" variants={fade} className="eyebrow mb-6 flex items-center gap-3 text-primary">
                <span className="h-px w-9 bg-primary/65" /> Un espace d'écoute et de soutien
              </motion.p>
              <motion.h1 initial="hidden" animate="visible" variants={fade} transition={{ delay: .08 }} className="display-serif max-w-[650px] text-[clamp(3.7rem,8vw,7.4rem)] leading-[.91] text-[#32352a]">
                Un moment dur <span className="italic text-primary">à traverser&nbsp;?</span>
              </motion.h1>
              <motion.p initial="hidden" animate="visible" variants={fade} transition={{ delay: .18 }} className="mt-7 max-w-[465px] text-[1.04rem] leading-[1.85] text-[#505147] md:text-[1.12rem]">
                Vous vous sentez épuisé(e), dépassé(e) ou incompris(e)&nbsp;? Vous n'êtes pas seul(e).
              </motion.p>
              <motion.div initial="hidden" animate="visible" variants={fade} transition={{ delay: .28 }} className="mt-9 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
                <a href={phone} className="group inline-flex min-h-[54px] items-center gap-3 rounded-full bg-primary px-7 text-sm font-medium text-primary-foreground transition duration-300 hover:-translate-y-0.5 hover:bg-[#4f5940] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary">
                  <Phone size={16} /> Parler avec ORANE <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
                </a>
                <a href="#approche" className="inline-flex items-center gap-2 px-2 py-3 text-sm text-foreground/75 transition-colors hover:text-primary">Découvrir l'approche <ArrowDown size={14} /></a>
              </motion.div>
              <motion.div initial="hidden" animate="visible" variants={fade} transition={{ delay: .4 }} className="mt-12 flex items-center gap-3 text-sm text-foreground/70">
                <span className="flex -space-x-2" aria-hidden="true">
                  <span className="h-8 w-8 rounded-full border-2 border-[#eee9dc] bg-[#a5a17e]" />
                  <span className="h-8 w-8 rounded-full border-2 border-[#eee9dc] bg-[#d5c5a8]" />
                  <span className="h-8 w-8 rounded-full border-2 border-[#eee9dc] bg-[#788265]" />
                </span>
                <span>À votre rythme, en toute confiance</span>
              </motion.div>
            </div>
          </div>
          <div className="absolute bottom-0 right-0 hidden items-center gap-3 bg-[#747b5c] px-8 py-4 text-[.68rem] tracking-[.16em] text-[#fbf8f0] sm:flex md:px-12">
            <span className="h-px w-8 bg-[#d8d5be]" /> PARTENARIAT AVEC ADOMSAP
          </div>
          <a href="#repere" aria-label="Défiler vers la suite" className="absolute bottom-7 left-6 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-primary/30 text-primary transition hover:bg-primary hover:text-primary-foreground md:left-[7.2%]">
            <ArrowDown size={16} />
          </a>
        </section>

        <section id="repere" className="relative bg-[#f7f4ec] py-20 md:py-28">
          <div className="mx-auto grid max-w-[1180px] gap-12 px-6 md:grid-cols-[.85fr_1.15fr] md:items-center md:px-10">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} variants={fade}>
              <p className="eyebrow mb-5 text-primary">Pour les jours où tout semble trop</p>
              <h2 className="display-serif text-4xl leading-[1.05] md:text-[3.5rem]">Vous n'avez pas à <span className="italic text-primary">tout porter seul(e).</span></h2>
            </motion.div>
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} variants={fade} className="md:border-l md:border-primary/25 md:pl-12">
              <p className="max-w-[590px] text-[1.04rem] leading-[1.95] text-foreground/75">
                Il y a des périodes où l'on se sent épuisé(e), dépassé(e), ou simplement incompris(e). Ici, vous pouvez prendre le temps de mettre des mots sur ce que vous vivez, sans devoir faire semblant ni savoir déjà quoi faire.
              </p>
              <p className="mt-5 text-[1.04rem] leading-[1.95] text-foreground/75">Une présence attentive, un espace pour souffler, et un accompagnement qui respecte votre propre rythme.</p>
            </motion.div>
          </div>
        </section>

        <section id="approche" className="relative overflow-hidden bg-[#e9e7dc] py-20 md:py-28">
          <div className="pointer-events-none absolute -right-24 top-[-90px] h-[360px] w-[360px] rounded-full border border-primary/15 md:h-[520px] md:w-[520px]" />
          <div className="pointer-events-none absolute -right-8 top-[-42px] h-[260px] w-[260px] rounded-full border border-primary/15 md:h-[410px] md:w-[410px]" />
          <div className="relative mx-auto max-w-[1180px] px-6 md:px-10">
            <div className="mb-14 max-w-[690px]">
              <p className="eyebrow mb-5 text-primary">Une présence, pas une méthode toute faite</p>
              <h2 className="display-serif text-5xl leading-[.99] md:text-[5rem]">Ici, votre histoire <span className="italic text-primary">a sa place.</span></h2>
              <p className="mt-7 max-w-[550px] text-base leading-[1.9] text-foreground/70">Un espace chaleureux pour accueillir ce qui est là. Pas d'injonction à aller mieux vite. Seulement un temps pour vous.</p>
            </div>
            <div className="grid gap-px border-y border-primary/20 sm:grid-cols-2 lg:grid-cols-4">
              {values.map(({ number, title, text, icon: Icon }, index) => (
                <motion.article key={title} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-40px" }} variants={fade} transition={{ delay: index * .08 }} className="group border-b border-primary/20 py-8 sm:px-6 sm:odd:border-r lg:border-b-0 lg:border-r lg:px-8 lg:first:pl-0 lg:last:border-r-0">
                  <div className="mb-8 flex items-center justify-between">
                    <span className="font-serif text-2xl italic text-primary/70">{number}</span>
                    <Icon size={20} strokeWidth={1.35} className="text-primary transition-transform duration-300 group-hover:scale-110" />
                  </div>
                  <h3 className="display-serif text-3xl">{title}</h3>
                  <p className="mt-3 max-w-[240px] text-sm leading-[1.8] text-foreground/68">{text}</p>
                </motion.article>
              ))}
            </div>
          </div>
        </section>

        <section id="accompagnement" className="bg-[#f7f4ec] py-20 md:py-32">
          <div className="mx-auto grid max-w-[1220px] gap-12 px-6 md:grid-cols-[.95fr_1.05fr] md:items-center md:gap-20 md:px-10">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} variants={fade} className="relative">
              <div className="absolute -inset-3 rotate-[-2deg] rounded-[48%_48%_4px_4px] bg-[#dedbca]" />
              <img src={heroImg} alt="Lumière douce dans un intérieur apaisant" className="relative aspect-[.91] w-full rounded-[48%_48%_4px_4px] object-cover object-left" />
              <span className="script-note absolute -bottom-5 right-0 rotate-[-8deg] text-3xl text-primary md:right-[-24px] md:text-4xl">à votre rythme</span>
              <span className="absolute bottom-7 left-5 rounded-full border border-white/50 bg-[#f4f1e7]/85 px-4 py-2 text-[.63rem] tracking-[.12em] text-primary backdrop-blur-sm md:left-8">UN ESPACE POUR SOUFFLER</span>
            </motion.div>
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} variants={fade} className="md:pl-2">
              <p className="eyebrow mb-5 text-primary">Un accompagnement personnalisé</p>
              <h2 className="display-serif text-5xl leading-[1] md:text-[4.5rem]">On avance <span className="italic text-primary">ensemble.</span></h2>
              <p className="mt-7 text-base leading-[1.95] text-foreground/75">Chaque rencontre part de vous : de ce que vous traversez, de ce qui vous préoccupe, de ce dont vous avez besoin maintenant. Il n'y a pas de parcours à suivre ni de bonne façon de faire.</p>
              <p className="mt-5 text-base leading-[1.95] text-foreground/75">Nous prenons le temps d'écouter et de faire émerger vos propres repères. Vous choisissez le pas suivant. Vous pouvez avancer à votre rythme.</p>
              <a href="#contact" className="group mt-8 inline-flex items-center gap-3 border-b border-primary/40 pb-2 text-sm font-medium text-primary transition-colors hover:border-primary hover:text-[#4f5940]">
                Faire connaissance <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
              </a>
            </motion.div>
          </div>
        </section>

        <APropos />

        <PublicEtSeance />

        <CadreDeontologique />

        <section id="formules" className="bg-[#e9e7dc] py-20 md:py-28">
          <div className="mx-auto max-w-[1120px] px-6 md:px-10">
            <div className="mb-12 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
              <div className="max-w-[640px]">
                <p className="eyebrow mb-5 text-primary">Formules</p>
                <h2 className="display-serif text-5xl leading-[.99] md:text-[4.5rem]">Un premier pas, <span className="italic text-primary">puis le vôtre.</span></h2>
              </div>
              <p className="max-w-[360px] text-sm leading-[1.85] text-foreground/70">Choisissez la formule qui correspond à votre besoin du moment. Nous pouvons en parler simplement.</p>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="flex items-center justify-between gap-4 rounded-2xl border border-primary/20 bg-[#f7f4ec] px-5 py-5 md:px-7">
                <div>
                  <h3 className="display-serif text-2xl"><Tarif pret={tarifs.pret}>{tarifs.decouverte.titre}</Tarif></h3>
                  <p className="mt-1 text-sm text-muted-foreground"><Tarif pret={tarifs.pret}>{tarifs.decouverte.duree}</Tarif></p>
                </div>
                <span className={`shrink-0 font-medium text-primary ${tarifs.decouverte.offerte ? "text-sm" : "text-lg"}`}><Tarif pret={tarifs.pret}>{tarifs.decouverte.prix}</Tarif></span>
              </div>
              <div className="flex items-center justify-between gap-4 rounded-2xl border border-primary/20 bg-[#f7f4ec] px-5 py-5 md:px-7">
                <div>
                  <h3 className="display-serif text-2xl">Séance individuelle</h3>
                  <p className="mt-1 text-sm text-muted-foreground"><Tarif pret={tarifs.pret}>{tarifs.seance.duree}</Tarif></p>
                </div>
                <span className="shrink-0 text-lg font-medium text-primary"><Tarif pret={tarifs.pret}>{tarifs.seance.prix}</Tarif></span>
              </div>
              <div className="flex items-center justify-between gap-4 rounded-2xl border border-primary/20 bg-[#f7f4ec] px-5 py-5 md:px-7">
                <h3 className="display-serif text-2xl">Pack 5 séances</h3>
                <span className="shrink-0 text-lg font-medium text-primary"><Tarif pret={tarifs.pret}>{tarifs.pack5.prix}</Tarif></span>
              </div>
              <div className="flex items-center justify-between gap-4 rounded-2xl border border-primary/20 bg-[#f7f4ec] px-5 py-5 md:px-7">
                <h3 className="display-serif text-2xl">Pack 10 séances</h3>
                <span className="shrink-0 text-lg font-medium text-primary"><Tarif pret={tarifs.pret}>{tarifs.pack10.prix}</Tarif></span>
              </div>
            </div>
            <div className="mt-5 flex flex-col gap-3 border-l-2 border-primary/35 pl-5 text-sm leading-[1.8] text-foreground/70 sm:flex-row sm:gap-8">
              <p>Les prix peuvent être adaptés après discussion.</p>
              <p><Tarif pret={tarifs.pret}>{tarifs.domicile.phrase}</Tarif></p>
            </div>
            <a href={phone} className="group mt-7 inline-flex min-h-[50px] items-center gap-3 rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground transition duration-300 hover:-translate-y-0.5 hover:bg-[#4f5940] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary">
              <Phone size={15} /> Parler des formules <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
            </a>
          </div>
        </section>

        <Temoignages />

        <section id="partenariat" className="relative bg-[#747b5c] px-6 py-20 text-[#f8f5eb] md:px-10 md:py-24">
          <div className="absolute inset-y-0 right-0 hidden w-[38%] overflow-hidden opacity-20 md:block">
            <div className="absolute -right-20 -top-28 h-[500px] w-[500px] rounded-full border border-[#efeddf]" />
            <div className="absolute -right-4 -top-14 h-[380px] w-[380px] rounded-full border border-[#efeddf]" />
          </div>
          <div className="relative mx-auto flex max-w-[1120px] flex-col gap-8 md:flex-row md:items-center md:justify-between">
            <div className="max-w-[710px]">
              <p className="eyebrow mb-5 text-[#e0dfca]">Un partenariat de confiance</p>
              <h2 className="display-serif text-4xl leading-tight md:text-[3.5rem]">Un accompagnement en partenariat avec <span className="italic">ADOMSAP</span></h2>
              <p className="mt-5 max-w-[590px] text-sm leading-[1.9] text-[#f0eedf]/85">Un cadre de présence et d'écoute pour vous aider à traverser le moment, avec douceur et respect de votre rythme.</p>
            </div>
            <Link href="/partenariat-adomsap" className="group inline-flex shrink-0 items-center gap-3 self-start rounded-full border border-[#e5e3d1]/55 px-6 py-4 text-sm text-[#fbf8ef] transition-colors hover:bg-[#f8f5eb] hover:text-primary md:self-center">
              En savoir plus <ArrowUpRight size={16} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
          </div>
        </section>

        <Faq />

        <section id="contact" className="relative overflow-hidden bg-[#f2eee4] py-20 md:py-28">
          <div className="pointer-events-none absolute -left-24 bottom-[-150px] h-[340px] w-[340px] rounded-full bg-[#e4e1d2] md:h-[480px] md:w-[480px]" />
          <div className="relative mx-auto grid max-w-[1120px] gap-12 px-6 md:grid-cols-[1fr_.82fr] md:items-center md:px-10">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-70px" }} variants={fade}>
              <p className="eyebrow mb-5 text-primary">Le premier pas peut être simple</p>
              <h2 className="display-serif max-w-[650px] text-5xl leading-[.99] md:text-[5rem]">Vous n'êtes <span className="italic text-primary">pas seul(e).</span></h2>
              <p className="mt-7 max-w-[510px] text-base leading-[1.9] text-foreground/72">Pour prendre rendez-vous, vous pouvez appeler ORANE ou vous rendre sur le site. Un premier contact, à votre façon.</p>
              <div className="script-note mt-4 text-3xl text-primary md:text-4xl">un pas après l'autre</div>
            </motion.div>
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-70px" }} variants={fade} className="rounded-[2rem] border border-[#d7d2c1] bg-[#f8f5ed] p-7 shadow-[0_18px_60px_rgba(55,54,37,.07)] md:p-9">
              <div className="eyebrow mb-7 text-primary">Prendre rendez-vous</div>
              <a href={phone} className="group flex items-center gap-4 border-b border-[#ded9c9] pb-6 transition-colors hover:text-primary">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#e7e5d7] text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground"><Phone size={19} strokeWidth={1.6} /></span>
                <span>
                  <span className="block text-xs text-muted-foreground">Par téléphone</span>
                  <span className="mt-1 block text-xl font-medium tracking-[.03em]">06 86 54 47 66</span>
                </span>
                <ArrowUpRight className="ml-auto text-primary" size={18} />
              </a>
              <a href={externalSite} target="_blank" rel="noreferrer" className="group mt-6 flex items-center gap-4 transition-colors hover:text-primary">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#e7e5d7] text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground"><ArrowUpRight size={19} strokeWidth={1.6} /></span>
                <span className="min-w-0">
                  <span className="block text-xs text-muted-foreground">Sur le site</span>
                  <span className="mt-1 block break-all text-[.91rem] font-medium sm:text-base">orane-coach-therapeutique.fr</span>
                </span>
                <ArrowUpRight className="ml-auto shrink-0 text-primary" size={18} />
              </a>
              <p className="mt-8 border-t border-[#ded9c9] pt-5 text-xs leading-relaxed text-muted-foreground">Rendez-vous sur le site ou par téléphone.</p>
            </motion.div>
          </div>
        </section>
        <EncartUrgence />
      </main>

      <footer className="bg-[#e7e4d8]">
        <div className="mx-auto flex max-w-[1220px] flex-col gap-8 px-6 py-9 md:flex-row md:items-center md:justify-between md:px-10">
          <a href="#accueil" className="flex items-center gap-3" aria-label="ORANE, retour en haut de page">
            <span className="flex h-9 w-9 items-center justify-center rounded-full border border-primary/35 text-primary"><Leaf size={17} strokeWidth={1.3} /></span>
            <span className="text-sm tracking-[.25em]">ORANE</span>
            <span className="text-[.58rem] tracking-[.13em] text-muted-foreground">COACH THÉRAPEUTIQUE</span>
          </a>
          <div className="flex flex-col gap-3 text-xs text-foreground/65 sm:flex-row sm:items-center sm:gap-7">
            <Link href="/partenariat-adomsap" className="transition-colors hover:text-primary">Partenariat avec ADOMSAP</Link>
            <a href={phone} className="transition-colors hover:text-primary">06 86 54 47 66</a>
            <a href={externalSite} target="_blank" rel="noreferrer" className="transition-colors hover:text-primary">orane-coach-therapeutique.fr</a>
            <Link href="/mentions-legales" className="transition-colors hover:text-primary">Mentions légales</Link>
            <Link href="/politique-de-confidentialite" className="transition-colors hover:text-primary">Politique de confidentialité</Link>
          </div>
          <a href="#accueil" className="text-xs text-foreground/55 transition-colors hover:text-primary">Retour en haut ↑</a>
        </div>
      </footer>
    </div>
  );
}
