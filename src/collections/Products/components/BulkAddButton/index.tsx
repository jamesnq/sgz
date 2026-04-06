'use client'

import React, { useState } from 'react'
import { BulkAddModal } from '../BulkAddModal'

export const BulkAddButton: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div style={{ marginBottom: '1rem' }}>
      <button 
        type="button"
        onClick={() => setIsOpen(true)} 
        style={{
          border: '1px solid var(--theme-elevation-150)',
          borderRadius: '4px',
          padding: '0.4rem 0.8rem',
          cursor: 'pointer',
          background: 'var(--theme-elevation-50)',
          color: 'var(--theme-elevation-800)',
          fontSize: '14px',
          fontWeight: '500',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="12" y1="18" x2="12" y2="12"></line><line x1="9" y1="15" x2="15" y2="15"></line></svg>
        Bulk Import (.xlsx)
      </button>
      {isOpen && <BulkAddModal onClose={() => setIsOpen(false)} />}
    </div>
  )
}
