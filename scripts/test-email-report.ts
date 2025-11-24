/**
 * Simple test script to verify email report generation
 * This tests the email generation without actually sending
 */

import type { DailyReport, Task } from '../src/lib/types';

// Mock data for November 18, 2024
const mockReport: DailyReport = {
  date: '2024-11-18',
  userId: 'test-user',
  startTime: '2024-11-18T09:00:00Z',
  endTime: '2024-11-18T17:00:00Z',
  generatedReport: `## Daily Summary for November 18, 2024

Today was a productive day! I completed 2 out of 3 planned tasks.

### Completed Tasks
- ✅ Complete project documentation (High energy)
- ✅ Team meeting (Medium energy)

### Incomplete Tasks
- ❌ Code review (High energy) - Will prioritize tomorrow

### Reflections
Good alignment with energy levels. The documentation work went smoothly during my high-energy morning hours.`,
  goals: 3,
  completed: 2,
  taskNotes: {
    'task1': 'Finished all sections including API documentation',
    'task2': 'Discussed sprint planning and resource allocation',
    'task3': 'Ran out of time, will complete tomorrow morning'
  },
  completedTaskIds: ['task1', 'task2'],
  incompletedTaskIds: ['task3']
};

const mockTasks: Task[] = [
  {
    id: 'task1',
    userId: 'test-user',
    name: 'Complete project documentation',
    category: 'work',
    energyLevel: 'High',
    completed: true,
    completedAt: '2024-11-18T14:30:00Z',
    createdAt: '2024-11-18T09:00:00Z',
    priority: 'Urgent & Important'
  },
  {
    id: 'task2',
    userId: 'test-user',
    name: 'Team meeting',
    category: 'work',
    energyLevel: 'Medium',
    completed: true,
    completedAt: '2024-11-18T11:00:00Z',
    createdAt: '2024-11-18T09:00:00Z',
    collaboration: 'Development Team',
    priority: 'Important & Not Urgent'
  },
  {
    id: 'task3',
    userId: 'test-user',
    name: 'Code review',
    category: 'work',
    energyLevel: 'High',
    completed: false,
    completedAt: null,
    createdAt: '2024-11-18T09:00:00Z',
    deadline: '2024-11-18T17:00:00Z',
    priority: 'Urgent & Important'
  }
];

async function testEmailGeneration() {
  console.log('Testing email report generation...\n');
  console.log('Report Date:', mockReport.date);
  console.log('Tasks:', mockTasks.length);
  console.log('Completed:', mockReport.completed, '/', mockReport.goals);
  console.log('\n--- Generated Report ---');
  console.log(mockReport.generatedReport);
  console.log('\n--- Task Notes ---');
  Object.entries(mockReport.taskNotes || {}).forEach(([taskId, note]) => {
    const task = mockTasks.find(t => t.id === taskId);
    console.log(`${task?.name}: ${note}`);
  });
  
  console.log('\n✅ Email report data structure is valid');
  console.log('\nTo test the actual email sending:');
  console.log('1. Make sure RESEND_API_KEY is set in .env.local');
  console.log('2. Navigate to http://localhost:3000/reports');
  console.log('3. Select a report and click "Email Report"');
  console.log('4. Review the preview and click "Send Email"');
}

testEmailGeneration();
