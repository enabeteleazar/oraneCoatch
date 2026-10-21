export type Stockage = "neon" | "local" | "aucune";
export type Session = { configure: boolean; authentifie: boolean; stockage: Stockage; agenda: boolean; email: boolean; formspree: boolean };

export const champCss =
  "h-12 w-full rounded-xl border border-primary/25 bg-[#fbf9f3] px-4 text-base outline-none transition-colors focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/30";
export const boutonCss =
  "inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full bg-primary px-7 text-sm font-medium text-primary-foreground transition duration-300 hover:-translate-y-0.5 hover:bg-[#4f5940] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary disabled:pointer-events-none disabled:opacity-60";
export const boutonDiscretCss =
  "inline-flex items-center gap-1.5 rounded-full border border-primary/30 px-4 py-2 text-xs font-medium text-primary transition-colors hover:bg-primary hover:text-primary-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-60";
