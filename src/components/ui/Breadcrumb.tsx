import Link from "next/link"
import styles from "./Breadcrumb.module.css"

export interface BreadcrumbItem {
    label: string
    href?: string
}

interface BreadcrumbProps {
    items: BreadcrumbItem[]
}

/** Le dernier item est toujours rendu comme texte courant, même avec un href fourni. */
export default function Breadcrumb({ items }: BreadcrumbProps) {
    return (
        <nav className={styles.breadcrumb} aria-label="Fil d'ariane">
            {items.map((item, index) => {
                const isLast = index === items.length - 1
                return (
                    <span key={`${item.label}-${index}`} className={styles.item}>
                        {!isLast && item.href ? (
                            <Link href={item.href} className={styles.link}>
                                {item.label}
                            </Link>
                        ) : (
                            <span className={isLast ? styles.current : styles.link}>{item.label}</span>
                        )}
                        {!isLast && (
                            <span className={styles.separator} aria-hidden="true">
                                ›
                            </span>
                        )}
                    </span>
                )
            })}
        </nav>
    )
}