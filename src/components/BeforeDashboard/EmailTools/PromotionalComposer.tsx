'use client'

import React, { useState } from 'react'
import { Button, toast } from '@payloadcms/ui'

type Deal = {
  title: string
  description: string
  ctaLabel: string
  ctaUrl: string
}

type PromotionalPreview = {
  subject: string
  html: string
  text: string
}

const defaultDeal: Deal = { title: '', description: '', ctaLabel: '', ctaUrl: '' }

export const PromotionalComposer: React.FC = () => {
  const [form, setForm] = useState({
    subject: 'Flash Sale SubGameZone',
    previewText: 'Ưu đãi mới dành cho bạn',
    title: 'Ưu đãi nổi bật hôm nay',
    intro: 'Chọn nhanh các deal đang giảm giá để không bỏ lỡ.',
    unsubscribeUrl: 'https://subgamezone.com/unsubscribe',
    mode: 'test',
    testEmail: '',
  })
  const [deals, setDeals] = useState<Deal[]>([{ ...defaultDeal }])
  const [preview, setPreview] = useState<PromotionalPreview | null>(null)
  const [loading, setLoading] = useState(false)

  const payload = { ...form, deals }

  const updateDeal = (index: number, key: keyof Deal, value: string) => {
    setDeals((current) => current.map((deal, dealIndex) => dealIndex === index ? { ...deal, [key]: value } : deal))
  }

  const handlePreview = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/email/promotional-preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
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

  const handleSend = async () => {
    if (!window.confirm('Gửi email khuyến mãi test?')) {
      return
    }

    const response = await fetch('/api/admin/email/promotional-send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, confirm: true }),
    })
    const data = await response.json()
    if (!response.ok) {
      toast.error(data.error || 'Send failed')
      return
    }
    toast.success(`Đã gửi ${data.sentCount}/${data.totalRecipients} email`)
  }

  return (
    <div className="email-tools__panel">
      <div className="email-tools__form-grid">
        {(['subject', 'previewText', 'title', 'intro', 'testEmail'] as const).map((key) => (
          <label className="email-tools__field" key={key}>
            <span>{key}</span>
            <input value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} />
          </label>
        ))}
        <label className="email-tools__field email-tools__field--wide">
          <span>unsubscribeUrl</span>
          <input value={form.unsubscribeUrl} onChange={(e) => setForm({ ...form, unsubscribeUrl: e.target.value })} />
        </label>
      </div>

      <div className="email-tools__deals">
        {deals.map((deal, index) => (
          <div className="email-tools__deal" key={index}>
            <input value={deal.title} onChange={(e) => updateDeal(index, 'title', e.target.value)} placeholder="Deal title" />
            <input value={deal.description} onChange={(e) => updateDeal(index, 'description', e.target.value)} placeholder="Description" />
            <input value={deal.ctaLabel} onChange={(e) => updateDeal(index, 'ctaLabel', e.target.value)} placeholder="CTA label" />
            <input value={deal.ctaUrl} onChange={(e) => updateDeal(index, 'ctaUrl', e.target.value)} placeholder="CTA URL" />
          </div>
        ))}
        <button type="button" className="email-tools__secondary" onClick={() => setDeals([...deals, { ...defaultDeal }])}>
          Add deal
        </button>
      </div>

      <div className="email-tools__actions">
        <Button onClick={handlePreview} disabled={loading}>{loading ? 'Đang tải...' : 'Preview email khuyến mãi'}</Button>
        <Button onClick={handleSend} disabled={!form.testEmail}>Gửi email test</Button>
      </div>

      {preview && (
        <div className="email-tools__preview-grid">
          <div className="email-tools__preview-card">
            <p className="email-tools__preview-label">Subject</p>
            <strong>{preview.subject}</strong>
            <iframe title="Promotional email preview" srcDoc={preview.html} className="email-tools__iframe" />
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
