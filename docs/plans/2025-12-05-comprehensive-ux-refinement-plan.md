# Comprehensive UX Refinement Implementation Plan

**Date:** 2025-12-05
**Approach:** Comprehensive UX Refinement (Approach 2)
**Estimated Timeline:** 1-2 weeks
**Priority:** High

## Executive Summary

This plan addresses systematic UI/UX improvements across the entire Pace Pilot application, focusing on mobile-first interactions, error handling, loading states, empty states, information hierarchy, and performance. The implementation is divided into 7 phases with clear deliverables and success criteria.

---

## Phase 1: Mobile-First Interaction Patterns

### Objective
Make all touch interactions functional and optimize for mobile/tablet devices.

### Tasks

#### 1.1 Create Adaptive Action Buttons Component
**File:** `src/components/ui/adaptive-action-menu.tsx` (new)

**Implementation:**
```typescript
// Create a component that shows hover buttons on desktop, menu on mobile
interface AdaptiveActionMenuProps {
  actions: Array<{
    label: string;
    icon: React.ReactNode;
    onClick: () => void;
    variant?: 'default' | 'destructive';
  }>;
  triggerClassName?: string;
}

export function AdaptiveActionMenu({ actions, triggerClassName }: AdaptiveActionMenuProps) {
  // Desktop: Show all action buttons with hover reveal
  // Mobile: Show three-dot menu that opens DropdownMenu
  // Use @media (hover: hover) CSS or useMediaQuery hook
}
```

**Changes Required:**
- Update `src/components/dashboard/task-list.tsx` (lines 264-295)
  - Replace opacity-0 hover buttons with AdaptiveActionMenu
  - Ensure minimum 44x44px touch targets on mobile
- Update `src/components/workday/workday-tasks-card.tsx`
  - Same pattern as task-list
- Update `src/app/projects/client-page.tsx`
  - Project card actions need touch-friendly pattern

**Success Criteria:**
- [ ] Action buttons work on touch devices
- [ ] No functionality hidden behind hover on mobile
- [ ] Minimum 44x44px touch targets maintained
- [ ] Desktop experience unchanged (hover still works)

---

#### 1.2 Implement Sheet Component for Mobile Forms
**File:** `src/components/ui/sheet.tsx` (verify shadcn/ui sheet exists)

**Implementation:**
- Install/verify Sheet component from shadcn/ui
- Create responsive form wrapper component
- Use Sheet on mobile, Dialog on desktop

**Changes Required:**
- Update `src/components/dashboard/task-form-dialog.tsx`
  - Wrap in responsive component
  - Sheet for mobile (slides from bottom)
  - Dialog for desktop (center modal)
  - Sticky header and footer in Sheet
- Update `src/components/ministries/ministry-dialog.tsx`
  - Same pattern
- Update `src/components/projects/project-details-dialog.tsx`
  - Same pattern

**Success Criteria:**
- [ ] Long forms scrollable without issues on mobile
- [ ] Submit button always accessible (sticky footer)
- [ ] Desktop experience unchanged
- [ ] Smooth sheet slide-in animation

---

#### 1.3 Enhanced Touch Feedback
**File:** `src/app/globals.css` (add utilities)

**Implementation:**
```css
/* Add to globals.css */
@layer utilities {
  .touch-target {
    @apply min-w-[44px] min-h-[44px];
  }

  .card-interactive {
    @apply active:scale-[0.98] transition-transform;
  }
}
```

**Changes Required:**
- Add active states to all interactive cards
- Increase spacing between touch targets on mobile
- Add press feedback to all buttons

**Success Criteria:**
- [ ] Visual feedback on all touch interactions
- [ ] No accidental taps due to tight spacing
- [ ] Professional feel on mobile devices

---

## Phase 2: Loading States & Feedback System

### Objective
Provide consistent, clear feedback during all asynchronous operations.

### Tasks

#### 2.1 Create LoadingButton Component
**File:** `src/components/ui/loading-button.tsx` (new)

**Implementation:**
```typescript
import { Button, ButtonProps } from './button';
import { Loader2 } from 'lucide-react';

interface LoadingButtonProps extends ButtonProps {
  loading?: boolean;
  loadingText?: string;
}

export function LoadingButton({
  loading,
  loadingText,
  children,
  disabled,
  ...props
}: LoadingButtonProps) {
  return (
    <Button disabled={disabled || loading} {...props}>
      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {loading && loadingText ? loadingText : children}
    </Button>
  );
}
```

**Changes Required:**
- Replace all async Button components with LoadingButton:
  - `src/components/dashboard/task-form-dialog.tsx`
  - `src/components/ministries/ministry-dialog.tsx`
  - `src/components/projects/project-details-dialog.tsx`
  - `src/app/settings/client-page.tsx` (Google Calendar connection)
  - All other forms/dialogs with submit buttons

