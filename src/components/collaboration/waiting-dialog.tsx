'use client';

import * as React from 'react';
import { useTeam } from '@/hooks/use-team';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { TeamMember } from '@/types/team';

interface WaitingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (userId: string, userName: string, reason: string, photoURL?: string) => void;
}

export function WaitingDialog({ open, onOpenChange, onSubmit }: WaitingDialogProps) {
  const { currentTeam } = useTeam();
  const [selectedMember, setSelectedMember] = React.useState<TeamMember | null>(null);
  const [reason, setReason] = React.useState('');
  const [searchQuery, setSearchQuery] = React.useState('');

  const filteredMembers = React.useMemo(() => {
    if (!currentTeam) return [];
    return currentTeam.members.filter((member) =>
      member.displayName.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [currentTeam, searchQuery]);

  const handleSubmit = () => {
    if (selectedMember && reason.trim()) {
      onSubmit(
        selectedMember.userId,
        selectedMember.displayName,
        reason,
        selectedMember.photoURL
      );
      setSelectedMember(null);
      setReason('');
      setSearchQuery('');
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>⏸️ Who are you waiting for?</DialogTitle>
          <DialogDescription>
            Mark this task as blocked while waiting for someone's input
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>👥 Select Team Member</Label>
            <Input
              placeholder="🔍 Search teammates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />

            <div className="max-h-48 space-y-2 overflow-y-auto">
              {filteredMembers.map((member) => (
                <button
                  key={member.userId}
                  onClick={() => setSelectedMember(member)}
                  className={`flex w-full items-center gap-3 rounded-lg border p-3 transition-colors ${
                    selectedMember?.userId === member.userId
                      ? 'border-primary bg-primary/10'
                      : 'hover:bg-muted'
                  }`}
                >
                  <Avatar className="size-8">
                    {member.photoURL && (
                      <AvatarImage src={member.photoURL} alt={member.displayName} />
                    )}
                    <AvatarFallback>{member.displayName.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium">{member.displayName}</p>
                    <p className="text-xs text-muted-foreground">{member.email}</p>
                  </div>
                  {member.isActive && (
                    <div className="size-2 rounded-full bg-green-500" />
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>📝 What do you need?</Label>
            <Textarea
              placeholder="e.g., Need design mockups for dashboard"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!selectedMember || !reason.trim()}
          >
            Mark as Waiting
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
