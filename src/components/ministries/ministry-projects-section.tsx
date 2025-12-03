'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Ministry, Project } from '@/lib/types';
import { FolderKanban, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { MinistryProjectDialog } from './ministry-project-dialog';

interface MinistryProjectsSectionProps {
  ministry: Ministry;
  projects: Project[];
}

export function MinistryProjectsSection({ ministry, projects }: MinistryProjectsSectionProps) {
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [selectedProject, setSelectedProject] = React.useState<Project | undefined>();

  const handleEditProject = (project: Project) => {
    setSelectedProject(project);
    setIsDialogOpen(true);
  };

  const handleNewProject = () => {
    setSelectedProject(undefined);
    setIsDialogOpen(true);
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'completed':
        return 'default';
      case 'in-progress':
        return 'secondary';
      case 'on-hold':
        return 'outline';
      default:
        return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Projects</h2>
          <p className="text-muted-foreground">Manage projects under this ministry</p>
        </div>
        <Button onClick={handleNewProject}>
          <Plus className="mr-2 h-4 w-4" />
          Add Project
        </Button>
      </div>

      {projects.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <FolderKanban className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No projects yet</h3>
            <p className="text-muted-foreground text-center mb-6">
              Create projects to organize your ministry's work.
            </p>
            <Button onClick={handleNewProject}>
              <Plus className="mr-2 h-4 w-4" />
              Add First Project
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Card
              key={project.id}
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => handleEditProject(project)}
            >
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-lg">{project.name}</CardTitle>
                  <Badge variant={project.priority === 'High' ? 'destructive' : project.priority === 'Medium' ? 'default' : 'secondary'}>
                    {project.priority}
                  </Badge>
                </div>
                {project.description && (
                  <CardDescription className="line-clamp-2">
                    {project.description}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent className="space-y-2">
                {project.status && (
                  <Badge variant={getStatusColor(project.status)}>
                    {project.status.replace('-', ' ')}
                  </Badge>
                )}
                {project.owner && (
                  <p className="text-sm text-muted-foreground">Owner: {project.owner}</p>
                )}
                {project.dueDate && (
                  <p className="text-sm text-muted-foreground">
                    Due: {format(new Date(project.dueDate), 'MMM d, yyyy')}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <MinistryProjectDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        ministry={ministry}
        project={selectedProject}
        onSuccess={() => setIsDialogOpen(false)}
      />
    </div>
  );
}