**Success Criteria:**
- [ ] Spinner visible during all async operations
- [ ] Button width doesn't shift during loading
- [ ] Loading state announced to screen readers
- [ ] Consistent across entire app

---

#### 2.2 Enhanced Skeleton Loaders
**File:** `src/components/ui/skeleton.tsx` (enhance existing)

**Implementation:**
```typescript
// Add pulse animation variant
export function SkeletonPulse({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
      role="status"
      aria-label="Loading..."
      {...props}
    />
  );
}
```

**Changes Required:**
- Update all skeleton usage to include aria-label
- Match skeleton dimensions exactly to loaded content:
  - `src/app/ministries/client-page.tsx` (lines 54-59)
  - `src/app/projects/client-page.tsx`
  - `src/app/dashboard/client-page.tsx`
  - All other pages with loading states

**Success Criteria:**
- [ ] No layout shift when skeleton → content
- [ ] Accessible loading announcement
- [ ] Subtle pulse animation
- [ ] Accurate content preview

---

#### 2.3 Progress Indicators for Long Operations
**File:** `src/components/ui/progress-indicator.tsx` (new)

**Implementation:**
```typescript
// Indeterminate progress bar
export function IndeterminateProgress({ status }: { status: string }) {
  return (
    <div className="space-y-2">
      <Progress value={undefined} className="w-full" /> {/* Indeterminate */}
      <p className="text-sm text-muted-foreground">{status}</p>
    </div>
  );
}

// Determinate progress bar
export function DeterminateProgress({
  current,
  total,
  label
}: {
  current: number;
  total: number;
  label: string;
}) {
  const percentage = (current / total) * 100;
  return (
    <div className="space-y-2">
      <Progress value={percentage} className="w-full" />
      <p className="text-sm text-muted-foreground">
        {label}: {current} of {total}
      </p>
    </div>
  );
}
```

**Changes Required:**
- Add to AI report generation:
  - `src/app/dashboard/client-page.tsx`
  - Show "Generating your report..." with indeterminate progress
- Add to batch operations (if any exist)
- Add to chart rendering (skeleton chart wireframes)

**Success Criteria:**
- [ ] Users know something is happening during long operations
- [ ] Clear status messages
- [ ] Progress shown when measurable
- [ ] Non-blocking (in dialog or inline)

---

#### 2.4 Optimistic Updates with Rollback
**File:** Multiple files (pattern to apply)

**Implementation Pattern:**
```typescript
// Example in task completion
const handleToggleTask = async (taskId: string) => {
  const task = tasks.find(t => t.id === taskId);
  if (!task) return;

  // Optimistic update
  const optimisticTasks = tasks.map(t =>
    t.id === taskId ? { ...t, completed: !t.completed } : t
  );
  setTasks(optimisticTasks);

  try {
    await updateTask(firestore, user.uid, taskId, { completed: !task.completed });
  } catch (error) {
    // Rollback on error
    setTasks(tasks);
    toast({
      variant: 'destructive',
      title: 'Failed to update task',
      description: 'Your change has been reverted.',
      action: <Button onClick={() => handleToggleTask(taskId)}>Retry</Button>,
    });
  }
};
```

**Changes Required:**
- Apply optimistic updates to:
  - Task completion (src/components/dashboard/task-list.tsx)
  - Ministry creation (src/components/ministries/ministry-dialog.tsx)
  - Project updates (src/components/projects/project-details-dialog.tsx)
  - Workday task operations

**Success Criteria:**
- [ ] UI updates immediately on user action
- [ ] Rollback on error with notification
- [ ] Retry option available
- [ ] Network latency not felt by user

---

## Phase 3: Error Handling & Recovery

### Objective
Provide clear error messages with recovery paths for all failure scenarios.

### Tasks

#### 3.1 Enhanced Error Toast with Actions
**File:** `src/hooks/use-toast.ts` (enhance existing)

**Implementation:**
```typescript
// Add helper for error toasts with retry
export function useErrorToast() {
  const { toast } = useToast();

  return {
    showError: (error: Error, retry?: () => void) => {
      toast({
        variant: 'destructive',
        title: 'Something went wrong',
        description: error.message || 'Please try again.',
        action: retry ? (
          <Button variant="outline" onClick={retry}>
            Retry
          </Button>
        ) : undefined,
        duration: Infinity, // Don't auto-dismiss errors
      });
    },
  };
}
```

**Changes Required:**
- Replace all error toast calls with enhanced version:
  - `src/components/dashboard/task-form-dialog.tsx` (line 79)
  - `src/components/ministries/ministry-dialog.tsx` (line 79)
  - `src/components/projects/project-details-dialog.tsx`
  - All API error handlers
- Include specific error messages (not generic "Something went wrong")
- Add retry callbacks where appropriate

**Success Criteria:**
- [ ] All errors persist until dismissed
- [ ] Specific error messages shown
- [ ] Retry option available for recoverable errors
- [ ] Manual dismiss option always present

---

