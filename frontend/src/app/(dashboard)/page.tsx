import { redirect } from "next/navigation";

export default function DashboardIndexPage() {
    // Default redirect to leads page setup for MVP
    redirect('/leads');
}
