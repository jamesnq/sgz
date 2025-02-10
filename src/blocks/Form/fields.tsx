import { Checkbox } from './Checkbox'
import { NumberField } from './Number'
import { SelectField } from './Select'
import { TextField } from './Text'
import { TextareaField } from './Textarea'
// TODO validate fields
export const fields = {
  checkbox: Checkbox,
  // country: Country,
  email: TextField,
  // message: Message,
  number: NumberField,
  select: SelectField,
  text: TextField,
  textarea: TextareaField,
}
