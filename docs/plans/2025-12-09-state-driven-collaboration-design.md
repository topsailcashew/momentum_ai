# State-Driven Task Cards with Team Collaboration Design

**Date:** 2025-12-09
**Status:** Design Approved
**Goal:** Add async team collaboration with playful micro-interactions while maintaining Pace Pilot's focus-first philosophy

---

## Overview

This design introduces **state-driven task cards** that enable small team collaboration (2-10 people) through async coordination patterns (hand-offs, blocking dependencies, waiting states). The implementation prioritizes:

- **Playful micro-interactions** (Stripe/Linear-style delightful animations)
- **Progressive complexity** (power features always available, visually secondary)
- **Individual focus preserved** (collaboration is opt-in, doesn't clutter solo use)
- **Mobile-first responsive design**
- **Full accessibility support**

---

## Part 1: Task State Machine & Core Architecture

### State Machine Design

**Task States:**
```typescript
type TaskState =
  | 'ready'        // Ready to work on (default)
  | 'in_progress'  // Currently being worked on
  | 'waiting'      // Blocked, waiting on someone/something
  | 'review'       // Ready for review/feedback
  | 'done'         // Completed
```

**State Transitions (Valid Flows):**
```
ready → in_progress → done
ready → waiting → ready → in_progress → done
in_progress → waiting → in_progress → done
in_progress → review → in_progress → done
review → done
```

**Key Rules:**
- Any state can move to `waiting` (except `done`)
- `waiting` always returns to previous state when unblocked
- Only `in_progress` and `review` can move directly to `done`
- Completing a task (checkbox) auto-sets state to `done`

### Data Model Updates

**Firestore Schema Changes:**

```typescript
interface Task {
  // ... existing fields ...

  // NEW FIELDS
  state: TaskState;
  stateHistory: StateHistoryEntry[];

  // Enhanced collaboration fields
  assignedTo?: string; // User ID
  assignedToName?: string; // Cached display name
  assignedToPhotoURL?: string; // Cached avatar

  waitingOn?: {
    userId: string;
    userName: string;
    userPhotoURL?: string;
    reason: string; // "What do you need?"
    blockedAt: Timestamp;
  };

  blockedTasks?: string[]; // Task IDs that are waiting on this one
}

interface StateHistoryEntry {
  state: TaskState;
  timestamp: Timestamp;
  changedBy: string; // User ID
  note?: string; // Optional context
}
```

**New Firestore Collections:**

```typescript
// users/{userId}/teams/{teamId}
interface Team {
  id: string;
  name: string;
  createdBy: string;
  createdAt: Timestamp;
  members: TeamMember[];
}

interface TeamMember {
  userId: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: 'owner' | 'member';
  joinedAt: Timestamp;
  currentEnergy?: 'low' | 'medium' | 'high'; // Shared if enabled
  isActive?: boolean; // Online in last 5 minutes
}
```

**Real-time Listeners:**
- Listen to tasks where `waitingOn.userId === currentUser.id` → Show "Someone needs you" notifications
- Listen to tasks where `assignedTo === currentUser.id` → Show in "Assigned to Me" filter
- Listen to `blockedTasks` array → Notify when blocker is resolved

---

## Part 2: Task Card UI & Visual Design

### State Badge Component

**Visual Design:**

```
┌─────────────────────────────────────┐
│ □  Fix authentication bug     [🟢]  │  ← State badge (top-right)
│    Priority: High                   │
│    👤 Sarah                         │  ← Assignee (if assigned)
│    ⏸️ Waiting on Tom               │  ← Waiting indicator (if blocked)
├─────────────────────────────────────┤
│ [View Details] [···]                │
└─────────────────────────────────────┘
```

**State Badge Colors & Icons:**
- `ready`: 🟢 Green circle - "Ready" - Default, subtle
- `in_progress`: 🔵 Blue pulse - "In Progress" - Animated pulse effect
- `waiting`: 🟡 Yellow pause - "Waiting" - Gentle breathing animation
- `review`: 🟣 Purple eye - "Review" - Subtle shimmer
- `done`: ⚪ Gray check - "Done" - Static

**Badge Interactions:**
- **Hover**: Badge scales to 1.1x, shows tooltip with state name
- **Click**: Dropdown opens with state transition options (only valid next states)
- **Always visible**: Badge is always present, but small and unobtrusive

### State Transition Dropdown

**When clicking state badge:**

```
┌────────────────────────┐
│ Change State           │
├────────────────────────┤
│ ▶ Start Working        │ ← in_progress (if ready)
│ ⏸️ Mark as Waiting     │ ← waiting (from any state)
│ 👁️ Send for Review     │ ← review (if in_progress)
│ ✓ Complete             │ ← done (if in_progress/review)
└────────────────────────┘
```

**Micro-interactions on selection:**
1. **Card flip animation** (3D transform, 300ms)
2. Badge color transitions smoothly
3. If selecting "Waiting" → Opens waiting dialog
4. If selecting "Review" → Opens review dialog
5. Haptic feedback (if supported)

### Waiting Dialog

**Opens when user selects "Mark as Waiting":**

```
┌──────────────────────────────────────┐
│  ⏸️ Who are you waiting for?         │
├──────────────────────────────────────┤
│  👥 Select Team Member               │
│  ┌────────────────────────────────┐ │
│  │ 🔍 Search teammates...         │ │
│  └────────────────────────────────┘ │
│                                      │
│  📝 What do you need?                │
│  ┌────────────────────────────────┐ │
│  │ e.g., "Need design mockups"    │ │
│  │                                │ │
│  └────────────────────────────────┘ │
│                                      │
│     [Cancel]  [Mark as Waiting]      │
└──────────────────────────────────────┘
```

**On submit:**
- Card "tosses" to assignee with arc animation (400ms)
- Small confetti burst on assignee avatar
- Notification sent to team member
- Card gets yellow badge + "⏸️ Waiting on {Name}" indicator

### Card State Indicators

**Visual overlays based on state:**

**In Progress:**
- Subtle blue glow on left border
- Pulsing animation (2s loop, subtle)
- Shows focus timer if active

**Waiting:**
- Yellow left border
- Shows avatar of person you're waiting for
- Displays reason below task title
- Gentle "breathing" animation (3s loop)

**Review:**
- Purple left border
- Shows "👁️ Ready for review" label
- Shimmer effect on hover

---

## Part 3: Micro-interactions & Animation Details

### Card Flip Animation (State Change)

**Implementation:**
```typescript
// 3D card flip on state transition
animation: flip-card 300ms ease-out

@keyframes flip-card {
  0% { transform: rotateY(0deg); }
  50% { transform: rotateY(90deg); opacity: 0.5; }
  100% { transform: rotateY(0deg); }
}
```

**Timing:**
1. User clicks state → Card flips (front disappears)
2. At 50% (card is edge-on) → State changes
3. Card flips back showing new state
4. Badge color cross-fades smoothly

### Task Toss Animation (Assignment)

**When assigning or marking "waiting on" someone:**

```typescript
// Arc trajectory from current position to assignee avatar
1. Card lifts with shadow increase (50ms)
2. Bezier curve path to target (400ms)
3. Small bounce on landing (100ms)
4. Micro confetti burst (8-12 particles, 500ms)
5. Card returns to list position with fade-in
```

**Visual details:**
- Card scales down to 0.7x during flight
- Rotation follows trajectory (slight tilt)
- Shadow expands/contracts with height
- Assignee avatar pulses on impact

### Unblocking Celebration

**When blocker task completes:**

```typescript
// For each task waiting on this one:
1. Yellow badge → Green badge (smooth color transition)
2. "⏸️ Waiting" indicator fades out
3. "🎉 Unblocked!" toast appears briefly
4. Card bounces once (playful spring physics)
5. Push notification if user is offline
```

**Notification copy:**
- "🎉 Good news! Tom finished 'API integration' - you're unblocked!"
- Click → Navigate to task

### State Badge Pulse (In Progress)

**Subtle attention indicator:**

```typescript
// Only for in_progress state
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
animation: pulse-badge 2s ease-in-out infinite
```

### Waiting Indicator Breathing

**Gentle, calming animation:**

```typescript
@keyframes breathe {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.6; transform: scale(0.98); }
}
animation: breathe 3s ease-in-out infinite
```

### Drag-to-Assign Interaction

**Advanced power user feature (always available, visually secondary):**

1. Hold and drag task card
2. Hover over team member in sidebar/header
3. Avatar grows and glows (magnetic attraction)
4. Release → Assignment dialog pre-filled
5. Elastic snap-back if canceled

---

## Part 4: Team Collaboration Features

### Team Member Management

**Team Setup Flow:**

1. **Settings → Teams** (new section)
2. "Create Team" button
3. Enter team name → Invite by email
4. Email invite with accept link
5. Invited user creates account → Auto-joins team

**Team Selector:**
- Header dropdown: "Personal" | "Team: [Name]"
- Switch context → Filters all views to team tasks
- Personal tasks always private unless explicitly assigned

### Assignment UI Component

**Team Member Picker:**

```
┌────────────────────────────────┐
│ 👥 Assign to...                │
├────────────────────────────────┤
│ 🔍 Search team members...      │
├────────────────────────────────┤
│ ● Sarah Chen                   │ ← Green dot = active
│   🔵 In Progress (2 tasks)     │ ← Current workload
│   ⚡ High energy                │ ← Shared energy level
│                                │
│ ○ Tom Reeves                   │ ← Gray = offline
│   🟢 Ready (0 tasks)           │
│   🔋 Medium energy             │
│                                │
│ ● Alex Kim                     │
│   🟡 Waiting (1 task)          │
│   💤 Low energy                │
└────────────────────────────────┘
```

**Smart Suggestions:**
- Sort by: least busy → most available
- Show energy level for smart matching
- Highlight if person has relevant skills (from past assignments)

### Blocking Relationships

**When Task A is waiting on Task B:**

```
Task A (Waiting)
├─ Shows: "⏸️ Waiting on Tom to complete 'API Setup'"
├─ Click link → Navigates to Task B
└─ Updates automatically when Task B completes

Task B (In Progress)
├─ Shows: "⚠️ 1 person waiting" badge
├─ Click badge → See all blocked tasks
└─ Complete → Triggers unblock celebration for Task A
```

**Visual Indicator on Blocker Task:**
- Small orange badge: "⚠️ 2" (number of blocked tasks)
- Hover → Tooltip: "Sarah & Tom are waiting on this"
- Creates gentle pressure to prioritize

### Notification System Enhancements

**New Notification Types:**

1. **Task Assigned to You:**
   - "👤 Sarah assigned you 'Fix login bug'"
   - Click → Navigate to task

2. **Someone Waiting on You:**
   - "⏸️ Tom needs your help on 'Design review' - Reason: Need mockups"
   - Click → Navigate to blocker task

3. **You're Unblocked:**
   - "🎉 Sarah completed 'API setup' - You can now work on 'Frontend integration'!"
   - Click → Navigate to unblocked task

4. **Task Moved to Review:**
   - "👁️ Tom sent 'User dashboard' for your review"
   - Click → Navigate to task

**Notification Priority:**
- 🔴 High: Someone waiting on you (you're blocking)
- 🟡 Medium: Task assigned to you
- 🟢 Low: You're unblocked, review requests

**Email Digest (Optional):**
- Daily summary at 9 AM: "You have 2 tasks waiting, 1 person blocked by you"

---

## Part 5: Team Views & Filtering

### Team Momentum Dashboard (New Page)

**Route:** `/team` (new sidebar link when team context active)

**Layout:**

```
┌─────────────────────────────────────────────────────┐
│  Team Momentum                                      │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Team Energy  ⚡ 2 High  🔋 3 Medium  💤 1 Low     │
│                                                     │
│  ┌───────────────┬───────────────┬───────────────┐ │
│  │ Sarah Chen    │ Tom Reeves    │ Alex Kim      │ │
│  │ ● Online      │ ○ Offline     │ ● Online      │ │
│  │ ⚡ High       │ 🔋 Medium     │ 💤 Low        │ │
│  │               │               │               │ │
│  │ 🔵 In Progress│ 🟢 Ready      │ 🟡 Waiting    │ │
│  │ 2 tasks       │ 0 tasks       │ 1 task        │ │
│  │               │               │               │ │
│  │ ⚠️ Blocking 1 │               │               │ │
│  └───────────────┴───────────────┴───────────────┘ │
│                                                     │
│  Blockers & Hand-offs                              │
│  ┌─────────────────────────────────────────────┐   │
│  │ ⏸️ "Frontend integration" (Sarah)           │   │
│  │    Waiting on Tom → "API setup"             │   │
│  │    [View Task] [Nudge Tom]                  │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  Team Activity Feed                                │
│  ┌─────────────────────────────────────────────┐   │
│  │ 🎉 Tom completed "API setup"          2m ago│   │
│  │ 👁️ Sarah sent "Dashboard" for review  15m   │   │
│  │ ⏸️ Alex is waiting on Tom             1h    │   │
│  └─────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

**Real-time Updates:**
- Member cards pulse when state changes
- Activity feed auto-scrolls new items
- Energy levels update in real-time
- "Nudge" button sends gentle reminder notification

### Enhanced Task Filtering

**New Filter Options (all task lists):**

**Assignment Filters:**
- ✅ **My Tasks** (default solo view)
- 👥 **Assigned to Me** (tasks others gave you)
- 📤 **Assigned by Me** (tasks you delegated)
- 🌐 **Team Tasks** (all shared tasks)
- 👤 **Unassigned** (team tasks without owner)

**State Filters:**
- 🟢 **Ready** (available to start)
- 🔵 **In Progress** (being worked on)
- 🟡 **Waiting** (blocked)
- 🟣 **Review** (ready for feedback)
- ✓ **Done** (completed)

**Blocker Filters:**
- ⚠️ **Blocking Others** (people waiting on you - high priority!)
- ⏸️ **Blocked by Others** (you're waiting)
- 🆓 **No Dependencies** (independent tasks)

**Filter UI Component:**

```
┌──────────────────────────────────────┐
│ 🔍 Filter Tasks                      │
├──────────────────────────────────────┤
│ Assignment                           │
│ [x] My Tasks  [ ] Assigned to Me     │
│                                      │
│ State                                │
│ [ ] Ready  [x] In Progress  [ ] ...  │
│                                      │
│ Dependencies                         │
│ [x] Blocking Others  [ ] Blocked     │
└──────────────────────────────────────┘
```

**Smart Filter Badges:**
- Shows active filter count: "Filters (3)"
- Quick-clear: "Clear all"
- Save filter views (future enhancement)

### Workday Page Enhancements

**When in Team Context:**

**New Section: "Waiting on Me"**
```
┌─────────────────────────────────────┐
│ ⚠️ People Waiting on You (2)        │ ← Priority alert section
├─────────────────────────────────────┤
│ "API Setup" → Blocking Sarah        │
│ "Design Review" → Blocking Tom      │
└─────────────────────────────────────┘
```

**This section appears above your regular workday tasks when:**
- Someone marks task as "waiting on you"
- Visual priority: Red/orange accent
- Gentle animation to draw attention

---

## Part 6: Keyboard Shortcuts & Power User Features

### Global Keyboard Shortcuts

**Always available, visually secondary - shown in tooltips and help panel**

**Navigation:**
- `G` then `W` → Go to Workday
- `G` then `T` → Go to Team
- `G` then `D` → Go to Dashboard
- `G` then `P` → Go to Projects
- `/` → Focus search bar
- `Esc` → Close dialogs/dropdowns

**Task Actions (when task focused):**
- `A` → Assign to...
- `W` → Mark as waiting
- `R` → Send for review
- `Enter` → Complete task
- `E` → Edit task details
- `D` → Delete task
- `↑`/`↓` → Navigate between tasks
- `Space` → Toggle task checkbox

**Quick Create:**
- `C` → Create new task
- `Shift + C` → Create task in specific project (opens dialog)

**State Changes:**
- `1` → Set to Ready
- `2` → Set to In Progress
- `3` → Set to Waiting
- `4` → Set to Review
- `5` → Mark as Done

### Keyboard Shortcut Help Panel

**Trigger:** Press `?` anywhere

```
┌──────────────────────────────────────────┐
│ ⌨️ Keyboard Shortcuts                    │
├──────────────────────────────────────────┤
│ Navigation                               │
│ G W          Go to Workday               │
│ G T          Go to Team                  │
│ /            Search                      │
│                                          │
│ Task Actions                             │
│ A            Assign to...                │
│ W            Mark as waiting             │
│ R            Send for review             │
│ Enter        Complete                    │
│                                          │
│ Quick States                             │
│ 1-5          Change state                │
│                                          │
│ [Close]                                  │
└──────────────────────────────────────────┘
```

**Display:**
- Floating modal, semi-transparent background
- Grouped by category
- Shows keyboard icon + action
- Press `?` again or `Esc` to close

### Task Focus Mode

**Power user feature for deep work:**

**Trigger:** Click task → Press `F` (or "Focus" button)

**Behavior:**
1. Task expands to full-screen modal
2. Shows only task details, no distractions
3. Integrated Pomodoro timer
4. Music player controls
5. Notes section for thoughts
6. `Esc` to exit

**Layout:**
```
┌─────────────────────────────────────────┐
│                                         │
│         Fix Authentication Bug          │
│         Priority: High                  │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │     Pomodoro: 23:45               │  │
│  │     [■ Stop]  [⏭ Skip]           │  │
│  └───────────────────────────────────┘  │
│                                         │
│  Description:                           │
│  Users can't login with Google OAuth    │
│                                         │
│  🎵 Lo-fi playing...  [⏸]             │
│                                         │
│  Notes:                                 │
│  ┌───────────────────────────────────┐  │
│  │ Discovered the issue is with...   │  │
│  │                                   │  │
│  └───────────────────────────────────┘  │
│                                         │
│  [✓ Complete Task]        [Esc] Exit   │
└─────────────────────────────────────────┘
```

### Drag & Drop Enhancements

**Power features, always available:**

**Drag Task to:**
- **Team Member Avatar** → Assign to that person
- **Date in Weekly Planner** → Set deadline
- **Project Card** → Move to project
- **State Badge** → Change state (with visual preview)

**Visual Feedback:**
- Drop zones glow when valid target
- Invalid targets fade out
- Ghost card follows cursor
- Elastic snap animation on drop

### Bulk Actions

**Select multiple tasks:**
- `Shift + Click` → Select range
- `Cmd/Ctrl + Click` → Toggle individual selection
- `Cmd/Ctrl + A` → Select all visible

**Bulk Action Menu (appears when tasks selected):**
```
┌────────────────────────────────┐
│ 3 tasks selected               │
│ [Assign] [Change State] [Delete]│
└────────────────────────────────┘
```

**Bulk State Change:**
- Select multiple → Press `W` → All marked waiting (with shared reason)
- Select multiple → Press `R` → All sent for review

### Smart Task Suggestions (AI Enhancement)

**When user is idle on workday:**

After 30 seconds of no interaction, subtle suggestion appears:

```
┌────────────────────────────────────┐
│ 💡 Suggestion                      │
├────────────────────────────────────┤
│ You have high energy right now     │
│ and 2 people are waiting on you.   │
│                                    │
│ Focus on "API Setup"?              │
│ [Start Focus Session] [Dismiss]    │
└────────────────────────────────────┘
```

**Suggestion Logic:**
- Prioritize tasks blocking others
- Match energy level to task priority
- Consider task dependencies
- Learn from user patterns

---

## Part 7: Mobile Experience & Responsive Design

### Mobile-First State Management

**Task Card on Mobile:**

```
┌─────────────────────────────┐
│ □ Fix authentication bug    │
│                             │
│ 🔵 In Progress              │ ← State badge (larger, more prominent)
│ 👤 Sarah                    │
│ ⏸️ Waiting on Tom           │
│                             │
│ [···]                       │ ← Actions menu
└─────────────────────────────┘
```

**Touch Interactions:**

1. **Tap task** → Opens task detail sheet (slides up from bottom)
2. **Tap state badge** → Opens state picker sheet
3. **Long press task** → Quick actions menu
4. **Swipe left** → Quick state change
5. **Swipe right** → Assign/waiting actions

### Mobile State Picker

**Bottom Sheet (slides up 60% of screen):**

```
┌─────────────────────────────┐
│ ───                         │ ← Drag handle
│ Change State                │
├─────────────────────────────┤
│                             │
│ ┌─────────────────────────┐ │
│ │ 🟢 Ready                │ │ ← Large touch targets (56px)
│ └─────────────────────────┘ │
│                             │
│ ┌─────────────────────────┐ │
│ │ 🔵 In Progress          │ │
│ └─────────────────────────┘ │
│                             │
│ ┌─────────────────────────┐ │
│ │ 🟡 Mark as Waiting      │ │
│ └─────────────────────────┘ │
│                             │
│ ┌─────────────────────────┐ │
│ │ 🟣 Send for Review      │ │
│ └─────────────────────────┘ │
│                             │
│ ┌─────────────────────────┐ │
│ │ ✓ Complete              │ │
│ └─────────────────────────┘ │
│                             │
│ [Cancel]                    │
└─────────────────────────────┘
```

**Interaction:**
- Swipe down or tap outside → Dismiss
- Tap option → Immediate state change with animation
- If "Waiting" selected → Opens waiting dialog

### Swipe Actions

**Swipe Left (Reveal Actions):**

```
┌─────────────────────────────────┐
│                  │ W │ A │ ✓ │  │ ← Action buttons revealed
└─────────────────────────────────┘
    Swipe ←
```

- `W` (Yellow) → Mark as waiting
- `A` (Blue) → Assign to...
- `✓` (Green) → Complete

**Swipe Right (Quick Complete):**
```
Swipe → for quick complete
```
- Shows checkmark trail following finger
- Release after 50% → Completes task with celebration
- Pull back → Cancel

### Mobile Team View

**Simplified for small screens:**

```
┌─────────────────────────────┐
│ Team Momentum               │
├─────────────────────────────┤
│ ⚡ Team Energy: Mixed       │
├─────────────────────────────┤
│                             │
│ ┌─────────────────────────┐ │
│ │ 👤 Sarah Chen           │ │
│ │ ● Online  ⚡ High       │ │
│ │ 🔵 2 tasks  ⚠️ Blocking 1│ │
│ └─────────────────────────┘ │
│                             │
│ ┌─────────────────────────┐ │
│ │ 👤 Tom Reeves           │ │
│ │ ○ Offline  🔋 Medium    │ │
│ │ 🟢 0 tasks              │ │
│ └─────────────────────────┘ │
│                             │
├─────────────────────────────┤
│ ⚠️ Waiting on You (2)       │
│                             │
│ • API Setup → Sarah waiting │
│ • Design Review → Tom       │
└─────────────────────────────┘
```

**Tap member card** → Expands to show their tasks

### Mobile Animations

**Touch-Optimized Micro-interactions:**

1. **Haptic Feedback:**
   - Light tap on button press
   - Medium tap on state change
   - Success pattern on task complete
   - Warning pattern when blocking someone

2. **Pull-to-Refresh:**
   - Pull down on task list → Refresh indicator
   - Spring animation on release
   - Syncs with Firestore

3. **Card Flip (Mobile):**
   - Faster (200ms vs 300ms desktop)
   - Reduced rotation (45° vs 90°)
   - Optimized for 60fps

4. **Bottom Sheet Animations:**
   - Spring physics for natural feel
   - Velocity-based dismiss (throw down)
   - Rubber-band bounce at top

### Accessibility Features

**Screen Reader Support:**

```typescript
// All interactive elements have proper labels
<button aria-label="Change task state to In Progress">
  🔵 In Progress
</button>

<div role="status" aria-live="polite">
  Task "API Setup" completed. Sarah is now unblocked.
</div>
```

**Focus Management:**
- Visible focus indicators (2px outline)
- Focus trap in modals
- Skip to main content link
- Keyboard navigation order matches visual order

**Color Accessibility:**
- All states distinguishable without color
- 4.5:1 contrast ratio minimum
- Icons + text labels (never icon only)
- Pattern fills in addition to colors for charts

**Motion Preferences:**

```typescript
// Respect prefers-reduced-motion
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

**Font Scaling:**
- Supports system font size preferences
- All spacing in `rem` units
- Max 120% zoom without horizontal scroll

**Voice Control:**
- All actions accessible via voice commands
- Descriptive labels for voice navigation

---

## Technical Implementation Notes

### Component Architecture

**New Components:**
```
src/components/collaboration/
├── state-badge.tsx                  // State indicator with dropdown
├── state-transition-dropdown.tsx    // Valid state options
├── waiting-dialog.tsx               // Assign blocker UI
├── review-dialog.tsx                // Send for review UI
├── team-member-picker.tsx           // Assignment selector
├── blocking-indicator.tsx           // "X people waiting" badge
├── team-momentum-card.tsx           // Team member status cards
├── team-activity-feed.tsx           // Real-time activity log
└── keyboard-shortcuts-panel.tsx     // Help overlay (?)

src/components/task/
├── task-card-state.tsx              // Enhanced task card with states
├── task-focus-mode.tsx              // Full-screen focus modal
└── task-bulk-actions.tsx            // Multi-select actions

src/hooks/
├── use-task-state.ts                // State machine logic
├── use-team-members.ts              // Team data & real-time listeners
├── use-keyboard-shortcuts.ts        // Global shortcut handler
└── use-drag-drop.ts                 // Drag & drop coordination
```

### Animation Libraries

**Recommended:**
- **Framer Motion** - Card flips, toss animations, spring physics
- **React Spring** - Gesture-based interactions, swipe actions
- **Canvas Confetti** - Already used, extend for unblock celebrations
- **React DnD** - Drag and drop implementation

### Firestore Rules Updates

```javascript
// Allow reading team members
match /users/{userId}/teams/{teamId} {
  allow read: if request.auth != null &&
    request.auth.uid in resource.data.members[].userId;
  allow write: if request.auth != null &&
    request.auth.uid == resource.data.createdBy;
}

// Allow writing to tasks if team member or owner
match /users/{userId}/tasks/{taskId} {
  allow write: if request.auth != null && (
    request.auth.uid == userId ||
    request.auth.uid in resource.data.assignedTo
  );
}
```

### Performance Considerations

1. **Real-time Listener Optimization:**
   - Limit team member listener to `where('isActive', '==', true)`
   - Use snapshot metadata to detect source (cache vs server)
   - Debounce activity feed updates (500ms)

2. **Animation Performance:**
   - Use `will-change: transform` for animated elements
   - Batch DOM updates with `requestAnimationFrame`
   - Lazy-load Framer Motion (code split)
   - Reduce motion complexity on low-end devices

3. **Mobile Optimization:**
   - Touch event passive listeners
   - Use CSS transforms over position changes
   - Implement virtual scrolling for large task lists
   - Compress animations for 60fps on mobile

---

## Implementation Phases

### Phase 1: Core State System
**Components:**
- Task state machine logic
- State badge component
- State transition dropdown
- Firestore schema updates
- Basic animations (card flip)

**Deliverable:** Tasks have states, users can change states with playful animations

### Phase 2: Collaboration Features
**Components:**
- Team member management (create/join teams)
- Assignment system (assign to team member)
- Waiting dialog (mark as waiting on someone)
- Blocking relationships (task dependencies)
- Notification system enhancements

**Deliverable:** Users can assign tasks and mark blockers

### Phase 3: Team Dashboard
**Components:**
- Team momentum page
- Team member status cards
- Activity feed
- Enhanced filtering (assignment, state, blockers)
- "Waiting on Me" section on workday

**Deliverable:** Team visibility and coordination dashboard

### Phase 4: Micro-interactions & Polish
**Components:**
- Task toss animation
- Unblocking celebration
- Drag-to-assign
- Haptic feedback
- All visual polish

**Deliverable:** Delightful, playful interactions throughout

### Phase 5: Power User Features
**Components:**
- Keyboard shortcuts
- Keyboard help panel (?)
- Task focus mode (F key)
- Bulk actions
- Smart AI suggestions

**Deliverable:** Power users can fly through tasks with keyboard

### Phase 6: Mobile Optimization
**Components:**
- Mobile state picker (bottom sheet)
- Swipe actions
- Touch interactions
- Mobile team view
- Performance optimization

**Deliverable:** Mobile experience matches desktop quality

### Phase 7: Accessibility
**Components:**
- Screen reader support
- Focus management
- Color accessibility audit
- Motion preferences
- Voice control support

**Deliverable:** WCAG 2.1 Level AA compliance

---

## Success Metrics

**Engagement:**
- % of users who create teams
- Average team size
- Daily active users in team context
- Tasks assigned per week

**Collaboration:**
- Number of tasks marked "waiting"
- Average time to unblock (blocker completion)
- Number of review hand-offs
- Team momentum page visits

**Power Users:**
- % of users using keyboard shortcuts
- Tasks completed via shortcuts
- Drag & drop usage
- Bulk actions usage

**Delight:**
- Session duration (increased engagement)
- Animation preference settings (motion on/off)
- Mobile vs desktop usage split
- User feedback on micro-interactions

---

## Open Questions

1. **Email Invites:** Should we use Firebase Dynamic Links or build custom invite system?
2. **Real-time Presence:** Use Firestore onDisconnect() or custom heartbeat system?
3. **Team Limits:** Cap at 10 members for free tier, unlimited for pro?
4. **State Customization:** Allow teams to define custom states (e.g., "Deployed", "Testing")?
5. **Mobile Drag & Drop:** Worth implementing or desktop-only feature?

---

## Design Approved

This design has been validated and is ready for implementation planning.

**Next Steps:**
1. Set up git worktree for isolated development
2. Create detailed implementation plan with task breakdown
3. Begin Phase 1: Core State System