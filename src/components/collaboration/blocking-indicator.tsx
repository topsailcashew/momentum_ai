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
