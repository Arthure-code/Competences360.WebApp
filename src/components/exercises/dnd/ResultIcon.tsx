import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faCheck, faXmark } from "@fortawesome/free-solid-svg-icons"

interface ResultIconProps {
    /**
     * `true` = correct, `false` = incorrect, `null`/`undefined` = pas
     * encore corrigé (rien n'est affiché). Volontairement découplé de
     * `BaseAnswerState` (ou de tout état étendu comme "filled") : ce
     * composant n'a besoin de savoir qu'une seule chose — quelle icône
     * montrer, le cas échéant — pas comment chaque mécanique nomme ses
     * états intermédiaires.
     */
    isCorrect: boolean | null | undefined
    className?: string
}

/**
 * Icône de résultat (check / xmark) une fois la réponse soumise. Partagée
 * entre toutes les mécaniques pour que "correct" et "incorrect" restent
 * visuellement identiques partout — un changement d'icône, ou l'ajout d'un
 * état comme "partiellement correct", se fait une fois ici plutôt que dans
 * chaque renderer.
 */
export default function ResultIcon({ isCorrect, className }: ResultIconProps) {
    if (isCorrect === null || isCorrect === undefined) return null

    return (
        <span className={className}>
            <FontAwesomeIcon icon={isCorrect ? faCheck : faXmark} />
        </span>
    )
}
