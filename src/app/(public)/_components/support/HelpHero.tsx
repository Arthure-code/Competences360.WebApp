"use client"

import SearchInput from "@/components/ui/SearchInput"
import styles from "./HelpHero.module.css"

interface HelpHeroProps {
    searchValue: string
    onSearchChange: (value: string) => void
}

export default function HelpHero({ searchValue, onSearchChange }: HelpHeroProps) {
    return (
        <section className={styles.hero}>
            <div className={styles.heroInner}>
                <h1 className={styles.title}>Centre d'aide</h1>
                <p className={styles.subtitle}>
                    Trouvez rapidement une réponse à votre question.
                </p>

                <SearchInput
                    value={searchValue}
                    onChange={onSearchChange}
                    placeholder="Rechercher une question..."
                    ariaLabel="Rechercher une question"
                    className={styles.searchArea}
                />
            </div>
        </section>
    )
}