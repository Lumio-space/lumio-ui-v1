
'use client'

import { useFormContext, useWatch } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import { NativeSelect } from '@/components/shared/NativeSelect'
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form'

// Generate once at module evaluation — no re-computation on re-renders
const CURRENT_YEAR = new Date().getFullYear()
export const YEAR_OPTIONS = Array.from({ length: 12 }, (_, i) => CURRENT_YEAR - 1 + i)

export function AcademicsStep() {
  const { control } = useFormContext()

  // Watch the start year to compute the displayed end year
  const startYear = useWatch({ control, name: 'academicYear' })
  const endYear   = startYear ? Number(startYear) + 1 : CURRENT_YEAR + 1

  return (
    <div className="grid gap-4 sm:grid-cols-2">

      {/* Academic year — dynamic range, end year computed */}
      <FormField
        control={control}
        name="academicYear"
        render={({ field }) => (
          <FormItem className="sm:col-span-2">
            <FormLabel>
              Academic year <span className="text-destructive">*</span>
            </FormLabel>
            <FormControl>
              <NativeSelect {...field} className="h-11">
                <option value="">Select start year…</option>
                {YEAR_OPTIONS.map((yr) => (
                  <option key={yr} value={String(yr)}>
                    {yr} – {yr + 1}
                  </option>
                ))}
              </NativeSelect>
            </FormControl>
            {startYear && (
              <p className="text-xs text-slate-500">
                School year runs from September {startYear} to July {endYear}.
              </p>
            )}
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="gradingSystem"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Grading system <span className="text-destructive">*</span></FormLabel>
            <FormControl>
              <NativeSelect {...field} className="h-11">
                <option value="">Select…</option>
                <option value="letter">Letter (A – F)</option>
                <option value="gpa">GPA (4.0 scale)</option>
                <option value="percent">Percentage (0 – 100)</option>
              </NativeSelect>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="termStructure"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Term structure <span className="text-destructive">*</span></FormLabel>
            <FormControl>
              <NativeSelect {...field} className="h-11">
                <option value="">Select…</option>
                <option value="semester">Two semesters</option>
                <option value="trimester">Three trimesters</option>
                <option value="quarter">Four quarters</option>
              </NativeSelect>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="weekStart"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Week starts on <span className="text-destructive">*</span></FormLabel>
            <FormControl>
              <NativeSelect {...field} className="h-11">
                  <option value="mon">Monday</option>
                  <option value="tues">Tuesday</option>
                  <option value="wed">Wednesday</option>
                  <option value="thurs">Thursday</option>
                  <option value="fri">Friday</option>
              </NativeSelect>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="startTime"
        render={({ field }) => (
          <FormItem>
            <FormLabel>School start time <span className="text-destructive">*</span></FormLabel>
            <FormControl>
              <Input {...field} type="time" className="h-11 rounded-xl" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="endTime"
        render={({ field }) => (
          <FormItem>
            <FormLabel>School end time <span className="text-destructive">*</span></FormLabel>
            <FormControl>
              <Input {...field} type="time" className="h-11 rounded-xl" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

    </div>
  )
}
