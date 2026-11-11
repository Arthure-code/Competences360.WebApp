import { CookieConsentProvider } from "./CookieConsentProvider"
import CookieConsentBanner from "./CookieConsentBanner"
import CookieConsentModal from "./CookieConsentModal"

export default function CookieConsentRoot({ children }: { children: React.ReactNode }) {
    return (
        <CookieConsentProvider>
            {children}
            <CookieConsentBanner />
            <CookieConsentModal />
        </CookieConsentProvider>
    )
}

export { useCookieConsent } from "./CookieConsentProvider"
