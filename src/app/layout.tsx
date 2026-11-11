import type { Metadata } from "next";
import { Urbanist } from "next/font/google";
import '@/styles/globals.css';
import { type LucideProps } from 'lucide-react';
import CookieConsentRoot from "@/components/shared/CookieConsentRoot";
import ConfigurationProvider from "@/components/shared/ConfigurationProvider"
import { getPlatformConfiguration } from "@/_mocks/configuration.mock"
import DevRoleSwitcherShortcut from "@/components/dev/DevRoleSwitcherShortcut"

const urbanist = Urbanist({
  subsets: ["latin"],
  variable: "--font-urbanist",
})

export const metadata = {
  title: "Compétences 360",
  description: "Plateforme numérique d'apprentissage",
}

/**
 * Asynchrone depuis que les règles chiffrées viennent du serveur : c'est le
 * seul endroit traversé par toutes les pages, donc le seul où les récupérer
 * une fois pour toutes (voir ConfigurationProvider). Sur une page publique,
 * l'appel n'est pas authentifié et retombe sur les valeurs de repli — ces
 * pages n'affichent aucun de ces chiffres.
 */
export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const configuration = await getPlatformConfiguration()

  return (
    <html lang="fr" className={`${urbanist.variable}`}>
      <body>
        <ConfigurationProvider configuration={configuration}>
          <CookieConsentRoot>
            {children}
          </CookieConsentRoot>
        </ConfigurationProvider>
        <DevRoleSwitcherShortcut />
      </body>
    </html>
  );
}