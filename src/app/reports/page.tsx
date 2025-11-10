import { getReports } from "@/lib/data";
import { ReportsClientPage } from "./client-page";

export default async function ReportsPage() {
    const reports = await getReports();
    const reportsArray = Object.values(reports).sort((a, b) => b.date.localeCompare(a.date));
    return <ReportsClientPage reports={reportsArray} />;
}
