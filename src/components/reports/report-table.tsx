import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Circle, Clock, Users } from 'lucide-react';
import type { Task, DailyReport } from '@/lib/types';

interface ReportTableProps {
    tasks: Task[];
    report: DailyReport;
}

export function ReportTable({ tasks, report }: ReportTableProps) {
    const getStatusBadge = (task: Task) => {
        if (task.completed) {
            return <Badge variant="default" className="bg-green-600">Complete</Badge>;
        } else if (task.state === 'in_progress') {
            return <Badge variant="secondary">In Progress</Badge>;
        } else {
            return <Badge variant="outline">Not Started</Badge>;
        }
    };

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[30%]">Task</TableHead>
                        <TableHead className="w-[15%]">Status</TableHead>
                        <TableHead className="w-[20%]">Collaborations</TableHead>
                        <TableHead className="w-[35%]">Notes</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {tasks.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                                No tasks recorded for this day.
                            </TableCell>
                        </TableRow>
                    ) : (
                        tasks.map((task) => {
                            // Try to find notes in report.taskNotes if stored there by ID
                            const note = report.taskNotes?.[task.id] || task.notes;

                            return (
                                <TableRow key={task.id}>
                                    <TableCell className="font-medium">{task.name}</TableCell>
                                    <TableCell>{getStatusBadge(task)}</TableCell>
                                    <TableCell>
                                        {task.collaboration ? (
                                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                                <Users className="h-3 w-3" />
                                                <span>{task.collaboration}</span>
                                            </div>
                                        ) : (
                                            <span className="text-sm text-muted-foreground">-</span>
                                        )}
                                    </TableCell>
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
