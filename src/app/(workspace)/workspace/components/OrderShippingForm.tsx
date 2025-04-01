'use client'

import { useDraggable } from '@/app/(workspace)/workspace/DraggableContext'
import { fields } from '@/blocks/Form/fields'
import { Form, FormSubmission, Order } from '@/payload-types'
import payloadClient from '@/utilities/payloadClient'
import { cn } from '@/utilities/ui'
import { useMutation } from '@tanstack/react-query'
import { Check, Copy, Loader2, UserPen } from 'lucide-react'
import { useMemo, useState } from 'react'

interface OrderShippingFormProps {
  order: Order
}

export function OrderShippingForm({ order }: OrderShippingFormProps) {
  const formSubmission = useMemo(() => order.formSubmission as FormSubmission, [order])
  const { refetch } = useDraggable()
  const form = useMemo(() => formSubmission?.form as Form, [formSubmission])
  const submissionData = useMemo(() => formSubmission?.submissionData || {}, [formSubmission])
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [updatingField, setUpdatingField] = useState<string | null>(null)

  const handleCopy = (value: string, fieldName: string) => {
    if (!value) return
    navigator.clipboard.writeText(value)
    setCopiedField(fieldName)
    setTimeout(() => {
      setCopiedField(null)
    }, 1500)
  }

  const { mutate: updateNeedProcessRequiredMutation, isPending } = useMutation({
    mutationFn: async ({ fieldName }: { fieldName: string }) => {
      setUpdatingField(fieldName)
      await payloadClient.updateById({
        collection: 'form-submissions',
        id: formSubmission.id,
        data: {
          submissionData: {
            ...(submissionData as any),
            [fieldName]: typeof (submissionData as any)[fieldName] === 'object' ? '' : {},
          },
        },
      })

      if (order.status !== 'USER_UPDATE' && order.status !== 'REFUND') {
        await payloadClient.updateById({
          collection: 'orders',
          id: order.id,
          data: { status: 'USER_UPDATE' },
        })
      }

      await refetch()
      setUpdatingField(null)
    },
  })

  return (
    <div className="grid grid-cols-2 gap-2 mt-1">
      {form?.fields?.map((field, index) => {
        const Field: React.FC<any> = fields?.[field.blockType as keyof typeof fields]
        if (!Field) return null
        const options = field.blockType == 'select' ? field.options : undefined
        const value =
          options && options?.length > 0
            ? options.find(
                (option) =>
                  option.value === submissionData[field.name as keyof typeof submissionData],
              )?.label
            : submissionData[field.name as keyof typeof submissionData] || ''

        const isCopied = copiedField === field.name
        const isProcessRequired = typeof value === 'object'
        const isHaveValue = value && !isProcessRequired
        const isUpdating = updatingField === field.name

        return (
          <div key={index} className="w-full flex">
            <div
              onClick={() => isHaveValue && handleCopy(value, field.name)}
              className={cn(
                'w-[90%] relative rounded-md border px-2 py-1.5 transition-all',
                !value && 'border-dashed opacity-70',
                value && 'cursor-pointer hover:bg-muted/50 active:bg-muted',
                isCopied && 'ring-1 ring-green-500',
              )}
            >
              <div className="flex items-center gap-0.5 text-xs font-medium text-muted-foreground">
                {field.label}
                {field.required && <span className="text-destructive">*</span>}
              </div>
              <div className="flex items-center justify-between gap-1">
                <div className="truncate text-sm">
                  {isHaveValue ? (
                    value
                  ) : (
                    <span className="text-muted-foreground italic">Chưa có</span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {isHaveValue && (
                    <div
                      className={cn(
                        'flex h-4 w-4 shrink-0 items-center justify-center text-muted-foreground transition-colors',
                        isCopied && 'text-green-500',
                      )}
                    >
                      {isCopied ? (
                        <Check className="h-3 w-3" />
                      ) : (
                        value && <Copy className="h-3 w-3" />
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
            {order.status !== 'REFUND' && (
              <button
                className={cn(
                  'w-[10%] flex border shrink-0 items-center justify-center text-muted-foreground transition-colors hover:bg-muted hover:text-highlight',
                  isProcessRequired && 'text-highlight',
                )}
                onClick={() => updateNeedProcessRequiredMutation({ fieldName: field.name })}
                disabled={isPending && isUpdating}
              >
                {isUpdating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <UserPen className="h-5 w-5" />
                )}
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
}