#### 3.2 Error Boundary Components
**Files:**
- `src/components/error-boundary.tsx` (new)
- `src/components/page-error-boundary.tsx` (new)

**Implementation:**
```typescript
// Page-level error boundary
export function PageErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary
      fallback={(error, reset) => (
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
          <AlertCircle className="h-12 w-12 text-destructive" />
          <h2 className="text-2xl font-semibold">Something went wrong</h2>
          <p className="text-muted-foreground text-center max-w-md">
            {error.message}
          </p>
          <div className="flex gap-2">
            <Button onClick={reset}>Try Again</Button>
            <Button variant="outline" onClick={() => window.location.href = '/'}>
              Go Home
            </Button>
          </div>
        </div>
      )}
    >
      {children}
    </ErrorBoundary>
  );
}
```

**Changes Required:**
- Wrap all page components with PageErrorBoundary
- Add component-level boundaries for complex components:
  - Chart components
  - Ministry detail sections
  - Dashboard widgets
- Implement graceful degradation (show partial UI if possible)

**Success Criteria:**
- [ ] App doesn't crash completely on errors
- [ ] User can recover without refresh
- [ ] Clear error messages with context
- [ ] "Report issue" option available

---

#### 3.3 Offline Detection & Sync Queue
**Files:**
- `src/hooks/use-online-status.ts` (new)
- `src/lib/offline-queue.ts` (new)
- `src/components/offline-banner.tsx` (new)

**Implementation:**
```typescript
// Offline hook
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

// Offline queue
class OfflineQueue {
  private queue: Array<{ operation: () => Promise<void>, id: string }> = [];

  enqueue(operation: () => Promise<void>) {
    const id = crypto.randomUUID();
    this.queue.push({ operation, id });
    this.saveToStorage();
  }

  async processQueue() {
    // Process queued operations when online
  }

  private saveToStorage() {
    // Persist queue to localStorage
  }
}

// Banner component
export function OfflineBanner() {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-yellow-500 text-yellow-950 p-2 text-center">
      <WifiOff className="inline-block mr-2 h-4 w-4" />
      You're offline. Changes will sync when reconnected.
    </div>
  );
}
```

**Changes Required:**
- Add OfflineBanner to layout.tsx
- Queue write operations when offline
- Auto-retry when connection restored
- Show sync status in UI

**Success Criteria:**
- [ ] User aware of offline state
- [ ] Operations queued during offline
- [ ] Auto-sync when online
- [ ] No data loss during offline usage

---

#### 3.4 Form Validation Improvements
**File:** Multiple form files

**Implementation:**
- Add real-time validation (useForm mode: 'onChange')
- Show field-level errors immediately
- Add error summary at top of forms
- Preserve form data in localStorage

**Changes Required:**
- Update all react-hook-form instances:
  - `src/components/dashboard/task-form-dialog.tsx`
  - `src/components/ministries/ministry-dialog.tsx`
  - `src/components/projects/project-details-dialog.tsx`
  - `src/app/profile/client-page.tsx`
- Add error summary component
- Implement form persistence (autosave to localStorage)

**Success Criteria:**
- [ ] Validation errors shown immediately
- [ ] Clear error messages per field
- [ ] Form data not lost on accidental close
- [ ] Error summary links to problem fields

---

## Phase 4: Empty States & Onboarding

### Objective
Create consistent, helpful empty states that guide users to first actions.

### Tasks

#### 4.1 Standardized EmptyState Component
**File:** `src/components/ui/empty-state.tsx` (new)

**Implementation:**
```typescript
interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  secondaryAction,
}: EmptyStateProps) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-16 text-center">
        <div className="text-muted-foreground mb-4">{icon}</div>
        <h3 className="text-xl font-semibold mb-2">{title}</h3>
        <p className="text-muted-foreground max-w-md mb-6">
          {description}
        </p>
        <div className="flex gap-2">
          {action && (
            <Button onClick={action.onClick}>
              <Plus className="mr-2 h-4 w-4" />
              {action.label}
            </Button>
          )}
          {secondaryAction && (
            <Button variant="outline" onClick={secondaryAction.onClick}>
              {secondaryAction.label}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
```

**Changes Required:**
- Replace custom empty states with EmptyState component:
  - `src/app/ministries/client-page.tsx` (lines 75-88)
  - `src/app/projects/client-page.tsx`
  - `src/app/reports/client-page.tsx`
  - `src/app/workday/client-page.tsx`
  - All other pages with empty states
- Update descriptions to be educational (explain what the feature does)
- Add secondary actions (help/documentation links)

**Success Criteria:**
- [ ] Consistent empty state design across app
- [ ] Clear guidance on what to do next
- [ ] Educational descriptions
- [ ] Help links where appropriate

---

#### 4.2 First-Time User Experience
**Files:**
- `src/components/onboarding/welcome-dialog.tsx` (new)
- `src/components/onboarding/feature-callout.tsx` (new)

