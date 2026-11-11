import type { Difficulty } from "@/types/module"

/**
 * Extrait de lib/notices.ts pour être partagé avec lib/rewards.ts sans
 * dupliquer ces libellés à deux endroits.
 */
export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
    novice: "Novice",
    intermediaire: "Intermédiaire",
    expert: "Expert",
}
