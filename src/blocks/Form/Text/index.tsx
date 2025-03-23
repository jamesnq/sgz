import { Input } from '@/components/ui/input'
import { FieldProps, FieldWrapper, isProcessRequired } from '../common/FieldWrapper'

export const TextField = ({ className, field, onChange, disabled }: FieldProps) => {
  return (
    <FieldWrapper className={className} field={field}>
      <Input
        disabled={disabled}
        name={field.name}
        type={'text'}
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
