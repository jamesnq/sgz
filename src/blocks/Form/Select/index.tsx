import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { FieldProps, FieldWrapper, isProcessRequired } from '../common/FieldWrapper'

export function SelectField({ className, field, onChange, disabled }: FieldProps) {
  return (
    <FieldWrapper className={className} field={field}>
      <Select
        name={field.name}
        defaultValue={isProcessRequired(field) ? undefined : field.defaultValue}
        onValueChange={(e) => {
          onChange?.(e)
        }}
        disabled={disabled}
      >
        <SelectTrigger className="rounded-xl text-xs">
          <SelectValue placeholder={field.placeholder} />
        </SelectTrigger>
        <SelectContent className="rounded-xl">
          {field.options &&
            field.options.map((x: any) => (
              <SelectItem key={x.value} value={x.value}>
                {x.label}
              </SelectItem>
            ))}
        </SelectContent>
      </Select>
    </FieldWrapper>
  )
}
