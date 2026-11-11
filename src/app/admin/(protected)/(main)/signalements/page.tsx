import { redirect } from "next/navigation"
import { getCurrentAdminSession } from "@/_mocksAdmin/adminAuth.mock"
import { getAllReports } from "@/_mocksToMigrate/reports.mock"
import { routes } from "@/constants/routes"
import SignalementsListView from "@/app/admin/_components/signalements/SignalementsListView"

export default async function SignalementsListPage() {
    const session = await getCurrentAdminSession()
    if (!session) redirect(routes.admin.login)

    const reports = await getAllReports()

    return <SignalementsListView reports={reports} />
}