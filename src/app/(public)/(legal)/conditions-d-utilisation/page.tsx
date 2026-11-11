import Link from "next/link"
import LegalArticle, { type LegalSection } from "@/app/(public)/(legal)/_components/shared/LegalArticle"
import LegalCallout from "@/app/(public)/(legal)/_components/shared/LegalCallout"
import styles from "./page.module.css"

const SECTIONS: LegalSection[] = [
    {
        title: "Acceptation des conditions",
        content: (
            <p>
                En accédant au site Compétences 360 ou en créant un compte d'utilisateur, vous
                acceptez d'être lié par les présentes conditions d'utilisation. Si vous
                n'acceptez pas ces conditions, vous ne devez pas utiliser le service. Ces
                termes constituent un contrat légal entre vous et La Griffe d'Alpha concernant
                votre utilisation de la plateforme.
            </p>
        ),
    },
    {
        title: "Description du service",
        content: (
            <p>
                Compétences 360 est une plateforme d'apprentissage en ligne (e-learning)
                développée et gérée par La Griffe d'Alpha. Le service permet aux utilisateurs
                d'accéder à des contenus éducatifs, des parcours de formation, des évaluations
                et des outils de suivi de progression professionnelle.
            </p>
        ),
    },
    {
        title: "Création de compte",
        content: (
            <>
                <p>
                    Pour accéder à certaines fonctionnalités, vous devez créer un compte
                    utilisateur :
                </p>
                <p>
                    Vous devez fournir des informations exactes, complètes et à jour lors de
                    l'inscription.
                </p>
                <p>Chaque utilisateur ne peut posséder qu'un seul compte personnel actif.</p>
                <p>
                    Vous êtes responsable du maintien de la confidentialité de votre mot de passe
                    et de vos identifiants.
                </p>
                <p>
                    Pour les comptes liés à une organisation, vous confirmez avoir
                    l'autorisation de représenter ladite organisation.
                </p>
            </>
        ),
    },
    {
        title: "Rôles et responsabilités",
        content: (
            <>
                <p>
                    <strong>Apprenant :</strong> Accède aux formations assignées ou achetées,
                    complète les modules et reçoit des attestations.
                </p>
                <p>
                    <strong>Apprenant libre :</strong> Utilisateur indépendant naviguant sur le
                    catalogue public et gérant son propre parcours.
                </p>
                <p>
                    <strong>Formateur :</strong> Crée, gère et anime des contenus pédagogiques tout
                    en assurant le suivi des apprenants.
                </p>
                <p>
                    <strong>Gestionnaire d'organisation :</strong> Administre les accès des
                    membres de son entreprise et consulte les rapports de performance.
                </p>
            </>
        ),
    },
    {
        title: "Utilisation acceptable",
        content: (
            <>
                <p>Il est interdit de partager vos identifiants de connexion avec des tiers.</p>
                <p>
                    Il est interdit de tenter de contourner les mesures de sécurité ou
                    d'accéder à des données non autorisées.
                </p>
                <p>
                    Vous ne devez pas utiliser la plateforme à des fins illégales ou pour diffuser
                    du contenu malveillant.
                </p>
                <p>
                    Le respect envers les autres utilisateurs et les formateurs est obligatoire
                    dans tous les espaces d'échange.
                </p>
                <LegalCallout>
                    Attention : Tout manquement aux règles d'utilisation acceptable peut
                    entraîner la clôture immédiate de votre compte sans préavis.
                </LegalCallout>
            </>
        ),
    },
    {
        title: "Propriété du contenu",
        content: (
            <p>
                L'ensemble des contenus présents sur Compétences 360 (textes, vidéos,
                graphiques, logos, codes) est la propriété exclusive de La Griffe d'Alpha ou
                de ses partenaires. Toute reproduction, distribution ou modification sans
                autorisation écrite préalable est strictement interdite.
            </p>
        ),
    },
    {
        title: "Suspension de compte",
        content: (
            <p>
                La Griffe d'Alpha se réserve le droit de suspendre ou de résilier votre accès
                aux services en cas de non-respect des présentes conditions, d'activités
                frauduleuses ou sur demande des autorités compétentes.
            </p>
        ),
    },
    {
        title: "Limitation de responsabilité",
        content: (
            <p>
                Le service est fourni « tel quel » et « selon la disponibilité ». La Griffe
                d'Alpha ne peut être tenue responsable des interruptions de service, de la
                perte de données ou de tout dommage indirect résultant de l'utilisation de la
                plateforme.
            </p>
        ),
    },
    {
        title: "Modifications",
        content: (
            <p>
                Nous nous réservons le droit de modifier ces conditions à tout moment. En cas de
                modification substantielle, les utilisateurs seront informés par courriel ou via
                une notification sur la plateforme au moins 30 jours avant l'entrée en
                vigueur des nouveaux termes.
            </p>
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

export default function ConditionsUtilisation() {
    return (
        <LegalArticle
            pageTitle="Conditions d'utilisation"
            orgLine="La Griffe d'Alpha — Compétences 360"
            lastUpdated="28 juin 2026"
            sections={SECTIONS}
        />
    )
}