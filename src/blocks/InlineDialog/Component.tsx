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
import { DialogDescription } from '@radix-ui/react-dialog'

type Props = InlineDialogProps & {
  className?: string
}

export const InlineDialog: React.FC<Props> = (props) => {
  const { className, displayText, dialogTitle, content } = props
  const [open, setOpen] = useState(false)

  return (
    <span className={cn('inline', className)}>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <span className="text-primary underline cursor-pointer hover:text-primary/80 transition-colors">
            {displayText || 'View details'}
          </span>
        </DialogTrigger>
        <DialogContent className="max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{dialogTitle || ''}</DialogTitle>
            <DialogDescription></DialogDescription>
          </DialogHeader>
          <div className="flex-grow overflow-y-auto pr-4">
            {content && (
              <div className={cn('mt-4', { 'mt-0': !dialogTitle })}>
                <RichText
                  data={content as SerializedEditorState}
                  enableGutter={false}
                  enableProse={true}
                />
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </span>
  )
}
