# Workday Enhancements Design Document

**Date:** December 6, 2025
**Status:** Design Approved
**Architectural Approach:** Hybrid (Critical Data in Firestore, UI State Local)

---

## Overview

This design document covers eight major enhancements to the Momentum AI workday experience, focused on improving task focus, time tracking, user celebration, and reporting capabilities.

### Core Principles
- **Discourage context switching** - Keep users focused on one task at a time
- **Celebrate achievements** - Positive reinforcement for task completion
- **Track meaningful metrics** - Cumulative time tracking across sessions
- **Intentional work sessions** - Daily planning ritual via morning modal
- **Enhanced reporting** - Detailed tabular reports with AI summaries

---

## Requirements Summary

1. **Task Click Behavior** - Checkbox for completion, task body for focus
2. **Focus Lock & Time Tracking** - Prevent task switching, track cumulative time
3. **Completion Celebration** - Confetti animation + notes modal
4. **Audio Feedback** - Chimes for timer start/end
5. **Toast Notifications** - System feedback at top of screen
6. **Morning Planning Modal** - Daily ritual for workday start
7. **Ministry Management** - Optional description, add projects from list
8. **Enhanced Reports** - Table view with task details

---

## Architecture: Hybrid Approach

### Core Strategy
- **Firestore:** Focused task, workday start time, cumulative time, completion state
- **Client State:** Modal visibility, animations, audio playback, local timer ticks
- **Optimistic Updates:** Immediate UI response with Firestore sync

### Benefits
- Key data survives browser crashes/refreshes
- Reduced Firestore write operations (cost-effective)
- Smooth UX with optimistic updates
- Clean separation: persistence vs presentation

---

## Database Schema Changes

### 1. Modified: Tasks & Recurring Tasks Collections

```typescript
Task {
  // ... existing fields
  focusedTimeMs?: number; // NEW: Cumulative time spent in focus (milliseconds)
  lastFocusedAt?: string; // NEW: ISO timestamp - when task was last focused
}

RecurringTask {
  // ... existing fields
  focusedTimeMs?: number; // NEW
  lastFocusedAt?: string; // NEW
}
```

**Purpose:** Track total time spent across all focus sessions for each task.

---

### 2. Modified: Daily Reports Collection

```typescript
DailyReport {
  // ... existing fields
  workdayStartTime?: string; // NEW: ISO - set ONLY by morning modal
  workdayEndTime?: string; // EXISTING: Set by end day dialog
  currentFocusedTaskId?: string; // NEW: Currently focused task
  currentFocusedTaskType?: 'regular' | 'recurring'; // NEW
  focusStartedAt?: string; // NEW: ISO - when current focus began
  energyLevel?: EnergyLevel; // NEW: Set in morning modal
  dailyGoalsText?: string; // NEW: User's written goals from morning modal
}
```

**Purpose:** Track workday session state, focused task, and daily planning context.

---

### 3. Modified: Workday Tasks Collection

```typescript
WorkdayTask {
  // ... existing fields
  timeSpentMs?: number; // NEW: Time spent on this specific workday instance
  completedAt?: string; // NEW: ISO - when marked complete today
}
```

**Purpose:** Track time spent on task for this specific day (useful for daily reports).

---

### 4. New: User Preferences Collection

```typescript
users/{userId}/preferences/settings {
  timerChimesEnabled: boolean; // default: true
  notificationsEnabled: boolean; // default: true
  hasSeenMorningModal: string; // YYYY-MM-DD - resets daily at midnight
}
```

**Purpose:** Store user settings for audio/notifications and track morning modal display.

---

## Feature Designs

### Feature 1: Task Click Behavior

#### Current State
Any click on task toggles completion status.

#### New Behavior

**Click on Checkbox:**
- If incomplete → Mark complete (trigger celebration flow)
- If complete → Mark incomplete

**Click on Task Body (anywhere except checkbox):**
- If no focused task → Set this task as focused
- If this task is already focused → No action (already focused)
- If another task is focused and incomplete → Show blocking modal

**Blocking Modal:**
```
┌─────────────────────────────────────────┐
│  ⚠️  Active Task in Progress            │
│                                          │
│  Please complete your current task:     │
│  "{current focused task name}"          │
│                                          │
│  [Stay Focused]      [Force Switch]     │
└─────────────────────────────────────────┘
```

**On "Force Switch":**
1. Save accumulated time to previous task
2. Clear focus from previous task
3. Set new task as focused
4. Record context switch (optional analytics)

