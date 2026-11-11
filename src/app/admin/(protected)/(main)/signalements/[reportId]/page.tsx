import { notFound, redirect } from "next/navigation"
import { getCurrentAdminSession } from "@/_mocksAdmin/adminAuth.mock"
import { getReportById } from "@/_mocksToMigrate/reports.mock"
import { getAdminFullName } from "@/lib/adminUser"
import { routes } from "@/constants/routes"
import SignalementDetailView from "@/app/admin/_components/signalements/SignalementDetailView"

interface SignalementDetailPageProps {
    params: Promise<{ reportId: string }>
}

export default async function SignalementDetailPage({ params }: SignalementDetailPageProps) {
    const { reportId } = await params
    const session = await getCurrentAdminSession()
    if (!session) redirect(routes.admin.login)

    const report = await getReportById(reportId)
    if (!report) notFound()

    return <SignalementDetailView report={report} adminId={session.admin.id} adminName={getAdminFullName(session.admin)} />
}