// import type { TextField } from '@payloadcms/plugin-form-builder/types'
// import type { FieldErrorsImpl, FieldValues, UseFormRegister } from 'react-hook-form'

// import { Input } from '@/components/ui/input'
// import { Label } from '@/components/ui/label'
// import React from 'react'

// import { Error } from '../Error'
// import { Width } from '../Width'
// export const Number: React.FC<
//   TextField & {
//     errors: Partial<FieldErrorsImpl>
//     register: UseFormRegister<FieldValues>
//   }
// > = ({ name, defaultValue, errors, label, register, required, width }) => {
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
//       <Input
//         defaultValue={defaultValue}
//         id={name}
//         type="number"
//         {...register(name, { required })}
//       />
//       {errors[name] && <Error />}
//     </Width>
//   )
// }

import RichText from '@/components/RichText'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/utilities/ui'

export const NumberField = ({
  className,
  field,
  onChange,
  disabled,
}: {
  className?: string
  field: any
  onChange?: (value: number) => void
  disabled?: boolean
}) => {
  return (
    <div className={cn(className)}>
      <div className="grid w-full items-center gap-1">
        <Label htmlFor={`input-${field.name}`} className="text-xs">
          {field.label}
          {field.required && <span className="text-red-500 ml-1">* </span>}
        </Label>
        <Input
          disabled={disabled}
          name={field.name}
          type={'number'}
          id={field.name}
          placeholder={field.placeholder}
          defaultValue={field.defaultValue}
          min={field.min}
          max={field.max}
          className="rounded-xl"
          onChange={(e) => {
            onChange?.(Number(e.target.value))
          }}
        />
        <RichText className="text-[11px] pl-5" data={field.description} enableGutter={true} />
      </div>
    </div>
  )
}
