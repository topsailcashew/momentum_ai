# Pace Pilot Design System

## Color System

### Theme Colors
- **Primary** (Pumpkin): `hsl(23 90% 55%)` - Used for primary actions, links, active states.
- **Secondary**: `hsl(240 5% 92%)` - Used for secondary actions, backgrounds.
- **Destructive**: `hsl(0 84.2% 60.2%)` - Used for dangerous actions, errors.
- **Muted**: `hsl(240 5% 94%)` - Used for backgrounds, borders, disabled states.

### Text Colors
- `text-foreground`: Primary text (Oxford Blue)
- `text-muted-foreground`: Secondary text (Gray)

## Typography Scale

### Headings (New)
- **H1**: `text-3xl font-bold tracking-tight` - Page titles
- **H2**: `text-2xl font-semibold tracking-tight` - Section titles
- **H3**: `text-xl font-semibold` - Card titles
- **H4**: `text-lg font-medium` - Subsections

### Body Text
- Default: `text-base` (16px)
- Small: `text-sm` (14px)
- Extra small: `text-xs` (12px)

## Spacing Scale
- Card padding: `p-6`
- Section spacing: `space-y-6`
- List item spacing: `space-y-4`
- Inline elements: `gap-2` or `gap-4`
- Page margins: `p-4 md:p-6 lg:p-8`

## UI Patterns

### Action Menus
- Use `AdaptiveActionMenu` for list items.
- Displays as **Buttons on Desktop** (hover).
- Displays as **Dropdown on Mobile**.

### Dialogs vs Sheets
- Use `ResponsiveModal` wrapper.
- **Desktop**: Dialog (centered modal).
- **Mobile**: Sheet (bottom drawer).

### Empty States
- Use `EmptyState` component for lists with no items.
- Always provide a call to action (e.g., "Create Task").

### Loading States
- Use `LoadingButton` for async actions.
- Use `SkeletonPulse` for initial page loads.
