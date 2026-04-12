import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { headers } from 'next/headers'
import { userHasRole } from '@/access/hasRoles'

import { User } from '@/payload-types'

export async function POST(req: Request) {
  try {
    const { title, content } = await req.json()
    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    const payload = await getPayload({ config: configPromise })
    
    // Authenticate request
    const reqHeaders = await headers()
    const { user } = await payload.auth({ headers: reqHeaders })
    if (!user || (!userHasRole(user, ['admin', 'staff']))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch AI Configuration
    const aiConfig = await payload.findGlobal({
      slug: 'ai-configuration',
    })

    if (!aiConfig?.apiKey || typeof aiConfig.apiKey !== 'string') {
      return NextResponse.json({ error: 'AI API Key not configured in Admin' }, { status: 500 })
    }

    const provider = aiConfig.provider || 'openai'
    const model = typeof aiConfig.model === 'string' && aiConfig.model ? aiConfig.model : (provider === 'gemini' ? 'gemini-1.5-flash' : 'gpt-4o-mini')
    const maxTokens = 3000
    const prompt = `Dựa vào tiêu đề VÀ nội dung sau, viết một thẻ meta description SEO (khoảng 150 ký tự) cho bài viết/sản phẩm trên website Sub Game Zone (chuyên game bản quyền, nạp game). Viết lôi cuốn, hấp dẫn, đúng chuẩn SEO tiếng Việt và không dùng ngoặc kép bọc lại hay ghi thêm chữ "Meta description:".\n\nTiêu đề: ${title}\nNội dung: ${content ? content.substring(0, 500) : ''}`

    let generatedText = ''

    if (provider === 'gemini') {
      // Gemini API
      const baseUrl = typeof aiConfig.baseUrl === 'string' && aiConfig.baseUrl ? aiConfig.baseUrl : 'https://generativelanguage.googleapis.com'
      const url = `${baseUrl}/v1beta/models/${model}:generateContent?key=${aiConfig.apiKey}`
      
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: maxTokens }
        })
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('[Gemini API] Failed request:', response.status, errorText)
        throw new Error(`Gemini API Error (${response.status}): ${errorText}`)
      }
      
      const data = await response.json()
      generatedText = data?.candidates?.[0]?.content?.parts?.[0]?.text || ''
    } else {
      // OpenAI API or Custom OpenAI compatible
      const baseUrl = typeof aiConfig.baseUrl === 'string' && aiConfig.baseUrl ? aiConfig.baseUrl.replace(/\/$/, '') : 'https://api.openai.com/v1'
      const url = `${baseUrl}/chat/completions`
      
      const response = await fetch(url, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${aiConfig.apiKey}`
        },
        body: JSON.stringify({
          model: model,
          messages: [{ role: 'user', content: prompt }],
          max_tokens: maxTokens,
          temperature: 0.7
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('[OpenAI/Custom API] Failed request:', response.status, errorText)
        throw new Error(`AI API Error (${response.status}): ${errorText}`)
      }

      const data = await response.json()
      generatedText = data?.choices?.[0]?.message?.content || ''
      
      if (!generatedText) {
        console.error('[OpenAI/Custom API] Empty or unexpected response:', data)
        throw new Error(`Unexpected API response format: ${JSON.stringify(data)}`)
      }
    }

    // Clean up response
    generatedText = generatedText.replace(/^["'`]+|["'`]+$/g, '').trim()

    return NextResponse.json({ description: generatedText })
  } catch (error: any) {
    console.error('[AI Meta Generation Error]:', error.message || error)
    
    // Provide a more helpful error message if it's the specific fetch "terminated" / network block error
    const msg = error?.message || String(error)
    if (msg.includes('terminated') || msg.includes('fetch failed')) {
      return NextResponse.json(
        { error: `Network/Proxy Error: The AI endpoint abruptly closed the connection. Double check your Base URL (did you forget /v1?). Inner error: ${msg}` }, 
        { status: 500 }
      )
    }

    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
