'use client'

import React, { useState } from 'react'
import { Button, toast } from '@payloadcms/ui'

type OrderPreview = {
  subject: string
  html: string
  text: string
}

export const OrderCompletionPreview: React.FC = () => {
  const [orderId, setOrderId] = useState('')
  const [preview, setPreview] = useState<OrderPreview | null>(null)
  const [loading, setLoading] = useState(false)

  const handlePreview = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/email/order-completion-preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: Number(orderId) }),
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Preview failed')
      }
      setPreview(data)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Preview failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="email-tools__panel">
      <div className="email-tools__form-grid">
        <label className="email-tools__field">
          <span>Order ID</span>
          <input value={orderId} onChange={(e) => setOrderId(e.target.value)} placeholder="123" />
        </label>
      </div>

      <div className="email-tools__actions">
        <Button onClick={handlePreview} disabled={loading || !orderId}>
          {loading ? 'Đang tải...' : 'Preview email hoàn thành'}
        </Button>
      </div>

      {preview && (
        <div className="email-tools__preview-grid">
          <div className="email-tools__preview-card">
            <p className="email-tools__preview-label">Subject</p>
            <strong>{preview.subject}</strong>
            <iframe title="Order completion email preview" srcDoc={preview.html} className="email-tools__iframe" />
          </div>
          <div className="email-tools__preview-card">
            <p className="email-tools__preview-label">Text version</p>
            <pre className="email-tools__text-preview">{preview.text}</pre>
          </div>
        </div>
      )}
    </div>
  )
}
