import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Circle, Clock } from 'lucide-react';
import type { Task, DailyReport } from '@/lib/types';
import { formatTime } from '@/lib/utils';

interface ReportTableProps {
    tasks: Task[];
    report: DailyReport;
}

export function ReportTable({ tasks, report }: ReportTableProps) {
    // Merge task data with report specific data (notes, time spent etc if available)
    // For now, we rely on task object properties mostly.
    // We can look up notes from report.taskNotes if available.

    const getStatusIcon = (completed: boolean) => {
        return completed ? (
            <CheckCircle2 className="h-4 w-4 text-green-500" />
        ) : (
            <Circle className="h-4 w-4 text-amber-500" />
        );
    };

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[30px]"></TableHead>
                        <TableHead>Task</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Energy</TableHead>
                        {/* <TableHead>Time</TableHead> */}
                        <TableHead className="w-[40%]">Notes</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {tasks.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                                No tasks recorded for this day.
                            </TableCell>
                        </TableRow>
                    ) : (
                        tasks.map((task) => {
                            // Try to find notes in report.taskNotes if stored there by ID
                            const note = report.taskNotes?.[task.id] || task.notes;

                            return (
                                <TableRow key={task.id}>
                                    <TableCell>{getStatusIcon(task.completed)}</TableCell>
                                    <TableCell className="font-medium">{task.name}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="capitalize">
                                            {task.category || 'Personal'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{task.energyLevel}</TableCell>
                                    {/* <TableCell>
                    {task.focusedTimeMs ? formatTime(task.focusedTimeMs) : '-'}
                  </TableCell> */}
                                    <TableCell className="text-sm text-muted-foreground whitespace-pre-wrap">
                                        {note || '-'}
                                    </TableCell>
                                </TableRow>
                            );
                        })
                    )}
                </TableBody>
            </Table>
        </div>
    );
}
