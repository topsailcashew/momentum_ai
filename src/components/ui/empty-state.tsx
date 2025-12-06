
import * as React from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface EmptyStateProps {
    icon?: React.ReactNode
    title: string
    description: string
    action?: {
        label: string
        onClick: () => void
    }
    secondaryAction?: {
        label: string
        onClick: () => void
    }
    className?: string
}

export function EmptyState({
    icon,
    title,
    description,
    action,
    secondaryAction,
    className
}: EmptyStateProps) {
    return (
        <Card className={cn("border-dashed", className)}>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                {icon && <div className="text-muted-foreground mb-4 opacity-50">{icon}</div>}
                <h3 className="text-xl font-semibold mb-2 tracking-tight">{title}</h3>
                <p className="text-muted-foreground max-w-sm mb-6 text-sm">
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
    )
}