**Implementation:**
```typescript
// Welcome dialog shown on first login
export function WelcomeDialog() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // Check if user has seen welcome (localStorage)
    const hasSeenWelcome = localStorage.getItem('hasSeenWelcome');
    if (!hasSeenWelcome) {
      setOpen(true);
    }
  }, []);

  const handleComplete = () => {
    localStorage.setItem('hasSeenWelcome', 'true');
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Welcome to Pace Pilot!</DialogTitle>
          <DialogDescription>
            Your personal productivity companion for managing tasks, projects, and ministries.
          </DialogDescription>
        </DialogHeader>
        {/* Multi-step intro with screenshots/gifs */}
        <Button onClick={handleComplete}>Get Started</Button>
      </DialogContent>
    </Dialog>
  );
}

// Feature callout (non-intrusive popover)
export function FeatureCallout({
  targetId,
  title,
  description,
  onDismiss
}: FeatureCalloutProps) {
  return (
    <Popover defaultOpen>
      <PopoverTrigger asChild>
        <div id={targetId} />
      </PopoverTrigger>
      <PopoverContent side="bottom" className="w-80">
        <div className="space-y-2">
          <h4 className="font-semibold">{title}</h4>
          <p className="text-sm text-muted-foreground">{description}</p>
          <Button variant="ghost" size="sm" onClick={onDismiss}>
            Got it
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
```

**Changes Required:**
- Add WelcomeDialog to main layout
- Add feature callouts for:
  - Ministry strategic planning (first time visiting ministry page)
  - Pomodoro timer (first time seeing workday)
  - Energy tracking (first time ending day)
- Create sample data option for new users
- Track dismissed callouts in user preferences

**Success Criteria:**
- [ ] New users see welcome dialog on first login
- [ ] Feature callouts appear contextually
- [ ] Callouts dismissible and don't reappear
- [ ] Sample data option helps users explore

---

#### 4.3 Contextual Help System
**File:** `src/components/ui/help-popover.tsx` (new)

**Implementation:**
```typescript
export function HelpPopover({ content }: { content: string }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="h-5 w-5">
          <HelpCircle className="h-4 w-4 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <p className="text-sm">{content}</p>
      </PopoverContent>
    </Popover>
  );
}
```

**Changes Required:**
- Add help icons next to complex features:
  - Strategic planning sections
  - Energy level selection
  - Eisenhower matrix
  - Ministry concept
- Write clear, concise help text for each
- Add "Learn more" links to external docs

**Success Criteria:**
- [ ] Help available inline (no external navigation)
- [ ] Clear explanations of complex features
- [ ] Consistent help icon placement
- [ ] Links to detailed docs when needed

---

## Phase 5: Information Hierarchy & Visual Design

### Objective
Establish consistent visual hierarchy and spacing throughout the application.

### Tasks

#### 5.1 Typography System Implementation
**File:** `src/app/globals.css` (enhance)

**Implementation:**
```css
@layer base {
  h1 {
    @apply text-3xl font-bold tracking-tight;
  }

  h2 {
    @apply text-2xl font-semibold tracking-tight;
  }

  h3 {
    @apply text-xl font-semibold;
  }

  h4 {
    @apply text-lg font-medium;
  }
}

@layer utilities {
  .text-primary-emphasis {
    @apply text-foreground;
  }

  .text-secondary-emphasis {
    @apply text-muted-foreground;
  }

  .text-de-emphasized {
    @apply text-muted-foreground opacity-70;
  }
}
```

**Changes Required:**
- Audit all pages for heading usage:
  - Replace inconsistent text-* classes with semantic h1-h4
  - Ensure proper heading hierarchy (h1 → h2 → h3)
  - Use text utility classes for emphasis levels
- Update all pages to use consistent headings
- Document typography scale in design system

**Success Criteria:**
- [ ] Consistent heading sizes across app
- [ ] Proper semantic HTML (h1, h2, h3, h4)
- [ ] Text color usage consistent
- [ ] Accessible heading hierarchy

---

#### 5.2 Spacing System Audit
**File:** All component files

**Implementation:**
- Create spacing audit checklist
- Standardize spacing values:
  - Card padding: p-6
  - Section spacing: space-y-6
  - List item spacing: space-y-4
  - Inline elements: gap-2 or gap-4
  - Page margins: p-4 md:p-6 lg:p-8

**Changes Required:**
- Audit every page for spacing consistency:
  - `src/app/*/client-page.tsx` (all pages)
  - `src/components/**/*.tsx` (all components)
- Replace arbitrary spacing values with scale values
- Create spacing documentation

**Success Criteria:**
- [ ] No arbitrary spacing values (e.g., space-y-7)
- [ ] Consistent rhythm across pages
- [ ] Whitespace improves readability
- [ ] Documented spacing scale

---

#### 5.3 Priority & Status Indicators
**File:** `src/components/ui/priority-badge.tsx` (new)

