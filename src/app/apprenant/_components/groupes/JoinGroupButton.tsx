"use client"

import { useState } from "react"
import Button from "@/components/ui/Button"
import JoinGroupModal from "./JoinGroupModal"

interface JoinGroupButtonProps {
    /** Pré-rempli et ouvre automatiquement si présent, résolu côté serveur (voir page.tsx, searchParams) plutôt que useSearchParams ici, pour éviter d'exiger un Suspense juste pour ce bouton. */
    initialCode?: string
}

export default function JoinGroupButton({ initialCode }: JoinGroupButtonProps) {
    const [isOpen, setIsOpen] = useState(Boolean(initialCode))

    return (
        <>
            <Button label="+ Rejoindre un groupe" onClick={() => setIsOpen(true)} />
            <JoinGroupModal isOpen={isOpen} onClose={() => setIsOpen(false)} initialCode={initialCode} />
        </>
    )
}