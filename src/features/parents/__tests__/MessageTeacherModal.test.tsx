import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithProviders } from '@/test/utils';
import { MessageTeacherModal } from '../components/MessageTeacherModal';

describe('MessageTeacherModal', () => {
  const onClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders modal with prefilled teacher name and student name', () => {
    renderWithProviders(
      <MessageTeacherModal
        open={true}
        teacherName="Mrs. Angela Vance"
        studentName="Amelia Bennett"
        className="Primary 5 · A"
        teacherEmail="angela.vance@school.edu"
        onClose={onClose}
      />
    );

    expect(screen.getByText('Message Mrs. Angela Vance')).toBeInTheDocument();
    expect(
      screen.getByText(/Direct pastoral communication regarding Amelia Bennett \(Primary 5 · A\)\./i)
    ).toBeInTheDocument();
    expect(screen.getByText(/Recipient:/i)).toBeInTheDocument();
    expect(screen.getByText(/angela\.vance@school\.edu/i)).toBeInTheDocument();
    expect(screen.getByDisplayValue('Inquiry regarding Amelia Bennett')).toBeInTheDocument();
  });

  it('submits message and displays confirmation screen', async () => {
    renderWithProviders(
      <MessageTeacherModal
        open={true}
        teacherName="Mrs. Angela Vance"
        studentName="Amelia Bennett"
        className="Primary 5 · A"
        teacherEmail="angela.vance@school.edu"
        onClose={onClose}
      />
    );

    const messageArea = screen.getByPlaceholderText(/Write your note to the form teacher…/i);
    fireEvent.change(messageArea, {
      target: { value: 'Good morning, please clarify the homework submission date.' },
    });

    const sendBtn = screen.getByRole('button', { name: /Send message/i });
    expect(sendBtn).not.toBeDisabled();
    fireEvent.click(sendBtn);

    await waitFor(() => {
      expect(screen.getByText('Message Sent Successfully')).toBeInTheDocument();
    }, { timeout: 2000 });

    expect(
      screen.getByText(/Your note has been delivered to Mrs\. Angela Vance \(angela\.vance@school\.edu\)\./i)
    ).toBeInTheDocument();
  });

  it('calls onClose when Cancel button is clicked', () => {
    renderWithProviders(
      <MessageTeacherModal
        open={true}
        teacherName="Mrs. Angela Vance"
        studentName="Amelia Bennett"
        onClose={onClose}
      />
    );

    const cancelBtn = screen.getByRole('button', { name: /Cancel/i });
    fireEvent.click(cancelBtn);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