#### Implementation Location
- **Component:** `/src/components/workday/workday-tasks-card.tsx`
- **Add:** Click handlers for checkbox vs task body
- **Add:** Modal component for blocking dialog

---

### Feature 2: Focus Lock & Time Tracking

#### Time Tracking Flow

**When Task Becomes Focused:**
1. Update `DailyReport.currentFocusedTaskId`, `currentFocusedTaskType`, and `focusStartedAt`
2. Highlight task in UI (visual indicator)
3. Enable "Start Pomodoro" button
4. Start local interval timer (update every second)

**During Focus Session:**
- Local state tracks elapsed seconds (UI display only)
- No Firestore writes during active session
- On page refresh: Calculate elapsed time from `focusStartedAt`

**When Focus Ends (Switch or Complete):**
1. Calculate session time: `now - focusStartedAt`
2. Update task: `focusedTimeMs += sessionTime`
3. Update workday-task: `timeSpentMs += sessionTime`
4. Clear `DailyReport.currentFocusedTaskId` and `focusStartedAt`

**Cumulative Tracking:**
- Each focus session adds to `task.focusedTimeMs`
- Works across multiple days/sessions
- Total time persists even after task completion

#### Implementation Location
- **Context:** Extend `/src/components/dashboard/pomodoro-provider.tsx` or create new `FocusTrackingContext`
- **Functions:** Add time calculation utilities in `/src/lib/data-firestore.ts`
- **UI Updates:** Modify task cards to show cumulative time

---

### Feature 3: Completion Celebration

#### Trigger
User clicks checkbox on incomplete task.

#### Celebration Sequence

**1. Immediate UI Update (Optimistic)**
- Move task to "Completed" section
- Start confetti animation

**2. Confetti Animation**
- **Library:** `react-confetti` or `canvas-confetti`
- **Duration:** 3-4 seconds
- **Coverage:** Full screen viewport
- **Physics:** Particles fall from top with gravity
- **Cleanup:** Auto-remove after animation completes

**3. Completion Notes Modal**
```
┌─────────────────────────────────────────┐
│  🎉 Task Completed!                     │
│                                          │
│  "{task name}"                           │
│                                          │
│  Time Spent: {formatTime(timeSpentMs)}  │
│                                          │
│  Notes (optional):                       │
│  [Text area - for reflections/learnings]│
│                                          │
│  [Skip]                    [Save Notes]  │
└─────────────────────────────────────────┘
```

**4. On "Save Notes":**
- Save to `workday-tasks.notes`
- Update task completion in Firestore
- Close modal
- Play completion chime (if enabled)

**5. Background Updates:**
- Save `focusedTimeMs` to task
- Save `timeSpentMs` to workday-task
- Set `completedAt` timestamp
- Trigger momentum score calculation
- Clear focused task state

#### Implementation Location
- **Modal:** New component `/src/components/workday/task-completion-modal.tsx`
- **Confetti:** Add library and wrapper component
- **Integration:** Call from `workday-tasks-card.tsx` on checkbox click

---

### Feature 4: Audio Chimes

#### Implementation
- **Technology:** HTML5 Audio API
- **Storage:** `/public/sounds/`

#### Audio Files Needed
```typescript
{
  timerStart: '/sounds/timer-start.mp3',    // Gentle "begin" sound
  timerEnd: '/sounds/timer-end.mp3',        // Gentle "complete" bell
  taskComplete: '/sounds/task-complete.mp3' // Celebration sound
}
```

#### Trigger Points
1. **Timer Start:** User clicks start on Pomodoro timer
2. **Timer End:** Timer reaches 0:00 (focus or break)
3. **Task Complete:** Task marked complete (plays with confetti)

#### User Controls
- Setting in user preferences: `timerChimesEnabled`
- Respects browser autoplay policies
- Graceful fallback if audio blocked

#### Implementation Location
- **Hook:** Create `/src/hooks/use-audio.ts` for audio playback
- **Integration:** Call from Pomodoro component and task completion flow
- **Settings:** Add toggle in user preferences UI

---

### Feature 5: Toast Notifications

#### Library
`sonner` or `react-hot-toast` (lightweight, modern)

#### Notification Types
```typescript
{
  success: 'Task completed! Great work!',
  warning: 'Timer ended - time for a break!',
  info: 'Task added to today\'s workday',
  error: 'Failed to save task'
}
```

#### Key Use Cases
- Timer started/ended
- Task added to workday
- Workday started (morning modal)
- Context switch warnings
- Save errors/failures

