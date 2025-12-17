'use client';

import * as React from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Battery, BatteryMedium, BatteryLow, Zap, Target, ChevronRight } from 'lucide-react';
import type { Task, EnergyLevel } from '@/lib/types';
import { cn } from '@/lib/utils';

interface EnergyCheckModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onEnergySelected: (energy: EnergyLevel, selectedTask?: Task) => void;
    availableTasks: Task[];
}

export function EnergyCheckModal({ open, onOpenChange, onEnergySelected, availableTasks }: EnergyCheckModalProps) {
    const [selectedEnergy, setSelectedEnergy] = React.useState<EnergyLevel | null>(null);
    const [step, setStep] = React.useState<'select-energy' | 'select-task'>('select-energy');

    const handleEnergySelect = (energy: EnergyLevel) => {
        setSelectedEnergy(energy);
        setStep('select-task');
    };

    const handleTaskSelect = (task: Task) => {
        if (selectedEnergy) {
            onEnergySelected(selectedEnergy, task);
            resetAndClose();
        }
    };

    const handleSkipTaskSelection = () => {
        if (selectedEnergy) {
            onEnergySelected(selectedEnergy);
            resetAndClose();
        }
    };

    const resetAndClose = () => {
        setSelectedEnergy(null);
        setStep('select-energy');
        onOpenChange(false);
    };

    const handleBack = () => {
        setStep('select-energy');
    };

    // Filter tasks by selected energy level
    const suggestedTasks = React.useMemo(() => {
        if (!selectedEnergy) return [];
        return availableTasks.filter(task => task.energyLevel === selectedEnergy);
    }, [selectedEnergy, availableTasks]);

    const energyOptions: Array<{
        level: EnergyLevel;
        icon: React.ReactNode;
        color: string;
        bgColor: string;
        label: string;
        description: string;
    }> = [
        {
            level: 'High',
            icon: <Battery className="h-8 w-8" />,
            color: 'text-green-600',
            bgColor: 'bg-green-50 hover:bg-green-100 dark:bg-green-950/20 dark:hover:bg-green-950/30 border-green-200',
            label: 'High Energy',
            description: 'Feeling energized and ready for challenging tasks'
        },
        {
            level: 'Medium',
            icon: <BatteryMedium className="h-8 w-8" />,
            color: 'text-yellow-600',
            bgColor: 'bg-yellow-50 hover:bg-yellow-100 dark:bg-yellow-950/20 dark:hover:bg-yellow-950/30 border-yellow-200',
            label: 'Medium Energy',
            description: 'Steady pace, good for moderate tasks'
        },
        {
            level: 'Low',
            icon: <BatteryLow className="h-8 w-8" />,
            color: 'text-orange-600',
            bgColor: 'bg-orange-50 hover:bg-orange-100 dark:bg-orange-950/20 dark:hover:bg-orange-950/30 border-orange-200',
            label: 'Low Energy',
            description: 'Taking it easy, focus on lighter tasks'
        }
    ];

    return (
        <Dialog open={open} onOpenChange={resetAndClose}>
            <DialogContent className="max-w-2xl">
                {step === 'select-energy' && (
                    <>
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 text-2xl">
                                <Zap className="h-6 w-6 text-primary" />
                                How's your energy level?
                            </DialogTitle>
                            <DialogDescription>
                                Help us suggest the right tasks for your current state
                            </DialogDescription>
                        </DialogHeader>

                        <div className="grid gap-4 py-4">
                            {energyOptions.map((option) => (
                                <button
                                    key={option.level}
                                    onClick={() => handleEnergySelect(option.level)}
                                    className={cn(
                                        "flex items-center gap-4 p-6 rounded-lg border-2 transition-all text-left",
                                        option.bgColor
                                    )}
                                >
                                    <div className={option.color}>
                                        {option.icon}
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-lg">{option.label}</h3>
                                        <p className="text-sm text-muted-foreground">{option.description}</p>
                                    </div>
                                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                                </button>
                            ))}
                        </div>
                    </>
                )}

                {step === 'select-task' && (
                    <>
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <Target className="h-5 w-5 text-primary" />
                                Suggested Tasks for {selectedEnergy} Energy
                            </DialogTitle>
                            <DialogDescription>
                                Pick a task to focus on, or skip to just update your energy level
                            </DialogDescription>
                        </DialogHeader>

                        <div className="py-4 space-y-3 max-h-[400px] overflow-y-auto">
                            {suggestedTasks.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    <Target className="h-12 w-12 mx-auto mb-3 opacity-20" />
                                    <p className="text-sm">No tasks match your current energy level</p>
                                    <p className="text-xs mt-1">You can still update your energy and continue working</p>
                                </div>
                            ) : (
                                suggestedTasks.map((task) => (
                                    <button
                                        key={task.id}
                                        onClick={() => handleTaskSelect(task)}
                                        className="w-full flex items-start gap-3 p-4 rounded-lg border bg-background hover:bg-accent/50 transition-colors text-left"
                                    >
                                        <div className="flex-1">
                                            <h4 className="font-medium">{task.name}</h4>
                                            <div className="flex flex-wrap gap-2 mt-2">
                                                {task.category && (
                                                    <Badge variant="secondary" className="text-xs">
                                                        {task.category}
                                                    </Badge>
                                                )}
                                                {task.priority && (
                                                    <Badge variant="outline" className="text-xs">
                                                        {task.priority}
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                        <ChevronRight className="h-5 w-5 text-muted-foreground mt-1" />
                                    </button>
                                ))
                            )}
                        </div>

                        <div className="flex gap-2 pt-4 border-t">
                            <Button variant="outline" onClick={handleBack} className="flex-1">
                                Back
                            </Button>
                            <Button onClick={handleSkipTaskSelection} className="flex-1">
                                Skip Task Selection
                            </Button>
                        </div>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}
