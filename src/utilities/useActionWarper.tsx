'use client'
import { useAction } from 'next-safe-action/hooks'

import { toast } from 'react-toastify'

export function useActionWarper(action: any): any {
  return useAction(action, {
    onSettled({ result }) {
      if (result.serverError) {
        const error: any = result.serverError
        if (error.notify) {
          if (error.notify.type === 'toast') {
            toast.error(error.message)
            return
          }
        }
        // TODO handle popup notification
        toast.error(error.message)
        return
      }
      const data: any = result.data
      if (data?.message) {
        toast.success(data?.message)
      }
    },
  })
}
