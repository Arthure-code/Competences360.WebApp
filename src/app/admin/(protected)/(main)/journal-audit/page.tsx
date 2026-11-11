import { redirect } from "next/navigation"
import { getCurrentAdminSession } from "@/_mocksAdmin/adminAuth.mock"
import { getAllAuditEntries } from "@/_mocksToMigrate/auditLog.mock"
import { routes } from "@/constants/routes"
import JournalAuditView from "@/app/admin/_components/journal-audit/JournalAuditView"

export default async function JournalAuditPage() {
    const session = await getCurrentAdminSession()
    if (!session) redirect(routes.admin.login)

    const entries = await getAllAuditEntries()

    return <JournalAuditView entries={entries} />
}