#### Display Configuration
- **Position:** Top-center of screen
- **Duration:** 3-5 seconds
- **Dismissible:** Click to close
- **Max visible:** 3 at once (queue others)

#### Implementation Location
- **Provider:** Add toast provider to `/src/app/layout.tsx`
- **Usage:** Import and call throughout app where notifications needed

---

### Feature 6: Morning Planning Modal

#### Trigger
User navigates to `/workday` page AND `hasSeenMorningModal` date < today's date.

#### Modal Content
```
┌─────────────────────────────────────────┐
│  Welcome back, {userName}!              │
│  What would you like to work on today?  │
│                                          │
│  Energy Level: [Low] [Medium] [High]    │
│                                          │
│  Today's Goals:                          │
│  [Text area for goals]                   │
│                                          │
│  Tasks for Today:                        │
│  [Task selector - from weekly planner]   │
│  + Add more tasks                        │
│                                          │
│  [Cancel]              [Start Workday]   │
└─────────────────────────────────────────┘
```

#### Data Flow

**On Modal Open:**
1. Check if `hasSeenMorningModal` !== today's date
2. Load user name from profile
3. Query weekly planner for tasks matching today
4. Pre-populate task selector with suggestions

**On "Start Workday":**
1. Set `DailyReport.workdayStartTime` = current timestamp (ISO)
2. Set `DailyReport.energyLevel` = selected energy
3. Set `DailyReport.dailyGoalsText` = goals text
4. Add selected tasks to `workday-tasks` collection
5. Update `preferences.hasSeenMorningModal` = today's date
6. Close modal, show workday page

**Important:** This is the ONLY place `workdayStartTime` is set.

#### Weekly Planner Integration
- Query tasks from weekly planner collection
- Filter by day of week or date range
- Show as pre-selected suggestions
- User can deselect or add additional tasks

#### Implementation Location
- **Component:** New `/src/components/workday/morning-planning-modal.tsx`
- **Integration:** Add check in `/src/app/workday/client-page.tsx`
- **Data:** Add functions to `/src/lib/data-firestore.ts` for preferences and workday start

---

### Feature 7: Ministry Management Updates

#### 7A: Optional Description Field

**Current:** Description required when creating/editing ministry

**New:** Make description field optional

**Changes:**
- Update form validation schema (Zod/Yup) to make description optional
- Allow saving ministry with null/empty description
- Display placeholder in UI: "No description provided"

**Implementation Location:**
- **Dialog:** `/src/components/ministries/ministry-dialog.tsx`
- **Display:** `/src/app/ministries/[id]/client-page.tsx`

---

#### 7B: Add Projects to Ministry

**New Component:** Add Projects Dialog

**Location in UI:**
Ministry detail page → Projects tab → "Add Projects" button

**Dialog Content:**
```
┌─────────────────────────────────────────┐
│  Add Projects to {ministry name}        │
│                                          │
│  Available Projects:                     │
│  ☐ Project Alpha (No ministry)          │
│  ☐ Project Beta (Currently: Work)       │
│  ☐ Project Gamma (No ministry)          │
│                                          │
│  ℹ️ Adding a project will move it to    │
│     this ministry along with its tasks. │
│                                          │
│  [Cancel]              [Add Projects]    │
└─────────────────────────────────────────┘
```

**Data Flow:**

**Load Projects:**
- Query all projects where `ministryId != currentMinistryId`
- Show projects with no ministry first
- Show warning for projects already in another ministry

**On "Add Projects":**
1. For each selected project:
   - Update `project.ministryId = currentMinistryId`
   - Query all tasks where `task.projectId = project.id`
   - For each task: Update `task.ministryId = currentMinistryId`
2. Show success toast: "X projects and Y tasks added to ministry"
3. Refresh ministry projects/tasks view (real-time listeners handle this)

**Edge Cases:**
- Moving project automatically moves ALL its tasks
- Tasks without `projectId` are unaffected
- Show confirmation if moving project from another ministry

**Implementation Location:**
- **Component:** New `/src/components/ministries/add-projects-dialog.tsx`
- **Functions:** Add batch update function in `/src/lib/data-firestore.ts`
- **Integration:** Add button in ministry projects section

---

### Feature 8: Enhanced Reports with Table View

#### Current Behavior
- Shows AI-generated markdown report
- "Email Report" button sends email via Resend

#### New Behavior
- Show **table at top** with task breakdown
- Show **AI report below** table
- Change button: "Email Report" → "Generate Report"
- "Generate Report" displays table (no email)

