# State-Driven Task Cards with Team Collaboration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add async team collaboration with state-driven task cards and playful micro-interactions to Pace Pilot.

**Architecture:** Extend existing task data model with state machine, add team management system, implement collaboration UI components with Framer Motion animations, use Firestore real-time listeners for team coordination.

**Tech Stack:** TypeScript, React, Next.js 15, Firestore, Framer Motion, Tailwind CSS, shadcn/ui

---

## Phase 1: Core State System (Foundation)

### Task 1: Add State Machine Types

**Files:**
- Create: `src/types/task-state.ts`
- Modify: `src/types/index.ts`

**Step 1: Create task state type definitions**

```typescript
// src/types/task-state.ts
import { Timestamp } from 'firebase/firestore';

export type TaskState =
  | 'ready'        // Ready to work on (default)
  | 'in_progress'  // Currently being worked on
  | 'waiting'      // Blocked, waiting on someone/something
  | 'review'       // Ready for review/feedback
  | 'done';        // Completed

export interface StateHistoryEntry {
  state: TaskState;
  timestamp: Timestamp;
  changedBy: string; // User ID
  note?: string; // Optional context
}

export interface WaitingInfo {
  userId: string;
  userName: string;
  userPhotoURL?: string;
  reason: string; // "What do you need?"
  blockedAt: Timestamp;
}

export interface TaskStateConfig {
  state: TaskState;
  color: string;
  icon: string;
  label: string;
  animation?: 'pulse' | 'breathe' | 'shimmer' | 'none';
}

export const TASK_STATE_CONFIGS: Record<TaskState, TaskStateConfig> = {
  ready: {
    state: 'ready',
    color: 'bg-green-500',
    icon: '🟢',
    label: 'Ready',
    animation: 'none',
  },
  in_progress: {
    state: 'in_progress',
    color: 'bg-blue-500',
    icon: '🔵',
    label: 'In Progress',
    animation: 'pulse',
  },
  waiting: {
    state: 'waiting',
    color: 'bg-yellow-500',
    icon: '🟡',
    label: 'Waiting',
    animation: 'breathe',
  },
  review: {
    state: 'review',
    color: 'bg-purple-500',
    icon: '🟣',
    label: 'Review',
    animation: 'shimmer',
  },
  done: {
    state: 'done',
    color: 'bg-gray-400',
    icon: '⚪',
    label: 'Done',
    animation: 'none',
  },
};

// Valid state transitions
export const STATE_TRANSITIONS: Record<TaskState, TaskState[]> = {
  ready: ['in_progress', 'waiting'],
  in_progress: ['done', 'waiting', 'review'],
  waiting: ['ready', 'in_progress'],
  review: ['in_progress', 'done'],
  done: [],
};

export function canTransitionTo(from: TaskState, to: TaskState): boolean {
  return STATE_TRANSITIONS[from].includes(to);
}

export function getValidTransitions(currentState: TaskState): TaskState[] {
  return STATE_TRANSITIONS[currentState];
}
```

**Step 2: Export types from index**

Modify `src/types/index.ts` and add:

```typescript
export * from './task-state';
```

**Step 3: Verify types compile**

Run: `npm run typecheck`
Expected: No type errors

**Step 4: Commit**

```bash
git add src/types/task-state.ts src/types/index.ts
git commit -m "feat: add task state machine types and configuration"
```

---

### Task 2: Update Task Interface with State Fields

**Files:**
- Modify: `src/types/index.ts` (Task interface)

**Step 1: Add state fields to Task interface**

Find the `Task` interface in `src/types/index.ts` and add these fields:

```typescript
export interface Task {
  // ... existing fields ...

  // NEW STATE FIELDS
  state: TaskState;
  stateHistory: StateHistoryEntry[];

  // ENHANCED COLLABORATION FIELDS
  assignedTo?: string; // User ID
  assignedToName?: string; // Cached display name
  assignedToPhotoURL?: string; // Cached avatar

  waitingOn?: WaitingInfo;

  blockedTasks?: string[]; // Task IDs that are waiting on this one
}
```

**Step 2: Verify types compile**

Run: `npm run typecheck`
Expected: May have errors about missing `state` field in existing code - this is expected

**Step 3: Commit**

```bash
git add src/types/index.ts
git commit -m "feat: extend Task interface with state and collaboration fields"
```

