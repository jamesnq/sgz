import RichText from '@/components/RichText'
import { Checkbox as CheckboxComponent } from '@/components/ui/checkbox'
import { cn } from '@/utilities/ui'

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
        id={field.name}
        checked={field.defaultValue}
        onCheckedChange={(checked) => onChange?.(!!checked)}
        disabled={disabled}
      />
      <div className="grid gap-1.5 leading-none">
        <label
          htmlFor={field.name}
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          {field.label}
          {field.required && <span className="text-red-500 ml-1">* </span>}
        </label>
        <RichText className="text-[11px] pl-5" data={field.description} overrideClassName={true} />
      </div>
    </div>
  )
}
