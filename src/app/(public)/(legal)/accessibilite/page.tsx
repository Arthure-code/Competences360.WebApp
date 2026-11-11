import {
    faVolumeHigh,
    faPalette,
    faKeyboard,
    faMobileScreen,
} from "@fortawesome/free-solid-svg-icons"
import SimpleLegalPage, {
    type SimpleLegalSection,
} from "@/app/(public)/(legal)/_components/shared/SimpleLegalPage"
import IconFeatureGrid from "@/app/(public)/(legal)/_components/shared/IconFeatureGrid"
import LegalCallout from "@/app/(public)/(legal)/_components/shared/LegalCallout"
import Button from "@/components/ui/Button"
import Link from "next/dist/client/link"
import styles from "./page.module.css"

const SECTIONS: SimpleLegalSection[] = [
    {
        title: "Notre engagement",
        content: (
            <p>
                Nous nous engageons à rendre la plateforme utilisable par le plus grand
                nombre, incluant les personnes ayant des difficultés de lecture, de
                vision, d'audition ou de motricité. Nous suivons les recommandations
                internationales WCAG 2.1 niveau AA comme référence de conception.
            </p>
        ),
    },
    {
        title: "Ce que nous avons mis en place",
        content: (
            <IconFeatureGrid
                items={[
                    {
                        icon: faVolumeHigh,
                        title: "Synthèse vocale intégrée",
                        description:
                            "Tous les contenus textuels peuvent être lus à voix haute directement dans la plateforme, sans installation de logiciel supplémentaire. Fonctionne sur tous les appareils modernes.",
                    },
                    {
                        icon: faPalette,
                        title: "Contraste et lisibilité",
                        description:
                            "Nos couleurs respectent les standards de contraste recommandés pour les personnes malvoyantes. Le texte est suffisamment grand et espacé pour une lecture confortable.",
                    },
                    {
                        icon: faKeyboard,
                        title: "Navigation au clavier",
                        description:
                            "La plateforme peut être utilisée entièrement au clavier, sans souris, pour les personnes ayant des difficultés de motricité fine.",
                    },
                    {
                        icon: faMobileScreen,
                        title: "Compatible tous appareils",
                        description:
                            "Compétences 360 fonctionne sur ordinateur, tablette et téléphone. L'interface s'adapte automatiquement à la taille de l'écran.",
                    },
                ]}
            />
        ),
    },
    {
        title: "Limitations connues",
        content: (
            <LegalCallout variant="warning">
                Certaines fonctionnalités avancées, notamment l'éditeur de vidéos
                interactives réservé aux gestionnaires, peuvent présenter des limitations
                d'accessibilité. Nous travaillons activement à les améliorer au fil des
                mises à jour.
            </LegalCallout>
        ),
    },
    {
        title: "Vous avez rencontré un problème ?",
        content: (
            <>
                <p>
                    Si vous avez de la difficulté à accéder à un contenu ou à utiliser une
                    fonctionnalité, nous voulons le savoir pour pouvoir l'améliorer
                    rapidement. {" "}
                    <Link href="/contact" className={styles.inlineLink}>
                        Nous signaler un problème <span aria-hidden="true">→</span>
                    </Link>
                </p>
            </>
        ),
    },
]

export default function Accessibilite() {
    return (
        <SimpleLegalPage
            pageTitle="Accessibilité"
            orgLine="La Griffe d'Alpha — Compétences 360"
            lastUpdated="28 juin 2026"
            intro={
                <p>
                    Compétences 360 a été conçu dès le départ pour être utilisé par tous,
                    incluant les personnes peu à l'aise avec les outils numériques.
                    L'accessibilité est au cœur de chaque décision de conception,
                    pas un ajout après coup.
                </p>
            }
            sections={SECTIONS}
        />
    )
}