---

### Task 3: Create State Badge Component

**Files:**
- Create: `src/components/collaboration/state-badge.tsx`
- Create: `src/components/collaboration/index.ts`

**Step 1: Install Framer Motion**

Run: `npm install framer-motion`

**Step 2: Create state badge component**

```typescript
// src/components/collaboration/state-badge.tsx
'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { TaskState, TASK_STATE_CONFIGS } from '@/types/task-state';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface StateBadgeProps {
  state: TaskState;
  onClick?: () => void;
  className?: string;
}

export function StateBadge({ state, onClick, className }: StateBadgeProps) {
  const config = TASK_STATE_CONFIGS[state];

  // Animation variants
  const animations = {
    pulse: {
      scale: [1, 1.05, 1],
      boxShadow: [
        '0 0 0 0 rgba(59, 130, 246, 0.4)',
        '0 0 0 4px rgba(59, 130, 246, 0)',
        '0 0 0 0 rgba(59, 130, 246, 0)',
      ],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
    breathe: {
      opacity: [1, 0.6, 1],
      scale: [1, 0.98, 1],
      transition: {
        duration: 3,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
    shimmer: {
      backgroundPosition: ['200% 0', '-200% 0'],
      transition: {
        duration: 3,
        repeat: Infinity,
        ease: 'linear',
      },
    },
    none: {},
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.button
            onClick={onClick}
            className={cn(
              'inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium',
              'transition-transform hover:scale-110',
              config.color,
              'text-white',
              onClick && 'cursor-pointer',
              className
            )}
            animate={config.animation ? animations[config.animation] : {}}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <span>{config.icon}</span>
            <span>{config.label}</span>
          </motion.button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Current state: {config.label}</p>
          {onClick && <p className="text-xs text-muted-foreground">Click to change</p>}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
```

**Step 3: Create barrel export**

```typescript
// src/components/collaboration/index.ts
export * from './state-badge';
```

**Step 4: Verify component compiles**

Run: `npm run typecheck`
Expected: No type errors

**Step 5: Commit**

```bash
git add src/components/collaboration/ package.json package-lock.json
git commit -m "feat: add StateBadge component with animated states"
```

---

### Task 4: Create State Transition Dropdown

**Files:**
- Create: `src/components/collaboration/state-transition-dropdown.tsx`
- Modify: `src/components/collaboration/index.ts`

**Step 1: Create state transition dropdown component**

```typescript
// src/components/collaboration/state-transition-dropdown.tsx
'use client';

import * as React from 'react';
import { TaskState, getValidTransitions, TASK_STATE_CONFIGS } from '@/types/task-state';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { StateBadge } from './state-badge';

interface StateTransitionDropdownProps {
  currentState: TaskState;
  onStateChange: (newState: TaskState) => void;
  children?: React.ReactNode;
}

export function StateTransitionDropdown({
  currentState,
  onStateChange,
  children,
}: StateTransitionDropdownProps) {
  const validTransitions = getValidTransitions(currentState);

  const getActionLabel = (state: TaskState): string => {
    const labels: Record<TaskState, string> = {
      ready: 'Mark as Ready',
      in_progress: '▶ Start Working',
      waiting: '⏸️ Mark as Waiting',
      review: '👁️ Send for Review',
      done: '✓ Complete',
    };
    return labels[state];
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {children || <StateBadge state={currentState} />}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {validTransitions.map((state) => {
          const config = TASK_STATE_CONFIGS[state];
          return (
            <DropdownMenuItem
              key={state}
              onClick={() => onStateChange(state)}
              className="gap-2"
            >
              <span>{config.icon}</span>
              <span>{getActionLabel(state)}</span>
            </DropdownMenuItem>
          );
        })}
        {validTransitions.length === 0 && (
          <DropdownMenuItem disabled>
            No available transitions
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

**Step 2: Export component**

Add to `src/components/collaboration/index.ts`:

```typescript
export * from './state-transition-dropdown';
```

**Step 3: Verify component compiles**

Run: `npm run typecheck`
Expected: No type errors

**Step 4: Commit**

```bash
git add src/components/collaboration/
git commit -m "feat: add StateTransitionDropdown component"
```

---

### Task 5: Create useTaskState Hook

**Files:**
- Create: `src/hooks/use-task-state.ts`

**Step 1: Create task state management hook**

```typescript
// src/hooks/use-task-state.ts
'use client';

