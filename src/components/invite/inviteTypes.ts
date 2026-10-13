export type InviteRole = 'teacher' | 'student' | 'parent';
export type InviteState = 'valid' | 'expired' | 'invalid' | 'used';

export interface InvitePayload {
  token: string;
  role: InviteRole;
  state: InviteState;
  existingAccount: boolean;
  invitee: {
    firstName?: string;
    lastName?: string;
    email: string;
  };
  school: {
    name: string;
    initials?: string;
    location?: string;
    logo?: string;
  };
  inviter?: {
    name?: string;
    title?: string;
    avatar?: string;
  };
  message?: string;
  sentOn?: string;
  expiresOn?: string;
}

export const ROLE_META = {
  teacher: {
    label: 'Teacher',
    tone: 'purple' as const,
    blurb: 'Record attendance, publish results and reach parents in one place.',
    highlights: [
      { icon: 'calendar' as const, label: 'Record daily attendance' },
      { icon: 'results' as const, label: 'Enter and publish results' },
      { icon: 'chat' as const, label: 'Reach parents directly' },
    ],
    whatsNext: [
      'Complete your teaching profile',
      'Your school admin will assign your classes and subjects',
      'You will be notified as soon as your assignments are ready',
    ],
    dashboardLabel: 'Teacher Dashboard',
  },
  student: {
    label: 'Student',
    tone: 'indigo' as const,
    blurb: 'Follow your timetable, results and school announcements.',
    highlights: [
      { icon: 'calendar' as const, label: 'See your timetable' },
      { icon: 'results' as const, label: 'Check your results' },
      { icon: 'megaphone' as const, label: 'Read school announcements' },
    ],
    whatsNext: [
      'Complete your student profile',
      'Your school admin will complete your class placement',
      'Your timetable and results appear once placement is done',
    ],
    dashboardLabel: 'Student Dashboard',
  },
  parent: {
    label: 'Parent',
    tone: 'gold' as const,
    blurb: "Stay close to your child's attendance, results and school updates.",
    highlights: [
      { icon: 'chart' as const, label: "Track your child's attendance" },
      { icon: 'results' as const, label: 'View results and report cards' },
      { icon: 'megaphone' as const, label: 'Get school announcements' },
    ],
    whatsNext: [
      'Complete your parent profile',
      'Your school will link your child to your account',
      'You will then see attendance, results and announcements',
    ],
    dashboardLabel: 'Parent Dashboard',
  },
};
