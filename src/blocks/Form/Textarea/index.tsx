import RichText from '@/components/RichText'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/utilities/ui'

export const TextareaField = ({
  className,
  field,
  onChange,
  disabled,
}: {
  className?: string
  field: any
  onChange?: (value: string) => void
  disabled?: boolean
}) => {
  return (
    <div className={cn(className)}>
      <div className="grid w-full items-center gap-1">
        <Label htmlFor={`input-${field.name}`} className="text-xs">
          {field.label}
          {field.required && <span className="text-red-500 ml-1">* </span>}
        </Label>
        <Textarea
          disabled={disabled}
          name={field.name}
          id={field.name}
          placeholder={field.placeholder}
          defaultValue={field.defaultValue}
          className="rounded-xl"
          onChange={(e) => {
            onChange?.(e.target.value)
          }}
        />
        <RichText className="text-[11px] pl-5" data={field.description} overrideClassName={true} />
      </div>
    </div>
  )
}
