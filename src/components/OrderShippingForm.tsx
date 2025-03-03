'use client'

import { Form, FormSubmission, Order } from '@/payload-types'
import { fields } from '@/blocks/Form/fields'
import { Button } from '@/components/ui/button'
import { Copy } from 'lucide-react'
import { useMemo } from 'react'
import { cn } from '@/utilities/ui'
import { toast } from 'react-toastify'

interface OrderShippingFormProps {
  order: Order
}

export function OrderShippingForm({ order }: OrderShippingFormProps) {
  const formSubmission = useMemo(() => order.formSubmission as FormSubmission, [order])
  const form = useMemo(() => formSubmission?.form as Form, [formSubmission])
  const submissionData = useMemo(() => formSubmission?.submissionData || {}, [formSubmission])

  const handleCopy = (value: string) => {
    if (!value) return
    navigator.clipboard.writeText(value)
    toast.success('Đã sao chép')
  }

  return (
    <div className="grid grid-cols-2 gap-2">
      {form?.fields?.map((field, index) => {
        const Field: React.FC<any> = fields?.[field.blockType as keyof typeof fields]
        if (!Field) return null

        const value = submissionData[field.name as keyof typeof submissionData] || ''

        return (
          <div
            key={index}
            className={cn(
              'relative rounded-md border px-2 py-1.5',
              !value && 'border-dashed opacity-70',
            )}
          >
            <div className="flex items-center gap-0.5 text-xs font-medium text-muted-foreground">
              {field.label}
              {field.required && <span className="text-destructive">*</span>}
            </div>
            <div className="flex items-center justify-between gap-1">
              <div className="truncate text-sm">
                {value || <span className="text-muted-foreground italic">Chưa có</span>}
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 shrink-0"
                disabled={!value}
                onClick={() => handleCopy(value)}
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
