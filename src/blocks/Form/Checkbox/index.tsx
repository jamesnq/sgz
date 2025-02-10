// export const Checkbox: React.FC<
//   CheckboxField & {
//     errors: Partial<FieldErrorsImpl>
//     register: UseFormRegister<FieldValues>
//   }
// > = ({ name, defaultValue, errors, label, register, required, width }) => {
//   const props = register(name, { required: required })
//   const { setValue } = useFormContext()

//   return (
//     <Width width={width}>
//       <div className="flex items-center gap-2">
//         <CheckboxUi
//           defaultChecked={defaultValue}
//           id={name}
//           {...props}
//           onCheckedChange={(checked) => {
//             setValue(props.name, checked)
//           }}
//         />
//         <Label htmlFor={name}>
//           {required && (
//             <span className="required">
//               * <span className="sr-only">(required)</span>
//             </span>
//           )}
//           {label}
//         </Label>
//       </div>
//       {errors[name] && <Error />}
//     </Width>
//   )
// }
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
        <RichText className="text-[11px] pl-5" data={field.description} enableGutter={false} />
      </div>
    </div>
  )
}
