'use client'

import { Form, FormSubmission, Order } from '@/payload-types'
import { useMemo, useState } from 'react'

import { updateOrderAction } from '@/app/_actions/updateFormSubmissionAction'
import { fields } from '@/blocks/Form/fields'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { useActionWarper } from '@/utilities/useActionWarper'
import { validateRequiredFields } from '@/utilities/validateFormFields'
import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

export function UpdateOrderShippingForm({ disabled, order }: { order: Order; disabled?: boolean }) {
  const formSubmission = useMemo(
    () => order.formSubmission as FormSubmission,
    [order.formSubmission],
  )
  const router = useRouter()
  const form = useMemo(() => formSubmission.form as Form, [formSubmission])
  const [formSubmissionData, setFormSubmissionData] = useState(formSubmission?.submissionData || {})
  const isFormValid = useMemo(() => {
    return validateRequiredFields(form.fields || [], formSubmissionData)
  }, [form.fields, formSubmissionData])

  const { executeAsync, isExecuting } = useActionWarper(updateOrderAction)
  return (
    <Card id="update" style={{ scrollMarginTop: '100px' }}>
      <CardHeader className="font-bold">Thông tin cung cấp</CardHeader>
      <CardContent>
        <div>
          {form.fields &&
            form.fields.map((field, index) => {
              const Field: React.FC<any> = fields?.[field.blockType as keyof typeof fields]
              if (!Field) {
                return null
              }
              // @ts-expect-error ignore
              field.defaultValue = formSubmissionData[field.name]
              return (
                <div className="mb-4 last:mb-0" key={index}>
                  <Field
                    field={field}
                    disabled={disabled}
                    onChange={(v: string) =>
                      setFormSubmissionData((p: any) => {
                        const newData = {
                          ...p,
                          [field.name]: v,
                        }
                        return newData
                      })
                    }
                  />
                </div>
              )
            })}
        </div>
      </CardContent>
      <CardFooter>
        <Button
          disabled={disabled || isExecuting || !isFormValid}
          className="w-full"
          onClick={() => {
            executeAsync({
              id: order.id,
              shippingFields: formSubmissionData,
            })
            router.refresh()
          }}
        >
          {isExecuting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Đang cập nhật...
            </>
          ) : (
            'Cập nhật thông tin'
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
