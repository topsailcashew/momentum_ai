import {
  getTasks,
  getTodayEnergy,
  getLatestMomentum,
  getCategories,
  getProjects,
} from '@/lib/data';
import { getSuggestedTasks } from '@/app/actions';
import { EnergyInput } from '@/components/dashboard/energy-input';
import { MomentumCard } from '@/components/dashboard/momentum-card';
import { SuggestedTasks } from '@/components/dashboard/suggested-tasks';
import { TaskList } from '@/components/dashboard/task-list';
import { Pomodoro } from '@/components/dashboard/pomodoro';

export default async function DashboardPage() {
  const [tasks, todayEnergy, latestMomentum, categories, projects] = await Promise.all([
    getTasks(),
    getTodayEnergy(),
    getLatestMomentum(),
    getCategories(),
    getProjects(),
  ]);

  const suggestedTasksData = todayEnergy
    ? await getSuggestedTasks(todayEnergy.level)
    : { suggestedTasks: '' };

  const suggestedTasks =
    suggestedTasksData.suggestedTasks.length > 0
      ? suggestedTasksData.suggestedTasks.split(',').map((t) => t.trim())
      : [];

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold tracking-tight font-headline">
        Dashboard
      </h1>
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <MomentumCard latestMomentum={latestMomentum} />
        </div>
        <div className="lg:col-span-2 grid gap-4">
            <EnergyInput todayEnergy={todayEnergy} />
            <Pomodoro />
        </div>
      </div>
      <div className="grid gap-4 xl:grid-cols-3">
        <div className="xl:col-span-1">
          <SuggestedTasks
            suggestedTasks={suggestedTasks}
            energyLevel={todayEnergy?.level}
          />
        </div>
        <div className="xl:col-span-2">
          <TaskList tasks={tasks} categories={categories} todayEnergy={todayEnergy} projects={projects} />
        </div>
      </div>
    </div>
  );
}
