import RichText from '@/components/RichText'
import { Label } from '@/components/ui/label'
import { cn } from '@/utilities/ui'
import { ReactNode } from 'react'

export type FieldProps = {
  className?: string
  field: any
  onChange?: (value: any) => void
  disabled?: boolean
}

export const isProcessRequired = (field: any) => {
  return typeof field.defaultValue === 'object' && field.defaultValue !== null
}

export const getFieldInputId = (field: any) => `input-${field.name}`
export const getFieldDescriptionId = (field: any) => `description-${field.name}`
export const getFieldErrorId = (field: any) => `error-${field.name}`
export const getFieldDescribedBy = (field: any) =>
  [
    field.description ? getFieldDescriptionId(field) : null,
    isProcessRequired(field) ? getFieldErrorId(field) : null,
  ]
    .filter(Boolean)
    .join(' ') || undefined

export const FieldWrapper = ({
  className,
  field,
  children,
}: {
  className?: string
  field: any
  children: ReactNode
}) => {
  return (
    <div className={cn(className)}>
      <div className="grid w-full items-center gap-1">
        <Label htmlFor={getFieldInputId(field)} className="text-xs">
          {field.label}
          {field.required && (
            <span aria-hidden="true" className="ml-1 text-red-500">
              *
            </span>
          )}
        </Label>
        {children}
        {field.description && (
          <div id={getFieldDescriptionId(field)}>
            <RichText
              className="pl-5 text-[11px]"
              data={field.description}
              overrideClassName={true}
            />
          </div>
        )}
        {isProcessRequired(field) && (
          <p id={getFieldErrorId(field)} className="text-xs text-red-400">
            Cần bổ sung để tiếp tục
          </p>
        )}
      </div>
    </div>
  )
}
