# Priority Focus System - Migration Guide

## Overview
This document outlines the migration from Pomodoro technique to the Priority Focus System.

## ✅ Completed (Phase 1)

### 1. Data Model Updates
- ✅ Added `FocusSession` type for tracking work sessions
- ✅ Extended `Task` interface with:
  - Subtask support (`parentTaskId`, `subtaskIds`, `isSubtask`, `subtaskOrder`)
  - Priority calculation (`autoCalculatedPriority`, `manualPriorityOverride`)
  - Enhanced focus tracking (`currentFocusStartTime`, `focusSessions`, `lastBreakReminderAt`)

### 2. Priority System (`src/lib/priority-system.ts`)
- ✅ Implemented priority calculation algorithm (0-100 score)
- ✅ Four priority factors:
  - Eisenhower Matrix (0-40 points)
  - Deadline proximity (0-30 points)
  - Energy level matching (0-20 points)
  - Task dependencies (0-10 points)
- ✅ Utility functions:
  - `calculateTaskPriority()`
  - `sortTasksByPriority()`
  - `getNextRecommendedTask()`
  - `getPriorityLabel()` and `getPriorityColor()`

### 3. Components Created

#### CurrentFocus Component (`src/components/dashboard/current-focus.tsx`)
Replaces Pomodoro timer with:
- Single task focus display
- Subtask progress visualization
- Time tracking without timer display
- Actions: Start/Pause, Complete, Break Down, Next Task
- Priority badge display

#### FocusProvider (`src/components/dashboard/focus-provider.tsx`)
Replaces PomodoroProvider with:
- Focus state management
- Time tracking without forced intervals
- LocalStorage persistence
- Returns FocusSession objects for history
- Custom `useFocus()` hook

#### TaskBreakdownDialog (`src/components/dashboard/task-breakdown-dialog.tsx`)
AI-powered task breakdown:
- Uses Gemini AI to suggest 3-6 subtasks
- Shows AI reasoning for breakdown approach
- Editable subtask details (name, description, energy level)
- Manual add/remove subtasks

#### FocusModeView (`src/components/dashboard/focus-mode-view.tsx`)
Distraction-free focus mode:
- Full-screen, centered layout
- Shows only current task and controls
- Minimal UI with subtle animations
- ESC to exit

### 4. AI Flow
- ✅ `suggestTaskBreakdown` flow (`src/ai/flows/suggest-task-breakdown.ts`)
  - Analyzes task context
  - Suggests logical subtasks with sequence
  - Estimates energy per subtask
  - Provides breakdown reasoning

### 5. Hooks
- ✅ `useBreakReminder` (`src/hooks/use-break-reminder.ts`)
  - Soft break reminders (default: 90 minutes)
  - Toast notifications (not blocking)
  - Configurable intervals
  - Auto-reset when paused

---

## 🔄 Remaining Work (Phase 2)

### 1. Update WorkdayClientPage
**File:** `src/app/workday/client-page.tsx`

**Changes needed:**
```typescript
// REMOVE
import { Pomodoro } from '@/components/dashboard/pomodoro';
import { PomodoroContext } from '@/components/dashboard/pomodoro-provider';

// ADD
import { CurrentFocus } from '@/components/dashboard/current-focus';
import { FocusModeView } from '@/components/dashboard/focus-mode-view';
import { TaskBreakdownDialog } from '@/components/dashboard/task-breakdown-dialog';
import { useFocus } from '@/components/dashboard/focus-provider';
import { useBreakReminder } from '@/hooks/use-break-reminder';
import { getNextRecommendedTask } from '@/lib/priority-system';

// Replace Pomodoro component with CurrentFocus
// Add FocusModeView toggle
// Integrate TaskBreakdownDialog
// Add break reminder integration
```

### 2. Update App Layout
**File:** `src/app/layout.tsx`

**Changes needed:**
```typescript
// REMOVE
import { PomodoroProvider } from '@/components/dashboard/pomodoro-provider';

// ADD
import { FocusProvider } from '@/components/dashboard/focus-provider';

// Replace <PomodoroProvider> with <FocusProvider>
```

### 3. Remove Pomodoro Components
**Files to delete:**
- `src/components/dashboard/pomodoro.tsx`
- `src/components/dashboard/pomodoro-provider.tsx`

