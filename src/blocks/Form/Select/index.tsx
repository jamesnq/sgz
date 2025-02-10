// import type { SelectField } from '@payloadcms/plugin-form-builder/types'
// import type { Control, FieldErrorsImpl } from 'react-hook-form'

// import { Label } from '@/components/ui/label'
// import {
//   Select as SelectComponent,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from '@/components/ui/select'
// import React from 'react'
// import { Controller } from 'react-hook-form'

// import { Error } from '../Error'
// import { Width } from '../Width'

// export const Select: React.FC<
//   SelectField & {
//     control: Control
//     errors: Partial<FieldErrorsImpl>
//   }
// > = ({ name, control, errors, label, options, required, width }) => {
//   return (
//     <Width width={width}>
//       <Label htmlFor={name}>
//         {label}
//         {required && (
//           <span className="required">
//             * <span className="sr-only">(required)</span>
//           </span>
//         )}
//       </Label>
//       <Controller
//         control={control}
//         defaultValue=""
//         name={name}
//         render={({ field: { onChange, value } }) => {
//           const controlledValue = options.find((t) => t.value === value)

//           return (
//             <SelectComponent onValueChange={(val) => onChange(val)} value={controlledValue?.value}>
//               <SelectTrigger className="w-full" id={name}>
//                 <SelectValue placeholder={label} />
//               </SelectTrigger>
//               <SelectContent>
//                 {options.map(({ label, value }) => {
//                   return (
//                     <SelectItem key={value} value={value}>
//                       {label}
//                     </SelectItem>
//                   )
//                 })}
//               </SelectContent>
//             </SelectComponent>
//           )
//         }}
//         rules={{ required }}
//       />
//       {errors[name] && <Error />}
//     </Width>
//   )
// }

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
  return (
    <div className={cn(className)}>
      <div className="grid w-full items-center gap-1">
        <Label htmlFor={`input-${field.name}`} className="text-xs">
          {field.label}
          {field.required && <span className="text-red-500 ml-1">* </span>}
        </Label>
        <Select
          name={field.name}
          defaultValue={field.defaultValue}
          onValueChange={(e) => {
            onChange?.(e)
          }}
          disabled={disabled}
        >
          <SelectTrigger className="rounded-xl">
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
        <RichText className="text-[11px] pl-5" data={field.description} enableGutter={false} />
      </div>
    </div>
  )
}
