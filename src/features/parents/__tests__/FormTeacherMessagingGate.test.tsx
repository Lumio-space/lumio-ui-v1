import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithProviders } from '@/test/utils';
import { ParentDetailModal } from '../components/ParentDetailModal';
import { useAuthStore } from '@/stores/auth.store';
import * as classesHooks from '@/features/classes/hooks';
import type { ParentRecord } from '../types';

const mockParent: ParentRecord = {
  id: 'p-1',
  name: 'Robert Bennett',
  fullName: 'Robert Bennett',
  email: 'robert@example.com',
  phone: '+1 555 0142',
  status: 'Active',
  children: [
    {
      studentId: 's-1',
      studentName: 'Amelia Bennett',
      grade: 'SS2',
      section: 'A',
      className: 'SS2 Science A',
      classId: 'cls-1',
      relationship: 'Father',
    },
  ],
};

const mockClasses = [
  {
    id: 'cls-1',
    grade: 'SS2',
    section: 'A',
    level: 'Senior Secondary',
    department: 'Science',
    formTeacher: 'teacher-1',
  },
];

describe('Form Teacher Parent Messaging Gate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(classesHooks, 'useClasses').mockReturnValue({
      data: mockClasses,
      isLoading: false,
    } as any);
  });

  it('strictly OMITS Message Parent button for School Admin users', () => {
    useAuthStore.setState({
      user: {
        id: 'admin-1',
        name: 'Sarah Mitchell',
        email: 'sarah@school.edu',
        role: 'admin',
      },
      isAuthenticated: true,
      role: 'admin',
    });

    renderWithProviders(
      <ParentDetailModal open={true} onClose={vi.fn()} parent={mockParent} />
    );

    expect(screen.getByText('Robert Bennett')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /message parent/i })).not.toBeInTheDocument();
  });

  it('strictly OMITS Message Parent button for subject teachers who are NOT form teachers for this child', () => {
    useAuthStore.setState({
      user: {
        id: 'teacher-2',
        name: 'Other Teacher',
        email: 'other@school.edu',
        role: 'teacher',
        classId: 'cls-2',
      },
      isAuthenticated: true,
      role: 'teacher',
    });

    renderWithProviders(
      <ParentDetailModal open={true} onClose={vi.fn()} parent={mockParent} />
    );

    expect(screen.getByText('Robert Bennett')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /message parent/i })).not.toBeInTheDocument();
  });

  it('RENDERS Message Parent button for the appointed Form Teacher and opens message modal', async () => {
    useAuthStore.setState({
      user: {
        id: 'teacher-1',
        name: 'Daniel Okafor',
        email: 'daniel@school.edu',
        role: 'teacher',
        classId: 'cls-1',
      },
      isAuthenticated: true,
      role: 'teacher',
    });

    renderWithProviders(
      <ParentDetailModal open={true} onClose={vi.fn()} parent={mockParent} />
    );

    expect(screen.getByText('Robert Bennett')).toBeInTheDocument();
    const messageBtn = screen.getByRole('button', { name: /message parent/i });
    expect(messageBtn).toBeInTheDocument();

    // Clicking message parent opens pastoral messaging dialog
    fireEvent.click(messageBtn);

    expect(screen.getByText(/message robert bennett/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/write your note to the parent/i)).toBeInTheDocument();
  });
});
