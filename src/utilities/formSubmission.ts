import type { Form } from '@/payload-types'

type FormWithFields = Pick<Form, 'fields'>

export const normalizeFormSubmissionData = (
  form: FormWithFields,
  submissionData: unknown,
): Record<string, unknown> => {
  if (!submissionData || typeof submissionData !== 'object' || Array.isArray(submissionData)) {
    return {}
  }

  const formFieldNames = new Set((form.fields ?? []).map((field) => field.name))
  return Object.fromEntries(
    Object.entries(submissionData as Record<string, unknown>).filter(([key]) =>
      formFieldNames.has(key),
    ),
  )
}