#### Updated Report Layout

```
┌─────────────────────────────────────────────────────────┐
│  Daily Report - December 6, 2025                        │
│                                                          │
│  📅 Workday: 9:00 AM - 5:30 PM (8h 30m)                │
│  ✅ Completed: 7/10 tasks                               │
│                                                          │
│  ┌─────────────────────────────────────────────────┐   │
│  │ Task Breakdown                                   │   │
│  ├──────────┬────────┬──────────┬───────┬─────────┤   │
│  │ Task     │ Status │ Collab   │ Time  │ Notes   │   │
│  ├──────────┼────────┼──────────┼───────┼─────────┤   │
│  │ Design   │ ✅     │ Sarah    │ 2h 15m│ Good... │   │
│  │ API work │ ✅     │ -        │ 1h 30m│ Fixed...│   │
│  │ Testing  │ ❌     │ Team     │ 45m   │ -       │   │
│  └──────────┴────────┴──────────┴───────┴─────────┘   │
│                                                          │
│  AI Summary:                                             │
│  [Existing AI-generated markdown report appears here]   │
│                                                          │
│  [Generate Report]                                       │
└─────────────────────────────────────────────────────────┘
```

#### Table Schema

**Columns:**
1. **Task** - Task name (truncate if > 50 chars, tooltip on hover)
2. **Status** - ✅ Completed or ❌ Incomplete
3. **Collaboration** - From `task.collaboration` field (show "-" if empty)
4. **Time Spent** - Format: `Xh Ym` from `workday-tasks.timeSpentMs`
5. **Notes** - From `workday-tasks.notes` (truncate at 50 chars, click to expand)

**Header Section (above table):**
- **Workday Start:** Format `DailyReport.workdayStartTime` as "h:mm A"
- **Workday End:** Format `DailyReport.workdayEndTime` as "h:mm A"
- **Duration:** Calculate `endTime - startTime` as "Xh Ym"

#### Data Loading

```typescript
// For selected report date
const report = DailyReport[selectedDate];
const workdayTasks = WorkdayTasks.filter(date === selectedDate);

// For each workday task
const taskDetails = await getTask(workdayTask.taskId, workdayTask.taskType);

// Build table rows
const tableData = workdayTasks.map(wt => ({
  taskName: taskDetails.name,
  status: taskDetails.completed,
  collaboration: taskDetails.collaboration || '-',
  timeSpent: formatTime(wt.timeSpentMs),
  notes: wt.notes || '-'
}));
```

#### Time Formatting Utility

```typescript
function formatTime(milliseconds: number): string {
  const totalMinutes = Math.floor(milliseconds / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) return `${minutes}m`;
  return `${hours}h ${minutes}m`;
}
```

#### "Generate Report" Button

**New Behavior:**
1. Button text: "Generate Report" (changed from "Email Report")
2. On click: Render table with loaded data (no API call needed)
3. Table appears above existing AI summary
4. Optional: Add "Download PDF" or "Copy Table" for future

**Remove:**
- Email preview dialog
- Email sending functionality
- Resend API integration (can add back as separate button later)

#### Implementation Location
- **Component:** Modify `/src/components/reports/visual-report-card.tsx`
- **Table Component:** New `/src/components/reports/report-table.tsx`
- **Utilities:** Add time formatting to `/src/lib/utils.ts`

---

## Implementation Checklist

### Phase 1: Database & Infrastructure
- [ ] Add new fields to Task and RecurringTask collections
- [ ] Add new fields to DailyReport collection
- [ ] Add new fields to WorkdayTask collection
- [ ] Create UserPreferences collection
- [ ] Add database migration/update functions
- [ ] Add time formatting utilities

### Phase 2: Core Task Management
- [ ] Modify task click handlers (checkbox vs body)
- [ ] Implement focus lock modal
- [ ] Add focus tracking state management
- [ ] Implement cumulative time tracking logic
- [ ] Update task card UI to show focused state
- [ ] Add time display to task cards

### Phase 3: Celebration & Feedback
- [ ] Install confetti library
- [ ] Create task completion modal component
- [ ] Integrate confetti with completion flow
- [ ] Add audio files to /public/sounds/
- [ ] Create audio playback hook
- [ ] Install and configure toast notification library
- [ ] Add toast notifications throughout app

### Phase 4: Morning Planning
- [ ] Create morning planning modal component
- [ ] Integrate with weekly planner queries
- [ ] Add modal trigger logic to workday page
- [ ] Implement workday start time setting
- [ ] Add user preferences UI for hasSeenMorningModal