**Files to update (remove Pomodoro references):**
- `src/app/dashboard/task-list.tsx`
- `src/components/dashboard/task-list.tsx`
- `src/components/music/global-music-player.tsx`
- `src/components/onboarding/welcome-dialog.tsx`
- `src/components/workday/workday-tasks-card.tsx`

**Search for:**
```bash
grep -r "pomodoro\|Pomodoro" src/
```

### 4. Update Data Layer (`src/lib/data-firestore.ts`)

**Add functions:**
```typescript
// Add subtask to a parent task
export async function addSubtask(
  db: Firestore,
  userId: string,
  parentTaskId: string,
  subtaskData: Omit<Task, 'id' | 'completed' | 'completedAt' | 'createdAt' | 'userId'>
): Promise<Task>

// Get subtasks for a parent task
export async function getSubtasks(
  db: Firestore,
  userId: string,
  parentTaskId: string
): Promise<Task[]>

// Update task priority
export async function updateTaskPriority(
  db: Firestore,
  userId: string,
  taskId: string,
  priority: number
): Promise<void>

// Start focus session
export async function startFocusSession(
  db: Firestore,
  userId: string,
  taskId: string
): Promise<void>

// End focus session and save to history
export async function endFocusSession(
  db: Firestore,
  userId: string,
  taskId: string,
  session: FocusSession
): Promise<void>
```

### 5. Update Task List to Show Subtasks
**File:** `src/components/dashboard/task-list.tsx` or similar

**Changes needed:**
- Show subtasks indented under parent tasks
- Show subtask progress indicator
- Collapse/expand subtasks
- Filter to show only parent tasks by default

**UI Structure:**
```
□ Parent Task (3/5 subtasks) ▼
  ✓ Subtask 1
  ✓ Subtask 2
  ✓ Subtask 3
  □ Subtask 4
  □ Subtask 5
```

### 6. Add Priority Queue to Dashboard
**Suggested location:** New component or update existing task list

**Features:**
- Sort tasks by `autoCalculatedPriority`
- Show priority badges (Critical/High/Medium/Low)
- Visual priority indicators
- "Next Recommended" task highlighted
- Energy level filtering

### 7. Update Firestore Rules
**File:** `firestore.rules`

**Add validation for new fields:**
```javascript
// Validate subtask relationships
match /users/{userId}/tasks/{taskId} {
  allow write: if request.resource.data.parentTaskId == null
    || exists(/databases/$(database)/documents/users/$(userId)/tasks/$(request.resource.data.parentTaskId));
}
```

### 8. Database Migration
**Create migration script to:**
- Add default values for new required fields:
  - `isSubtask: false`
  - `focusSessions: []`
  - `autoCalculatedPriority: 50`
- Calculate initial priorities for existing tasks
- Preserve existing `focusedTimeMs` data

### 9. Testing
- Test subtask creation and management
- Test priority calculations
- Test focus session tracking
- Test break reminders
- Test Focus Mode view
- Test task completion with subtasks
- Test localStorage persistence

---

## 📋 Implementation Checklist

- [ ] Update WorkdayClientPage
- [ ] Update App Layout (replace PomodoroProvider)
- [ ] Remove Pomodoro components
- [ ] Update data-firestore.ts with subtask functions
- [ ] Update task list to show subtasks
- [ ] Add priority queue to dashboard
- [ ] Update Firestore rules
- [ ] Create database migration script
- [ ] Test all functionality
- [ ] Update documentation
- [ ] Remove Pomodoro-related tests
- [ ] Add new tests for Priority Focus System

---

## 🎯 Key Benefits

1. **Single Task Focus**: No more context switching between timed intervals
2. **Smart Prioritization**: Auto-calculated priorities based on multiple factors
3. **Task Breakdown**: AI-powered suggestions to make large tasks manageable
4. **Flexible Time Tracking**: Track time without rigid 25-minute blocks
5. **Soft Reminders**: Gentle break suggestions, not forced interruptions
6. **Focus Mode**: Distraction-free view for deep work
7. **Progress Visualization**: See subtask completion progress

---

## 🚀 Next Steps

1. Complete Phase 2 implementation
2. Test thoroughly with real tasks
3. Deploy to staging
4. User feedback and iteration
5. Production deployment

---

## Notes

- All Phase 1 code is committed and ready to use
- Data model is backward compatible (new fields are optional)
- Can be deployed incrementally
- Old Pomodoro data (focusedTimeMs) is preserved
