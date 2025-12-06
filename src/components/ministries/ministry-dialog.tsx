"use client";
import { Loader2 } from 'lucide-react';

import * as React from 'react';
import {
  ResponsiveModal,
  ResponsiveModalContent,
  ResponsiveModalHeader,
  ResponsiveModalTitle,
  ResponsiveModalDescription,
  ResponsiveModalFooter,
  ResponsiveModalClose,
} from '@/components/ui/responsive-modal';
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
    <ResponsiveModal open={open} onOpenChange={onOpenChange}>
      <ResponsiveModalContent className="sm:max-w-lg max-h-[90vh] flex flex-col p-0 gap-0">
        <ResponsiveModalHeader className="p-6 pb-2 flex-none">
          <ResponsiveModalTitle>{ministry ? 'Edit Ministry' : 'Create New Ministry'}</ResponsiveModalTitle>
          <ResponsiveModalDescription>
            {ministry ? 'Update your ministry details.' : 'Add a new ministry to organize your projects and tasks.'}
          </ResponsiveModalDescription>
        </ResponsiveModalHeader>
        <div className="flex-1 overflow-y-auto p-6 py-2">
          <form id="ministry-form" onSubmit={handleSubmit} className="space-y-4">
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
          </form>
        </div>
        <ResponsiveModalFooter className="p-6 pt-2 flex-none">
          <div className="flex justify-end gap-3 w-full">
            <ResponsiveModalClose asChild>
              <Button
                type="button"
                variant="outline"
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            </ResponsiveModalClose>
            <Button type="submit" form="ministry-form" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSubmitting ? 'Saving...' : ministry ? 'Update' : 'Create'}
            </Button>
          </div>
        </ResponsiveModalFooter>
      </ResponsiveModalContent>
    </ResponsiveModal>
  );
}
