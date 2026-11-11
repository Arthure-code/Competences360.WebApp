"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import Drawer from "@/components/ui/Drawer"
import { highlightMatches } from "@/lib/textHighlight"
import { FAQ_ITEMS } from "@/_content/faq"
import styles from "./FaqAccordion.module.css"

// highlightMatches déplacée vers lib/textHighlight.tsx (réutilisée aussi
// par GlobalSearchResults.tsx, recherche de la topbar) — n'était dupliquée
// qu'ici auparavant.

type RichSegment =
    | { type: "text"; content: string }
    | { type: "bold"; content: string }
    | { type: "link"; content: string; href: string }

function parseRichText(text: string): RichSegment[] {
    const regex = /\[(.+?)\]\((.+?)\)|\*\*(.+?)\*\*/g
    const segments: RichSegment[] = []
    let lastIndex = 0
    let match: RegExpExecArray | null

    while ((match = regex.exec(text)) !== null) {
        if (match.index > lastIndex) {
            segments.push({ type: "text", content: text.slice(lastIndex, match.index) })
        }

        if (match[1] !== undefined) {
            segments.push({ type: "link", content: match[1], href: match[2] })
        } else if (match[3] !== undefined) {
            segments.push({ type: "bold", content: match[3] })
        }

        lastIndex = regex.lastIndex
    }

    if (lastIndex < text.length) {
        segments.push({ type: "text", content: text.slice(lastIndex) })
    }

    return segments
}

function renderRichText(text: string, query: string): React.ReactNode {
    return parseRichText(text).map((segment, index) => {
        const highlighted = highlightMatches(segment.content, query, styles.highlight)

        if (segment.type === "link") {
            return (
                <Link key={index} href={segment.href} className={styles.link}>
                    {highlighted}
                </Link>
            )
        }

        if (segment.type === "bold") {
            return <strong key={index}>{highlighted}</strong>
        }

        return <span key={index}>{highlighted}</span>
    })
}

interface FaqAccordionProps {
    searchQuery: string
}

export default function FaqAccordion({ searchQuery }: FaqAccordionProps) {
    const [openIds, setOpenIds] = useState<Set<string>>(new Set())

    const filteredItems = useMemo(() => {
        const query = searchQuery.trim().toLowerCase()
        if (!query) return FAQ_ITEMS
        return FAQ_ITEMS.filter(
            (item) =>
                item.question.toLowerCase().includes(query) ||
                item.answer.toLowerCase().includes(query)
        )
    }, [searchQuery])

    // Ouvre automatiquement tout élément dont la question ou la réponse
    // contient le terme recherché, sans refermer ceux déjà ouverts.
    useEffect(() => {
        const query = searchQuery.trim().toLowerCase()
        if (!query) return

        setOpenIds((prev) => {
            const next = new Set(prev)
            FAQ_ITEMS.forEach((item) => {
                const matches =
                    item.question.toLowerCase().includes(query) ||
                    item.answer.toLowerCase().includes(query)
                if (matches) next.add(item.id)
            })
            return next
        })
    }, [searchQuery])

    function toggleItem(id: string) {
        setOpenIds((prev) => {
            const next = new Set(prev)
            if (next.has(id)) {
                next.delete(id)
            } else {
                next.add(id)
            }
            return next
        })
    }

    return (
        <section className={styles.faqSection}>
            <div className={styles.faqInner}>
                {filteredItems.length === 0 ? (
                    <p className={styles.emptyState}>
                        Aucune question ne correspond à votre recherche.
                    </p>
                ) : (
                    <ul className={styles.list}>
                        {filteredItems.map((item) => (
                            <li key={item.id} className={styles.listItem}>
                                <Drawer
                                    id={item.id}
                                    open={openIds.has(item.id)}
                                    onOpenChange={() => toggleItem(item.id)}
                                    trigger={renderRichText(item.question, searchQuery)}
                                >
                                    <p>{renderRichText(item.answer, searchQuery)}</p>
                                </Drawer>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </section>
    )
}