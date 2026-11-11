import styles from "./page.module.css"
import MissionHero from "@/app/(public)/_components/a-propos/MissionHero"
import StatsBlock from "@/app/(public)/_components/a-propos/StatsBlock"
import ValuesGrid from "@/app/(public)/_components/a-propos/ValuesGrid"
import FinalCta from "@/app/(public)/_components/accueil/FinalCta"

export default function APropos() {
    return (
        <div className={styles.page}>
            <MissionHero />
            <StatsBlock />
            <ValuesGrid />
            <FinalCta />
        </div>
    )
}