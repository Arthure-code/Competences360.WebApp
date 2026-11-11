import styles from "./SocialAuthButton.module.css"

interface SocialAuthButtonProps {
    label: string
    onClick?: () => void
}

export default function SocialAuthButton({ label, onClick }: SocialAuthButtonProps) {
    return (
        <button type="button" className={styles.button} onClick={onClick}>
            <svg viewBox="0 0 48 48" className={styles.icon} xmlns="http://www.w3.org/2000/svg">
                <path
                    fill="#FFC107"
                    d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 8 3l6-6C34 5.1 29.3 3 24 3 12.4 3 3 12.4 3 24s9.4 21 21 21 21-9.4 21-21c0-1.4-.1-2.7-.4-3.5Z"
                />
                <path
                    fill="#FF3D00"
                    d="M6.3 14.7l6.6 4.8C14.6 15.9 18.9 13 24 13c3.1 0 5.8 1.1 8 3l6-6C34 5.1 29.3 3 24 3c-7.5 0-14 4.2-17.7 10.7Z"
                />
                <path
                    fill="#4CAF50"
                    d="M24 45c5.2 0 9.9-2 13.4-5.2l-6.2-5.2c-2 1.5-4.6 2.4-7.2 2.4-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.9 40.7 16.4 45 24 45Z"
                />
                <path
                    fill="#1976D2"
                    d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.2 4.2-4.1 5.6l6.2 5.2C40.9 36 44 30.5 44 24c0-1.4-.1-2.7-.4-3.5Z"
                />
            </svg>
            {label}
        </button>
    )
}
