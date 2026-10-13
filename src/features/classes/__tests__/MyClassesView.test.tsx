import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from '@/test/utils';
import { MyClassesView } from '../components/MyClassesView';
import * as classesApi from '../api/classes.api';
import { useAuthStore } from '@/stores/auth.store';
import type { ClassRecord } from '../types';

const mockClasses: ClassRecord[] = [
  {
    id: 'cls-1',
    grade: 'Primary 1',
    section: 'A',
    level: 'primary',
    schoolId: 'school-1',
    formTeacher: 'teacher-1',
    capacity: 30,
    room: 101,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'cls-2',
    grade: 'Primary 2',
    section: 'A',
    level: 'primary',
    schoolId: 'school-1',
    formTeacher: 'teacher-2',
    capacity: 30,
    room: 102,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'cls-3',
    grade: 'JSS 1',
    section: 'A',
    level: 'junior_secondary',
    schoolId: 'school-1',
    formTeacher: 'teacher-3',
    capacity: 35,
    room: 201,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'cls-4',
    grade: 'JSS 2',
    section: 'A',
    level: 'junior_secondary',
    schoolId: 'school-1',
    formTeacher: 'teacher-4',
    capacity: 35,
    room: 202,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
];

describe('MyClassesView - Class Assignment Isolation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(classesApi, 'fetchClasses').mockResolvedValue(mockClasses);
  });

  it('renders ONLY the assigned class for Teacher A (Primary 1A) and not all school classes', async () => {
    useAuthStore.setState({
      user: {
        id: 'teacher-1',
        name: 'Teacher One',
        email: 'teacher1@school.edu',
        role: 'teacher',
        classId: 'cls-1',
      },
      isAuthenticated: true,
      role: 'teacher',
    });

    renderWithProviders(<MyClassesView />);

    await waitFor(() => {
      expect(screen.getByText(/Primary 1 A/i)).toBeInTheDocument();
    });

    // Verify other classes are NOT rendered
    expect(screen.queryByText(/Primary 2 A/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/JSS 1 A/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/JSS 2 A/i)).not.toBeInTheDocument();
  });

  it('shows empty state when teacher has no matching assigned class', async () => {
    useAuthStore.setState({
      user: {
        id: 'unassigned-teacher',
        name: 'New Teacher',
        email: 'unassigned@school.edu',
        role: 'teacher',
      },
      isAuthenticated: true,
      role: 'teacher',
    });

    renderWithProviders(<MyClassesView />);

    await waitFor(() => {
      expect(screen.getByText(/No classes assigned yet/i)).toBeInTheDocument();
    });

    // None of the school classes should be displayed
    expect(screen.queryByText(/Primary 1 A/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Primary 2 A/i)).not.toBeInTheDocument();
  });
});
