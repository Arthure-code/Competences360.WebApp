import { redirect } from "next/navigation"
import PageHeader from "@/components/ui/PageHeader"
import { getCurrentAdminSession } from "@/_mocksAdmin/adminAuth.mock"
import { routes } from "@/constants/routes"
import AdminPersonalInfoCard from "@/app/admin/_components/compte/AdminPersonalInfoCard"
import AdminRoleStatusCard from "@/app/admin/_components/compte/AdminRoleStatusCard"
import DeleteAccountCard from "@/app/admin/_components/compte/DeleteAccountCard"
import styles from "./page.module.css"

/**
 * Non monolithique — même patron que apprenant/formateur/gestionnaire
 * compte/page.tsx : chaque bloc est un composant indépendant, la page
 * ne fait que les assembler.
 *
 * CORRECTION : ce commentaire disait auparavant qu'un compte Admin ne se
 * supprimerait jamais en libre-service — repensé depuis. DeleteAccountCard
 * (self-service, protections dernier propriétaire/racine déjà
 * appliquées côté serveur, voir deleteMyAccount) vit ici, cohérent avec
 * le même patron "zone de danger dans Mon compte" que les 3 autres
 * rôles — pas dans Paramètres, où il vivait temporairement avant ce
 * correctif.
 *
 * AdminPasswordCard retirée d'ici — le mot de passe vit maintenant DANS
 * AdminPersonalInfoCard (points + lien + modal), même présentation que
 * le vrai PersonalInfoCard. Le fichier AdminPasswordCard.tsx n'est plus
 * utilisé, à retirer du projet.
 */
export default async function AdminComptePage() {
    const session = await getCurrentAdminSession()
    if (!session) redirect(routes.admin.login)

    return (
        <div className={styles.page}>
            <PageHeader title="Mon compte" subtitle="Gérez vos informations personnelles et vos identifiants de connexion." />

            <AdminPersonalInfoCard admin={session.admin} />
            <AdminRoleStatusCard admin={session.admin} />
            <DeleteAccountCard />
        </div>
    )
}