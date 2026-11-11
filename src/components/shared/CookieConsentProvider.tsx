"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"

export interface ConsentPreferences {
    essential: true
    analytics: boolean
}

interface StoredConsent {
    preferences: ConsentPreferences
    timestamp: string
    version: number
}

const STORAGE_KEY = "competences360_cookie_consent"
const CONSENT_VERSION = 1

const DEFAULT_PREFERENCES: ConsentPreferences = {
    essential: true,
    analytics: false,
}

interface CookieConsentContextValue {
    preferences: ConsentPreferences
    hasConsented: boolean
    isBannerVisible: boolean
    isModalOpen: boolean
    openModal: () => void
    closeModal: () => void
    acceptAll: () => void
    rejectAll: () => void
    savePreferences: (prefs: ConsentPreferences) => void
}

const CookieConsentContext = createContext<CookieConsentContextValue | null>(null)

function readStoredConsent(): StoredConsent | null {
    if (typeof window === "undefined") return null
    try {
        const raw = window.localStorage.getItem(STORAGE_KEY)
        if (!raw) return null
        return JSON.parse(raw) as StoredConsent
    } catch {
        return null
    }
}

function writeStoredConsent(preferences: ConsentPreferences) {
    const record: StoredConsent = {
        preferences,
        timestamp: new Date().toISOString(),
        version: CONSENT_VERSION,
    }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(record))
}

export function CookieConsentProvider({ children }: { children: ReactNode }) {
    const [preferences, setPreferences] = useState<ConsentPreferences>(DEFAULT_PREFERENCES)
    const [hasConsented, setHasConsented] = useState(false)
    const [isBannerVisible, setIsBannerVisible] = useState(false)
    const [isModalOpen, setIsModalOpen] = useState(false)

    // Au montage : lit le consentement stocké. Si absent (ou version obsolète), affiche la bannière.
    useEffect(() => {
        const stored = readStoredConsent()
        if (stored && stored.version === CONSENT_VERSION) {
            setPreferences(stored.preferences)
            setHasConsented(true)
            setIsBannerVisible(false)
        } else {
            setIsBannerVisible(true)
        }
    }, [])

    function commit(prefs: ConsentPreferences) {
        setPreferences(prefs)
        setHasConsented(true)
        writeStoredConsent(prefs)
        setIsBannerVisible(false)
        setIsModalOpen(false)
    }

    function acceptAll() {
        commit({ essential: true, analytics: true })
    }

    function rejectAll() {
        commit({ essential: true, analytics: false })
    }

    function savePreferences(prefs: ConsentPreferences) {
        commit(prefs)
    }

    function openModal() {
        setIsModalOpen(true)
    }

    function closeModal() {
        setIsModalOpen(false)
    }

    return (
        <CookieConsentContext.Provider
            value={{
                preferences,
                hasConsented,
                isBannerVisible,
                isModalOpen,
                openModal,
                closeModal,
                acceptAll,
                rejectAll,
                savePreferences,
            }}
        >
            {children}
        </CookieConsentContext.Provider>
    )
}

export function useCookieConsent() {
    const context = useContext(CookieConsentContext)
    if (!context) {
        throw new Error("useCookieConsent doit être utilisé à l'intérieur de <CookieConsentProvider>")
    }
    return context
}
