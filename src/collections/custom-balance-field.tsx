'use client'

import { adminBalanceAction } from '@/app/_actions/adminBalanceAction'
import { Button, NumberField, useField } from '@payloadcms/ui'
import { WalletIcon } from 'lucide-react'
import { NumberFieldClientComponent } from 'payload'
import { useCallback, useEffect, useRef, useState } from 'react'

export const CustomBalanceField: NumberFieldClientComponent = ({ path, field, ...props }) => {
  const { setValue } = useField<number>({ path })
  const [popupState, setPopupState] = useState<{ isOpen: boolean }>({
    isOpen: false,
  })
  const [inputValue, setInputValue] = useState<string>('')
  const [noteValue, setNoteValue] = useState<string>('')
  const buttonRef = useRef<HTMLButtonElement>(null)

  // Extract userId from URL path
  const getUserIdFromPath = () => {
    if (typeof window === 'undefined') return null

    const pathParts = window.location.pathname.split('/')
    // URL format: /admin/collections/users/{userId}
    const userIdIndex = pathParts.indexOf('users') + 1

    if (userIdIndex < pathParts.length) {
      const userId = pathParts[userIdIndex]
      return isNaN(Number(userId)) ? null : Number(userId)
    }

    return null
  }

  const handleOpenPopup = () => {
    setInputValue('')
    setNoteValue('')
    setPopupState({ isOpen: true })
  }

  const handleClosePopup = useCallback(() => {
    setPopupState((prev) => ({ ...prev, isOpen: false }))
  }, [])

  const handleApply = async () => {
    if (!inputValue) return

    const amount = Number(inputValue)
    if (!Number.isFinite(amount)) return

    const userId = getUserIdFromPath()

    if (!userId) {
      console.error('Could not determine user ID from URL path')
      return
    }

    const result = await adminBalanceAction({
      userId,
      amount,
      note: noteValue || '',
    })

    if (result?.serverError) {
      console.error('[CustomBalanceField] Failed to adjust balance:', result.serverError)
      return
    }

    if (typeof result?.data?.balance === 'number') {
      setValue(result.data.balance)
    }

    handleClosePopup()
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value)
  }

  const handleNoteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNoteValue(e.target.value)
  }

  // Close popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popupState.isOpen &&
        event.target instanceof Element &&
        !event.target.closest('.popup-content')
      ) {
        handleClosePopup()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [popupState.isOpen, handleClosePopup])

  const renderPopup = () => {
    if (!popupState.isOpen) return null

    return (
      <div
        className="popup-overlay"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
        }}
      >
        <div
          className="popup-content"
          style={{
            backgroundColor: 'var(--theme-elevation-0, white)',
            borderRadius: '4px',
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.2)',
            border: '1px solid var(--theme-elevation-100, #e0e0e0)',
            maxWidth: '90%',
            width: '350px',
          }}
        >
          <div style={{ padding: '20px' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: 500 }}>
              Adjust Balance User #{getUserIdFromPath()}
            </h3>
            <div style={{ marginBottom: '16px' }}>
              <label
                style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: 500 }}
              >
                Amount (positive to add, negative to subtract):
              </label>
              <input
                type="number"
                value={inputValue}
                onChange={handleInputChange}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid var(--theme-elevation-100, #ccc)',
                  borderRadius: '4px',
                  fontSize: '14px',
                }}
                autoFocus
                placeholder="Enter amount (e.g. 100 or -50)"
              />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label
                style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: 500 }}
              >
                Note (optional):
              </label>
              <input
                type="text"
                value={noteValue}
                onChange={handleNoteChange}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid var(--theme-elevation-100, #ccc)',
                  borderRadius: '4px',
                  fontSize: '14px',
                }}
                placeholder="Enter a note for this transaction"
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <Button buttonStyle="secondary" size="small" onClick={handleClosePopup}>
                Cancel
              </Button>
              <Button buttonStyle="primary" size="small" onClick={handleApply}>
                Apply
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', gap: '2px' }}>
      <NumberField {...props} path={path} field={field} onChange={setValue} />

      <div style={{ position: 'relative' }}>
        <Button buttonStyle="secondary" size="large" onClick={handleOpenPopup} ref={buttonRef}>
          <WalletIcon />
        </Button>
      </div>

      {popupState.isOpen && renderPopup()}
    </div>
  )
}
