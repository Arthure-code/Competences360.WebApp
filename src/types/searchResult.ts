export type SearchResultType = "module" | "group" | "member"

export interface SearchResult {
    id: string
    type: SearchResultType
    label: string
    description?: string
    href: string
}
