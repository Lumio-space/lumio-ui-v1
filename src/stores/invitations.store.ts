import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { TeacherInvitation, InviteStatus } from '@/features/teachers/types';
import type { TeacherRecord } from '@/features/teachers/types';
import type { ClassRecord } from '@/features/classes/types';

const safeStorage = {
  getItem: () => null,
  setItem: () => undefined,
  removeItem: () => undefined,
};

interface InvitationsState {
  invitations: TeacherInvitation[];
  addInvitation: (
    invitation: Partial<TeacherInvitation> &
      Pick<TeacherInvitation, 'email' | 'classId' | 'className'>
  ) => void;
  markAccepted: (
    emailOrClassIdOrToken: string,
    details?: { teacherId?: string; name?: string }
  ) => void;
  markDeclined: (emailOrToken: string) => void;
  resendInvitation: (id: string) => void;
  cancelInvitation: (id: string) => void;
  syncWithBackend: (teachers: TeacherRecord[], classes: ClassRecord[]) => void;
}

export const useInvitationsStore = create<InvitationsState>()(
  persist(
    (set, get) => ({
      invitations: [],

      addInvitation: (
        invitation: Partial<TeacherInvitation> &
          Pick<TeacherInvitation, 'email' | 'classId' | 'className'>
      ) => {
        const now = new Date();
        const fullInvite: TeacherInvitation = {
          status: 'Pending',
          ...invitation,
          id: invitation.id ?? `inv-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          sent: invitation.sent ?? now.toISOString(),
          expires: invitation.expires ?? new Date(now.getTime() + 7 * 86400000).toISOString(),
        };
        const current = get().invitations;
        // Replace existing invitation for same email if exists, else prepend
        const filtered = current.filter(
          (i) => i.id !== fullInvite.id && i.email.toLowerCase() !== fullInvite.email.toLowerCase()
        );
        set({ invitations: [fullInvite, ...filtered] });
      },

      markAccepted: (emailOrClassIdOrToken: string, details?: { teacherId?: string; name?: string }) => {
        if (!emailOrClassIdOrToken) return;
        const needle = emailOrClassIdOrToken.toLowerCase();
        const current = get().invitations;
        const updated = current.map((i) => {
          const match =
            i.email.toLowerCase() === needle ||
            i.classId === emailOrClassIdOrToken ||
            i.token === emailOrClassIdOrToken ||
            i.id === emailOrClassIdOrToken;

          if (match) {
            return {
              ...i,
              status: 'Accepted' as InviteStatus,
              acceptedOn: i.acceptedOn || new Date().toISOString(),
              name: details?.name || i.name,
              teacherId: details?.teacherId || i.teacherId,
            };
          }
          return i;
        });
        set({ invitations: updated });
      },

      markDeclined: (emailOrToken: string) => {
        if (!emailOrToken) return;
        const needle = emailOrToken.toLowerCase();
        const current = get().invitations;
        const updated = current.map((i) => {
          if (
            i.email.toLowerCase() === needle ||
            i.token === emailOrToken ||
            i.id === emailOrToken
          ) {
            return {
              ...i,
              status: 'Declined' as InviteStatus,
            };
          }
          return i;
        });
        set({ invitations: updated });
      },

      resendInvitation: (id: string) => {
        const current = get().invitations;
        const now = new Date();
        const expires = new Date(now.getTime() + 7 * 86400000);
        const updated = current.map((i) =>
          i.id === id
            ? {
                ...i,
                status: 'Pending' as InviteStatus,
                sent: now.toISOString(),
                expires: expires.toISOString(),
              }
            : i
        );
        set({ invitations: updated });
      },

      cancelInvitation: (id: string) => {
        const current = get().invitations;
        const updated = current.filter((i) => i.id !== id);
        set({ invitations: updated });
      },

      syncWithBackend: (teachers: TeacherRecord[], classes: ClassRecord[]) => {
        const current = get().invitations;
        if (current.length === 0) return;

        let hasChanges = false;
        const now = Date.now();

        const updated = current.map((i) => {
          // 1. Check if an active teacher belongs to the invited class
          const matchingClass = classes.find((c) => c.id === i.classId);
          const activeTeacherInClass = teachers.find(
            (t) =>
              t.classId === i.classId ||
              (t.userId && matchingClass?.formTeacher === t.userId) ||
              (t.email && t.email.toLowerCase() === i.email.toLowerCase())
          );

          if (activeTeacherInClass && i.status !== 'Accepted') {
            hasChanges = true;
            return {
              ...i,
              status: 'Accepted' as InviteStatus,
              acceptedOn: i.acceptedOn || new Date().toISOString(),
              name: activeTeacherInClass.fullName || activeTeacherInClass.name || i.name,
              teacherId: activeTeacherInClass.userId || activeTeacherInClass.id,
            };
          }

          // 2. Check if expired
          if (i.status === 'Pending' && i.expires) {
            const expTime = new Date(i.expires).getTime();
            if (!Number.isNaN(expTime) && expTime < now) {
              hasChanges = true;
              return {
                ...i,
                status: 'Expired' as InviteStatus,
              };
            }
          }

          return i;
        });

        if (hasChanges) {
          set({ invitations: updated });
        }
      },
    }),
    {
      name: 'lumio-invitations',
      storage: createJSONStorage(() => {
        if (typeof window === 'undefined' || !window.localStorage) {
          return safeStorage;
        }
        return window.localStorage;
      }),
    }
  )
);
