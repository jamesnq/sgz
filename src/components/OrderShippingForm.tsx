'use client'

import { useDraggable } from '@/app/(workspace)/workspace/DraggableContext'
import { fields } from '@/blocks/Form/fields'
import { Form, FormSubmission, Order } from '@/payload-types'
import payloadClient from '@/utilities/payloadClient'
import { cn } from '@/utilities/ui'
import { Check, Copy, Pencil } from 'lucide-react'
import { useMemo, useState } from 'react'

// import payloadClient from '@/utilities/payloadClient'

interface OrderShippingFormProps {
  order: Order
}

export function OrderShippingForm({ order }: OrderShippingFormProps) {
  const formSubmission = useMemo(() => order.formSubmission as FormSubmission, [order])
  const { refetch } = useDraggable()
  const form = useMemo(() => formSubmission?.form as Form, [formSubmission])
  const submissionData = useMemo(() => formSubmission?.submissionData || {}, [formSubmission])
  const [copiedField, setCopiedField] = useState<string | null>(null)

  const handleCopy = (value: string, fieldName: string) => {
    if (!value) return
    navigator.clipboard.writeText(value)
    setCopiedField(fieldName)
    setTimeout(() => {
      setCopiedField(null)
    }, 1500)
  }
  const updateNeedProcessRequired = async (fieldName: string) => {
    await payloadClient.updateById({
      collection: 'form-submissions',
      id: formSubmission.id,
      data: { submissionData: { ...(submissionData as any), [fieldName]: {} } },
    })
    if (order.status !== 'USER_UPDATE') {
      await payloadClient.updateById({
        collection: 'orders',
        id: order.id,
        data: { status: 'USER_UPDATE' },
      })
    }
    await refetch()
  }
  return (
    <div className="grid grid-cols-2 gap-2">
      {form?.fields?.map((field, index) => {
        const Field: React.FC<any> = fields?.[field.blockType as keyof typeof fields]
        if (!Field) return null

        const value = submissionData[field.name as keyof typeof submissionData] || ''
        const isCopied = copiedField === field.name
        const isProcessRequired = typeof value === 'object'
        const isHaveValue = value && !isProcessRequired
        return (
          <div
            key={index}
            onClick={() => isHaveValue && handleCopy(value, field.name)}
            className={cn(
              'relative rounded-md border px-2 py-1.5 transition-all',
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
                <button
                  className={cn(
                    'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-highlight',
                    isProcessRequired && 'text-highlight',
                  )}
                  onClick={async () => {
                    await updateNeedProcessRequired(field.name)
                  }}
                >
                  <Pencil className="h-3 w-3" />
                </button>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
