import ForgotPasswordForm from "@/app/(auth)/_components/ForgotPasswordForm"
import styles from "./page.module.css"

export default function ForgotPasswordPage() {
    return (
        <div className={styles.page}>
            <ForgotPasswordForm />
        </div>
    )
}