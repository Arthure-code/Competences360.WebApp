"use client"

import { useRouter } from "next/navigation"
import { faRightFromBracket } from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { logoutAdmin } from "@/_mocksAdmin/adminAuth.actions"
import { routes } from "@/constants/routes"
import styles from "./AdminLogoutButton.module.css"

export default function AdminLogoutButton() {
    const router = useRouter()

    async function handleLogout() {
        await logoutAdmin()
        router.push(routes.admin.login)
        router.refresh()
    }

    return (
        <button type="button" className={styles.button} onClick={handleLogout}>
            <FontAwesomeIcon icon={faRightFromBracket} aria-hidden="true" />
            Se déconnecter
        </button>
    )
}
