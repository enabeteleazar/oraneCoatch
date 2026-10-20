export type Session = {
  configure: boolean;
  authentifie: boolean;
  stockage: "redis" | "fichier" | "aucun";
  agenda: boolean;
  email: boolean;
};

export const champCss =
  "h-12 w-full rounded-xl border border-primary/25 bg-[#fbf9f3] px-4 text-base outline-none transition-colors focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/30";

export const boutonCss =
  "inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full bg-primary px-7 text-sm font-medium text-primary-foreground transition duration-300 hover:-translate-y-0.5 hover:bg-[#4f5940] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary disabled:pointer-events-none disabled:opacity-60";

export const boutonDiscretCss =
  "inline-flex min-h-9 items-center justify-center gap-2 rounded-full border border-primary/25 px-4 text-xs text-foreground/75 transition-colors hover:border-primary hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:pointer-events-none disabled:opacity-60";
