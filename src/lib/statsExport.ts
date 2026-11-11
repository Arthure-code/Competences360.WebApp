export type ExportFormat = "csv" | "excel" | "pdf"

/**
 * Le mot que l'API attend pour chaque format. Le bouton dit "Excel", la route
 * dit "xlsx" : la correspondance vit ici plutôt que dans l'appelant.
 */
const FORMATS_API: Record<ExportFormat, string> = {
    csv: "csv",
    excel: "xlsx",
    pdf: "pdf",
}

const NOM_PAR_DEFAUT = "export"

/**
 * Le nom que le serveur a donné au fichier, lu dans son en-tête d'attachement.
 *
 * C'est le serveur qui nomme, pas le navigateur : deux clients qui exportent la
 * même chose doivent obtenir le même nom de fichier.
 */
function nomDuFichier(entete: string | null): string {
    if (!entete) return NOM_PAR_DEFAUT

    const correspondance = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(entete)
    return correspondance ? decodeURIComponent(correspondance[1]) : NOM_PAR_DEFAUT
}

/**
 * Remet le fichier à l'utilisateur.
 *
 * Un lien créé puis cliqué, plutôt qu'une navigation : c'est le seul moyen de
 * déclencher un enregistrement sans quitter la page, et de choisir le nom.
 */
function declencherTelechargement(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
}

/**
 * Télécharge un export produit par le serveur.
 *
 * Le navigateur ne met rien en forme : il transmet la vue, les filtres et le
 * tri affichés, et reçoit le fichier. Un autre client qui poserait la même
 * question recevrait le même fichier.
 *
 * @param format Format demandé, tel que le bouton le nomme
 * @param parametres Vue, filtres et tri, tels que l'écran les tient
 */
export async function telechargerExport(
    format: ExportFormat,
    parametres: URLSearchParams,
): Promise<void> {
    parametres.set("format", FORMATS_API[format])

    const reponse = await fetch(`/api/export?${parametres.toString()}`)

    if (!reponse.ok) return

    declencherTelechargement(
        await reponse.blob(),
        nomDuFichier(reponse.headers.get("content-disposition")))
}