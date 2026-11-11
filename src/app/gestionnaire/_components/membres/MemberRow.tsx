import Link from "next/link"
import StatusBadge from "@/components/ui/StatusBadge"
import { ROLE_LABELS } from "@/constants/roles"
import type { OrganizationMember } from "@/_mocks/organizationMembers.mock"
import styles from "./MemberRow.module.css"

interface MemberRowProps {
    member: OrganizationMember
    /** Absent = ligne non cliquable (repli honnête plutôt qu'un lien vers nulle part) — voir MembresView.tsx pour le calcul selon le rôle */
    href?: string
}

/** Épopée 17 — devient un lien vers le dossier complet (apprenant ou staff selon le rôle, voir MembresView.tsx) — auparavant une simple ligne, cliquer ne faisait rien. */
export default function MemberRow({ member, href }: MemberRowProps) {
    const content = (
        <>
            <div className={styles.identity}>
                <span className={styles.name}>{member.fullName}</span>
                <span className={styles.email}>{member.email}</span>
            </div>

            <div className={styles.roles}>
                {member.roles.map((role) => (
                    <span key={role} className={styles.roleBadge}>
                        {ROLE_LABELS[role]}
                    </span>
                ))}
            </div>

            <StatusBadge
                variant={member.isActive ? "success" : "neutral"}
                label={member.isActive ? "Actif" : "Désactivé"}
            />
        </>
    )

    if (!href) return <div className={styles.row}>{content}</div>

    return (
        <Link href={href} className={`${styles.row} ${styles.rowLink}`}>
            {content}
        </Link>
    )
}