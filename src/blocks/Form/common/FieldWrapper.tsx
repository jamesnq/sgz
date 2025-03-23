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
        <Label htmlFor={`input-${field.name}`} className="text-xs">
          {field.label}
          {field.required && <span className="text-red-500 ml-1">* </span>}
          {isProcessRequired(field) && <span className="text-red-500 ml-1">Cần bổ sung để tiếp tục</span>}
        </Label>
        {children}
        <RichText className="text-[11px] pl-5" data={field.description} overrideClassName={true} />
      </div>
    </div>
  )
}
