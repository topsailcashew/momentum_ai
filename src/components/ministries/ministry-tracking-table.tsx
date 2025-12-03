'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { Ministry, Project, Task } from '@/lib/types';
import { format } from 'date-fns';
import { Download, Search } from 'lucide-react';

interface MinistryTrackingTableProps {
  ministry: Ministry;
  projects: Project[];
  tasks: Task[];
}

interface TableRow {
  ministryName: string;
  projectName: string;
  taskName: string;
  owner: string;
  startDate: string;
  dueDate: string;
  priority: string;
  status: string;
  notes: string;
}

export function MinistryTrackingTable({ ministry, projects, tasks }: MinistryTrackingTableProps) {
  const [searchTerm, setSearchTerm] = React.useState('');

  const tableData: TableRow[] = React.useMemo(() => {
    return tasks.map(task => {
      const project = projects.find(p => p.id === task.projectId);
      return {
        ministryName: ministry.name,
        projectName: project?.name || 'No Project',
        taskName: task.name,
        owner: task.owner || project?.owner || '-',
        startDate: task.startDate || project?.startDate || '-',
        dueDate: task.deadline || project?.dueDate || '-',
        priority: task.priority || project?.priority || '-',
        status: task.status || (task.completed ? 'completed' : 'not-started'),
        notes: task.notes || '-',
      };
    });
  }, [ministry, projects, tasks]);

  const filteredData = React.useMemo(() => {
    if (!searchTerm) return tableData;

    const term = searchTerm.toLowerCase();
    return tableData.filter(row =>
      row.taskName.toLowerCase().includes(term) ||
      row.projectName.toLowerCase().includes(term) ||
      row.owner.toLowerCase().includes(term) ||
      row.status.toLowerCase().includes(term)
    );
  }, [tableData, searchTerm]);

  const exportToCSV = () => {
    const headers = ['Ministry', 'Project', 'Task', 'Owner', 'Start Date', 'Due Date', 'Priority', 'Status', 'Updates/Notes'];
    const csvContent = [
      headers.join(','),
      ...filteredData.map(row => [
        `"${row.ministryName}"`,
        `"${row.projectName}"`,
        `"${row.taskName}"`,
        `"${row.owner}"`,
        `"${row.startDate}"`,
        `"${row.dueDate}"`,
        `"${row.priority}"`,
        `"${row.status}"`,
        `"${row.notes}"`,
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${ministry.name}_tracking_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'completed':
        return 'default';
      case 'in-progress':
        return 'secondary';
      case 'blocked':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getPriorityBadgeVariant = (priority: string) => {
    switch (priority) {
      case 'High':
      case 'Urgent & Important':
        return 'destructive';
      case 'Medium':
      case 'Important & Not Urgent':
        return 'default';
      case 'Low':
      case 'Urgent & Not Important':
      case 'Not Urgent & Not Important':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>Ministry Tracking Table</CardTitle>
            <CardDescription>
              Track all tasks, projects, and owners in one comprehensive view
            </CardDescription>
          </div>
          <Button onClick={exportToCSV} variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
        <div className="flex items-center gap-4 pt-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tasks, projects, owners..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="text-sm text-muted-foreground">
            {filteredData.length} {filteredData.length === 1 ? 'task' : 'tasks'}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ministry</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Task</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="max-w-xs">Updates/Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    {searchTerm ? 'No tasks match your search.' : 'No tasks yet. Create tasks for this ministry to see them here.'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredData.map((row, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{row.ministryName}</TableCell>
                    <TableCell>{row.projectName}</TableCell>
                    <TableCell>{row.taskName}</TableCell>
                    <TableCell>{row.owner}</TableCell>
                    <TableCell>
                      {row.startDate !== '-' ? format(new Date(row.startDate), 'MMM d, yyyy') : '-'}
                    </TableCell>
                    <TableCell>
                      {row.dueDate !== '-' ? format(new Date(row.dueDate), 'MMM d, yyyy') : '-'}
                    </TableCell>
                    <TableCell>
                      {row.priority !== '-' ? (
                        <Badge variant={getPriorityBadgeVariant(row.priority)} className="text-xs">
                          {row.priority}
                        </Badge>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(row.status)} className="text-xs">
                        {row.status.replace('-', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <div className="line-clamp-2 text-sm text-muted-foreground">
                        {row.notes}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
