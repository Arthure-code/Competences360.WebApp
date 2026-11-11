"use client"

import { useEffect, useState } from "react"
import Notice from "@/components/shared/Notice"

const MILLISECONDES_PAR_SECONDE = 1000
const SECONDES_PAR_MINUTE = 60

interface VerrouillageNoticeProps {
    /** Fin du verrouillage, date ISO renvoyée par l'API. */
    finVerrouillage: string
    onFin: () => void
}

/** Avertit que le compte est verrouillé et affiche le temps restant, mis à jour chaque seconde. */
export default function VerrouillageNotice({ finVerrouillage, onFin }: VerrouillageNoticeProps) {
    const [restant, setRestant] = useState(() => secondesRestantes(finVerrouillage))

    useEffect(() => {
        const minuterie = setInterval(() => {
            const secondes = secondesRestantes(finVerrouillage)
            setRestant(secondes)
            if (secondes === 0) {
                clearInterval(minuterie)
                onFin()
            }
        }, MILLISECONDES_PAR_SECONDE)

        return () => clearInterval(minuterie)
    }, [finVerrouillage, onFin])

    return (
        <Notice
            notice={{
                variant: "warning",
                title: "Compte verrouillé temporairement",
                message: restant > 0
                    ? `Trop de tentatives de connexion. Réessayez dans ${formater(restant)}.`
                    : "Vous pouvez réessayer maintenant.",
            }}
            size="sm"
        />
    )
}

/** Secondes restantes avant la fin du verrouillage, jamais négatives. */
function secondesRestantes(fin: string): number {
    return Math.max(0, Math.ceil((new Date(fin).getTime() - Date.now()) / MILLISECONDES_PAR_SECONDE))
}

/** « 12 min 05 s », ou « 45 s » sous la minute. */
function formater(secondes: number): string {
    const minutes = Math.floor(secondes / SECONDES_PAR_MINUTE)
    const reste = String(secondes % SECONDES_PAR_MINUTE).padStart(2, "0")
    return minutes > 0 ? `${minutes} min ${reste} s` : `${secondes} s`
}
