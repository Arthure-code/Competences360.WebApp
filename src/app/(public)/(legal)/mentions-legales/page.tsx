import SimpleLegalPage, {
    type SimpleLegalSection,
} from "@/app/(public)/(legal)/_components/shared/SimpleLegalPage"
import KeyValueCard from "@/app/(public)/(legal)/_components/shared/KeyValueCard"

const SECTIONS: SimpleLegalSection[] = [
    {
        title: "Éditeur",
        hideTitle: true,
        content: (
            <KeyValueCard
                title="Éditeur"
                rows={[
                    { label: "Nom de la plateforme", value: "Compétences 360" },
                    { label: "Société éditrice", value: "La Griffe d'Alpha" },
                    { label: "Statut juridique", value: "OBNL" },
                    { label: "Numéro d'entreprise du Québec (NEQ)", value: "À compléter", placeholder: true },
                    { label: "Adresse", value: "420 Rue Carillon, Mont-Laurier, QC, J9L 1P6" },
                    { label: "Numéro de téléphone", value: "À compléter", placeholder: true },
                ]}
            />
        ),
    },
    {
        title: "Hébergement",
        hideTitle: true,
        content: (
            <KeyValueCard
                title="Hébergement"
                rows={[
                    { label: "Hébergeur principal", value: "Microsoft Azure" },
                    {
                        label: "Région",
                        value: "Canada Central (données hébergées au Canada conformément à la Loi 25)",
                    },
                    { label: "Stockage des médias", value: "Cloudflare R2 — Canada" },
                    { label: "Courriels transactionnels", value: "Sinch Mailgun" },
                ]}
            />
        ),
    },
    {
        title: "Propriété intellectuelle",
        content: (
            <p>
                L'ensemble du contenu de la plateforme Compétences 360 — textes,
                graphismes, interfaces, logo et contenu pédagogique — est la propriété
                exclusive de La Griffe d'Alpha ou de ses partenaires, sauf mention
                contraire. Toute reproduction est interdite sans autorisation écrite
                préalable.
            </p>
        ),
    },
]

export default function MentionsLegales() {
    return (
        <SimpleLegalPage
            pageTitle="Mentions légales"
            orgLine="La Griffe d'Alpha — Compétences 360"
            lastUpdated="28 juin 2026"
            intro={
                <p>
                    Conformément aux obligations légales applicables au Québec, voici les
                    informations relatives à l'éditeur et à l'hébergement de la
                    plateforme Compétences 360.
                </p>
            }
            sections={SECTIONS}
        />
    )
}