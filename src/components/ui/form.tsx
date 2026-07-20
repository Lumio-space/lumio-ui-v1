'use client'

import * as React from 'react'
import {
  Controller,
  FormProvider,
  useFormContext,
  useFormState,
  type ControllerProps,
  type FieldPath,
  type FieldValues,
} from 'react-hook-form'
import { Slot } from 'radix-ui'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

/* Form  */
const Form = FormProvider

/* FormField */
type FormFieldContextValue<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = { name: TName }

const FormFieldContext = React.createContext({} as FormFieldContextValue)

function FormField<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({ ...props }: ControllerProps<TFieldValues, TName>) {
  return (
    <FormFieldContext.Provider value={{ name: props.name }}>
      <Controller {...props} />
    </FormFieldContext.Provider>
  )
}

/* FormItem */
const FormItemContext = React.createContext({ id: '' })

function FormItem({ className, ...props }: React.ComponentProps<'div'>) {
  const id = React.useId()
  return (
    <FormItemContext.Provider value={{ id }}>
      <div className={cn('space-y-1.5', className)} {...props} />
    </FormItemContext.Provider>
  )
}

/* useFormField */
function useFormField() {
  const fieldCtx = React.useContext(FormFieldContext)
  const itemCtx  = React.useContext(FormItemContext)

  if (!fieldCtx.name) {
    throw new Error('useFormField must be used inside <FormField>')
  }


  const { control } = useFormContext()
  const { errors }  = useFormState({ control })

  // Support dotted paths like "administrators.0.email"
  const error = (fieldCtx.name as string)
    .split('.')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .reduce((obj: any, key) => obj?.[key], errors)

  const { id } = itemCtx
  return {
    id,
    name:              fieldCtx.name,
    formItemId:        `${id}-form-item`,
    formDescriptionId: `${id}-form-desc`,
    formMessageId:     `${id}-form-msg`,
    error,
    invalid: !!error,
  }
}

/* FormLabel  */
function FormLabel({ className, ...props }: React.ComponentProps<typeof Label>) {
  const { error, formItemId } = useFormField()
  return (
    <Label
      htmlFor={formItemId}
      className={cn(error && 'text-destructive', className)}
      {...props}
    />
  )
}

/* FormControl */
function FormControl({ ...props }: React.ComponentProps<typeof Slot.Root>) {
  const { error, formItemId, formDescriptionId, formMessageId } = useFormField()
  return (
    <Slot.Root
      id={formItemId}
      aria-describedby={
        error ? `${formDescriptionId} ${formMessageId}` : formDescriptionId
      }
      aria-invalid={!!error}
      {...props}
    />
  )
}

/* FormDescription */
function FormDescription({ className, ...props }: React.ComponentProps<'p'>) {
  const { formDescriptionId } = useFormField()
  return (
    <p
      id={formDescriptionId}
      className={cn('text-xs text-muted-foreground', className)}
      {...props}
    />
  )
}

/* FormMessage */
function FormMessage({ className, children, ...props }: React.ComponentProps<'p'>) {
  const { error, formMessageId } = useFormField()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw     = (error as any)?.message
  const message = raw !== undefined ? String(raw) : children

  if (!message) return null

  return (
    <p
      id={formMessageId}
      role="alert"
      className={cn('text-xs font-medium text-destructive', className)}
      {...props}
    >
      {message}
    </p>
  )
}

export {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
  useFormField,
}
