/**
 * Rôle Administrateur de plateforme — complètement séparé du système de
 * rôles normal (Role, constants/roles.ts) et de son authentification
 * (getCurrentSession, users.mock.ts, maintenant branché sur l'API réelle
 * du backend — jamais touché ici). Comptes NOMMÉS (pas un mot de passe
 * unique partagé) : le journal d'audit (épopée Admin, point 14) a besoin
 * de savoir QUI a fait quoi, un mot de passe partagé viderait ce "qui" de
 * son sens.
 */
export interface AdminUser {
    id: string
    /**
     * Séparés dès la source — PAS un seul `name` à découper au besoin
     * (fragile : un nom composé comme "Marie Claire Dubois" se
     * découperait mal avec un simple split(" ")). Voir lib/adminUser.ts,
     * getAdminFullName, pour l'affichage combiné partout où un seul
     * nom complet est nécessaire — même esprit que getFullName(user)
     * pour le système normal.
     */
    firstName: string
    lastName: string
    /** Facultatif, affiché dans l'application à la place de firstName si présent — même concept que User.preferredFirstName */
    preferredFirstName?: string
    email: string
    /** false = accès révoqué (voir deactivateAdmin) — un admin désactivé ne peut plus se connecter, mais reste dans la liste pour l'historique/journal d'audit */
    isActive: boolean
    createdAt: string
    /**
     * false tant que la personne n'a pas changé le mot de passe temporaire
     * qu'on lui a communiqué à la création (voir createAdmin,
     * adminAuth.actions.ts) — tant que c'est false, un autre admin peut
     * voir ce mot de passe dans la liste des Administrateurs (utile si la
     * personne l'a perdu avant même sa première connexion). Devient true
     * définitivement une fois que la personne change son mot de passe
     * elle-même (voir changeAdminPassword) — plus jamais visible ensuite.
     */
    /**
     * true = Propriétaire — peut créer/désactiver/promouvoir d'autres
     * admins. false = Administrateur — accès complet au reste de la
     * plateforme (orgs, contenu, réglages), mais ne peut pas toucher au
     * roster des admins eux-mêmes. Le tout premier compte (voir
     * adminAuth.seed.ts) est toujours Propriétaire — quelqu'un doit
     * pouvoir démarrer la chaîne. Un Propriétaire peut ensuite promouvoir
     * n'importe quel Administrateur existant (voir promoteToOwner,
     * adminAuth.actions.ts).
     */
    isOwner: boolean
    hasChangedPassword: boolean
    /**
     * Compte racine — inspiré du compte root AWS. Personne ne peut
     * désactiver/rétrograder ce compte, sauf lui-même ou un autre compte
     * racine (voir deactivateAdmin/demoteToAdmin,
     * adminAuth.actions.ts). Seul un compte déjà racine peut en désigner
     * un nouveau (voir grantRootStatus) — sinon un propriétaire ordinaire
     * pourrait se l'accorder lui-même, ce qui viderait la protection de
     * son sens.
     *
     * Un compte racine ne peut PAS retirer ce statut de lui-même tant
     * qu'il est le SEUL compte racine actif — doit d'abord en désigner un
     * autre (voir removeMyRootStatus) : jamais de fenêtre où la
     * plateforme se retrouve sans aucun compte racine, même
     * temporairement.
     */
    isRoot: boolean
}