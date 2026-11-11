"use client"

import { PointerSensor, KeyboardSensor, useSensor, useSensors } from "@dnd-kit/core"
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable"

interface UseExerciseDndSensorsOptions {
    /**
     * Active un KeyboardSensor avec les coordonnées de tri (flèches),
     * pour les mécaniques de type liste triable (Ordre : useSortable).
     * À laisser désactivé pour les mécaniques source→cible (Association :
     * useDraggable/useDroppable), où "flèches" n'a pas de sens sans ordre
     * linéaire — ces mécaniques ont déjà un équivalent clavier via le
     * tap-tap (boutons/chips focusables au Tab).
     */
    sortableKeyboard?: boolean
    /**
     * Distance (px) que le pointeur doit parcourir avant que le drag ne
     * s'active. En dessous du seuil, dnd-kit laisse l'événement clic natif
     * se produire — c'est ce qui permet au tap et au drag de cohabiter sur
     * le même élément sans conflit. Valeur alignée sur Ordre et
     * Association ; à ne changer qu'avec une raison UX documentée, pas
     * silencieusement mécanique par mécanique.
     */
    activationDistance?: number
}

/**
 * Sensors communs à toutes les mécaniques d'exercice basées sur dnd-kit.
 * Centralise le compromis tap-vs-drag pour qu'il ne diverge pas d'une
 * mécanique à l'autre au fil du temps.
 */
export function useExerciseDndSensors(options: UseExerciseDndSensorsOptions = {}) {
    const { sortableKeyboard = false, activationDistance = 5 } = options

    const pointerSensor = useSensor(PointerSensor, {
        activationConstraint: { distance: activationDistance },
    })
    const keyboardSensor = useSensor(KeyboardSensor, {
        coordinateGetter: sortableKeyboardCoordinates,
    })

    return useSensors(pointerSensor, ...(sortableKeyboard ? [keyboardSensor] : []))
}
