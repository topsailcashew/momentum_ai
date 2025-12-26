import { describe, it, expect } from 'vitest';
import { cn, getProjectProgress, formatTime } from './utils';
import { createMockTask } from '@/test/fixtures';

describe('cn (className utility)', () => {
  it('should merge class names', () => {
    const result = cn('px-4', 'py-2');
    expect(result).toBe('px-4 py-2');
  });

  it('should handle conditional classes', () => {
    const result = cn('base', true && 'active', false && 'disabled');
    expect(result).toBe('base active');
  });

  it('should merge tailwind classes correctly', () => {
    const result = cn('px-2', 'px-4');
    expect(result).toBe('px-4');
  });

  it('should handle empty inputs', () => {
    const result = cn();
    expect(result).toBe('');
  });
});

describe('getProjectProgress', () => {
  it('should return 0% for project with no tasks', () => {
    const result = getProjectProgress('project-1', []);

    expect(result.percentage).toBe(0);
    expect(result.text).toBe('0/0');
    expect(result.totalTasks).toBe(0);
    expect(result.completedTasks).toBe(0);
  });

  it('should calculate progress correctly for partially completed project', () => {
    const tasks = [
      createMockTask({ projectId: 'project-1', completed: true }),
      createMockTask({ projectId: 'project-1', completed: false }),
      createMockTask({ projectId: 'project-1', completed: false }),
      createMockTask({ projectId: 'project-1', completed: true }),
    ];

    const result = getProjectProgress('project-1', tasks);

    expect(result.percentage).toBe(50);
    expect(result.text).toBe('2/4');
    expect(result.totalTasks).toBe(4);
    expect(result.completedTasks).toBe(2);
  });

  it('should return 100% for fully completed project', () => {
    const tasks = [
      createMockTask({ projectId: 'project-1', completed: true }),
      createMockTask({ projectId: 'project-1', completed: true }),
    ];

    const result = getProjectProgress('project-1', tasks);

    expect(result.percentage).toBe(100);
    expect(result.text).toBe('2/2');
  });

  it('should ignore tasks from other projects', () => {
    const tasks = [
      createMockTask({ projectId: 'project-1', completed: true }),
      createMockTask({ projectId: 'project-2', completed: false }),
      createMockTask({ projectId: 'project-1', completed: false }),
    ];

    const result = getProjectProgress('project-1', tasks);

    expect(result.percentage).toBe(50);
    expect(result.text).toBe('1/2');
    expect(result.totalTasks).toBe(2);
  });

  it('should handle tasks without projectId', () => {
    const tasks = [
      createMockTask({ projectId: 'project-1', completed: true }),
      createMockTask({ projectId: undefined, completed: false }),
    ];

    const result = getProjectProgress('project-1', tasks);

    expect(result.totalTasks).toBe(1);
    expect(result.completedTasks).toBe(1);
  });

  it('should round percentage correctly', () => {
    const tasks = [
      createMockTask({ projectId: 'project-1', completed: true }),
      createMockTask({ projectId: 'project-1', completed: false }),
      createMockTask({ projectId: 'project-1', completed: false }),
    ];

    const result = getProjectProgress('project-1', tasks);

    // 1/3 = 33.333... should round to 33
    expect(result.percentage).toBe(33);
  });

  it('should include progress data for charting', () => {
    const tasks = [
      createMockTask({ projectId: 'project-1', completed: true }),
      createMockTask({ projectId: 'project-1', completed: false }),
    ];

    const result = getProjectProgress('project-1', tasks);

    expect(result.data).toEqual([
      { name: 'Progress', value: 50, fill: 'hsl(var(--primary))' }
    ]);
  });
});

describe('formatTime', () => {
  it('should format zero milliseconds', () => {
    expect(formatTime(0)).toBe('0m');
  });

  it('should handle undefined input', () => {
    expect(formatTime(undefined)).toBe('0m');
  });

  it('should handle null input', () => {
    expect(formatTime(null as any)).toBe('0m');
  });

  it('should format minutes only', () => {
    expect(formatTime(5 * 60000)).toBe('5m'); // 5 minutes
    expect(formatTime(30 * 60000)).toBe('30m'); // 30 minutes
    expect(formatTime(59 * 60000)).toBe('59m'); // 59 minutes
  });

  it('should format hours and minutes', () => {
    expect(formatTime(60 * 60000)).toBe('1h 0m'); // 1 hour
    expect(formatTime(90 * 60000)).toBe('1h 30m'); // 1.5 hours
    expect(formatTime(125 * 60000)).toBe('2h 5m'); // 2 hours 5 minutes
  });

  it('should handle large values', () => {
    expect(formatTime(24 * 60 * 60000)).toBe('24h 0m'); // 24 hours
    expect(formatTime(100 * 60 * 60000)).toBe('100h 0m'); // 100 hours
  });

  it('should floor partial minutes', () => {
    expect(formatTime(30000)).toBe('0m'); // 30 seconds = 0 minutes
    expect(formatTime(89000)).toBe('1m'); // 89 seconds = 1 minute
  });

  it('should handle seconds correctly when converting to minutes', () => {
    expect(formatTime(1 * 60000 + 30000)).toBe('1m'); // 1 min 30 sec = 1 min
    expect(formatTime(2 * 60000 + 59000)).toBe('2m'); // 2 min 59 sec = 2 min
  });

  it('should handle edge case of exactly one hour', () => {
    expect(formatTime(3600000)).toBe('1h 0m');
  });

  it('should format mixed hours and minutes correctly', () => {
    expect(formatTime(3 * 60 * 60000 + 45 * 60000)).toBe('3h 45m');
  });
});