### Phase 5: Ministry Updates
- [ ] Make description field optional in ministry dialog
- [ ] Create add projects dialog component
- [ ] Implement project + tasks batch update function
- [ ] Add button to ministry projects section
- [ ] Test project/task migration flow

### Phase 6: Reports Enhancement
- [ ] Create report table component
- [ ] Update visual report card layout
- [ ] Modify "Email Report" button text and behavior
- [ ] Add time spent column with formatting
- [ ] Add workday start/end header display
- [ ] Remove email sending flow (optional: keep for future)

### Phase 7: Testing & Polish
- [ ] Test focus lock prevents context switching
- [ ] Verify time tracking persists across sessions
- [ ] Test confetti animation performance
- [ ] Verify audio chimes work (and respect settings)
- [ ] Test morning modal resets daily
- [ ] Verify project migration moves all tasks
- [ ] Test report table with various data scenarios

---

## Technical Considerations

### Performance
- **Time Tracking:** Use local intervals, sync to Firestore on focus change only
- **Confetti:** Cleanup animation after completion to prevent memory leaks
- **Real-time Listeners:** Existing architecture already handles this well

### Error Handling
- **Optimistic Updates:** Roll back on Firestore write failure
- **Audio Playback:** Graceful fallback if browser blocks autoplay
- **Modal State:** Ensure modals can be dismissed/escaped

### Browser Compatibility
- **Audio API:** Test across browsers (should work everywhere modern)
- **Confetti:** Canvas-based, widely supported
- **LocalStorage:** Used by Pomodoro, already working

### Data Migration
- **Existing Tasks:** New fields are optional, existing tasks continue to work
- **DailyReports:** New fields are optional, historical reports unaffected
- **No breaking changes:** All additions are additive

---

## Success Metrics

### User Behavior
- **Focus Time:** Average time on single task before switching
- **Context Switches:** Number of force-switches per day (should decrease)
- **Completion Rate:** % of focused tasks that get completed
- **Morning Modal Usage:** % of days user completes morning planning

### Technical Metrics
- **Time Tracking Accuracy:** Verify cumulative time matches reality
- **Firestore Writes:** Should be minimal (only on focus change/completion)
- **Animation Performance:** Confetti should not cause lag
- **Audio Success Rate:** % of times audio plays successfully

---

## Future Enhancements

### Potential Additions
- **Focus Insights:** Weekly report on focus patterns and context switches
- **Time Estimates:** Let users estimate task time, compare to actual
- **Break Reminders:** Suggest breaks after extended focus sessions
- **Focus Streaks:** Track consecutive days of deep focus work
- **Export Reports:** PDF/CSV export of daily reports
- **Email Reports:** Re-add as optional feature with table in email

### Integration Opportunities
- **Calendar Integration:** Sync workday start/end with calendar events
- **Pomodoro Stats:** Track completed pomodoros per task
- **Team Features:** Share focus time/completed tasks with team
- **AI Insights:** Suggest optimal task order based on energy/time patterns

---

## Appendix: Key File Locations

### New Files
- `/src/components/workday/task-completion-modal.tsx`
- `/src/components/workday/morning-planning-modal.tsx`
- `/src/components/workday/focus-lock-modal.tsx`
- `/src/components/ministries/add-projects-dialog.tsx`
- `/src/components/reports/report-table.tsx`
- `/src/hooks/use-audio.ts`
- `/src/hooks/use-focus-tracking.ts` (or extend pomodoro-provider)
- `/public/sounds/timer-start.mp3`
- `/public/sounds/timer-end.mp3`
- `/public/sounds/task-complete.mp3`

### Modified Files
- `/src/components/workday/workday-tasks-card.tsx`
- `/src/components/dashboard/pomodoro.tsx`
- `/src/components/dashboard/pomodoro-provider.tsx`
- `/src/components/ministries/ministry-dialog.tsx`
- `/src/components/reports/visual-report-card.tsx`
- `/src/app/workday/client-page.tsx`
- `/src/lib/types.ts`
- `/src/lib/data-firestore.ts`
- `/src/lib/utils.ts`

### Collections Modified
- `users/{userId}/tasks`
- `users/{userId}/recurring-tasks`
- `users/{userId}/daily-reports`
- `users/{userId}/workday-tasks`
- `users/{userId}/preferences` (new)

---

## End of Design Document

**Next Steps:** Proceed to implementation planning phase.
