'use client'

import React, { Fragment, useCallback, useState } from 'react'
import { toast } from '@payloadcms/ui'

import './index.scss'

type ActionButtonProps = {
  label: string
  endpoint: string
  confirmMessage: string
  loadingMessage: string
  successMessage: React.ReactNode
  errorMessage: string
  alreadyInProgressMessage: string
  className?: string
}

export const ActionButton: React.FC<ActionButtonProps> = ({
  label,
  endpoint,
  confirmMessage,
  loadingMessage,
  successMessage,
  errorMessage,
  alreadyInProgressMessage,
  className = 'actionButton',
}) => {
  const [loading, setLoading] = useState(false)
  const [completed, setCompleted] = useState(false)
  const [error, setError] = useState<null | string>(null)

  const handleClick = useCallback(
    async (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault()

      if (loading) {
        toast.info(alreadyInProgressMessage)
        return
      }
      if (error) {
        toast.error(`An error occurred, please refresh and try again.`)
        return
      }
      
      // Simple confirmation using window.confirm
      const isConfirmed = window.confirm(confirmMessage)
      
      if (!isConfirmed) {
        return
      }
      
      setLoading(true)
      setCompleted(false)

      try {
        toast.promise(
          new Promise((resolve, reject) => {
            try {
              fetch(endpoint, { method: 'POST', credentials: 'include' })
                .then((res) => {
                  if (res.ok) {
                    resolve(true)
                    setCompleted(true)
                  } else {
                    reject(errorMessage)
                  }
                })
                .catch((error) => {
                  reject(error)
                })
            } catch (error) {
              reject(error)
            } finally {
              setLoading(false)
            }
          }),
          {
            loading: loadingMessage,
            success: successMessage,
            error: errorMessage,
          },
        )
      } catch (err) {
        const error = err instanceof Error ? err.message : String(err)
        setError(error)
        setLoading(false)
      }
    },
    [loading, error, endpoint, confirmMessage, loadingMessage, successMessage, errorMessage, alreadyInProgressMessage],
  )

  let message = ''
  if (loading) message = ' (processing...)'
  if (completed) message = ' (done!)'
  if (error) message = ` (error: ${error})`

  return (
    <Fragment>
      <button className={className} onClick={handleClick}>
        {label}
      </button>
      {message}
    </Fragment>
  )
}
