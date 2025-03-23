import { Textarea } from '@/components/ui/textarea'
import { FieldProps, FieldWrapper, isProcessRequired } from '../common/FieldWrapper'

export const TextareaField = ({ className, field, onChange, disabled }: FieldProps) => {
  return (
    <FieldWrapper className={className} field={field}>
      <Textarea
        disabled={disabled}
        name={field.name}
        id={field.name}
        placeholder={field.placeholder}
        defaultValue={isProcessRequired(field) ? '' : field.defaultValue}
        className="rounded-xl"
        onChange={(e) => {
          onChange?.(e.target.value)
        }}
      />
    </FieldWrapper>
  )
}
