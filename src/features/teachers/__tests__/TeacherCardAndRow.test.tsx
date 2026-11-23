import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders, userEvent } from '@/test/utils';
import { TeacherCard } from '../components/TeacherCard';
import { TeacherRow } from '../components/TeacherRow';
import type { TeacherRecord, TeacherInvitation } from '../types';

describe('TeacherCard and TeacherRow (Active Form Teacher & Visibility)', () => {
  const activeTeacherWithFormClass: TeacherRecord = {
    id: 't-1',
    userId: 'u-1',
    fullName: 'Ada Lovelace',
    email: 'ada@school.edu',
    status: 'active',
    department: 'Sciences',
    staffNo: 'FAC-01',
    joinedAt: '2026-01-01',
    classes: [
      {
        id: 'cls-jss1a',
        grade: 'JSS1',
        section: 'A',
        level: 'junior_secondary',
        isFormTeacher: true,
      },
      {
        id: 'cls-jss2b',
        grade: 'JSS2',
        section: 'B',
        level: 'junior_secondary',
        isFormTeacher: false,
      },
    ],
    subjects: [
      { id: 'sub-1', title: 'Mathematics' },
    ],
  };

  const pendingTeacher: TeacherRecord = {
    id: 't-2',
    userId: 'u-2',
    fullName: 'Alan Turing',
    email: 'alan@school.edu',
    status: 'pending',
    joinedAt: '2026-01-01',
    classes: [],
    subjects: [],
  };

  const pendingInvite: TeacherInvitation = {
    id: 'inv-turing',
    email: 'alan@school.edu',
    classId: 'cls-sss1',
    className: 'SSS 1 Science A',
    status: 'Pending',
    sent: '2026-01-01',
    expires: '2026-02-01',
  };

  describe('TeacherCard', () => {
    it('renders active teacher card with form teacher badge derived from teacher.classes', () => {
      renderWithProviders(
        <TeacherCard
          teacher={activeTeacherWithFormClass}
          invitations={[]}
          index={0}
          onClick={vi.fn()}
        />
      );

      expect(screen.getByText('Ada Lovelace')).toBeInTheDocument();
      expect(screen.getByText('FAC-01 · Sciences')).toBeInTheDocument();
      expect(screen.getByText('JSS 1 A')).toBeInTheDocument();
      expect(screen.getByText('Form Teacher')).toBeInTheDocument();
      expect(screen.getByText('Mathematics')).toBeInTheDocument();
      expect(screen.getByText('2 classes')).toBeInTheDocument();
    });

    it('renders pending invitation badge when teacher has pending invite', () => {
      renderWithProviders(
        <TeacherCard
          teacher={pendingTeacher}
          invitations={[pendingInvite]}
          index={1}
          onClick={vi.fn()}
        />
      );

      expect(screen.getByText('Alan Turing')).toBeInTheDocument();
      expect(screen.getByText('SSS 1 Science A')).toBeInTheDocument();
      expect(screen.getByText('Pending')).toBeInTheDocument();
      expect(screen.getByText('1 class')).toBeInTheDocument();
    });

    it('renders no class assignment when teacher has neither active nor pending class assignment', () => {
      const unassignedTeacher: TeacherRecord = {
        ...pendingTeacher,
        email: 'nobody@school.edu',
      };

      renderWithProviders(
        <TeacherCard
          teacher={unassignedTeacher}
          invitations={[]}
          index={0}
          onClick={vi.fn()}
        />
      );

      expect(screen.getByText('No class assignment')).toBeInTheDocument();
      expect(screen.getByText('0 classes')).toBeInTheDocument();
    });
  });

  describe('TeacherRow', () => {
    it('renders teacher row with form teacher badge and actions', async () => {
      const user = userEvent.setup();
      const mockView = vi.fn();

      renderWithProviders(
        <TeacherRow
          teacher={activeTeacherWithFormClass}
          invitations={[]}
          onView={mockView}
        />
      );

      expect(screen.getByText('Ada Lovelace')).toBeInTheDocument();
      expect(screen.getByText('ada@school.edu')).toBeInTheDocument();
      expect(screen.getByText('JSS 1 A')).toBeInTheDocument();
      expect(screen.getByText('Form Teacher')).toBeInTheDocument();
      expect(screen.getByText('Mathematics')).toBeInTheDocument();
    });
  });
});
