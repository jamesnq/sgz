'use client'

import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { cn } from '@/utilities/ui'
import RichText from '@/components/RichText'
import { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'

import type { InlineDialog as InlineDialogProps } from '@/payload-types'

type Props = InlineDialogProps & {
  className?: string
}

export const InlineDialog: React.FC<Props> = (props) => {
  const { className, buttonText, dialogTitle, content, maxWidth = 'md' } = props
  const [open, setOpen] = useState(false)

  // Map maxWidth to Tailwind classes
  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
  }

  return (
    <span className={cn('inline', className)}>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <span className="text-primary underline cursor-pointer hover:text-primary/80 transition-colors">
            {buttonText || 'View details'}
          </span>
        </DialogTrigger>
        <DialogContent className={cn('max-h-[80vh] overflow-y-auto', maxWidthClasses[maxWidth as keyof typeof maxWidthClasses] || 'max-w-md')}>
          <DialogHeader>
            <DialogTitle>{dialogTitle}</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            {content && (
              <RichText 
                data={content as SerializedEditorState} 
                enableGutter={false}
                enableProse={true}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </span>
  )
}
