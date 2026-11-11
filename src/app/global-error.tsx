"use client"

/**
 * Convention Next.js — remplace le layout RACINE lui-même si CELUI-CI
 * plante (cas rare, distinct de error.tsx qui suppose que le layout
 * racine reste debout). Doit inclure ses propres <html>/<body> puisqu'il
 * remplace tout, et utilise du CSS en ligne plutôt que les modules CSS
 * habituels — si le layout racine a planté, mieux vaut ne dépendre de
 * rien d'autre pour s'assurer que ce message s'affiche quand même.
 */
export default function GlobalError({ unstable_retry }: { error: Error & { digest?: string }; unstable_retry: () => void }) {
    return (
        <html lang="fr">
            <body style={{ fontFamily: "system-ui, sans-serif" }}>
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "12px",
                        minHeight: "100vh",
                        padding: "24px",
                        textAlign: "center",
                    }}
                >
                    <h1 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 700 }}>Une erreur est survenue</h1>
                    <p style={{ margin: 0, fontSize: "0.875rem", color: "#666" }}>
                        Réessayez — si ça persiste, contactez le soutien.
                    </p>
                    <button
                        type="button"
                        onClick={() => unstable_retry()}
                        style={{
                            marginTop: "8px",
                            padding: "10px 20px",
                            borderRadius: "8px",
                            border: "none",
                            backgroundColor: "#111",
                            color: "#fff",
                            fontSize: "0.875rem",
                            fontWeight: 600,
                            cursor: "pointer",
                        }}
                    >
                        Réessayer
                    </button>
                </div>
            </body>
        </html>
    )
}
