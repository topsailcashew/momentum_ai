import { getProjects, getTasks } from "@/lib/data";
import { ProjectClientPage } from "./client-page";

export default async function ProjectsPage() {
    const [projects, tasks] = await Promise.all([getProjects(), getTasks()]);

    return (
        <div className="flex flex-col gap-4">
            <ProjectClientPage projects={projects} tasks={tasks} />
        </div>
    )
}
