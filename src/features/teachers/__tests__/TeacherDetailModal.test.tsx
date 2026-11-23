import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders, userEvent } from '@/test/utils';
import { TeacherDetailModal } from '../components/TeacherDetailModal';
import type { TeacherRecord, TeacherInvitation } from '../types';

describe('TeacherDetailModal (Active Form Teacher & Visibility)', () => {
  const baseTeacher: TeacherRecord = {
    id: 't-1',
    userId: 'u-1',
    teacherId: 'u-1',
    fullName: 'Grace Hopper',
    email: 'grace@school.edu',
    phone: '+234 800 000 0001',
    staffNo: 'T-101',
    role: 'teacher',
    status: 'active',
    joinedAt: '2026-01-01',
    classes: [],
    subjects: [
      { id: 'sub-cs', title: 'Computer Science' },
    ],
  };

  it('renders modal profile header, email, and phone', () => {
    renderWithProviders(
      <TeacherDetailModal
        teacher={baseTeacher}
        invitations={[]}
        onClose={vi.fn()}
      />
    );

    expect(screen.getByText('Teacher profile')).toBeInTheDocument();
    expect(screen.getByText('Grace Hopper')).toBeInTheDocument();
    expect(screen.getByText('grace@school.edu')).toBeInTheDocument();
    expect(screen.getByText('+234 800 000 0001')).toBeInTheDocument();
    expect(screen.getByText('Computer Science')).toBeInTheDocument();
  });

  it('renders active form teacher class directly from teacher.classes without invitation store', () => {
    const teacherWithFormClass: TeacherRecord = {
      ...baseTeacher,
      classes: [
        {
          id: 'cls-jss1a',
          grade: 'JSS1',
          section: 'A',
          level: 'junior_secondary',
          isFormTeacher: true,
        },
      ],
    };

    renderWithProviders(
      <TeacherDetailModal
        teacher={teacherWithFormClass}
        invitations={[]}
        onClose={vi.fn()}
      />
    );

    // Active form teacher class resolved from teacher.classes
    expect(screen.getByText('JSS 1 A')).toBeInTheDocument();
    expect(screen.getByText('Active — Form Teacher')).toBeInTheDocument();
    expect(screen.queryByText('Not assigned as form teacher of any class.')).not.toBeInTheDocument();
  });

  it('renders unassigned placeholder when teacher has no form teacher classes and no pending invites', () => {
    const teacherTeachingOnly: TeacherRecord = {
      ...baseTeacher,
      classes: [
        {
          id: 'cls-jss1b',
          grade: 'JSS1',
          section: 'B',
          level: 'junior_secondary',
          isFormTeacher: false,
        },
      ],
    };

    renderWithProviders(
      <TeacherDetailModal
        teacher={teacherTeachingOnly}
        invitations={[]}
        onClose={vi.fn()}
      />
    );

    expect(screen.getByText('Not assigned as form teacher of any class.')).toBeInTheDocument();
  });

  it('renders pending invitation assignment when teacher has a pending invite', () => {
    const pendingTeacher: TeacherRecord = {
      ...baseTeacher,
      status: 'pending',
      classes: [],
    };

    const pendingInvite: TeacherInvitation = {
      id: 'inv-1',
      email: 'grace@school.edu',
      classId: 'cls-pending-1',
      className: 'Primary 2 B',
      status: 'Pending',
      sent: '2026-02-01',
      expires: '2026-03-01',
    };

    renderWithProviders(
      <TeacherDetailModal
        teacher={pendingTeacher}
        invitations={[pendingInvite]}
        onClose={vi.fn()}
      />
    );

    expect(screen.getByText('Primary 2 B')).toBeInTheDocument();
    expect(screen.getByText('Invitation Pending')).toBeInTheDocument();
  });

  it('renders teaching classes badges for all assigned cohorts', () => {
    const teacherWithMultipleClasses: TeacherRecord = {
      ...baseTeacher,
      classes: [
        {
          id: 'c-1',
          grade: 'JSS1',
          section: 'A',
          level: 'junior_secondary',
          isFormTeacher: true,
        },
        {
          id: 'c-2',
          grade: 'JSS2',
          section: 'B',
          level: 'junior_secondary',
          isFormTeacher: false,
        },
      ],
    };

    renderWithProviders(
      <TeacherDetailModal
        teacher={teacherWithMultipleClasses}
        invitations={[]}
        onClose={vi.fn()}
      />
    );

    expect(screen.getByText('Teaching classes')).toBeInTheDocument();
    expect(screen.getByText(/JSS 1 A · Form Teacher/)).toBeInTheDocument();
    expect(screen.getByText('JSS 2 B')).toBeInTheDocument();
  });

  it('triggers onAssignFormTeacher callback when action button is clicked', async () => {
    const user = userEvent.setup();
    const mockAssignFormTeacher = vi.fn();

    renderWithProviders(
      <TeacherDetailModal
        teacher={baseTeacher}
        invitations={[]}
        onClose={vi.fn()}
        onAssignFormTeacher={mockAssignFormTeacher}
      />
    );

    const button = screen.getByRole('button', { name: /assign form teacher/i });
    await user.click(button);

    expect(mockAssignFormTeacher).toHaveBeenCalledWith(baseTeacher);
  });

  it('triggers onAssignSubject callback when action button is clicked', async () => {
    const user = userEvent.setup();
    const mockAssignSubject = vi.fn();

    renderWithProviders(
      <TeacherDetailModal
        teacher={baseTeacher}
        invitations={[]}
        onClose={vi.fn()}
        onAssignSubject={mockAssignSubject}
      />
    );

    const button = screen.getByRole('button', { name: /assign subject/i });
    await user.click(button);

    expect(mockAssignSubject).toHaveBeenCalledWith(baseTeacher);
  });

  it('triggers onToggleStatus callback with teacher record', async () => {
    const user = userEvent.setup();
    const mockToggleStatus = vi.fn();

    renderWithProviders(
      <TeacherDetailModal
        teacher={baseTeacher}
        invitations={[]}
        onClose={vi.fn()}
        onToggleStatus={mockToggleStatus}
      />
    );

    const button = screen.getByRole('button', { name: /mark inactive/i });
    await user.click(button);

    expect(mockToggleStatus).toHaveBeenCalledWith(baseTeacher);
  });
});
