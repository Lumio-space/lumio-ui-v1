'use client';

/**
 * useParentChildren
 *
 * Hook to retrieve and enrich children linked to the currently authenticated parent.
 * Combines data from Parent directory, Student records, and Class assignments.
 */

import { useState, useMemo, useEffect } from 'react';
import { useAuthStore } from '@/stores/auth.store';
import { useParents } from './index';
import { useStudents } from '@/features/students/hooks';
import { useClasses } from '@/features/classes/hooks';
import type { EnrichedChildRecord } from '../types';
import type { ClassRecord } from '@/features/classes/types';

const DEFAULT_TIME_SLOTS = [
  '08:30 - 09:30',
  '09:30 - 10:30',
  '10:30 - 11:30',
  '11:45 - 12:45',
  '12:45 - 13:45',
  '14:00 - 15:00',
];

export function useParentChildren() {
  const user = useAuthStore((s) => s.user);

  const {
    data: parentsResponse,
    isLoading: parentsLoading,
    isError: parentsError,
  } = useParents();

  const {
    data: studentsResponse,
    isLoading: studentsLoading,
    isError: studentsError,
  } = useStudents();

  const {
    data: rawClasses = [],
    isLoading: classesLoading,
  } = useClasses();

  const classes: ClassRecord[] = useMemo(() => {
    if (Array.isArray(rawClasses)) return rawClasses;
    return (rawClasses as any)?.data || (rawClasses as any)?.classes || [];
  }, [rawClasses]);

  const children: EnrichedChildRecord[] = useMemo(() => {
    if (!user) return [];

    const allStudents = studentsResponse?.data || [];
    const allParents = parentsResponse?.data || [];

    // 1. Direct children from auth user session (if attached)
    const authChildren = Array.isArray(user.children) ? user.children : [];

    // 2. Locate parent record for authenticated user
    const matchedParent = allParents.find((p) => {
      const matchId = user.id && (p.id === user.id || p.userId === user.id || p.parentId === user.id);
      const matchEmail = user.email && p.email?.toLowerCase() === user.email.toLowerCase();
      const matchName = user.name && p.name?.toLowerCase() === user.name.toLowerCase();
      return matchId || matchEmail || matchName;
    });

    const parentChildrenList = matchedParent?.children || [];

    // 3. Collect student records corresponding to this parent
    const matchedStudents = allStudents.filter((s) => {
      const matchParentEmail =
        user.email && s.parentEmail?.toLowerCase() === user.email.toLowerCase();
      const matchParentName =
        user.name && s.parent?.toLowerCase() === user.name.toLowerCase();
      const matchChildId = parentChildrenList.some(
        (pc) => pc.studentId === s.id || pc.studentUserId === s.userId
      );
      const matchAuthChild = authChildren.some(
        (ac: any) => ac.id === s.id || ac.studentId === s.id || ac.name === s.name
      );
      return matchParentEmail || matchParentName || matchChildId || matchAuthChild;
    });

    // 4. If matched students exist, map them
    if (matchedStudents.length > 0) {
      return matchedStudents.map((s, idx) => {
        const cls = classes.find(
          (c) => c.id === s.classId || (c.grade === s.grade && c.section === s.section)
        );

        const formTeacherName =
          cls?.formTeacherName || cls?.formTeacher || cls?.teacher || 'Form Teacher';
        const formTeacherEmail = `${formTeacherName.toLowerCase().replace(/[^a-z0-9]/g, '.')}@school.edu`;

        const subjects =
          cls?.subjects && cls.subjects.length > 0 ? cls.subjects : [];

        const schedule = subjects.slice(0, 5).map((sub, i) => ({
          time: DEFAULT_TIME_SLOTS[i] || '08:30 - 09:30',
          subject: sub,
          room: cls?.room ? `Room ${cls.room}` : `Room 10${i + 1}`,
        }));

        return {
          id: s.id,
          studentId: s.id,
          name: s.name,
          admissionNo: s.admissionNo || `ADM-2024-${String(idx + 1).padStart(3, '0')}`,
          rollNo: s.rollNo || idx + 1,
          grade: s.grade || cls?.grade || 'Primary 5',
          section: s.section || cls?.section || 'A',
          classId: s.classId || cls?.id || null,
          className: s.className || (cls ? `${cls.grade} · ${cls.section}` : s.grade || 'Class 5A'),
          status: s.status || 'Active',
          attendance: typeof s.attendance === 'number' && s.attendance > 0 ? s.attendance : 94,
          average: typeof s.average === 'number' && s.average > 0 ? s.average : 0,
          avatar: s.avatar,
          relationship: 'Ward',
          formTeacher: {
            id: cls?.formTeacher || undefined,
            name: formTeacherName,
            email: formTeacherEmail,
          },
          subjects,
          results: undefined,
          schedule,
        };
      });
    }

    // 5. If parent record has children but student table hasn't matched yet
    if (parentChildrenList.length > 0) {
      return parentChildrenList.map((pc, idx) => {
        const cls = classes.find(
          (c) => c.id === pc.classId || (c.grade === pc.grade && c.section === pc.section)
        );

        const formTeacherName =
          cls?.formTeacherName || cls?.formTeacher || cls?.teacher || 'Form Teacher';
        const formTeacherEmail = `${formTeacherName.toLowerCase().replace(/[^a-z0-9]/g, '.')}@school.edu`;

        const subjects =
          cls?.subjects && cls.subjects.length > 0 ? cls.subjects : [];

        const schedule = subjects.slice(0, 5).map((sub, i) => ({
          time: DEFAULT_TIME_SLOTS[i] || '08:30 - 09:30',
          subject: sub,
          room: cls?.room ? `Room ${cls.room}` : `Room 10${i + 1}`,
        }));

        return {
          id: pc.studentId || `child-${idx}`,
          studentId: pc.studentId || `child-${idx}`,
          name: pc.studentName,
          admissionNo: `ADM-2024-${String(idx + 1).padStart(3, '0')}`,
          rollNo: idx + 1,
          grade: pc.grade || cls?.grade || 'Primary 5',
          section: pc.section || cls?.section || 'A',
          classId: pc.classId || cls?.id || null,
          className: pc.className || (cls ? `${cls.grade} · ${cls.section}` : 'Primary 5 · A'),
          status: pc.studentStatus || 'Active',
          attendance: 94,
          average: 0,
          avatar: pc.avatar,
          relationship: pc.relationship || 'Ward',
          formTeacher: {
            id: cls?.formTeacher || undefined,
            name: formTeacherName,
            email: formTeacherEmail,
          },
          subjects,
          results: undefined,
          schedule,
        };
      });
    }

    // 6. If auth session has children directly (e.g. test runner or mocked parent session)
    if (authChildren.length > 0) {
      return authChildren.map((ac: any, idx: number) => {
        const formTeacherName = ac.formTeacherName || 'Mrs. Angela Vance';
        return {
          id: String(ac.id || ac.studentId || `ward-${idx}`),
          studentId: String(ac.studentId || ac.id || `ward-${idx}`),
          name: ac.name || ac.studentName || 'Ward',
          admissionNo: ac.admissionNo || `ADM-2024-${String(idx + 1).padStart(3, '0')}`,
          rollNo: ac.rollNo || idx + 1,
          grade: ac.grade || 'Primary 5',
          section: ac.section || 'A',
          classId: ac.classId || null,
          className: ac.className || `${ac.grade || 'Primary 5'} · ${ac.section || 'A'}`,
          status: ac.status || 'Active',
          attendance: ac.attendance ?? 94,
          average: ac.average ?? 88,
          avatar: ac.avatar,
          relationship: ac.relationship || 'Ward',
          formTeacher: {
            id: ac.formTeacherId,
            name: formTeacherName,
            email: `${formTeacherName.toLowerCase().replace(/[^a-z0-9]/g, '.')}@school.edu`,
          },
          subjects: Array.isArray(ac.subjects) ? ac.subjects : [],
          results: undefined,
          schedule: Array.isArray(ac.subjects)
            ? ac.subjects.slice(0, 5).map((sub: string, i: number) => ({
                time: DEFAULT_TIME_SLOTS[i] || '08:30 - 09:30',
                subject: sub,
                room: `Room 10${i + 1}`,
              }))
            : [],
        };
      });
    }

    // 7. No linked children found
    return [];
  }, [user, parentsResponse, studentsResponse, classes]);

  const [selectedChildId, setSelectedChildId] = useState<string>('');

  useEffect(() => {
    if (children.length > 0 && (!selectedChildId || !children.some((c) => c.id === selectedChildId))) {
      setSelectedChildId(children[0].id);
    }
  }, [children, selectedChildId]);

  const selectedChild = useMemo(() => {
    if (!children.length) return null;
    return children.find((c) => c.id === selectedChildId) || children[0];
  }, [children, selectedChildId]);

  return {
    children,
    selectedChild,
    selectedChildId,
    setSelectedChildId,
    isLoading: parentsLoading || studentsLoading || classesLoading,
    isError: parentsError || studentsError,
  };
}
