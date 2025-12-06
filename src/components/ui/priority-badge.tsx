
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface PriorityBadgeProps {
    priority: "Low" | "Medium" | "High" | string;
    className?: string;
}

export function PriorityBadge({ priority, className }: PriorityBadgeProps) {
    const normalizedPriority = priority.charAt(0).toUpperCase() + priority.slice(1).toLowerCase();

    const variants: Record<string, string> = {
        Low: "border-blue-500 text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/20",
        Medium: "border-yellow-500 text-yellow-700 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-950/20",
        High: "border-red-500 text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/20",
    };

    const style = variants[normalizedPriority] || "border-gray-500 text-gray-700";

    return (
        <Badge variant="outline" className={cn("border-l-4 pl-2 font-medium", style, className)}>
            {normalizedPriority}
        </Badge>
    );
}