**Implementation:**
```typescript
export function PriorityBadge({ priority }: { priority: 'Low' | 'Medium' | 'High' }) {
  const variants = {
    Low: 'border-blue-500 text-blue-700 dark:text-blue-400',
    Medium: 'border-yellow-500 text-yellow-700 dark:text-yellow-400',
    High: 'border-red-500 text-red-700 dark:text-red-400',
  };

  return (
    <Badge variant="outline" className={cn('border-l-4', variants[priority])}>
      {priority}
    </Badge>
  );
}

export function EnergyLevelIndicator({ level }: { level: EnergyLevel }) {
  const colors = {
    Low: 'bg-red-500',
    Medium: 'bg-yellow-500',
    High: 'bg-green-500',
  };

  return (
    <Tooltip content={`Energy: ${level}`}>
      <div className={cn('w-2 h-2 rounded-full', colors[level])} />
    </Tooltip>
  );
}

export function DueDateIndicator({ date }: { date: string }) {
  const daysUntil = differenceInDays(parseISO(date), new Date());

  let variant: 'default' | 'secondary' | 'destructive' = 'default';
  if (daysUntil < 0) variant = 'destructive'; // Overdue
  else if (daysUntil <= 3) variant = 'destructive'; // Due soon
  else if (daysUntil <= 7) variant = 'secondary'; // Coming up

  return (
    <Badge variant={variant}>
      {daysUntil < 0 ? 'Overdue' : `Due in ${daysUntil}d`}
    </Badge>
  );
}
```

**Changes Required:**
- Add priority indicators to:
  - Task list items
  - Project cards (`src/app/projects/client-page.tsx`)
  - Ministry tasks
- Add energy level dots to all task displays
- Add due date warnings with color coding
- Update workday tasks to show priority

**Success Criteria:**
- [ ] Visual urgency system clear
- [ ] Priority visible at a glance
- [ ] Color-blind friendly (not just color)
- [ ] Consistent across all views

---

#### 5.4 Ministry Detail Page Restructuring
**File:** `src/app/ministries/[id]/client-page.tsx`

