'use client';

import { Battery, BatteryMedium, BatteryLow } from 'lucide-react';
import type { EnergyLevel } from '@/lib/types';
import { cn } from '@/lib/utils';

interface EnergyBatteryIconProps {
    energyLevel: EnergyLevel | null;
    className?: string;
    showLabel?: boolean;
}

export function EnergyBatteryIcon({ energyLevel, className, showLabel = false }: EnergyBatteryIconProps) {
    if (!energyLevel) {
        return (
            <div className={cn("flex items-center gap-2 text-muted-foreground", className)}>
                <BatteryMedium className="h-5 w-5" />
                {showLabel && <span className="text-sm">No energy data</span>}
            </div>
        );
    }

    const energyConfig = {
        High: {
            icon: Battery,
            color: 'text-green-600 dark:text-green-400',
            bgColor: 'bg-green-50 dark:bg-green-950/20',
            label: 'High Energy'
        },
        Medium: {
            icon: BatteryMedium,
            color: 'text-yellow-600 dark:text-yellow-400',
            bgColor: 'bg-yellow-50 dark:bg-yellow-950/20',
            label: 'Medium Energy'
        },
        Low: {
            icon: BatteryLow,
            color: 'text-orange-600 dark:text-orange-400',
            bgColor: 'bg-orange-50 dark:bg-orange-950/20',
            label: 'Low Energy'
        }
    };

    const config = energyConfig[energyLevel];
    const Icon = config.icon;

    return (
        <div className={cn("flex items-center gap-2", className)}>
            <div className={cn("p-2 rounded-lg", config.bgColor)}>
                <Icon className={cn("h-5 w-5", config.color)} />
            </div>
            {showLabel && (
                <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground">Current Energy</span>
                    <span className={cn("text-sm font-medium", config.color)}>
                        {config.label}
                    </span>
                </div>
            )}
        </div>
    );
}
