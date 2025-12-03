
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ProjectClientPage } from './client-page';
import { describe, it, expect, vi } from 'vitest';
import { useUser, useFirestore } from '@/firebase';
import { getProjects, getTasks, addProject } from '@/lib/data-firestore';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { useDashboardData } from '@/hooks/use-dashboard-data';
import type { User } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';

// Mock dependencies
vi.mock('@/firebase', () => ({
  useUser: vi.fn(),
  useFirestore: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({ push: vi.fn() })),
}));

vi.mock('@/lib/data-firestore', () => ({
  getProjects: vi.fn(),
  getTasks: vi.fn(),
  addProject: vi.fn(),
  updateProject: vi.fn(),
  deleteProject: vi.fn(),
}));

vi.mock('@/app/actions', () => ({
  onClientWrite: vi.fn(),
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: vi.fn(() => ({ toast: vi.fn() })),
}));

vi.mock('@/hooks/use-dashboard-data', () => ({
  useDashboardData: vi.fn(),
}));

describe('ProjectClientPage', () => {
  it('should allow a user to add a new project', async () => {
    // Arrange
    const mockUser = { uid: '123' } as User;
    const mockFirestore = {} as Firestore;
    const mockProjects = [
      { id: '1', name: 'Existing Project', userId: '123', priority: 'Medium' as const },
    ];
    const mockSetProjects = vi.fn();
    const newProject = { id: '2', name: 'New Project', userId: '123', priority: 'Medium' as const };

    vi.mocked(useUser).mockReturnValue({ user: mockUser, isUserLoading: false, userError: null });
    vi.mocked(useFirestore).mockReturnValue(mockFirestore);
    vi.mocked(getProjects).mockResolvedValue(mockProjects);
    vi.mocked(getTasks).mockResolvedValue([]);
    vi.mocked(addProject).mockResolvedValue(newProject);
    vi.mocked(useDashboardData).mockReturnValue({
      projects: mockProjects,
      tasks: [],
      categories: [],
      recurringTasks: [],
      energyLog: [],
      ministries: [],
      todayEnergy: undefined,
      latestMomentum: undefined,
      todaysReport: null,
      loading: false,
      error: null,
      selectedMinistryId: null,
      setSelectedMinistryId: vi.fn(),
      setTasks: vi.fn(),
      setProjects: mockSetProjects,
      setRecurringTasks: vi.fn(),
      setTodaysReport: vi.fn(),
      setTodayEnergy: vi.fn(),
      setLatestMomentum: vi.fn(),
      refetchData: vi.fn(),
      filteredTasks: [],
      filteredProjects: mockProjects,
    });

    render(<ProjectClientPage />);

    // Act
    const input = await screen.findByPlaceholderText('e.g., Q3 Marketing Campaign');
    fireEvent.change(input, { target: { value: 'New Project' } });

    const addButton = screen.getByRole('button', { name: /Add Project/i });
    fireEvent.click(addButton);

    // Assert
    await waitFor(() => {
      expect(addProject).toHaveBeenCalledWith(mockFirestore, mockUser.uid, { name: 'New Project', priority: 'Medium' });
    });

    await waitFor(() => {
        expect(mockSetProjects).toHaveBeenCalled();
    });
  });
});
