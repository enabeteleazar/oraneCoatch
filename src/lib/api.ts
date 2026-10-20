const base = () => `${import.meta.env.BASE_URL}api/`;

export type ReponseApi = { ok: boolean; status: number; data: Record<string, unknown> | null };

/** Appel JSON de l'API du site (cookies de session inclus, jamais mis en cache). */
export async function appeler(chemin: string, init?: RequestInit): Promise<ReponseApi> {
  try {
    const reponse = await fetch(`${base()}${chemin}`, {
      credentials: "same-origin",
      cache: "no-store",
      ...init,
      headers: { Accept: "application/json", "Content-Type": "application/json", ...init?.headers },
    });
    let data: Record<string, unknown> | null = null;
    try {
      data = (await reponse.json()) as Record<string, unknown>;
    } catch {
      /* corps vide ou non JSON */
    }
    return { ok: reponse.ok, status: reponse.status, data };
  } catch {
    return { ok: false, status: 0, data: null };
  }
}

export const messageErreur = (r: ReponseApi, defaut: string) => (typeof r.data?.erreur === "string" ? r.data.erreur : defaut);
