'use client'

import React, { useState } from 'react'
import { useForm, useField } from '@payloadcms/ui'
import { Button } from '@payloadcms/ui'
import { toast } from '@payloadcms/ui'
import { textOnly } from '../RichText/textOnly'

export const AiGenerateButton: React.FC = () => {
  const { setModified } = useForm()
  const [isGenerating, setIsGenerating] = useState(false)
  
  // We need to access doc title and content to generate description
  const { value: name } = useField<string>({ path: 'name' })
  const { value: title } = useField<string>({ path: 'title' })
  const { value: description } = useField<any>({ path: 'description' })
  const { value: excerpt } = useField<string>({ path: 'excerpt' })
  const { value: content } = useField<any>({ path: 'content' })
  const { value: descriptionField, setValue: setMetaDescription } = useField<string>({ path: 'meta.description' })

  const handleGenerate = async () => {
    setIsGenerating(true)
    try {
      const docTitle = name || title || ''
      if (!docTitle) {
        toast.error('Vui lòng nhập Tên/Tiêu đề trước khi tạo.')
        setIsGenerating(false)
        return
      }

      let docContent = excerpt && typeof excerpt === 'string' ? excerpt : ''
      if (!docContent && content) {
        docContent = textOnly(content)
      }
      if (!docContent && description) {
        docContent = textOnly(description)
      }

      // We call our custom Next.js API endpoint to run AI
      // The endpoint will read AiConfiguration and run it
      const response = await fetch('/api/ai/generate-meta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          title: docTitle,
          content: docContent
        })
      })

      if (!response.ok) {
        throw new Error('AI API Error')
      }

      const data = await response.json()
      if (data?.description) {
        setMetaDescription(data.description)
        setModified(true)
        toast.success('Đã tạo Meta Description thành công!')
      }
    } catch (e: any) {
      toast.error('Lỗi khi gọi AI: ' + e.message)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="field-type" style={{ marginBottom: '1rem', marginTop: '-1rem' }}>
      <Button 
        buttonStyle="secondary" 
        onClick={handleGenerate}
        disabled={isGenerating}
      >
        {isGenerating ? 'Đang tạo...' : '✨ Tạo Meta Description (AI)'}
      </Button>
    </div>
  )
}
