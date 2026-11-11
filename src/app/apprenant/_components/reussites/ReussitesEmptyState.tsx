import { faQuestion } from "@fortawesome/free-solid-svg-icons"
import EmptyState from "@/components/ui/EmptyState"
import Button from "@/components/ui/Button"
import { routes } from "@/constants/routes"
import styles from "./ReussitesEmptyState.module.css"

export default function ReussitesEmptyState() {
    return (
        <div className={styles.wrapper}>
            <EmptyState
                icon={faQuestion}
                title="Vos premières réussites vous attendent"
                description="Complétez votre premier exercice pour obtenir votre premier moment fort. Terminez un niveau pour décrocher un badge. Complétez un module pour obtenir un certificat."
            />
            <Button label="Explorer les modules" href={routes.apprenant.modules.root} />
        </div>
    )
}
