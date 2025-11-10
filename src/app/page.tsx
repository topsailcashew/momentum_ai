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
import { ScoreAndSuggestTasksOutput } from '@/ai/flows/suggest-tasks-based-on-energy';

export default async function DashboardPage() {
  const [tasks, todayEnergy, latestMomentum, categories, projects] = await Promise.all([
    getTasks(),
    getTodayEnergy(),
    getLatestMomentum(),
    getCategories(),
    getProjects(),
  ]);

  let suggestions: ScoreAndSuggestTasksOutput = {
    suggestedTasks: [],
    microSuggestions: [],
  };
  if (todayEnergy) {
    suggestions = await getSuggestedTasks(todayEnergy.level);
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold tracking-tight font-headline">
        Dashboard
      </h1>
      
      {/* Tier 1: Emotional State & Motivation */}
      <div className="grid gap-4 md:grid-cols-2">
        <MomentumCard latestMomentum={latestMomentum} />
        <EnergyInput todayEnergy={todayEnergy} />
      </div>

      {/* Tier 2: Action Zone */}
      <SuggestedTasks
        suggestions={suggestions}
        energyLevel={todayEnergy?.level}
      />

      {/* Tier 3: Deep Work Tools */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-1">
            <Pomodoro />
        </div>
        <div className="lg:col-span-2">
            <TaskList tasks={tasks} categories={categories} todayEnergy={todayEnergy} projects={projects} />
        </div>
      </div>
    </div>
  );
}
