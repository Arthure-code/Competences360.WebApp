"use client"

import { useState } from "react"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faCheck, faRotateLeft, faTrash, faChevronDown, faChevronRight } from "@fortawesome/free-solid-svg-icons"
import { toggleCommentResolved, respondToComment, deleteReviewComment } from "@/_mocks/reviewComments.actions"
import type { ReviewComment } from "@/types/reviewComment"
import styles from "./CommentItem.module.css"

interface CommentItemProps {
    comment: ReviewComment
    currentUserId: string
    onChanged: () => void
}

function formatTime(dateIso: string): string {
    return new Date(dateIso).toLocaleDateString("fr-CA", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
}

/**
 * Un commentaire résolu se replie en une seule ligne (façon GitHub sur une
 * PR), dépliable au clic, pour ne pas noyer ce qui reste vraiment à
 * traiter dans l'historique déjà réglé. Badge "Rouvert" si ça l'a déjà
 * été une fois. Les deux côtés (auteur du commentaire ou pas) peuvent
 * basculer résolu/non résolu, voir la discussion sur le mécanisme de
 * révision, seul l'auteur peut supprimer.
 */
export default function CommentItem({ comment, currentUserId, onChanged }: CommentItemProps) {
    const [isExpanded, setIsExpanded] = useState(!comment.resolved)
    const [isResponding, setIsResponding] = useState(false)
    const [responseText, setResponseText] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)

    const isOwnComment = comment.authorUserId === currentUserId

    async function handleToggleResolved() {
        setIsSubmitting(true)
        await toggleCommentResolved(comment.id)
        setIsSubmitting(false)
        onChanged()
    }

    async function handleRespond() {
        if (!responseText.trim()) return
        setIsSubmitting(true)
        await respondToComment(comment.id, responseText.trim(), currentUserId, comment.authorName)
        setResponseText("")
        setIsResponding(false)
        setIsSubmitting(false)
        onChanged()
    }

    async function handleDelete() {
        setIsSubmitting(true)
        await deleteReviewComment(comment.id, currentUserId)
        setIsSubmitting(false)
        onChanged()
    }

    if (comment.resolved && !isExpanded) {
        return (
            <button type="button" className={styles.collapsedRow} onClick={() => setIsExpanded(true)}>
                <FontAwesomeIcon icon={faChevronRight} className={styles.collapsedIcon} aria-hidden="true" />
                <FontAwesomeIcon icon={faCheck} className={styles.resolvedIcon} aria-hidden="true" />
                <span className={styles.collapsedText}>{comment.text}</span>
                {comment.reopened && <span className={styles.reopenedBadge}>Rouvert</span>}
            </button>
        )
    }

    return (
        <div className={`${styles.item} ${comment.resolved ? styles.itemResolved : ""}`}>
            {comment.resolved && (
                <button type="button" className={styles.collapseButton} onClick={() => setIsExpanded(false)}>
                    <FontAwesomeIcon icon={faChevronDown} aria-hidden="true" />
                    Replier
                </button>
            )}

            <div className={styles.header}>
                <span className={styles.author}>{comment.authorName}</span>
                <span className={styles.time}>{formatTime(comment.createdAt)}</span>
                {comment.reopened && <span className={styles.reopenedBadge}>Rouvert</span>}
            </div>
            <p className={styles.text}>{comment.text}</p>

            {comment.response && (
                <div className={styles.response}>
                    <div className={styles.header}>
                        <span className={styles.author}>{comment.response.authorName}</span>
                        <span className={styles.time}>{formatTime(comment.response.createdAt)}</span>
                    </div>
                    <p className={styles.text}>{comment.response.text}</p>
                </div>
            )}

            {isResponding && (
                <div className={styles.responseForm}>
                    <textarea
                        value={responseText}
                        onChange={(event) => setResponseText(event.target.value)}
                        className={styles.responseTextarea}
                        placeholder="Votre réponse..."
                        rows={2}
                        autoFocus
                    />
                    <div className={styles.responseFormActions}>
                        <button type="button" onClick={() => setIsResponding(false)} className={styles.textButton}>
                            Annuler
                        </button>
                        <button
                            type="button"
                            onClick={handleRespond}
                            className={styles.primaryTextButton}
                            disabled={isSubmitting || !responseText.trim()}
                        >
                            Répondre
                        </button>
                    </div>
                </div>
            )}

            <div className={styles.actions}>
                {!comment.response && !isResponding && (
                    <button type="button" className={styles.textButton} onClick={() => setIsResponding(true)}>
                        Répondre
                    </button>
                )}
                <button type="button" className={styles.textButton} onClick={handleToggleResolved} disabled={isSubmitting}>
                    <FontAwesomeIcon icon={comment.resolved ? faRotateLeft : faCheck} aria-hidden="true" />
                    {comment.resolved ? "Rouvrir" : "Marquer résolu"}
                </button>
                {isOwnComment && (
                    <button type="button" className={styles.deleteButton} onClick={handleDelete} disabled={isSubmitting} aria-label="Supprimer">
                        <FontAwesomeIcon icon={faTrash} />
                    </button>
                )}
            </div>
        </div>
    )
}
