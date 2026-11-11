/**
 * Origine de l'API, quand la variable d'environnement `API_BASE_URL` n'est
 * pas définie.
 *
 * Depuis le 2026-09-10, elle pointe sur l'API de TEST déployée sur Azure :
 * le front est désormais connecté au back-end sans qu'il soit nécessaire de
 * lancer l'API en local. Rien à installer, rien à configurer.
 *
 * Définie ici et nulle part ailleurs, parce que DEUX endroits en dépendent et
 * qu'ils doivent toujours viser le même serveur :
 * - `lib/api.ts`, pour tous les appels du serveur Next vers l'API ;
 * - `next.config.ts`, pour les réécritures (médias, code QR, export), seule
 *   voie par laquelle le navigateur atteint l'API.
 *
 * Si les deux divergeaient, les données viendraient d'un serveur et les
 * images d'un autre : photos et vidéos cassées, export en erreur, sans aucun
 * message pour l'expliquer.
 *
 * Pour travailler contre une autre API que celle par défaut, sa propre
 * instance locale par exemple, poser `API_BASE_URL` dans un `.env.local`
 * (jamais versionné) plutôt que de modifier cette valeur.
 */
export const DEFAULT_API_ORIGIN = "https://app-competences360-api-test-dypj.azurewebsites.net"
