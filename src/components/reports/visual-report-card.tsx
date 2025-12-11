'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DailyReport, Task } from '@/lib/types';
import { format, parseISO } from 'date-fns';
import { CheckCircle2, Goal, Hourglass } from 'lucide-react';
import { RadialBarChart, RadialBar, PolarAngleAxis } from 'recharts';
import { ChartContainer } from '@/components/ui/chart';
import { ReportTable } from './report-table';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

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
        <div className="space-y-4">
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 items-center">
                <div className="grid grid-cols-3 gap-2">
                    <StatItem icon={Goal} title="Goals" value={totalTasks} />
                    <StatItem icon={CheckCircle2} title="Done" value={completedTasks} />
                    <StatItem icon={Hourglass} title="Pending" value={inProgressTasks} />
                </div>

                <div className="hidden md:block w-px h-24 bg-border"></div>

                <div className="flex items-center justify-center gap-6">
                    <div className="flex flex-col items-center">
                        <ChartContainer
                            config={{}}
                            className="mx-auto aspect-square w-full max-w-[100px]"
                        >
                            <RadialBarChart
                                data={chartData}
                                startAngle={90}
                                endAngle={-270}
                                innerRadius="70%"
                                outerRadius="100%"
                                barSize={8}
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
                                    className="fill-foreground text-lg font-bold"
                                >
                                    {completionRate}%
                                </text>
                            </RadialBarChart>
                        </ChartContainer>
                        <p className="text-xs text-muted-foreground mt-1">Completion</p>
                    </div>

                    <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">Start:</span>
                            <span className="text-sm font-semibold">{report.startTime ? format(parseISO(report.startTime), 'p') : 'N/A'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">End:</span>
                            <span className="text-sm font-semibold">{report.endTime ? format(parseISO(report.endTime), 'p') : 'N/A'}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* AI Summary - Show first if available */}
            {report.generatedReport && (
                <div>
                    <h3 className="font-semibold mb-2 text-sm">AI Summary</h3>
                    <div className="prose prose-sm dark:prose-invert max-w-none bg-secondary/30 p-3 rounded-lg">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {report.generatedReport}
                        </ReactMarkdown>
                    </div>
                </div>
            )}

            {/* Task Breakdown */}
            <div>
                <h3 className="font-semibold mb-2 text-sm">Task Breakdown</h3>
                <ReportTable tasks={tasks} report={report} />
            </div>
        </div>
    )
}
