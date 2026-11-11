import Link from "next/link"
import LegalArticle, { type LegalSection } from "@/app/(public)/(legal)/_components/shared/LegalArticle"
import LegalCallout from "@/app/(public)/(legal)/_components/shared/LegalCallout"
import DarkContactBox from "@/app/(public)/(legal)/_components/shared/DarkContactBox"
import styles from "./page.module.css"

const SECTIONS: LegalSection[] = [
    {
        title: "Qui sommes-nous ?",
        content: (
            <p>
                Compétences 360 est une plateforme éditée par La Griffe d'Alpha. Nous
                nous engageons à protéger la vie privée de nos utilisateurs et à traiter
                leurs données personnelles de manière transparente et sécurisée.
            </p>
        ),
    },
    {
        title: "Données collectées",
        content: (
            <>
                <p>Informations d'identification (Nom, Prénom, Courriel)</p>
                <p>Données professionnelles (Poste, Entreprise, Compétences déclarées)</p>
                <p>Données d'utilisation (Fréquence de connexion, temps passé par module)</p>
                <p>Informations techniques (Adresse IP, type de navigateur)</p>
            </>
        ),
    },
    {
        title: "Pourquoi nous les collectons",
        content: (
            <>
                <p>Fournir et gérer votre accès à la plateforme</p>
                <p>Personnaliser les recommandations de parcours de formation</p>
                <p>Améliorer l'expérience utilisateur et les fonctionnalités du produit</p>
                <p>Assurer la sécurité de vos données et prévenir la fraude</p>
            </>
        ),
    },
    {
        title: "Où sont-elles stockées ?",
        content: (
            <>
                <p>
                    Toutes les données traitées par Compétences 360 sont hébergées dans des
                    centres de données sécurisés situés exclusivement sur le territoire
                    canadien, ce qui est conforme à la Loi 25 et aux standards
                    de protection des données.
                </p>
            </>
        ),
    },
    {
        title: "Durée de conservation",
        content: (
            <>
                <p>
                    <strong>Compte actif : </strong> Les données sont conservées tant que
                    votre compte est actif pour assurer la continuité de votre historique
                    d'apprentissage.
                </p>
                <p>
                    <strong>Suppression : </strong> En cas de demande de suppression, vos
                    données sont effacées ou anonymisées dans un délai de 30 jours, sauf
                    obligation légale contraire.
                </p>
            </>
        ),
    },
    {
        title: "Vos droits",
        content: (
            <>
                <p>
                    Conformément à la législation en vigueur, vous disposez des droits
                    suivants concernant vos données personnelles :
                </p>

                <p>
                    <strong>Droit d'accès :</strong> Demander une copie des données que
                    nous détenons sur vous.
                </p>
                <p>
                    <strong>Droit de correction :</strong> Modifier des informations
                    inexactes ou incomplètes.
                </p>
                <p>
                    <strong>Droit à l'oubli :</strong> Demander la suppression totale
                    de vos données de nos systèmes.
                </p>
                <p>
                    <strong>Droit à la portabilité :</strong> Recevoir vos données dans un
                    format structuré et lisible par machine.
                </p>
                <p>
                    Pour exercer l'un de ces droits, veuillez nous contacter à <strong>privacy@competences360.ca</strong>.
                </p>
            </>
        ),
    },
    {
        title: "Consentement",
        content: (
            <p>
                En utilisant notre plateforme, vous consentez à la collecte et au
                traitement de vos données tel que décrit dans cette politique. Vous pouvez
                retirer votre consentement à tout moment, bien que cela puisse limiter
                l'accès à certaines fonctionnalités essentielles de la plateforme.
            </p>
        ),
    },
    {
        title: "Cookies",
        content: (
            <>
                <p>
                    Nous utilisons des cookies techniques nécessaires au fonctionnement du
                    site et des cookies d'analyse anonymisés.
                </p>
                <p>
                    <Link href="/cookies" className={styles.inlineLink}>
                        Consulter notre politique de cookies complète <span aria-hidden="true">→</span>
                    </Link>
                </p>
            </>
        ),
    },
    {
        title: "Nous contacter",
        content: (
            <>
                <p>
                    Pour toute question concernant ces conditions, veuillez nous contacter via
                    notre{" "}
                    <Link href="/contact" className={styles.inlineLink}>
                        formulaire de contact <span aria-hidden="true">→</span>
                    </Link>
                </p>
            </>
        ),
    },
]

export default function PolitiqueConfidentialite() {
    return (
        <LegalArticle
            pageTitle="Politique de confidentialité"
            orgLine="La Griffe d'Alpha — Compétences 360"
            lastUpdated="28 juin 2026"
            sections={SECTIONS}
        />
    )
}