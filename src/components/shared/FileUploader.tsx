"use client"

import { useRef } from "react"
import { UPLOAD_KIND_CONFIG, type UploadKind } from "@/constants/contentLimits"
import { usePlatformConfiguration } from "@/components/shared/ConfigurationProvider"
import { televerserMedia } from "@/_mocks/mediaUpload.actions"

export interface UploadResult {
    url: string
    name: string
    kind: UploadKind
}

interface FileUploaderProps {
    /** Un ou plusieurs types acceptés. */
    kinds: UploadKind | UploadKind[]
    onUploadComplete: (result: UploadResult) => void
    onError?: (message: string) => void
    /** Rendu du déclencheur. Reçoit `open()` à appeler sur clic. */
    children: (open: () => void) => React.ReactNode
}

const OCTETS_PAR_MEGAOCTET = 1024 * 1024

/** Ouvre un sélecteur de fichier, téléverse le fichier choisi et rend son url à l'appelant. */
export default function FileUploader({ kinds, onUploadComplete, onError, children }: FileUploaderProps) {
    const inputRef = useRef<HTMLInputElement>(null)
    const configuration = usePlatformConfiguration()
    const kindList = Array.isArray(kinds) ? kinds : [kinds]
    const acceptAttr = kindList.map((kind) => UPLOAD_KIND_CONFIG[kind].accept).join(",")

    const maxOctetsParType: Record<UploadKind, number> = {
        image: configuration.maxImageOctets,
        video: configuration.maxVideoOctets,
        audio: configuration.maxAudioOctets,
    }

    function matchKind(mimeType: string): UploadKind | null {
        return kindList.find((kind) => mimeType.startsWith(kind + "/")) ?? null
    }

    async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0]
        e.target.value = ""
        if (!file) return

        const kind = matchKind(file.type)
        if (!kind) {
            onError?.("Type de fichier non accepté ici.")
            return
        }

        const maxOctets = maxOctetsParType[kind]
        if (file.size > maxOctets) {
            const limiteMo = Math.floor(maxOctets / OCTETS_PAR_MEGAOCTET)
            onError?.(`Fichier trop volumineux — limite de ${limiteMo} Mo.`)
            return
        }

        const form = new FormData()
        form.append("file", file)
        form.append("mediaType", kind)

        const envoi = await televerserMedia(form)

        if (!envoi.succes || !envoi.url) {
            onError?.(envoi.erreur ?? "Le téléversement a échoué.")
            return
        }

        onUploadComplete({ url: envoi.url, name: file.name, kind })
    }

    return (
        <>
            {children(() => inputRef.current?.click())}
            <input
                ref={inputRef}
                type="file"
                accept={acceptAttr}
                onChange={handleChange}
                style={{ display: "none" }}
            />
        </>
    )
}
