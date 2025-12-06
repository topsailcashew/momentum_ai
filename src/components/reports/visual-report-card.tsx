'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DailyReport, Task } from '@/lib/types';
import { format, parseISO } from 'date-fns';
import { CheckCircle2, Goal, Hourglass } from 'lucide-react';
import { RadialBarChart, RadialBar, PolarAngleAxis } from 'recharts';
import { ChartContainer } from '@/components/ui/chart';
import { ReportTable } from './report-table';

interface VisualReportCardProps {
    report: DailyReport;
    tasks: Task[];
}

const StatItem = ({ icon, title, value }: { icon: React.ElementType, title: string, value: string | number }) => {
    const Icon = icon;
    return (
        <div className="flex flex-col items-center gap-1.5 text-muted-foreground p-2 rounded-md bg-background/50 text-center">
            <Icon className="size-5" />
            <span className="text-xs">{title}</span>
            <span className="font-bold text-lg text-foreground">
                {value}
            </span>
        </div>
    );
};

export function VisualReportCard({ report, tasks }: VisualReportCardProps) {
    const completedTasks = tasks.filter(t => t.completed).length;
    const totalTasks = tasks.length;
    const inProgressTasks = totalTasks - completedTasks;

    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    const chartData = [
        { name: 'Completion', value: completionRate, fill: "hsl(var(--primary))" }
    ];

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <p className="text-sm font-medium text-muted-foreground text-center mb-2">Work Hours</p>
                    <div className="flex flex-col items-center gap-2 text-center p-4 rounded-lg bg-background/50">
                        <div>
                            <p className="text-xs text-muted-foreground">Start</p>
                            <p className="font-semibold">{report.startTime ? format(parseISO(report.startTime), 'p') : 'N/A'}</p>
                        </div>
                        <div className="w-full h-px bg-border"></div>
                        <div>
                            <p className="text-xs text-muted-foreground">End</p>
                            <p className="font-semibold">{report.endTime ? format(parseISO(report.endTime), 'p') : 'N/A'}</p>
                        </div>
                    </div>
                </div>
                <div className="flex flex-col items-center">
                    <p className="text-sm font-medium text-muted-foreground text-center mb-2">Completion</p>
                    <ChartContainer
                        config={{}}
                        className="mx-auto aspect-square h-full w-full max-w-[120px]"
                    >
                        <RadialBarChart
                            data={chartData}
                            startAngle={90}
                            endAngle={-270}
                            innerRadius="75%"
                            outerRadius="100%"
                            barSize={10}
                        >
                            <PolarAngleAxis
                                type="number"
                                domain={[0, 100]}
                                dataKey="value"
                                tick={false}
                            />
                            <RadialBar
                                dataKey="value"
                                background
                                cornerRadius={10}
                            />
                            <text
                                x="50%"
                                y="50%"
                                textAnchor="middle"
                                dominantBaseline="middle"
                                className="fill-foreground text-xl font-bold"
                            >
                                {completionRate}%
                            </text>
                        </RadialBarChart>
                    </ChartContainer>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
                <StatItem icon={Goal} title="Goals" value={totalTasks} />
                <StatItem icon={CheckCircle2} title="Completed" value={completedTasks} />
                <StatItem icon={Hourglass} title="In Progress" value={inProgressTasks} />
            </div>

            <div className="pt-2">
                <h3 className="font-semibold mb-3">Task Breakdown</h3>
                <ReportTable tasks={tasks} report={report} />
            </div>

            {report.generatedReport && (
                <div className="pt-2">
                    <h3 className="font-semibold mb-3">AI Summary</h3>
                    <div className="prose prose-sm dark:prose-invert max-w-none bg-secondary/30 p-4 rounded-lg whitespace-pre-wrap">
                        {report.generatedReport}
                    </div>
                </div>
            )}
        </div>
    )
}