**Implementation:**
```typescript
// Restructure from 5 tabs to focused view with progressive disclosure

export function MinistryDetailPage() {
  return (
    <div className="space-y-6">
      {/* Header: Name, description, quick stats */}
      <MinistryHeader ministry={ministry} />

      {/* Main content: Strategic Plan (most important) */}
      <Card>
        <CardHeader>
          <CardTitle>Strategic Plan</CardTitle>
        </CardHeader>
        <CardContent>
          <StrategicPlanOverview ministryId={ministry.id} />
        </CardContent>
      </Card>

      {/* Quick access sections with "View all" links */}
      <div className="grid md:grid-cols-2 gap-6">
        <ProjectsPreview ministryId={ministry.id} />
        <GoalsPreview ministryId={ministry.id} />
      </div>

      {/* Tabs only for detailed views (lazy loaded) */}
      <Tabs defaultValue="metrics">
        <TabsList>
          <TabsTrigger value="metrics">Metrics</TabsTrigger>
          <TabsTrigger value="milestones">Milestones</TabsTrigger>
        </TabsList>
        <TabsContent value="metrics">
          <MetricsSection ministryId={ministry.id} />
        </TabsContent>
        <TabsContent value="milestones">
          <MilestonesSection ministryId={ministry.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

**Changes Required:**
- Refactor ministry detail page structure
- Create preview components for projects/goals (show top 3-5)
- Lazy load tab content
- Add "View all" links to full pages
- Reduce initial load complexity

**Success Criteria:**
- [ ] Most important info (strategic plan) shown first
- [ ] Less overwhelming for new users
- [ ] Faster initial load
- [ ] Easy access to detailed views

---

## Phase 6: Performance & Perceived Performance

### Objective
Improve actual and perceived performance through optimizations and animations.

### Tasks

#### 6.1 Transition Animations
**File:** `src/app/globals.css` (add utilities)

**Implementation:**
```css
@layer utilities {
  .animate-page-enter {
    animation: fadeIn 150ms ease-in;
  }

  .animate-dialog-enter {
    animation: slideUp 200ms ease-out;
  }

  .animate-list-item-enter {
    animation: slideDown 200ms ease-out;
  }

  .animate-completion {
    animation: scaleDown 200ms ease-in;
  }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes scaleDown {
  from {
    opacity: 1;
    transform: scale(1);
  }
  to {
    opacity: 0;
    transform: scale(0.95);
  }
}
```

**Changes Required:**
- Add page enter animations to all client pages
- Add list item animations for task additions
- Add completion animations for task completion
- Keep animations subtle (150-200ms duration)
- Respect `prefers-reduced-motion` media query

**Success Criteria:**
- [ ] Smooth transitions between states
- [ ] No jarring content appearance
- [ ] Respects user motion preferences
- [ ] Consistent animation timing

---

#### 6.2 Chart Performance Optimization
**Files:**
- All files using Recharts components

**Implementation:**
```typescript
// Lazy load charts
const Chart = dynamic(() => import('@/components/charts/bar-chart'), {
  loading: () => <SkeletonChart />,
  ssr: false, // Don't render charts on server
});

// Memoize chart data
const chartData = useMemo(() => {
  return transformDataForChart(rawData);
}, [rawData]);

// Debounce data updates
const debouncedData = useDebounce(liveData, 300);
```

**Changes Required:**
- Lazy load all chart components:
  - `src/app/dashboard/client-page.tsx`
  - `src/app/reports/client-page.tsx`
  - `src/app/weekly-planner/client-page.tsx`
- Add skeleton chart components
- Memoize chart data transformations
- Debounce real-time chart updates
- Consider switching to canvas-based charts for large datasets (if needed)

**Success Criteria:**
- [ ] Charts don't block page render
- [ ] Smooth data updates
- [ ] No unnecessary re-renders
- [ ] Good performance with large datasets

---

#### 6.3 Data Fetching Optimization
**File:** Multiple files

**Implementation:**
```typescript
// Parallel fetches
const [tasks, projects, ministries] = await Promise.all([
  getTasks(),
  getProjects(),
  getMinistries(),
]);

// Stale-while-revalidate pattern (for less critical data)
const useStaleWhileRevalidate = (fetcher, key) => {
  const [data, setData] = useState(getCachedData(key));

  useEffect(() => {
    fetcher().then(newData => {
      setData(newData);
      setCachedData(key, newData);
    });
  }, [fetcher, key]);

  return data;
};

// Prefetch on hover
const prefetchProject = (projectId: string) => {
  queryClient.prefetchQuery(['project', projectId], () => getProject(projectId));
};

<ProjectCard
  onMouseEnter={() => prefetchProject(project.id)}
  {...props}
/>
```

**Changes Required:**
- Use Promise.all for parallel fetches:
  - `src/hooks/use-dashboard-data.tsx` (already has some parallelization)
- Implement stale-while-revalidate for:
  - Category list
  - User preferences
  - Less frequently changed data
- Add hover prefetch for:
  - Project details
  - Ministry details
- Review all data fetching for optimization opportunities

**Success Criteria:**
- [ ] Faster initial page load
- [ ] Instant navigation for prefetched content
- [ ] Better perceived performance
- [ ] Less network usage (caching)

---

## Phase 7: Design System Documentation

### Objective
Document design patterns for consistency and future development.

### Tasks

#### 7.1 Create Design System Documentation
**File:** `docs/design-system.md` (new)

**Implementation:**
```markdown
# Pace Pilot Design System

## Color System

### Theme Colors
- Primary: Used for primary actions, links, active states
- Secondary: Used for secondary actions, backgrounds
- Destructive: Used for dangerous actions, errors
- Muted: Used for backgrounds, borders, disabled states

### Text Colors
- `text-foreground`: Primary text (high emphasis)
- `text-muted-foreground`: Secondary text (medium emphasis)
- `text-muted-foreground opacity-70`: De-emphasized text (low emphasis)

## Typography Scale

### Headings
- H1: `text-3xl font-bold` - Page titles
- H2: `text-2xl font-semibold` - Section titles
- H3: `text-xl font-semibold` - Card titles
- H4: `text-lg font-medium` - Subsections

### Body Text
- Default: `text-base` (16px)
- Small: `text-sm` (14px)
- Extra small: `text-xs` (12px)

## Spacing Scale

### Consistent Values
- Card padding: `p-6`
- Section spacing: `space-y-6`
- List item spacing: `space-y-4`
- Inline elements: `gap-2` or `gap-4`
- Page margins: `p-4 md:p-6 lg:p-8`

## Component Patterns

### When to Use Dialog vs Sheet
- **Dialog**: Desktop forms, confirmations, smaller content
- **Sheet**: Mobile forms, settings panels, side content

### When to Use Card vs Plain Container
- **Card**: Grouped content with clear boundaries
- **Plain Container**: Page sections, layout structure

### When to Use Toast vs Alert vs Dialog
- **Toast**: Non-critical notifications, success messages
- **Alert**: Important but non-blocking messages
- **Dialog**: Critical alerts requiring user action

## Animation Guidelines

### Timing
- Quick transitions: 150ms (page transitions, fades)
- Standard transitions: 200ms (dialogs, sheets)
- Long transitions: 300ms (complex animations)

### Easing
- Enter: `ease-out`
- Exit: `ease-in`
- Continuous: `ease-in-out`

## Accessibility Requirements

### Required
- All images must have alt text
- All interactive elements must be keyboard accessible
- Color contrast must meet WCAG AA standards
- Form inputs must have associated labels
- Loading states must be announced to screen readers

### Best Practices
- Use semantic HTML (h1, nav, main, etc.)
- Provide skip links for keyboard navigation
- Test with screen reader
- Support keyboard shortcuts
- Respect `prefers-reduced-motion`

## Mobile Considerations

### Touch Targets
- Minimum size: 44x44px
- Spacing between targets: 8px minimum

### Responsive Breakpoints
- Mobile: < 768px
- Tablet: 768px - 1024px
- Desktop: > 1024px

### Mobile-Specific Patterns
- Use Sheet instead of Dialog for forms
- Show menu button instead of hover actions
- Increase touch target sizes
- Simplify complex layouts
```

**Success Criteria:**
- [ ] Comprehensive documentation
- [ ] Easy to reference
- [ ] Includes code examples
- [ ] Updated as patterns evolve

---

#### 7.2 Component Example Library
**File:** `docs/component-examples.md` (new)

**Implementation:**
- Document each reusable component with:
  - Purpose and when to use
  - Props and types
  - Code example
  - Visual example (screenshot)
  - Accessibility considerations
  - Mobile considerations

**Components to document:**
- EmptyState
- LoadingButton
- AdaptiveActionMenu
- PriorityBadge
- EnergyLevelIndicator
- HelpPopover
- PageErrorBoundary
- OfflineBanner
- ProgressIndicator

**Success Criteria:**
- [ ] All custom components documented
- [ ] Clear usage guidelines
- [ ] Copy-paste ready examples
- [ ] Visual references included

---

#### 7.3 Developer Tools Setup
**Files:**
- `.eslintrc.json` (enhance)
- `.husky/pre-commit` (new)

**Implementation:**
```json
// ESLint rules for consistency
{
  "rules": {
    "jsx-a11y/alt-text": "error",
    "jsx-a11y/aria-props": "error",
    "jsx-a11y/aria-role": "error",
    "@typescript-eslint/no-explicit-any": "warn",
    "no-console": ["warn", { "allow": ["warn", "error"] }]
  }
}
```

```bash
# Pre-commit hook
#!/bin/sh
npm run typecheck
npm run lint
# Add accessibility checks if tooling available
```

**Changes Required:**
- Enhance ESLint rules for accessibility
- Set up pre-commit hooks
- Configure TypeScript strict mode (if not already)
- Add automated accessibility checks (e.g., axe-core)

**Success Criteria:**
- [ ] Automated enforcement of standards
- [ ] Catch issues before commit
- [ ] Consistent code quality
- [ ] Accessibility built-in

---

## Testing Strategy

### Manual Testing Checklist

**Mobile Testing (Required)**
- [ ] Test on actual iOS device
- [ ] Test on actual Android device
- [ ] Test on tablet (iPad or Android tablet)
- [ ] Verify touch targets are 44x44px minimum
- [ ] Verify forms work in Sheet component
- [ ] Verify action menus work without hover

**Desktop Testing**
- [ ] Test in Chrome
- [ ] Test in Firefox
- [ ] Test in Safari
- [ ] Verify hover interactions work
- [ ] Verify keyboard navigation works
- [ ] Verify all animations smooth

**Accessibility Testing**
- [ ] Test with VoiceOver (macOS/iOS)
- [ ] Test with NVDA (Windows)
- [ ] Test keyboard-only navigation
- [ ] Verify color contrast (axe DevTools)
- [ ] Test with dark mode
- [ ] Test with reduced motion enabled

**Error Scenarios**
- [ ] Test offline mode
- [ ] Test with network throttling
- [ ] Test error recovery flows
- [ ] Test retry mechanisms
- [ ] Verify error messages helpful

**Performance Testing**
- [ ] Measure page load times
- [ ] Check for layout shifts
- [ ] Verify charts render smoothly
- [ ] Test with large datasets
- [ ] Check bundle size impact

### Automated Testing

**Playwright E2E Tests to Add**
```typescript
// tests/mobile-interactions.spec.ts
test('action menu works on touch devices', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto('/');
  // Test touch interactions
});

