import { getTasks, getProjects, getCategories } from "@/lib/data";
import { WeeklyPlannerClientPage } from "./client-page";

export default async function WeeklyPlannerPage() {
    const [tasks, projects, categories] = await Promise.all([getTasks(), getProjects(), getCategories()]);

    return (
        <WeeklyPlannerClientPage tasks={tasks} projects={projects} categories={categories} />
    );
}
