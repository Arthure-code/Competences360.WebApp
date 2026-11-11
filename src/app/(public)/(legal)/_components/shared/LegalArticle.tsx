"use client"

import { useEffect, useRef, useState, type MouseEvent, type ReactNode } from "react"
import Link from "next/link"
import { faChevronRight, faArrowLeft, faArrowUp } from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import styles from "./LegalArticle.module.css"

export interface LegalSection {
    title: string
    content: ReactNode
}

interface LegalArticleProps {
    pageTitle: string
    orgLine: string
    lastUpdated: string
    sections: LegalSection[]
    sidebar?: boolean
}

function getSectionId(index: number) {
    return `section-${index + 1}`
}

export default function LegalArticle({
    pageTitle,
    orgLine,
    lastUpdated,
    sections,
    sidebar = true,
}: LegalArticleProps) {
    const [activeIndex, setActiveIndex] = useState(0)
    const sectionRefs = useRef<(HTMLElement | null)[]>([])

    useEffect(() => {
        if (!sidebar) return

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        const index = sectionRefs.current.findIndex((el) => el === entry.target)
                        if (index !== -1) setActiveIndex(index)
                    }
                })
            },
            { rootMargin: "-96px 0px -70% 0px", threshold: 0 }
        )

        sectionRefs.current.forEach((el) => {
            if (el) observer.observe(el)
        })

        return () => observer.disconnect()
    }, [sections.length, sidebar])

    function handleTocClick(event: MouseEvent<HTMLAnchorElement>, index: number) {
        event.preventDefault()
        const target = sectionRefs.current[index]
        if (target) {
            target.scrollIntoView({ behavior: "smooth", block: "start" })
            window.history.replaceState(null, "", `#${getSectionId(index)}`)
        }
    }

    function handleScrollTop(event: MouseEvent) {
        event.preventDefault()
        window.scrollTo({ top: 0, behavior: "smooth" })
    }

    const tocList = (
        <ul className={styles.tocList}>
            {sections.map((section, index) => (
                <li key={section.title}>
                    <a
                        href={`#${getSectionId(index)}`}
                        className={`${styles.tocLink} ${
                            sidebar && activeIndex === index ? styles.tocLinkActive : ""
                        }`}
                        onClick={(event) => handleTocClick(event, index)}
                    >
                        {index + 1}. {section.title}
                    </a>
                </li>
            ))}
        </ul>
    )

    return (
        <div className={sidebar ? styles.page : `${styles.page} ${styles.pageNoSidebar}`}>

            <div className={sidebar ? styles.grid : styles.gridNoSidebar}>
                {sidebar && (
                    <aside className={styles.sidebar}>
                        <p className={styles.sidebarTitle}>Contenu de la page</p>
                        {tocList}
                    </aside>
                )}

                <article className={sidebar ? styles.article : styles.articleNoSidebar}>
                    <header className={styles.header}>
                        <h1 className={styles.title}>{pageTitle}</h1>
                        <p className={styles.orgLine}>{orgLine}</p>
                        <p className={styles.lastUpdated}>Dernière mise à jour : {lastUpdated}</p>
                    </header>

                    <hr className={styles.divider} />

                    {!sidebar && (
                        <div className={styles.inlineToc}>
                            <p className={styles.sidebarTitle}>Contenu de la page</p>
                            {tocList}
                        </div>
                    )}

                    {sections.map((section, index) => (
                        <section
                            key={section.title}
                            id={getSectionId(index)}
                            ref={(el) => {
                                sectionRefs.current[index] = el
                            }}
                            className={styles.section}
                        >
                            <h2 className={styles.sectionTitle}>
                                {index + 1}. {section.title}
                            </h2>
                            <div className={styles.sectionContent}>{section.content}</div>
                            {index < sections.length - 1 && <hr className={styles.divider} />}
                        </section>
                    ))}

                    <div className={styles.footerNav}>
                        <Link href="/" className={styles.footerLink}>
                            <FontAwesomeIcon icon={faArrowLeft} aria-hidden="true" />
                            Retour à l'accueil
                        </Link>
                        <button type="button" className={styles.footerLink} onClick={handleScrollTop}>
                            <FontAwesomeIcon icon={faArrowUp} aria-hidden="true" />
                            Haut de page
                        </button>
                    </div>
                </article>
            </div>
        </div>
    )
}