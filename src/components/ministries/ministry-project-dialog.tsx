'use client';

import * as React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore } from '@/firebase';
import { addDoc, collection, updateDoc, doc } from 'firebase/firestore';
import type { Ministry, Project } from '@/lib/types';

interface MinistryProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ministry: Ministry;
  project?: Project;
  onSuccess?: () => void;
}

export function MinistryProjectDialog({ open, onOpenChange, ministry, project, onSuccess }: MinistryProjectDialogProps) {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const [name, setName] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [owner, setOwner] = React.useState('');
  const [startDate, setStartDate] = React.useState('');
  const [dueDate, setDueDate] = React.useState('');
  const [priority, setPriority] = React.useState<'Low' | 'Medium' | 'High'>('Medium');
  const [status, setStatus] = React.useState<'not-started' | 'in-progress' | 'completed' | 'on-hold'>('not-started');

  React.useEffect(() => {
    if (project) {
      setName(project.name);
      setDescription(project.description || '');
      setOwner(project.owner || '');
      setStartDate(project.startDate || '');
      setDueDate(project.dueDate || '');
      setPriority(project.priority);
      setStatus(project.status || 'not-started');
    } else {
      setName('');
      setDescription('');
      setOwner('');
      setStartDate('');
      setDueDate('');
      setPriority('Medium');
      setStatus('not-started');
    }
  }, [project, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user || !firestore) return;
    if (!name.trim()) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'Project name is required.',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const projectData = {
        name: name.trim(),
        description: description.trim() || undefined,
        owner: owner.trim() || undefined,
        startDate: startDate || undefined,
        dueDate: dueDate || undefined,
        priority,
        status,
        ministryId: ministry.id,
      };

      if (project) {
        const projectRef = doc(firestore, 'users', user.uid, 'projects', project.id);
        await updateDoc(projectRef, projectData);
        toast({
          title: 'Project Updated',
          description: 'Your project has been updated successfully.',
        });
      } else {
        const projectsCol = collection(firestore, 'users', user.uid, 'projects');
        await addDoc(projectsCol, {
          ...projectData,
          userId: user.uid,
        });
        toast({
          title: 'Project Created',
          description: 'Your project has been created successfully.',
        });
      }

      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving project:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to save project. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{project ? 'Edit Project' : 'Create New Project'}</DialogTitle>
          <DialogDescription>
            {project ? 'Update project details.' : 'Add a new project to this ministry.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="project-name">Project Name *</Label>
            <Input
              id="project-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Easter Sunday Service"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="project-description">Description</Label>
            <Textarea
              id="project-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief project description..."
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="project-owner">Owner</Label>
            <Input
              id="project-owner"
              value={owner}
              onChange={(e) => setOwner(e.target.value)}
              placeholder="Person responsible for this project"
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="project-start-date">Start Date</Label>
              <Input
                id="project-start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="project-due-date">Due Date</Label>
              <Input
                id="project-due-date"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="project-priority">Priority</Label>
              <Select value={priority} onValueChange={(value) => setPriority(value as 'Low' | 'Medium' | 'High')}>
                <SelectTrigger id="project-priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Low">Low</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="High">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="project-status">Status</Label>
              <Select value={status} onValueChange={(value) => setStatus(value as 'not-started' | 'in-progress' | 'completed' | 'on-hold')}>
                <SelectTrigger id="project-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="not-started">Not Started</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="on-hold">On Hold</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : project ? 'Update Project' : 'Create Project'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
