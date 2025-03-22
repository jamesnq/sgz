import RichText from '@/components/RichText'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/utilities/ui'

export function SelectField({
  className,
  field,
  onChange,
  disabled,
}: {
  className?: string
  field: any
  onChange?: (value: string) => void
  disabled?: boolean
}) {
  const isProcessRequired = typeof field.defaultValue === 'object'
  return (
    <div className={cn(className)}>
      <div className="grid w-full items-center gap-1">
        <Label htmlFor={`input-${field.name}`} className="text-xs">
          {field.label}
          {field.required && <span className="text-red-500 ml-1">* </span>}
          {isProcessRequired && <span className="text-red-500 ml-1">Cần bổ sung để tiếp tục</span>}
        </Label>
        <Select
          name={field.name}
          defaultValue={isProcessRequired ? undefined : field.defaultValue}
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
        <RichText className="text-[11px] pl-5" data={field.description} overrideClassName={true} />
      </div>
    </div>
  )
}
