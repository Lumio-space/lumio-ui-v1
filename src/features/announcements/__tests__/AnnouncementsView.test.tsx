import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithProviders } from '@/test/utils';
import { AnnouncementsView } from '../components/AnnouncementsView';
import { useAuthStore } from '@/stores/auth.store';
import * as announcementHooks from '../hooks';

describe('AnnouncementsView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({
      user: {
        id: 'admin-1',
        name: 'Principal Admin',
        email: 'admin@school.edu',
        role: 'SCHOOL_ADMIN',
        schoolId: 'sch-1',
      },
      isAuthenticated: true,
      role: 'admin',
    });
  });

  it('shows New announcement button for admin and renders paginated announcements', () => {
    vi.spyOn(announcementHooks, 'useAnnouncements').mockReturnValue({
      data: {
        data: [
          {
            id: 'ann-1',
            title: 'Mid-Term Break',
            message: 'School closes Friday.',
            audiences: ['teacher', 'student', 'parent'],
            createdAt: '2026-09-10T10:00:00.000Z',
          },
        ],
        meta: {
          total: 12,
          page: 1,
          limit: 10,
          totalPages: 2,
          hasNextPage: true,
          hasPreviousPage: false,
        },
      },
      isLoading: false,
      isError: false,
      error: null,
      isFetching: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof announcementHooks.useAnnouncements>);

    renderWithProviders(<AnnouncementsView />);

    expect(screen.getByRole('heading', { name: /announcements/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /new announcement/i })).toBeInTheDocument();
    expect(screen.getByText('Mid-Term Break')).toBeInTheDocument();
    expect(screen.getByText('Teachers')).toBeInTheDocument();
    expect(screen.getByText('Students')).toBeInTheDocument();
    expect(screen.getByText('Parents')).toBeInTheDocument();
    expect(screen.getByText('Page 1 of 2')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /next/i })).toBeEnabled();
    expect(screen.getByRole('button', { name: /previous/i })).toBeDisabled();
  });

  it('hides New announcement button for teacher and surfaces genuine API errors without mocking', () => {
    useAuthStore.setState({
      user: {
        id: 'teacher-1',
        name: 'Jane Teacher',
        email: 'jane@school.edu',
        role: 'TEACHER',
        schoolId: 'sch-1',
      },
      isAuthenticated: true,
      role: 'teacher',
    });

    const mockRefetch = vi.fn();
    vi.spyOn(announcementHooks, 'useAnnouncements').mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new Error('syntax error at or near "ANY"'),
      isFetching: false,
      refetch: mockRefetch,
    } as unknown as ReturnType<typeof announcementHooks.useAnnouncements>);

    renderWithProviders(<AnnouncementsView />);

    expect(screen.queryByRole('button', { name: /new announcement/i })).not.toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('syntax error at or near "ANY"');
    fireEvent.click(screen.getByRole('button', { name: /try again/i }));
    expect(mockRefetch).toHaveBeenCalledTimes(1);
  });

  it('opens detail modal using detail hook when an announcement is clicked', async () => {
    vi.spyOn(announcementHooks, 'useAnnouncements').mockReturnValue({
      data: {
        data: [
          {
            id: 'ann-7',
            title: 'Assembly Update',
            message: 'Short preview.',
            audiences: ['teacher'],
            createdAt: '2026-09-12T08:00:00.000Z',
          },
        ],
        meta: {
          total: 1,
          page: 1,
          limit: 10,
          totalPages: 1,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      },
      isLoading: false,
      isError: false,
      error: null,
      isFetching: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof announcementHooks.useAnnouncements>);

    const detailSpy = vi.spyOn(announcementHooks, 'useAnnouncementDetail').mockReturnValue({
      data: {
        id: 'ann-7',
        title: 'Assembly Update',
        message: 'Full announcement text from detail endpoint.',
        audiences: ['teacher'],
        createdAt: '2026-09-12T08:00:00.000Z',
      },
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof announcementHooks.useAnnouncementDetail>);

    renderWithProviders(<AnnouncementsView />);

    fireEvent.click(screen.getByText('Assembly Update'));

    await waitFor(() => {
      expect(detailSpy).toHaveBeenCalledWith('ann-7');
      expect(
        screen.getByText('Full announcement text from detail endpoint.')
      ).toBeInTheDocument();
    });
  });

  it('validates and submits new announcement through CreateAnnouncementModal for admin', async () => {
    vi.spyOn(announcementHooks, 'useAnnouncements').mockReturnValue({
      data: {
        data: [],
        meta: {
          total: 0,
          page: 1,
          limit: 10,
          totalPages: 1,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      },
      isLoading: false,
      isError: false,
      error: null,
      isFetching: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof announcementHooks.useAnnouncements>);

    const mutateMock = vi.fn((_payload, options) => {
      options?.onSuccess?.({
        id: 'ann-new',
        title: 'Sports Day',
        message: 'Friday at 9 AM.',
        audiences: ['student', 'parent'],
        createdAt: '2026-09-15T08:00:00.000Z',
      });
    });

    vi.spyOn(announcementHooks, 'useCreateAnnouncement').mockReturnValue({
      mutate: mutateMock,
      isPending: false,
    } as unknown as ReturnType<typeof announcementHooks.useCreateAnnouncement>);

    renderWithProviders(<AnnouncementsView />);

    fireEvent.click(screen.getAllByRole('button', { name: /new announcement/i })[0]);

    fireEvent.change(screen.getByLabelText(/^title$/i), {
      target: { value: 'Sports Day' },
    });
    fireEvent.change(screen.getByLabelText(/^message$/i), {
      target: { value: 'Friday at 9 AM.' },
    });
    fireEvent.click(screen.getByLabelText(/students/i));
    fireEvent.click(screen.getByLabelText(/parents/i));

    fireEvent.click(screen.getByRole('button', { name: /publish announcement/i }));

    await waitFor(() => {
      expect(mutateMock).toHaveBeenCalledWith(
        {
          title: 'Sports Day',
          message: 'Friday at 9 AM.',
          audiences: ['student', 'parent'],
        },
        expect.any(Object)
      );
      expect(screen.getByRole('status')).toHaveTextContent(
        'Announcement "Sports Day" published successfully.'
      );
    });
  });
});
