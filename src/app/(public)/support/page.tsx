import styles from "./page.module.css"
import SupportInteractive from "@/app/(public)/_components/support/SupportInteractive"
import ContactCta from "@/app/(public)/_components/support/ContactCta"

export default function Support() {
    return (
        <div className={styles.page}>
            <SupportInteractive />
            <ContactCta />
        </div>
    )
}