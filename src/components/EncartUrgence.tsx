import { LifeBuoy, Phone } from "lucide-react";

const numeros = [
  { numero: "3114", href: "tel:3114", titre: "Prévention du suicide", detail: "Numéro national, gratuit, 24 h/24 et 7 j/7" },
  { numero: "15", href: "tel:15", titre: "SAMU", detail: "Urgence médicale" },
  { numero: "112", href: "tel:112", titre: "Urgences européen", detail: "Police, pompiers, secours" },
];

export default function EncartUrgence() {
  return (
    <section id="urgence" aria-labelledby="urgence-titre" className="bg-[#f7f4ec] px-6 py-14 md:px-10 md:py-20">
      <div className="mx-auto max-w-[1120px] rounded-[2rem] border border-accent/60 bg-[#f1ead9] p-7 md:p-10">
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between md:gap-12">
          <div className="max-w-[440px]">
            <p className="eyebrow mb-4 flex items-center gap-2 text-primary">
              <LifeBuoy size={15} strokeWidth={1.6} /> En cas d'urgence
            </p>
            <h2 id="urgence-titre" className="display-serif text-3xl leading-[1.1] md:text-[2.6rem]">
              Besoin d'aide <span className="italic text-primary">tout de suite&nbsp;?</span>
            </h2>
            <p className="mt-4 text-sm leading-[1.85] text-foreground/75">
              ORANE n'est pas un service d'urgence. Si vous ou l'un de vos proches êtes en danger ou en grande
              détresse, appelez sans attendre.
            </p>
          </div>
          <ul className="grid flex-1 gap-3 sm:grid-cols-3 md:max-w-[640px]">
            {numeros.map(({ numero, href, titre, detail }) => (
              <li key={numero}>
                <a
                  href={href}
                  className="group flex h-full flex-col rounded-2xl border border-primary/25 bg-[#f8f5ed] p-5 transition duration-300 hover:-translate-y-0.5 hover:border-primary hover:bg-primary hover:text-primary-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
                >
                  <span className="flex items-center justify-between">
                    <span className="display-serif text-4xl">{numero}</span>
                    <Phone size={17} strokeWidth={1.6} className="text-primary transition-colors group-hover:text-primary-foreground" aria-hidden="true" />
                  </span>
                  <span className="mt-3 text-sm font-medium">{titre}</span>
                  <span className="mt-1 text-xs leading-relaxed text-foreground/65 transition-colors group-hover:text-primary-foreground/85">{detail}</span>
                  <span className="sr-only">. Appeler le {numero}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}