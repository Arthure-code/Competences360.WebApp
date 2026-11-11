/**
 * Palette fermée pour les catégories org-scopées — pas de sélecteur hex
 * libre, un choix parmi un ensemble restreint, cohérent avec le reste des
 * couleurs déjà utilisées dans l'app (voir categories.mock.ts pour les 3
 * catégories globales existantes, dont les couleurs sont déjà dans cette
 * liste).
 */
export interface CategoryColorOption {
    hex: string
    label: string
}

export const CATEGORY_COLOR_PALETTE: CategoryColorOption[] = [
    { hex: "#E8832A", label: "Orange" },
    { hex: "#1A73E8", label: "Bleu" },
    { hex: "#2D9E6B", label: "Vert" },
    { hex: "#D64545", label: "Rouge" },
    { hex: "#9B59B6", label: "Violet" },
    { hex: "#E6B800", label: "Jaune" },
    { hex: "#16A0A8", label: "Sarcelle" },
    { hex: "#E0578F", label: "Rose" },
    { hex: "#6E7B8B", label: "Gris ardoise" },
    { hex: "#4E5D94", label: "Indigo" },
]
