'use client';

import * as React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore } from '@/firebase';
import { addMinistry, updateMinistry } from '@/lib/data-firestore';
import type { Ministry } from '@/lib/types';

interface MinistryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ministry?: Ministry;
  onSuccess?: () => void;
}

export function MinistryDialog({ open, onOpenChange, ministry, onSuccess }: MinistryDialogProps) {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const [name, setName] = React.useState('');
  const [description, setDescription] = React.useState('');

  React.useEffect(() => {
    if (ministry) {
      setName(ministry.name);
      setDescription(ministry.description || '');
    } else {
      setName('');
      setDescription('');
    }
  }, [ministry, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user || !firestore) return;
    if (!name.trim()) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'Ministry name is required.',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      if (ministry) {
        await updateMinistry(firestore, user.uid, ministry.id, {
          name: name.trim(),
          description: description.trim() || undefined,
        });
        toast({
          title: 'Ministry Updated',
          description: 'Your ministry has been updated successfully.',
        });
      } else {
        await addMinistry(firestore, user.uid, {
          name: name.trim(),
          description: description.trim() || undefined,
        });
        toast({
          title: 'Ministry Created',
          description: 'Your ministry has been created successfully.',
        });
      }

      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving ministry:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to save ministry. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{ministry ? 'Edit Ministry' : 'Create New Ministry'}</DialogTitle>
          <DialogDescription>
            {ministry ? 'Update your ministry details.' : 'Add a new ministry to organize your projects and tasks.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Ministry Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Youth Ministry, Worship Team"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of this ministry..."
              rows={3}
            />
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
              {isSubmitting ? 'Saving...' : ministry ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
