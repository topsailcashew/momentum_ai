'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import type { Ministry, StrategicPlan, StrategicGoal } from '@/lib/types';
import { Target, Plus, Calendar, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import { GoalDialog } from './goal-dialog';

interface GoalsSectionProps {
  ministry: Ministry;
  strategicPlan: StrategicPlan | null;
  goals: StrategicGoal[];
}

export function GoalsSection({ ministry, strategicPlan, goals }: GoalsSectionProps) {
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [selectedGoal, setSelectedGoal] = React.useState<StrategicGoal | undefined>();

  const handleEditGoal = (goal: StrategicGoal) => {
    setSelectedGoal(goal);
    setIsDialogOpen(true);
  };

  const handleNewGoal = () => {
    setSelectedGoal(undefined);
    setIsDialogOpen(true);
  };

  const getStatusColor = (status: string) => {
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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'default';
      case 'low':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  if (!strategicPlan) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <Target className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">No Strategic Plan</h3>
          <p className="text-muted-foreground text-center mb-6">
            Create a strategic plan first before adding goals and metrics.
          </p>
          <Button onClick={() => window.location.reload()}>
            Refresh Page
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Strategic Goals</h2>
          <p className="text-muted-foreground">Track and manage your ministry's strategic objectives</p>
        </div>
        <Button onClick={handleNewGoal}>
          <Plus className="mr-2 h-4 w-4" />
          Add Goal
        </Button>
      </div>

      {goals.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Target className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No goals yet</h3>
            <p className="text-muted-foreground text-center mb-6">
              Start by adding strategic goals to track your ministry's progress.
            </p>
            <Button onClick={handleNewGoal}>
              <Plus className="mr-2 h-4 w-4" />
              Add First Goal
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {goals.map((goal) => (
            <Card
              key={goal.id}
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => handleEditGoal(goal)}
            >
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-lg">{goal.title}</CardTitle>
                  <Badge variant={getPriorityColor(goal.priority)}>
                    {goal.priority}
                  </Badge>
                </div>
                {goal.description && (
                  <CardDescription className="line-clamp-2">
                    {goal.description}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2 text-sm">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-semibold">{goal.progress}%</span>
                  </div>
                  <Progress value={goal.progress} className="h-2" />
                </div>

                <div className="flex items-center justify-between text-sm">
                  <Badge variant={getStatusColor(goal.status)}>
                    {goal.status.replace('-', ' ')}
                  </Badge>
                  {goal.targetDate && (
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span>{format(new Date(goal.targetDate), 'MMM d, yyyy')}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <GoalDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        ministry={ministry}
        strategicPlan={strategicPlan}
        goal={selectedGoal}
        onSuccess={() => setIsDialogOpen(false)}
      />
    </div>
  );
}