import { useState } from 'react';
import { doc, updateDoc, arrayUnion, serverTimestamp } from 'firebase/firestore';
import { db } from '@/firebase';
import { Task, TaskState, StateHistoryEntry } from '@/types';
import { useUser } from '@/firebase';
import { useToast } from './use-toast';

export function useTaskState() {
  const { user } = useUser();
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);

  const updateTaskState = async (
    taskId: string,
    userId: string,
    newState: TaskState,
    note?: string
  ): Promise<void> => {
    if (!user) {
      toast({
        title: 'Error',
        description: 'You must be logged in to update task state',
        variant: 'destructive',
      });
      return;
    }

    setIsUpdating(true);

    try {
      const taskRef = doc(db, `users/${userId}/tasks`, taskId);

      const historyEntry: StateHistoryEntry = {
        state: newState,
        timestamp: serverTimestamp() as any,
        changedBy: user.uid,
        ...(note && { note }),
      };

      await updateDoc(taskRef, {
        state: newState,
        stateHistory: arrayUnion(historyEntry),
      });

      toast({
        title: 'State updated',
        description: `Task moved to ${newState}`,
      });
    } catch (error) {
      console.error('Error updating task state:', error);
      toast({
        title: 'Error',
        description: 'Failed to update task state',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return {
    updateTaskState,
    isUpdating,
  };
}
```

**Step 2: Verify hook compiles**

Run: `npm run typecheck`
Expected: No type errors

**Step 3: Commit**

```bash
git add src/hooks/use-task-state.ts
git commit -m "feat: add useTaskState hook for state management"
```

---

### Task 6: Add State to Task Cards (Quick Add Card)

**Files:**
- Modify: `src/components/tasks/quick-add-task-card.tsx`

**Step 1: Add default state when creating tasks**

Find the `handleAddTask` function and add `state: 'ready'` to the task object:

```typescript
const newTask: Task = {
  // ... existing fields ...
  state: 'ready', // NEW: Default state
  stateHistory: [], // NEW: Empty history
};
```

**Step 2: Verify component compiles**

Run: `npm run typecheck`
Expected: No type errors

**Step 3: Commit**

```bash
git add src/components/tasks/quick-add-task-card.tsx
git commit -m "feat: add default state to new tasks"
```

---

### Task 7: Display State Badge on Task Cards

**Files:**
- Modify: `src/components/tasks/task-card.tsx`

**Step 1: Import StateBadge and StateTransitionDropdown**

Add imports at top of file:

```typescript
import { StateBadge, StateTransitionDropdown } from '@/components/collaboration';
import { useTaskState } from '@/hooks/use-task-state';
```

**Step 2: Add state badge to task card UI**

Find the task card layout and add the state badge in the top-right corner:

```typescript
export function TaskCard({ task, ...props }: TaskCardProps) {
  const { updateTaskState } = useTaskState();

  const handleStateChange = async (newState: TaskState) => {
    await updateTaskState(task.id, task.userId, newState);
  };

  return (
    <div className="relative">
      {/* Existing task card content */}

      {/* NEW: State badge in top-right */}
      <div className="absolute top-2 right-2">
        <StateTransitionDropdown
          currentState={task.state || 'ready'}
          onStateChange={handleStateChange}
        />
      </div>

      {/* Rest of card content */}
    </div>
  );
}
```

**Step 3: Verify component compiles**

Run: `npm run typecheck`
Expected: May have errors if task.state is not always present - add fallback to 'ready'

**Step 4: Test in dev mode**

Run: `npm run dev`
Navigate to a task list and verify state badges appear

**Step 5: Commit**

```bash
git add src/components/tasks/task-card.tsx
git commit -m "feat: display state badge on task cards"
```

---

### Task 8: Add Card Flip Animation on State Change

**Files:**
- Create: `src/components/collaboration/state-transition-card.tsx`
- Modify: `src/components/collaboration/index.ts`

**Step 1: Create animated card wrapper**

```typescript
// src/components/collaboration/state-transition-card.tsx
'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface StateTransitionCardProps {
  isTransitioning: boolean;
  children: React.ReactNode;
}

export function StateTransitionCard({
  isTransitioning,
  children,
}: StateTransitionCardProps) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={isTransitioning ? 'transitioning' : 'stable'}
        initial={{ rotateY: 0 }}
        animate={{
          rotateY: isTransitioning ? 90 : 0,
          opacity: isTransitioning ? 0.5 : 1,
        }}
        exit={{ rotateY: 90, opacity: 0 }}
        transition={{
          duration: 0.3,
          ease: 'easeOut',
        }}
        style={{
          transformStyle: 'preserve-3d',
          backfaceVisibility: 'hidden',
        }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
```

**Step 2: Export component**

Add to `src/components/collaboration/index.ts`:

```typescript
export * from './state-transition-card';
```

**Step 3: Wrap TaskCard with animation**

Modify `src/components/tasks/task-card.tsx`:

```typescript
import { StateTransitionCard } from '@/components/collaboration';

export function TaskCard({ task, ...props }: TaskCardProps) {
  const { updateTaskState, isUpdating } = useTaskState();

  return (
    <StateTransitionCard isTransitioning={isUpdating}>
      <div className="relative">
        {/* Card content */}
      </div>
    </StateTransitionCard>
  );
}
```

**Step 4: Test animation in dev mode**

Run: `npm run dev`
Change task state and verify card flips

**Step 5: Commit**

```bash
git add src/components/collaboration/ src/components/tasks/task-card.tsx
git commit -m "feat: add card flip animation on state change"
```

---

## Phase 2: Team Management System

### Task 9: Create Team Data Types

**Files:**
- Create: `src/types/team.ts`
- Modify: `src/types/index.ts`

**Step 1: Define team types**

```typescript
// src/types/team.ts
import { Timestamp } from 'firebase/firestore';

export interface TeamMember {
  userId: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: 'owner' | 'member';
  joinedAt: Timestamp;
  currentEnergy?: 'low' | 'medium' | 'high';
  isActive?: boolean; // Online in last 5 minutes
}

export interface Team {
  id: string;
  name: string;
  createdBy: string;
  createdAt: Timestamp;
  members: TeamMember[];
}

export interface TeamInvite {
  id: string;
  teamId: string;
  teamName: string;
  invitedBy: string;
  invitedByName: string;
  email: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: Timestamp;
  expiresAt: Timestamp;
}
```

**Step 2: Export from index**

Add to `src/types/index.ts`:

```typescript
export * from './team';
```

**Step 3: Verify types compile**

Run: `npm run typecheck`
Expected: No type errors

**Step 4: Commit**

```bash
git add src/types/team.ts src/types/index.ts
git commit -m "feat: add team management types"
```

---

### Task 10: Create Team Context Provider

**Files:**
- Create: `src/hooks/use-team.tsx`

**Step 1: Create team context and hook**

```typescript
// src/hooks/use-team.tsx
'use client';

import * as React from 'react';
import { collection, query, where, onSnapshot, doc } from 'firebase/firestore';
import { db } from '@/firebase';
import { useUser } from '@/firebase';
import { Team, TeamMember } from '@/types/team';

interface TeamContextValue {
  teams: Team[];
  currentTeam: Team | null;
  setCurrentTeam: (team: Team | null) => void;
  isLoading: boolean;
}

const TeamContext = React.createContext<TeamContextValue | undefined>(undefined);

export function TeamProvider({ children }: { children: React.ReactNode }) {
  const { user } = useUser();
  const [teams, setTeams] = React.useState<Team[]>([]);
  const [currentTeam, setCurrentTeam] = React.useState<Team | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    if (!user) {
      setTeams([]);
      setCurrentTeam(null);
      setIsLoading(false);
      return;
    }

    // Listen to teams where user is a member
    const teamsRef = collection(db, 'teams');
    const q = query(
      teamsRef,
      where('members', 'array-contains', {
        userId: user.uid,
      })
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const teamsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Team[];

      setTeams(teamsData);

      // Auto-select first team if none selected
      if (teamsData.length > 0 && !currentTeam) {
        setCurrentTeam(teamsData[0]);
      }

      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  return (
    <TeamContext.Provider
      value={{
        teams,
        currentTeam,
        setCurrentTeam,
        isLoading,
      }}
    >
      {children}
    </TeamContext.Provider>
  );
}

export function useTeam() {
  const context = React.useContext(TeamContext);
  if (context === undefined) {
    throw new Error('useTeam must be used within a TeamProvider');
  }
  return context;
}
```

**Step 2: Verify hook compiles**

Run: `npm run typecheck`
Expected: No type errors

**Step 3: Commit**

```bash
git add src/hooks/use-team.tsx
git commit -m "feat: add TeamProvider context for team management"
```

---

### Task 11: Add TeamProvider to App Layout

**Files:**
- Modify: `src/components/app-layout.tsx`

**Step 1: Import and wrap with TeamProvider**

Add import:

```typescript
import { TeamProvider } from '@/hooks/use-team';
```

Wrap DashboardDataProvider content with TeamProvider:

```typescript
return (
  <DashboardDataProvider>
    <TeamProvider>
      <>
        <Sidebar>
          {/* ... sidebar content ... */}
        </Sidebar>
        {/* ... rest of layout ... */}
      </>
    </TeamProvider>
  </DashboardDataProvider>
);
```

**Step 2: Verify app compiles**

Run: `npm run typecheck`
Expected: No type errors

**Step 3: Test in dev mode**

Run: `npm run dev`
Verify app loads without errors

**Step 4: Commit**

```bash
git add src/components/app-layout.tsx
git commit -m "feat: add TeamProvider to app layout"
```

---

### Task 12: Create Team Selector Component

**Files:**
- Create: `src/components/team/team-selector.tsx`
- Create: `src/components/team/index.ts`

**Step 1: Create team selector dropdown**

```typescript
// src/components/team/team-selector.tsx
'use client';

import * as React from 'react';
import { useTeam } from '@/hooks/use-team';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { ChevronDown, Users, User } from 'lucide-react';

export function TeamSelector() {
  const { teams, currentTeam, setCurrentTeam } = useTeam();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2">
          {currentTeam ? (
            <>
              <Users className="size-4" />
              <span>{currentTeam.name}</span>
            </>
          ) : (
            <>
              <User className="size-4" />
              <span>Personal</span>
            </>
          )}
          <ChevronDown className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setCurrentTeam(null)}>
          <User className="size-4" />
          <span>Personal</span>
        </DropdownMenuItem>
        {teams.length > 0 && <DropdownMenuSeparator />}
        {teams.map((team) => (
          <DropdownMenuItem
            key={team.id}
            onClick={() => setCurrentTeam(team)}
          >
            <Users className="size-4" />
            <span>{team.name}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

**Step 2: Create barrel export**

```typescript
// src/components/team/index.ts
export * from './team-selector';
```

**Step 3: Add to header**

Modify `src/components/layout/header.tsx` to include TeamSelector in the header

**Step 4: Verify component compiles**

Run: `npm run typecheck`
Expected: No type errors

**Step 5: Commit**

```bash
git add src/components/team/ src/components/layout/header.tsx
git commit -m "feat: add team selector to header"
```

---

## Phase 3: Waiting/Blocking System

### Task 13: Create Waiting Dialog Component

**Files:**
- Create: `src/components/collaboration/waiting-dialog.tsx`
- Modify: `src/components/collaboration/index.ts`

**Step 1: Create waiting dialog**

```typescript
// src/components/collaboration/waiting-dialog.tsx
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
```

**Step 2: Export component**

Add to `src/components/collaboration/index.ts`:

```typescript
export * from './waiting-dialog';
```

**Step 3: Verify component compiles**

Run: `npm run typecheck`
Expected: No type errors

**Step 4: Commit**

```bash
git add src/components/collaboration/
git commit -m "feat: add waiting dialog for blocking tasks"
```

---

### Task 14: Integrate Waiting Dialog with State Transitions

**Files:**
- Modify: `src/components/collaboration/state-transition-dropdown.tsx`

**Step 1: Add dialog state and handler**

```typescript
import { WaitingDialog } from './waiting-dialog';

export function StateTransitionDropdown({
  currentState,
  onStateChange,
  onWaitingInfoProvided,
  children,
}: StateTransitionDropdownProps) {
  const [showWaitingDialog, setShowWaitingDialog] = React.useState(false);

  const handleStateClick = (state: TaskState) => {
    if (state === 'waiting') {
      setShowWaitingDialog(true);
    } else {
      onStateChange(state);
    }
  };

  const handleWaitingSubmit = (
    userId: string,
    userName: string,
    reason: string,
    photoURL?: string
  ) => {
    onWaitingInfoProvided?.({
      userId,
      userName,
      reason,
      userPhotoURL: photoURL,
    });
    onStateChange('waiting');
  };

  return (
    <>
      <DropdownMenu>
        {/* Existing dropdown code, but onClick calls handleStateClick */}
      </DropdownMenu>

      <WaitingDialog
        open={showWaitingDialog}
        onOpenChange={setShowWaitingDialog}
        onSubmit={handleWaitingSubmit}
      />
    </>
  );
}
```

**Step 2: Update props interface**

```typescript
interface StateTransitionDropdownProps {
  currentState: TaskState;
  onStateChange: (newState: TaskState) => void;
  onWaitingInfoProvided?: (info: Omit<WaitingInfo, 'blockedAt'>) => void;
  children?: React.ReactNode;
}
```

**Step 3: Verify component compiles**

Run: `npm run typecheck`
Expected: No type errors

**Step 4: Commit**

```bash
git add src/components/collaboration/state-transition-dropdown.tsx
git commit -m "feat: integrate waiting dialog with state transitions"
```

---

### Task 15: Update useTaskState Hook for Waiting Info

**Files:**
- Modify: `src/hooks/use-task-state.ts`

**Step 1: Add waiting info parameter**

```typescript
import { WaitingInfo } from '@/types';
import { serverTimestamp } from 'firebase/firestore';

export function useTaskState() {
  // ... existing code ...

  const updateTaskState = async (
    taskId: string,
    userId: string,
    newState: TaskState,
    note?: string,
    waitingInfo?: Omit<WaitingInfo, 'blockedAt'>
  ): Promise<void> => {
    // ... existing validation ...

    try {
      const taskRef = doc(db, `users/${userId}/tasks`, taskId);

      const updates: any = {
        state: newState,
        stateHistory: arrayUnion(historyEntry),
      };

      // Add waiting info if provided
      if (newState === 'waiting' && waitingInfo) {
        updates.waitingOn = {
          ...waitingInfo,
          blockedAt: serverTimestamp(),
        };
      } else if (newState !== 'waiting') {
        // Clear waiting info when leaving waiting state
        updates.waitingOn = null;
      }

      await updateDoc(taskRef, updates);

      // ... rest of function ...
    }
  };

  return {
    updateTaskState,
    isUpdating,
  };
}
```

**Step 2: Verify hook compiles**

Run: `npm run typecheck`
Expected: No type errors

**Step 3: Commit**

```bash
git add src/hooks/use-task-state.ts
git commit -m "feat: add waiting info support to state updates"
```

---

## Phase 4: UI Polish & Animations

### Task 16: Add CSS Animations for State Badges

**Files:**
- Create: `src/styles/animations.css`
- Modify: `src/app/globals.css`

**Step 1: Create animation keyframes**

```css
/* src/styles/animations.css */

@keyframes pulse-badge {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.4);
    transform: scale(1);
  }
  50% {
    box-shadow: 0 0 0 4px rgba(59, 130, 246, 0);
    transform: scale(1.05);
  }
}

@keyframes breathe {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.6;
    transform: scale(0.98);
  }
}

@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

.animate-pulse-badge {
  animation: pulse-badge 2s ease-in-out infinite;
}

.animate-breathe {
  animation: breathe 3s ease-in-out infinite;
}

.animate-shimmer {
  animation: shimmer 3s linear infinite;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(255, 255, 255, 0.3) 50%,
    transparent 100%
  );
  background-size: 200% 100%;
}

/* Respect reduced motion preference */
@media (prefers-reduced-motion: reduce) {
  .animate-pulse-badge,
  .animate-breathe,
  .animate-shimmer {
    animation: none;
  }
}
```

**Step 2: Import animations in globals.css**

Add to `src/app/globals.css`:

```css
@import '../styles/animations.css';
```

**Step 3: Verify styles load**

Run: `npm run dev`
Check that animations work

**Step 4: Commit**

```bash
git add src/styles/animations.css src/app/globals.css
git commit -m "feat: add CSS animations for state badges"
```

---

### Task 17: Create Blocking Indicator Component

**Files:**
- Create: `src/components/collaboration/blocking-indicator.tsx`
- Modify: `src/components/collaboration/index.ts`

**Step 1: Create blocking indicator badge**

```typescript
// src/components/collaboration/blocking-indicator.tsx
'use client';

import * as React from 'react';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface BlockingIndicatorProps {
  blockedCount: number;
  blockedTaskNames?: string[];
}

export function BlockingIndicator({
  blockedCount,
  blockedTaskNames = [],
}: BlockingIndicatorProps) {
  if (blockedCount === 0) return null;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant="outline"
            className="border-orange-500 bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-300"
          >
            ⚠️ {blockedCount}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <div className="space-y-1">
            <p className="font-medium">
              {blockedCount} {blockedCount === 1 ? 'person' : 'people'} waiting
            </p>
            {blockedTaskNames.length > 0 && (
              <ul className="text-xs text-muted-foreground">
                {blockedTaskNames.map((name, i) => (
                  <li key={i}>• {name}</li>
                ))}
              </ul>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
```

**Step 2: Export component**

Add to `src/components/collaboration/index.ts`:

```typescript
export * from './blocking-indicator';
```

**Step 3: Verify component compiles**

Run: `npm run typecheck`
Expected: No type errors

**Step 4: Commit**

```bash
git add src/components/collaboration/
git commit -m "feat: add blocking indicator badge"
```

---

### Task 18: Display Waiting Indicator on Task Cards

**Files:**
- Modify: `src/components/tasks/task-card.tsx`

**Step 1: Add waiting indicator display**

```typescript
import { BlockingIndicator } from '@/components/collaboration';

export function TaskCard({ task }: TaskCardProps) {
  return (
    <div className="relative">
      {/* Existing content */}

      {/* Show if someone is waiting on this task */}
      {task.blockedTasks && task.blockedTasks.length > 0 && (
        <div className="mt-2">
          <BlockingIndicator blockedCount={task.blockedTasks.length} />
        </div>
      )}

      {/* Show if this task is waiting on someone */}
      {task.state === 'waiting' && task.waitingOn && (
        <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
          <Avatar className="size-6">
            {task.waitingOn.userPhotoURL && (
              <AvatarImage
                src={task.waitingOn.userPhotoURL}
                alt={task.waitingOn.userName}
              />
            )}
            <AvatarFallback>
              {task.waitingOn.userName.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <span>⏸️ Waiting on {task.waitingOn.userName}</span>
        </div>
      )}
    </div>
  );
}
```

**Step 2: Verify component compiles**

Run: `npm run typecheck`
Expected: No type errors

**Step 3: Test in dev mode**

Run: `npm run dev`
Verify waiting indicators display correctly

**Step 4: Commit**

```bash
git add src/components/tasks/task-card.tsx
git commit -m "feat: display waiting and blocking indicators on task cards"
```

---

## Phase 5: Firestore Rules & Security

### Task 19: Update Firestore Rules for State Fields

**Files:**
- Modify: `firestore.rules`

**Step 1: Add validation for state fields**

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // ... existing rules ...

    match /users/{userId}/tasks/{taskId} {
      allow read: if request.auth != null && request.auth.uid == userId;

      allow create: if request.auth != null &&
        request.auth.uid == userId &&
        request.resource.data.state in ['ready', 'in_progress', 'waiting', 'review', 'done'] &&
        request.resource.data.stateHistory is list;

      allow update: if request.auth != null && (
        request.auth.uid == userId ||
        request.auth.uid == resource.data.assignedTo
      ) &&
      request.resource.data.state in ['ready', 'in_progress', 'waiting', 'review', 'done'];

      allow delete: if request.auth != null && request.auth.uid == userId;
    }

    // Team rules
    match /teams/{teamId} {
      allow read: if request.auth != null &&
        request.auth.uid in resource.data.members;

      allow create: if request.auth != null &&
        request.auth.uid == request.resource.data.createdBy;

      allow update: if request.auth != null &&
        request.auth.uid == resource.data.createdBy;
    }
  }
}
```

**Step 2: Deploy rules**

Run: `firebase deploy --only firestore:rules`

**Step 3: Verify rules work**

Test creating and updating tasks in dev mode

**Step 4: Commit**

```bash
git add firestore.rules
git commit -m "feat: update Firestore rules for state and team fields"
```

---

## Phase 6: Documentation & Testing

### Task 20: Create Migration Guide

**Files:**
- Create: `docs/migrations/2025-12-09-add-state-fields.md`

**Step 1: Write migration documentation**

```markdown
# Migration: Add State Fields to Tasks

**Date:** 2025-12-09

## Overview

This migration adds state management fields to all existing tasks.

## Required Fields

All tasks need:
- `state`: TaskState (default: 'ready')
- `stateHistory`: StateHistoryEntry[] (default: empty array)

## Migration Script

Run this script in Firebase Console or via Admin SDK:

\`\`\`typescript
import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const db = getFirestore();

async function migrateTaskStates() {
  const usersSnapshot = await db.collection('users').get();

  for (const userDoc of usersSnapshot.docs) {
    const tasksSnapshot = await db
      .collection(\`users/\${userDoc.id}/tasks\`)
      .get();

    const batch = db.batch();
    let batchCount = 0;

    for (const taskDoc of tasksSnapshot.docs) {
      const taskData = taskDoc.data();

      // Skip if already has state
      if (taskData.state) continue;

      batch.update(taskDoc.ref, {
        state: taskData.completed ? 'done' : 'ready',
        stateHistory: [],
      });

      batchCount++;

      // Commit in batches of 500
      if (batchCount === 500) {
        await batch.commit();
        batchCount = 0;
      }
    }

    if (batchCount > 0) {
      await batch.commit();
    }

    console.log(\`Migrated tasks for user \${userDoc.id}\`);
  }

  console.log('Migration complete!');
}

migrateTaskStates().catch(console.error);
\`\`\`

## Rollback

To rollback, remove the fields:

\`\`\`typescript
batch.update(taskDoc.ref, {
  state: FieldValue.delete(),
  stateHistory: FieldValue.delete(),
  assignedTo: FieldValue.delete(),
  assignedToName: FieldValue.delete(),
  assignedToPhotoURL: FieldValue.delete(),
  waitingOn: FieldValue.delete(),
  blockedTasks: FieldValue.delete(),
});
\`\`\`

## Testing

After migration:
1. Verify all tasks have `state` field
2. Check state badge displays correctly
3. Test state transitions
4. Verify state history is recorded
```

**Step 2: Commit migration guide**

```bash
git add docs/migrations/
git commit -m "docs: add migration guide for state fields"
```

---

### Task 21: Update README with New Features

**Files:**
- Modify: `README.md`

**Step 1: Add collaboration features section**

Add after the existing features:

```markdown
### Team Collaboration (NEW!)

Work together without the chaos:

- **State-driven task cards** → Visual workflow: Ready, In Progress, Waiting, Review, Done
- **Async coordination** → Mark tasks as blocked, hand off to teammates, track dependencies
- **Smart blocking indicators** → See who's waiting on you, prioritize unblocking teammates
- **Team momentum dashboard** → Visibility into team energy, activity, and blockers
- **Playful micro-interactions** → Delightful animations that make collaboration feel natural

**Built for small teams (2-10 people)** who want to stay coordinated without constant meetings.
```

**Step 2: Commit README update**

```bash
git add README.md
git commit -m "docs: add team collaboration features to README"
```

---

## Execution Checklist

Before starting implementation:
- [ ] All design documents reviewed and approved
- [ ] Worktree created and dependencies installed
- [ ] Baseline tests pass (typecheck and build)
- [ ] Migration plan documented

After each phase:
- [ ] Run `npm run typecheck` to verify no type errors
- [ ] Run `npm run build` to verify production build works
- [ ] Test new features in dev mode (`npm run dev`)
- [ ] Commit changes with descriptive message

Final verification:
- [ ] All phases completed
- [ ] Firestore rules deployed
- [ ] Migration script tested
- [ ] Documentation updated
- [ ] Ready for code review

---

## Next Steps

After implementation plan is approved:

1. **Execute Plan:** Use @superpowers:executing-plans or @superpowers:subagent-driven-development
2. **Code Review:** Use @superpowers:requesting-code-review after major milestones
3. **Testing:** Write integration tests for state transitions and team features
4. **Deployment:** Run migration script, deploy rules, merge to main
5. **Monitor:** Track state transition analytics, team adoption metrics

---

**Plan Status:** Ready for execution
**Estimated Effort:** 6-8 hours (spread across phases)
**Dependencies:** Framer Motion, existing Firebase setup
**Risk Level:** Low (incremental changes, backwards compatible)