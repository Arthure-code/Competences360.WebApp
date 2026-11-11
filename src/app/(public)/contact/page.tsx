import styles from "./page.module.css"
import ContactIntro from "@/app/(public)/_components/contact/ContactIntro"
import HelpCard from "@/app/(public)/_components/contact/HelpCard"
import ContactInteractive from "@/app/(public)/_components/contact/ContactInteractive"

export default function Contact() {
    return (
        <div className={styles.page}>
            <div className={styles.grid}>
                <div className={styles.leftColumn}>
                    <ContactIntro />
                    <HelpCard />
                </div>
                <ContactInteractive />
            </div>
        </div>
    )
}