'use client';

import * as React from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Zap, ZapOff, Battery, Folder, Calendar, Users, FileText } from 'lucide-react';
import { useDashboardData } from '@/hooks/use-dashboard-data';
import { useUser } from '@/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import type { Task, Project, RecurringTask, EnergyLevel } from '@/lib/types';
import { format, parseISO } from 'date-fns';
import { TaskFormDialog } from '@/components/dashboard/task-form-dialog';

const energyIcons: Record<EnergyLevel, React.ElementType> = {
  Low: ZapOff,
  Medium: Battery,
  High: Zap,
};

export function SearchClientPage() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';

  const [searchQuery, setSearchQuery] = React.useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = React.useState(initialQuery);
  const [selectedTask, setSelectedTask] = React.useState<Task | null>(null);

  const { user, isUserLoading: userLoading } = useUser();
  const { tasks, projects, recurringTasks, categories, loading: dataLoading } = useDashboardData();

  // Debounce search query
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Search logic
  const searchResults = React.useMemo(() => {
    if (!debouncedQuery.trim()) {
      return { tasks: [], projects: [], recurringTasks: [] };
    }

    const query = debouncedQuery.toLowerCase();

    const filteredTasks = tasks.filter(task =>
      task.name.toLowerCase().includes(query) ||
      task.details?.toLowerCase().includes(query) ||
      task.collaboration?.toLowerCase().includes(query) ||
      categories.find(c => c.id === task.category)?.name.toLowerCase().includes(query)
    );

    const filteredProjects = projects.filter(project =>
      project.name.toLowerCase().includes(query)
    );

    const filteredRecurringTasks = recurringTasks.filter(task =>
      task.name.toLowerCase().includes(query)
    );

    return {
      tasks: filteredTasks,
      projects: filteredProjects,
      recurringTasks: filteredRecurringTasks,
    };
  }, [debouncedQuery, tasks, projects, recurringTasks, categories]);

  const totalResults = searchResults.tasks.length + searchResults.projects.length + searchResults.recurringTasks.length;

  const getCategoryName = (categoryId: string) => {
    return categories.find(c => c.id === categoryId)?.name ?? categoryId;
  };

  const getProjectName = (projectId: string) => {
    return projects.find(p => p.id === projectId)?.name;
  };

  if (userLoading || dataLoading || !user) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Search Header */}
      <div>
        <h1 className="text-2xl font-bold mb-2">Search</h1>
        <div className="relative max-w-2xl">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tasks, projects, and more..."
            className="pl-9 h-12 text-lg"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoFocus
          />
        </div>
      </div>

      {/* Results */}
      {debouncedQuery.trim() ? (
        <Card>
          <CardHeader>
            <CardTitle>Search Results</CardTitle>
            <CardDescription>
              Found {totalResults} result{totalResults !== 1 ? 's' : ''} for "{debouncedQuery}"
            </CardDescription>
          </CardHeader>
          <CardContent>
            {totalResults === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Search className="h-12 w-12 mx-auto mb-3 opacity-20" />
                <p className="font-medium">No results found</p>
                <p className="mt-1 text-sm">Try searching with different keywords</p>
              </div>
            ) : (
              <Tabs defaultValue="tasks" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="tasks">
                    Tasks ({searchResults.tasks.length})
                  </TabsTrigger>
                  <TabsTrigger value="projects">
                    Projects ({searchResults.projects.length})
                  </TabsTrigger>
                  <TabsTrigger value="recurring">
                    Recurring ({searchResults.recurringTasks.length})
                  </TabsTrigger>
                </TabsList>

                {/* Tasks Results */}
                <TabsContent value="tasks" className="mt-4">
                  {searchResults.tasks.length > 0 ? (
                    <div className="space-y-3">
                      {searchResults.tasks.map(task => {
                        const Icon = energyIcons[task.energyLevel ?? 'Medium'];
                        const projectName = task.projectId ? getProjectName(task.projectId) : null;

                        return (
                          <div
                            key={task.id}
                            className="flex items-start gap-3 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer"
                            onClick={() => setSelectedTask(task)}
                          >
                            <div className="flex-grow min-w-0">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="font-semibold text-base">{task.name}</h3>
                                {task.completed && (
                                  <Badge variant="default" className="bg-green-500">
                                    Completed
                                  </Badge>
                                )}
                              </div>
                              <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm text-muted-foreground">
                                <Badge variant="secondary" className="capitalize">
                                  {getCategoryName(task.category ?? 'personal')}
                                </Badge>
                                <div className="flex items-center gap-1">
                                  <Icon className="size-3" />
                                  <span>{task.energyLevel}</span>
                                </div>
                                {projectName && (
                                  <div className="flex items-center gap-1">
                                    <Folder className="size-3" />
                                    <span>{projectName}</span>
                                  </div>
                                )}
                                {task.deadline && (
                                  <div className="flex items-center gap-1">
                                    <Calendar className="size-3" />
                                    <span>{format(parseISO(task.deadline), 'MMM d, yyyy')}</span>
                                  </div>
                                )}
                                {task.collaboration && (
                                  <div className="flex items-center gap-1">
                                    <Users className="size-3" />
                                    <span>{task.collaboration}</span>
                                  </div>
                                )}
                              </div>
                              {task.details && (
                                <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                                  {task.details}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>No tasks found</p>
                    </div>
                  )}
                </TabsContent>

                {/* Projects Results */}
                <TabsContent value="projects" className="mt-4">
                  {searchResults.projects.length > 0 ? (
                    <div className="space-y-3">
                      {searchResults.projects.map(project => (
                        <div
                          key={project.id}
                          className="flex items-center gap-3 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                        >
                          <Folder className="h-8 w-8 text-primary" />
                          <div className="flex-grow">
                            <h3 className="font-semibold text-base">{project.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              Priority: {project.priority}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>No projects found</p>
                    </div>
                  )}
                </TabsContent>

                {/* Recurring Tasks Results */}
                <TabsContent value="recurring" className="mt-4">
                  {searchResults.recurringTasks.length > 0 ? (
                    <div className="space-y-3">
                      {searchResults.recurringTasks.map(task => (
                        <div
                          key={task.id}
                          className="flex items-center gap-3 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                        >
                          <FileText className="h-8 w-8 text-purple-500" />
                          <div className="flex-grow">
                            <h3 className="font-semibold text-base">{task.name}</h3>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="secondary">{task.frequency}</Badge>
                              {task.lastCompleted && (
                                <span className="text-sm text-muted-foreground">
                                  Last completed: {format(parseISO(task.lastCompleted), 'MMM d, yyyy')}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>No recurring tasks found</p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">
              <Search className="h-16 w-16 mx-auto mb-4 opacity-20" />
              <p className="text-lg font-medium">Start searching</p>
              <p className="mt-2">Enter a search term to find tasks, projects, and recurring tasks</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Task Edit Dialog */}
      {selectedTask && (
        <TaskFormDialog
          open={!!selectedTask}
          onOpenChange={(open) => !open && setSelectedTask(null)}
          task={selectedTask}
          categories={categories}
          projects={projects}
          onSave={() => { }} // TODO: Implement save functionality
          isPending={false}
        />
      )}
    </div>
  );
}
