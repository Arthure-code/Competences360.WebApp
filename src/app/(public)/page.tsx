import styles from "./page.module.css"
import Hero from "./_components/accueil/Hero"
import HowItWorks from "./_components/accueil/HowItWorks"
import Categories from "./_components/accueil/Categories"
import VideoInteractive from "./_components/accueil/VideoInteractive"
import Experience from "./_components/accueil/Experience"
import AudienceSection from "./_components/accueil/AudienceSection"
import PlatformDemo from "./_components/accueil/PlatformDemo"
import FinalCta from "./_components/accueil/FinalCta"

export default function Home() {
    return (
        <div className={styles.page}>
            <Hero />
            <HowItWorks />
            <Categories />
            <VideoInteractive />
            <Experience />
            <AudienceSection />
            <PlatformDemo />
            <FinalCta />
        </div>
    )
}