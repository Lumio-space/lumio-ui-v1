import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithProviders } from '@/test/utils';
import { ResultsView } from '../components/ResultsView';
import { useAuthStore } from '@/stores/auth.store';
import * as classHooks from '@/features/classes/hooks';
import * as resultHooks from '../hooks';

describe('ResultsView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(classHooks, 'useClasses').mockReturnValue({
      data: [
        {
          id: 'cls-1',
          schoolId: 'sch-1',
          grade: 'Primary1',
          section: 'A',
          level: 'primary',
          capacity: 30,
          room: 101,
          formTeacher: 'teacher-1',
          createdAt: '2026-01-01T00:00:00.000Z',
        },
        {
          id: 'cls-2',
          schoolId: 'sch-1',
          grade: 'Primary2',
          section: 'B',
          level: 'primary',
          capacity: 30,
          room: 102,
          formTeacher: 'other-teacher',
          createdAt: '2026-01-01T00:00:00.000Z',
        },
      ],
      isLoading: false,
      isError: false,
      error: null,
    } as unknown as ReturnType<typeof classHooks.useClasses>);
  });

  it('shows honest unavailable notice for parent accounts', () => {
    useAuthStore.setState({
      user: {
        id: 'parent-1',
        name: 'Parent User',
        email: 'parent@school.edu',
        role: 'PARENT',
        schoolId: 'sch-1',
      },
      isAuthenticated: true,
      role: 'parent',
    });

    renderWithProviders(<ResultsView />);

    expect(
      screen.getByText('Parent results viewing is unavailable')
    ).toBeInTheDocument();
  });

  it('renders scratch-card redemption form for student accounts and displays returned results', async () => {
    useAuthStore.setState({
      user: {
        id: 'student-1',
        name: 'Student User',
        email: 'student@school.edu',
        role: 'STUDENT',
        schoolId: 'sch-1',
      },
      isAuthenticated: true,
      role: 'student',
    });

    const redeemMutate = vi.fn((_payload, options) => {
      options?.onSuccess?.({
        success: true,
        student: { id: 'stu-1', fullName: 'Ada Lovelace' },
        academicYear: '2026/2027',
        term: 'first_term',
        usesRemaining: 4,
        results: [
          {
            resultId: 'res-1',
            subjectId: 'sub-1',
            subjectTitle: 'Mathematics',
            classSubjectId: 'cs-1',
            testScore: 18,
            caScore: 17,
            examScore: 55,
            totalScore: 90,
            grade: 'A',
            remark: 'Excellent',
          },
        ],
      });
    });

    vi.spyOn(resultHooks, 'useRedeemResultCard').mockReturnValue({
      mutate: redeemMutate,
      isPending: false,
    } as unknown as ReturnType<typeof resultHooks.useRedeemResultCard>);

    renderWithProviders(<ResultsView />);

    fireEvent.change(screen.getByLabelText(/serial number/i), {
      target: { value: 'LUMIO-2026-XYZ' },
    });
    fireEvent.change(screen.getByLabelText(/^pin$/i), {
      target: { value: '123456' },
    });
    fireEvent.click(screen.getByRole('button', { name: /view published results/i }));

    await waitFor(() => {
      expect(redeemMutate).toHaveBeenCalled();
      expect(screen.getByText('Ada Lovelace')).toBeInTheDocument();
      expect(screen.getByText('Mathematics')).toBeInTheDocument();
      expect(screen.getByText('4 card uses remaining')).toBeInTheDocument();
    });
  });

  it('restricts teacher class selector to form classes and enforces < 100 total score validation', async () => {
    useAuthStore.setState({
      user: {
        id: 'teacher-1',
        name: 'Form Teacher',
        email: 'teacher@school.edu',
        role: 'TEACHER',
        schoolId: 'sch-1',
      },
      isAuthenticated: true,
      role: 'teacher',
    });

    vi.spyOn(resultHooks, 'useClassResults').mockReturnValue({
      data: [
        {
          studentId: 'stu-1',
          fullName: 'Grace Hopper',
          results: [
            {
              classSubjectId: 'cs-1',
              subjectId: 'sub-1',
              subjectTitle: 'Mathematics',
              testScore: null,
              caScore: null,
              examScore: null,
              totalScore: null,
              grade: null,
              remark: null,
              status: 'not_started',
            },
          ],
        },
      ],
      isLoading: false,
      isError: false,
      error: null,
      isFetching: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof resultHooks.useClassResults>);

    const saveMutate = vi.fn();
    vi.spyOn(resultHooks, 'useSaveClassResults').mockReturnValue({
      mutate: saveMutate,
      isPending: false,
    } as unknown as ReturnType<typeof resultHooks.useSaveClassResults>);

    renderWithProviders(<ResultsView />);

    // Only cls-1 (where formTeacher === 'teacher-1') is listed; cls-2 is excluded
    const classSelect = screen.getByLabelText(/^class$/i) as HTMLSelectElement;
    expect(classSelect.options).toHaveLength(1);
    expect(classSelect.options[0].value).toBe('cls-1');

    // Teachers cannot publish
    expect(
      screen.queryByRole('button', { name: /publish class results/i })
    ).not.toBeInTheDocument();

    // Select subject to enter scores
    fireEvent.change(screen.getByLabelText(/subject view/i), {
      target: { value: 'cs-1' },
    });

    fireEvent.change(screen.getByLabelText('Test score for Grace Hopper'), {
      target: { value: '20' },
    });
    fireEvent.change(screen.getByLabelText('CA score for Grace Hopper'), {
      target: { value: '20' },
    });
    fireEvent.change(screen.getByLabelText('Exam score for Grace Hopper'), {
      target: { value: '60' },
    });

    fireEvent.click(screen.getByRole('button', { name: /save draft scores/i }));

    await waitFor(() => {
      expect(saveMutate).not.toHaveBeenCalled();
      expect(
        screen.getByText(/total score must be less than 100/i)
      ).toBeInTheDocument();
    });
  });

  it('shows School Admin RBAC notice for score creation while supporting publishing and scratch cards tab', async () => {
    useAuthStore.setState({
      user: {
        id: 'admin-1',
        name: 'School Admin',
        email: 'admin@school.edu',
        role: 'SCHOOL_ADMIN',
        schoolId: 'sch-1',
      },
      isAuthenticated: true,
      role: 'admin',
    });

    vi.spyOn(resultHooks, 'useClassResults').mockReturnValue({
      data: [
        {
          studentId: 'stu-1',
          fullName: 'Grace Hopper',
          results: [
            {
              classSubjectId: 'cs-1',
              subjectId: 'sub-1',
              subjectTitle: 'Mathematics',
              testScore: 15,
              caScore: 20,
              examScore: 55,
              totalScore: 90,
              grade: 'A',
              remark: 'Excellent',
              status: 'draft',
            },
          ],
        },
      ],
      isLoading: false,
      isError: false,
      error: null,
      isFetching: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof resultHooks.useClassResults>);

    const publishMutate = vi.fn((_payload, options) => {
      options?.onSuccess?.({
        success: true,
        message: 'Results published successfully',
        publishedCount: 1,
        alreadyPublishedCount: 0,
      });
    });

    vi.spyOn(resultHooks, 'usePublishClassResults').mockReturnValue({
      mutate: publishMutate,
      isPending: false,
    } as unknown as ReturnType<typeof resultHooks.usePublishClassResults>);

    renderWithProviders(<ResultsView />);

    expect(screen.getByRole('note')).toHaveTextContent(
      /GRADE_CREATE is omitted for SCHOOL_ADMIN/i
    );

    fireEvent.click(screen.getByRole('button', { name: /publish class results/i }));
    fireEvent.click(screen.getByRole('button', { name: /confirm publish/i }));

    await waitFor(() => {
      expect(publishMutate).toHaveBeenCalledWith(
        expect.objectContaining({ term: 'first_term' }),
        expect.any(Object)
      );
      expect(screen.getByRole('status')).toHaveTextContent(
        /Results published successfully/i
      );
    });

    // Switch to Result Scratch Cards tab
    fireEvent.click(screen.getByRole('tab', { name: /result scratch cards/i }));
    expect(screen.getByText(/purchase scratch-card batch/i)).toBeInTheDocument();
  });
});
