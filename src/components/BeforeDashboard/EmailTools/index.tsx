'use client'

import React, { useState } from 'react'
import { OrderCompletionPreview } from './OrderCompletionPreview'
import { PromotionalComposer } from './PromotionalComposer'
import './EmailTools.scss'

export const EmailTools: React.FC = () => {
  const [tab, setTab] = useState<'transactional' | 'promotional'>('transactional')

  return (
    <section className="email-tools">
      <div className="email-tools__header">
        <div>
          <p className="email-tools__eyebrow">Email control room</p>
          <h2>Email templates and previews</h2>
        </div>
        <div className="email-tools__tabs">
          <button
            className={tab === 'transactional' ? 'email-tools__tab email-tools__tab--active' : 'email-tools__tab'}
            type="button"
            onClick={() => setTab('transactional')}
          >
            Order Completion
          </button>
          <button
            className={tab === 'promotional' ? 'email-tools__tab email-tools__tab--active' : 'email-tools__tab'}
            type="button"
            onClick={() => setTab('promotional')}
          >
            Promotional Deals
          </button>
        </div>
      </div>

      {tab === 'transactional' ? <OrderCompletionPreview /> : <PromotionalComposer />}
    </section>
  )
}
