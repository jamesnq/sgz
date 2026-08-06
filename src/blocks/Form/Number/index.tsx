import { Input } from '@/components/ui/input'
import {
  FieldProps,
  FieldWrapper,
  getFieldDescribedBy,
  getFieldInputId,
  isProcessRequired,
} from '../common/FieldWrapper'

export const NumberField = ({ className, field, onChange, disabled }: FieldProps) => {
  return (
    <FieldWrapper className={className} field={field}>
      <Input
        disabled={disabled}
        name={field.name}
        type={'number'}
        id={getFieldInputId(field)}
        aria-describedby={getFieldDescribedBy(field)}
        aria-invalid={isProcessRequired(field) || undefined}
        aria-required={field.required || undefined}
        required={field.required}
        placeholder={field.placeholder}
        defaultValue={isProcessRequired(field) ? '' : field.defaultValue}
        min={field.min}
        max={field.max}
        className="rounded-xl"
        onChange={(e) => {
          onChange?.(Number(e.target.value))
        }}
      />
    </FieldWrapper>
  )
}
