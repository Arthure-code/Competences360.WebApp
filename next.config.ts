import type { NextConfig } from "next";
// Import relatif : ce fichier est chargé avant le bundler, l'alias `@/` n'y
// est pas résolu.
import { DEFAULT_API_ORIGIN } from "./src/constants/apiOrigin";

const API_ORIGIN = process.env.API_BASE_URL ?? DEFAULT_API_ORIGIN;

const nextConfig: NextConfig = {
  output: "standalone",
  reactCompiler: true,

  /**
   * En développement, Next bloque ses ressources (_next/*) demandées depuis
   * une autre origine que localhost : une page ouverte par l'adresse LAN rend
   * son HTML mais aucun script ne démarre. Sans effet en production.
   */
  allowedDevOrigins: ["10.152.54.82", "172.25.159.82"],

  // Server Actions (ex. televerserMedia, FileUploader.tsx) sont limitées à
  // 1 Mo par défaut — trop bas pour un vrai fichier média. Alignée sur le
  // plus gros cas accepté (vidéo, voir UPLOAD_KIND_CONFIG dans
  // constants/contentLimits.ts), pas juste les images.
  experimental: {
    serverActions: {
      bodySizeLimit: "200mb",
    },
  },

  /**
   * Relaie les médias et les téléchargements vers l'API. Une balise <img>, une
   * balise <video> ou une requête de téléchargement ne peut pas passer par une
   * Server Action : ces réécritures sont la seule voie par laquelle le
   * navigateur atteint l'API, et le cookie de session les suit.
   */
  async rewrites() {
    return [
      { source: "/uploads/:path*", destination: `${API_ORIGIN}/uploads/:path*` },
      { source: "/api/uploads/photos/:userId", destination: `${API_ORIGIN}/api/uploads/photos/:userId` },
      { source: "/api/groups/:id/code-qr", destination: `${API_ORIGIN}/api/groups/:id/code-qr` },
      { source: "/api/export", destination: `${API_ORIGIN}/api/export` },
    ];
  },
};

export default nextConfig;