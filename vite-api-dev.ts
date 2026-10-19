import fs from "node:fs";
import path from "node:path";
import type { IncomingMessage } from "node:http";
import { loadEnv, type Plugin } from "vite";

/**
 * Sert le dossier /api pendant `pnpm dev` (sur Vercel, ce sont de vraies fonctions).
 * Charge aussi les variables de .env / .env.local (ex. ADMIN_PASSWORD) dans process.env.
 * N'agit jamais au build.
 */
export function apiDev(): Plugin {
  return {
    name: "orane-api-dev",
    apply: "serve",
    configResolved(config) {
      const env = loadEnv(config.mode, config.root, "");
      for (const [cle, valeur] of Object.entries(env)) {
        if (process.env[cle] === undefined) process.env[cle] = valeur;
      }
    },
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = new URL(req.url ?? "/", "http://localhost");
        if (!url.pathname.startsWith("/api/")) return next();

        const relatif = url.pathname.replace(/^\/api\//, "").replace(/\/+$/, "");
        if (!/^[\w-]+(\/[\w-]+)*$/.test(relatif) || relatif.startsWith("_")) {
          res.statusCode = 404;
          res.end(JSON.stringify({ erreur: "Introuvable." }));
          return;
        }
        const fichier = path.resolve(server.config.root, "api", `${relatif}.ts`);
        if (!fs.existsSync(fichier)) {
          res.statusCode = 404;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ erreur: "Introuvable." }));
          return;
        }

        try {
          const module = await server.ssrLoadModule(fichier);
          const methode = (req.method ?? "GET").toUpperCase();
          const gestionnaire = module[methode] as ((r: Request) => Promise<Response> | Response) | undefined;
          if (typeof gestionnaire !== "function") {
            res.statusCode = 405;
            res.end();
            return;
          }

          const corps = methode === "GET" || methode === "HEAD" ? undefined : await lireCorps(req);
          const entetes = new Headers();
          for (const [cle, valeur] of Object.entries(req.headers)) {
            if (Array.isArray(valeur)) valeur.forEach((v) => entetes.append(cle, v));
            else if (valeur !== undefined) entetes.set(cle, valeur);
          }
          const requete = new Request(`http://${req.headers.host ?? "localhost"}${req.url}`, {
            method: methode,
            headers: entetes,
            body: corps ? new Uint8Array(corps) : undefined,
          });

          const reponse = await gestionnaire(requete);
          res.statusCode = reponse.status;
          reponse.headers.forEach((valeur, cle) => {
            if (cle.toLowerCase() !== "set-cookie") res.setHeader(cle, valeur);
          });
          const cookies = reponse.headers.getSetCookie();
          if (cookies.length > 0) res.setHeader("Set-Cookie", cookies);
          res.end(Buffer.from(await reponse.arrayBuffer()));
        } catch (erreur) {
          server.config.logger.error(`[api] ${String(erreur)}`);
          res.statusCode = 500;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ erreur: "Erreur interne." }));
        }
      });
    },
  };
}

function lireCorps(req: IncomingMessage): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const morceaux: Buffer[] = [];
    req.on("data", (m: Buffer) => morceaux.push(m));
    req.on("end", () => resolve(Buffer.concat(morceaux)));
    req.on("error", reject);
  });
}
