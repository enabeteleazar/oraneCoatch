export function json(data: unknown, init: { status?: number; headers?: Record<string, string> } = {}): Response {
  return new Response(JSON.stringify(data), {
    status: init.status ?? 200,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...init.headers },
  });
}

/** Lit un corps JSON de taille raisonnable. Renvoie `undefined` si le corps est invalide. */
export async function lireJson(request: Request, tailleMax = 4000): Promise<unknown | undefined> {
  try {
    const texte = await request.text();
    if (texte.length === 0 || texte.length > tailleMax) return undefined;
    return JSON.parse(texte);
  } catch {
    return undefined;
  }
}
