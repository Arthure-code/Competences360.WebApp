/**
 * États de base partagés par toutes les mécaniques avec correction (Ordre,
 * Association, et les futures). Chaque mécanique peut étendre ce type avec
 * ses propres états intermédiaires — ex. `BaseAnswerState | "filled"` pour
 * Association, qui a besoin de distinguer "case remplie mais pas encore
 * corrigée" de "vide". "default" / "correct" / "incorrect" doivent rester
 * communs pour que les styles de résultat partagés s'appliquent partout
 * sans adaptation au cas par cas.
 */
export type BaseAnswerState = "default" | "correct" | "incorrect"
