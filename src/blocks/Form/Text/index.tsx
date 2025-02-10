// import type { TextField } from '@payloadcms/plugin-form-builder/types'
// import type { FieldErrorsImpl, FieldValues, UseFormRegister } from 'react-hook-form'

// import { Input } from '@/components/ui/input'
// import { Label } from '@/components/ui/label'
// import React from 'react'

// import { Error } from '../Error'
// import { Width } from '../Width'

// export const Text: React.FC<
//   TextField & { secret: boolean } & {
//     errors: Partial<FieldErrorsImpl>
//     register: UseFormRegister<FieldValues>
//   }
// > = ({ name, defaultValue, errors, label, register, required, width, secret }) => {
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
//         type={secret ? 'password' : 'text'}
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

export const TextField = ({
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
        <Input
          disabled={disabled}
          name={field.name}
          type={'text'}
          id={field.name}
          placeholder={field.placeholder}
          defaultValue={field.defaultValue}
          className="rounded-xl"
          onChange={(e) => {
            onChange?.(e.target.value)
          }}
        />
        <RichText className="text-[11px] pl-5" data={field.description} enableGutter={true} />
      </div>
    </div>
  )
}
