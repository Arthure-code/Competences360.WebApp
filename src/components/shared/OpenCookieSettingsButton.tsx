"use client"

import Button from "@/components/ui/Button"
import { useCookieConsent } from "./CookieConsentProvider"

interface OpenCookieSettingsButtonProps {
    label?: string
    variant?: "primary" | "secondary" | "outline"
    fullWidth?: boolean
}

export default function OpenCookieSettingsButton({
    label = "Gérer mes préférences de cookies",
    variant = "outline",
    fullWidth,
}: OpenCookieSettingsButtonProps) {
    const { openModal } = useCookieConsent()

    return <Button label={label} variant={variant} fullWidth={fullWidth} onClick={openModal} />
}