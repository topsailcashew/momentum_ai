/**
 * Script to create a test report for a past date
 * Run with: npx tsx scripts/seed-test-report.ts
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { format, subDays } from 'date-fns';

// Initialize Firebase Admin
const serviceAccount = require('../momentum-ai-firebase-adminsdk.json');

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

async function seedTestReport() {
  // Use a date from last week (November 18, 2024)
  const testDate = '2024-11-18';
  
  // Replace with your actual user ID - you'll need to get this from Firebase Auth
  const userId = process.env.TEST_USER_ID || 'YOUR_USER_ID_HERE';
  
  if (userId === 'YOUR_USER_ID_HERE') {
    console.error('Please set TEST_USER_ID environment variable or update the script');
    process.exit(1);
  }

  console.log(`Creating test report for ${testDate} for user ${userId}`);

  // Create some test tasks for that date
  const tasksRef = db.collection('users').doc(userId).collection('tasks');
  
  const task1 = await tasksRef.add({
    userId,
    name: 'Complete project documentation',
    category: 'work',
    energyLevel: 'High',
    completed: true,
    completedAt: `${testDate}T14:30:00Z`,
    createdAt: `${testDate}T09:00:00Z`,
    priority: 'Urgent & Important'
  });

  const task2 = await tasksRef.add({
    userId,
    name: 'Team meeting',
    category: 'work',
    energyLevel: 'Medium',
    completed: true,
    completedAt: `${testDate}T11:00:00Z`,
    createdAt: `${testDate}T09:00:00Z`,
    collaboration: 'Development Team',
    priority: 'Important & Not Urgent'
  });

  const task3 = await tasksRef.add({
    userId,
    name: 'Code review',
    category: 'work',
    energyLevel: 'High',
    completed: false,
    completedAt: null,
    createdAt: `${testDate}T09:00:00Z`,
    deadline: `${testDate}T17:00:00Z`,
    priority: 'Urgent & Important'
  });

  console.log('Created test tasks:', task1.id, task2.id, task3.id);

  // Create a test report
  const reportRef = db.collection('users').doc(userId).collection('reports').doc(testDate);
  
  await reportRef.set({
    date: testDate,
    userId,
    startTime: `${testDate}T09:00:00Z`,
    endTime: `${testDate}T17:00:00Z`,
    generatedReport: `## Daily Summary for ${testDate}\n\nToday was a productive day! I completed 2 out of 3 planned tasks.\n\n### Completed Tasks\n- ✅ Complete project documentation (High energy)\n- ✅ Team meeting (Medium energy)\n\n### Incomplete Tasks\n- ❌ Code review (High energy) - Will prioritize tomorrow\n\n### Reflections\nGood alignment with energy levels. The documentation work went smoothly during my high-energy morning hours. The team meeting was productive and we made key decisions about the upcoming sprint.`,
    goals: 3,
    completed: 2,
    taskNotes: {
      [task1.id]: 'Finished all sections including API documentation',
      [task2.id]: 'Discussed sprint planning and resource allocation',
      [task3.id]: 'Ran out of time, will complete tomorrow morning'
    },
    completedTaskIds: [task1.id, task2.id],
    incompletedTaskIds: [task3.id]
  });

  console.log(`✅ Test report created for ${testDate}`);
  console.log('You can now view it at http://localhost:3000/reports');
  
  process.exit(0);
}

seedTestReport().catch(error => {
  console.error('Error seeding test report:', error);
  process.exit(1);
});
