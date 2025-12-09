# Migration: Add State Fields to Tasks

**Date:** 2025-12-09

## Overview

This migration adds state management fields to all existing tasks.

## Required Fields

All tasks need:
- `state`: TaskState (default: 'ready')
- `stateHistory`: StateHistoryEntry[] (default: empty array)

## Migration Script

Run this script in Firebase Console or via Admin SDK:

```typescript
import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const db = getFirestore();

async function migrateTaskStates() {
  const usersSnapshot = await db.collection('users').get();

  for (const userDoc of usersSnapshot.docs) {
    const tasksSnapshot = await db
      .collection(`users/${userDoc.id}/tasks`)
      .get();

    const batch = db.batch();
    let batchCount = 0;

    for (const taskDoc of tasksSnapshot.docs) {
      const taskData = taskDoc.data();

      // Skip if already has state
      if (taskData.state) continue;

      batch.update(taskDoc.ref, {
        state: taskData.completed ? 'done' : 'ready',
        stateHistory: [],
      });

      batchCount++;

      // Commit in batches of 500
      if (batchCount === 500) {
        await batch.commit();
        batchCount = 0;
      }
    }

    if (batchCount > 0) {
      await batch.commit();
    }

    console.log(`Migrated tasks for user ${userDoc.id}`);
  }

  console.log('Migration complete!');
}

migrateTaskStates().catch(console.error);
```

## Rollback

To rollback, remove the fields:

```typescript
batch.update(taskDoc.ref, {
  state: FieldValue.delete(),
  stateHistory: FieldValue.delete(),
  assignedTo: FieldValue.delete(),
  assignedToName: FieldValue.delete(),
  assignedToPhotoURL: FieldValue.delete(),
  waitingOn: FieldValue.delete(),
  blockedTasks: FieldValue.delete(),
});
```

## Testing

After migration:
1. Verify all tasks have `state` field
2. Check state badge displays correctly
3. Test state transitions
4. Verify state history is recorded
