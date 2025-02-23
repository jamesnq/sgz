'use client'
import { HookSafeActionFn, useAction, UseActionHookReturn } from 'next-safe-action/hooks'

import { toast } from 'react-toastify'
import { Schema } from 'zod'
export function useActionWarper<
  ServerError,
  S extends Schema | undefined,
  const BAS extends readonly Schema[],
  CVE,
  CBAVE,
  Data,
>(
  action: HookSafeActionFn<ServerError, S, BAS, CVE, CBAVE, Data>,
): UseActionHookReturn<ServerError, S, BAS, CVE, CBAVE, Data> {
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
