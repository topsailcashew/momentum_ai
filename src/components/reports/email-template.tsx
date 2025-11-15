import * as React from 'react';
import { DailyReport, Task } from '@/lib/types';
import { format, parseISO } from 'date-fns';

interface EmailTemplateProps {
  userName: string;
  report: DailyReport;
  tasks: Task[];
  aiSummary: string;
  greeting: string;
  collaborators: string[];
}

const container = {
  fontFamily: 'Arial, sans-serif',
  color: '#333',
  lineHeight: '1.6',
};

const h2 = {
  color: '#0D3B66',
  borderBottom: '1px solid #eee',
  paddingBottom: '5px',
};

const strong = {
  color: '#0D3B66',
};

const ul = {
    paddingLeft: '20px',
};

const li = {
    marginBottom: '5px',
};

export const EmailTemplate: React.FC<Readonly<EmailTemplateProps>> = ({
  userName,
  report,
  tasks,
  aiSummary,
  greeting,
  collaborators,
}) => {
    const completedTasks = tasks.filter(t => t.completed);
    const uncompletedTasks = tasks.filter(t => !t.completed);

    return (
        <div style={container}>
        <p>{greeting}</p>
        <p>{aiSummary}</p>

        <h2 style={h2}>Daily Summary</h2>
        <p><strong style={strong}>Start Work Time:</strong> {report.startTime ? format(parseISO(report.startTime), 'p') : 'Not set'}</p>
        <p><strong style={strong}>End Work Time:</strong> {report.endTime ? format(parseISO(report.endTime), 'p') : 'Not set'}</p>

        <h2 style={h2}>Daily Goals</h2>
        <ul style={ul}>
            {tasks.map(task => <li style={li} key={task.id}>{task.name}</li>)}
        </ul>
        
        {completedTasks.length > 0 && (
            <>
                <h2 style={h2}>Completed Tasks</h2>
                <ul style={ul}>
                    {completedTasks.map(task => <li style={li} key={task.id}>{task.name}</li>)}
                </ul>
            </>
        )}

        {uncompletedTasks.length > 0 && (
            <>
                <h2 style={h2}>Uncompleted Tasks &amp; Plans for Completion</h2>
                <ul style={ul}>
                    {uncompletedTasks.map(task => <li style={li} key={task.id}>{task.name}</li>)}
                </ul>
            </>
        )}

        {collaborators.length > 0 && (
             <>
                <h2 style={h2}>Collaborations with Other Staff Members</h2>
                <ul style={ul}>
                    {collaborators.map(name => <li style={li} key={name}>Worked with {name}</li>)}
                </ul>
            </>
        )}
        

        <p>Best regards,</p>
        <p>{userName}</p>
        </div>
    );
};
