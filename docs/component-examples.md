# Component Examples

## LoadingButton
A button that handles loading state automatically.

```tsx
import { LoadingButton } from "@/components/ui/loading-button";

// Usage
<LoadingButton loading={isLoading} onClick={handleClick}>
  Save Changes
</LoadingButton>
```

## EmptyState
Standardized empty state with icon and action.

```tsx
import { EmptyState } from "@/components/ui/empty-state";
import { ListTodo } from "lucide-react";

// Usage
<EmptyState
  icon={<ListTodo className="h-12 w-12" />}
  title="No tasks found"
  description="Get started by creating your first task."
  action={{
    label: "Create Task",
    onClick: () => setIsOpen(true)
  }}
/>
```

## PriorityBadge
Consistent priority coloring.

```tsx
import { PriorityBadge } from "@/components/ui/priority-badge";

// Usage
<PriorityBadge priority="High" />
```

## AdaptiveActionMenu
Responsive actions for lists.

```tsx
import { AdaptiveActionMenu } from "@/components/ui/adaptive-action-menu";

// Usage
<AdaptiveActionMenu
  actions={[
    {
      label: "Edit",
      icon: <EditIcon />,
      onClick: handleEdit
    },
    {
      label: "Delete",
      icon: <TrashIcon />,
      onClick: handleDelete,
      variant: "destructive"
    }
  ]}
/>
```
