import * as React from "react";
import { MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

interface Action {
    label: string;
    icon: React.ReactNode;
    onClick: (e: React.MouseEvent) => void;
    variant?: "default" | "destructive" | "ghost" | "secondary";
}

interface AdaptiveActionMenuProps {
    actions: Action[];
    className?: string;
}

export function AdaptiveActionMenu({ actions, className }: AdaptiveActionMenuProps) {
    return (
        <div className={cn("flex items-center", className)}>
            {/* Desktop View: Hover buttons */}
            <div className="hidden sm:flex items-center gap-1">
                <TooltipProvider>
                    {actions.map((action, index) => (
                        <Tooltip key={index}>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className={cn(
                                        "h-8 w-8 transition-opacity",
                                        action.variant === 'destructive' && "text-destructive hover:text-destructive hover:bg-destructive/10"
                                    )}
                                    onClick={action.onClick}
                                >
                                    {action.icon}
                                    <span className="sr-only">{action.label}</span>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>{action.label}</p>
                            </TooltipContent>
                        </Tooltip>
                    ))}
                </TooltipProvider>
            </div>

            {/* Mobile View: Dropdown Menu */}
            <div className="sm:hidden">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                            <span className="sr-only">Open menu</span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        {actions.map((action, index) => (
                            <DropdownMenuItem
                                key={index}
                                onClick={action.onClick}
                                className={action.variant === 'destructive' ? 'text-destructive focus:text-destructive focus:bg-destructive/10' : ''}
                            >
                                <span className="mr-2 flex items-center justify-center [&>svg]:h-4 [&>svg]:w-4">
                                    {action.icon}
                                </span>
                                {action.label}
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    );
}
