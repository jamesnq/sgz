import RichText from '@/components/RichText'
import { Checkbox as CheckboxComponent } from '@/components/ui/checkbox'
import { cn } from '@/utilities/ui'
import { getFieldDescriptionId, getFieldInputId, isProcessRequired } from '../common/FieldWrapper'

export const Checkbox = ({
  className,
  field,
  onChange,
  disabled,
}: {
  className?: string
  field: any
  onChange?: (value: boolean) => void
  disabled?: boolean
}) => {
  return (
    <div className={cn('items-top flex space-x-2', className)}>
      <CheckboxComponent
        id={getFieldInputId(field)}
        checked={field.defaultValue}
        aria-describedby={field.description ? getFieldDescriptionId(field) : undefined}
        aria-invalid={isProcessRequired(field) || undefined}
        aria-required={field.required || undefined}
        onCheckedChange={(checked) => onChange?.(!!checked)}
        disabled={disabled}
      />
      <div className="grid gap-1.5 leading-none">
        <label
          htmlFor={getFieldInputId(field)}
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          {field.label}
          {field.required && (
            <span aria-hidden="true" className="ml-1 text-red-500">
              *
            </span>
          )}
        </label>
        {field.description && (
          <div id={getFieldDescriptionId(field)}>
            <RichText
              className="pl-5 text-[11px]"
              data={field.description}
              overrideClassName={true}
            />
          </div>
        )}
      </div>
    </div>
  )
}
