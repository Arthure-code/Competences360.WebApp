"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faCommentDots } from "@fortawesome/free-solid-svg-icons"
import CommentItem from "./CommentItem"
import { createReviewComment } from "@/_mocks/reviewComments.actions"
import type { ReviewComment } from "@/types/reviewComment"
import styles from "./CommentThread.module.css"

interface CommentThreadProps {
    comments: ReviewComment[]
    versionId: string
    target: ReviewComment["target"]
    targetId: string
    currentUserId: string
    currentUserName: string
    /** true seulement pour le gestionnaire en train de réviser (readOnly, pas propriétaire) — le formateur répond/résout mais ne crée pas de nouveaux commentaires, voir la discussion sur le mécanisme de révision */
    canCreate: boolean
}

/**
 * Plusieurs commentaires indépendants possibles sur le même élément, pas
 * un seul fil qui s'empile — si le gestionnaire n'est pas satisfait après
 * une réponse, il rouvre ou ajoute un nouveau commentaire distinct,
 * jamais une 2e réponse sous le même.
 */
export default function CommentThread({
    comments,
    versionId,
    target,
    targetId,
    currentUserId,
    currentUserName,
    canCreate,
}: CommentThreadProps) {
    const router = useRouter()
    const [isAdding, setIsAdding] = useState(false)
    const [newText, setNewText] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)

    function refresh() {
        router.refresh()
    }

    async function handleAdd() {
        if (!newText.trim()) return
        setIsSubmitting(true)
        await createReviewComment({
            versionId,
            target,
            targetId,
            text: newText.trim(),
            authorUserId: currentUserId,
            authorName: currentUserName,
        })
        setNewText("")
        setIsAdding(false)
        setIsSubmitting(false)
        refresh()
    }

    return (
        <div className={styles.thread}>
            {comments.length > 0 && (
                <div className={styles.list}>
                    {comments.map((comment) => (
                        <CommentItem key={comment.id} comment={comment} currentUserId={currentUserId} onChanged={refresh} />
                    ))}
                </div>
            )}

            {canCreate &&
                (isAdding ? (
                    <div className={styles.addForm}>
                        <textarea
                            value={newText}
                            onChange={(event) => setNewText(event.target.value)}
                            className={styles.addTextarea}
                            placeholder="Laisser un commentaire..."
                            rows={2}
                            autoFocus
                        />
                        <div className={styles.addFormActions}>
                            <button type="button" className={styles.textButton} onClick={() => setIsAdding(false)}>
                                Annuler
                            </button>
                            <button
                                type="button"
                                className={styles.primaryTextButton}
                                onClick={handleAdd}
                                disabled={isSubmitting || !newText.trim()}
                            >
                                Commenter
                            </button>
                        </div>
                    </div>
                ) : (
                    <button type="button" className={styles.addButton} onClick={() => setIsAdding(true)}>
                        <FontAwesomeIcon icon={faCommentDots} aria-hidden="true" />
                        Ajouter un commentaire
                    </button>
                ))}
        </div>
    )
}