// tests/error-recovery.spec.ts
test('retry button works after error', async ({ page }) => {
  // Mock API failure
  // Click retry
  // Verify success
});

// tests/loading-states.spec.ts
test('loading spinners shown during async operations', async ({ page }) => {
  // Verify loading indicators appear
});
```

**Success Criteria:**
- [ ] E2E tests cover critical flows
- [ ] Mobile interaction tests passing
- [ ] Error recovery tests passing
- [ ] Accessibility tests integrated

---

## Implementation Phases & Timeline

### Week 1: Critical Fixes
**Days 1-2: Mobile-First (Phase 1)**
- Create AdaptiveActionMenu component
- Update TaskList, WorkdayTasks, Projects with touch-friendly actions
- Implement Sheet for mobile forms
- Add touch feedback to all interactions

**Days 3-4: Loading & Error Handling (Phases 2-3)**
- Create LoadingButton component
- Implement enhanced error toasts with retry
- Add error boundaries
- Set up offline detection
- Improve skeleton loaders

**Day 5: Empty States (Phase 4.1)**
- Create EmptyState component
- Update all pages with consistent empty states
- Add educational descriptions

### Week 2: Polish & Documentation
**Days 6-7: Visual Hierarchy (Phase 5)**
- Implement typography system
- Audit and fix spacing
- Add priority/status indicators
- Restructure ministry detail page

**Day 8: Performance (Phase 6)**
- Add transition animations
- Optimize chart performance
- Implement data fetching optimizations
- Add prefetching

**Days 9-10: Documentation & Testing (Phase 7)**
- Write design system documentation
- Create component examples
- Set up developer tools
- Comprehensive testing
- Bug fixes

---

## Success Metrics

### User Experience
- **Mobile usability:** All features fully functional on touch devices
- **Error recovery:** 100% of errors have recovery path
- **Loading clarity:** Users always know when something is processing
- **Empty state guidance:** First-time users know what to do next

### Technical
- **Page load time:** < 2s on 3G
- **Lighthouse score:** > 90 (Performance, Accessibility, Best Practices)
- **Zero layout shift:** CLS score of 0
- **Bundle size:** No increase (or minimal with lazy loading)

### Code Quality
- **TypeScript coverage:** 100% (strict mode)
- **ESLint errors:** 0
- **Accessibility violations:** 0 (per axe DevTools)
- **Test coverage:** > 70% of critical paths

---

## Rollout Strategy

### Progressive Rollout
1. **Phase 1 (Mobile Critical):** Deploy to staging, test on devices
2. **Phases 2-3 (Loading/Errors):** Deploy to production, monitor error rates
3. **Phase 4 (Empty States):** Deploy to production
4. **Phases 5-6 (Visual/Performance):** Deploy to production with monitoring
5. **Phase 7 (Documentation):** Internal release

### Monitoring
- Track error rates (expect decrease)
- Monitor performance metrics (expect improvement)
- Gather user feedback
- Track feature discovery (callouts/help usage)

### Rollback Plan
- Each phase deployable independently
- Feature flags for new components (if needed)
- Quick rollback capability for each phase
- Preserve backward compatibility

---

## Post-Implementation

### Maintenance
- Review design system quarterly
- Update documentation with new patterns
- Refine based on user feedback
- Monitor accessibility compliance

### Future Enhancements
- Command palette (keyboard shortcuts)
- Drag-and-drop for tasks
- Advanced keyboard navigation
- More granular notifications
- User preferences for customization

---

## Appendix: File Inventory

### New Files Created
- `src/components/ui/adaptive-action-menu.tsx`
- `src/components/ui/loading-button.tsx`
- `src/components/ui/empty-state.tsx`
- `src/components/ui/help-popover.tsx`
- `src/components/ui/priority-badge.tsx`
- `src/components/ui/progress-indicator.tsx`
- `src/components/error-boundary.tsx`
- `src/components/page-error-boundary.tsx`
- `src/components/offline-banner.tsx`
- `src/components/onboarding/welcome-dialog.tsx`
- `src/components/onboarding/feature-callout.tsx`
- `src/hooks/use-online-status.ts`
- `src/hooks/use-error-toast.ts`
- `src/lib/offline-queue.ts`
- `docs/design-system.md`
- `docs/component-examples.md`
- `tests/mobile-interactions.spec.ts`
- `tests/error-recovery.spec.ts`
- `tests/loading-states.spec.ts`

### Files Modified (Major)
- `src/components/dashboard/task-list.tsx`
- `src/components/workday/workday-tasks-card.tsx`
- `src/components/dashboard/task-form-dialog.tsx`
- `src/components/ministries/ministry-dialog.tsx`
- `src/components/projects/project-details-dialog.tsx`
- `src/app/ministries/[id]/client-page.tsx`
- `src/app/layout.tsx` (add OfflineBanner, WelcomeDialog)
- `src/app/globals.css` (typography, animations)
- All page files (empty states, spacing, headings)

### Dependencies to Add
```json
{
  "react-swipeable": "^7.0.0" // Optional, for swipe gestures
}
```

---

## Notes & Considerations

### Design Decisions
- **Mobile-first:** All designs start with mobile, enhance for desktop
- **Progressive disclosure:** Hide complexity until needed
- **Recovery over prevention:** Always provide recovery path for errors
- **Education over assumptions:** Explain features, don't assume knowledge
- **Consistency over novelty:** Reuse patterns, don't reinvent

### Trade-offs
- **Animation:** Subtle animations improve UX but add complexity (kept minimal)
- **Help system:** Contextual help vs external docs (chose contextual)
- **Empty states:** Educational vs concise (chose educational)
- **Error persistence:** Never auto-dismiss errors (may feel sticky, but ensures visibility)

### Future Considerations
- Internationalization (i18n) support
- Advanced theming (beyond dark/light)
- User-customizable layouts
- More sophisticated offline support
- Real-time collaboration features

---

**End of Implementation Plan**
