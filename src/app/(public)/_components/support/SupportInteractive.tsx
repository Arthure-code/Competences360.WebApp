"use client"

import { useState } from "react"
import styles from "./SupportInteractive.module.css"
import HelpHero from "./HelpHero"
import FaqAccordion from "./FaqAccordion"

export default function SupportInteractive() {
    const [searchQuery, setSearchQuery] = useState("")

    return (
        <div className={styles.wrapper}>
            <HelpHero searchValue={searchQuery} onSearchChange={setSearchQuery} />
            <FaqAccordion searchQuery={searchQuery} />
        </div>
    )
}