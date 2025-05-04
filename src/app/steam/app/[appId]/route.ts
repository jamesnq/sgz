import { config } from '@/config'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest): Promise<Response> {
  try {
    const appId = request.nextUrl.pathname.split('/').pop()
    if (!appId) {
      return NextResponse.json({ error: 'App ID is required' }, { status: 400 })
    }

    // Create the download URL with the API key
    const downloadUrl = `https://generator.ryuu.lol/secure_download?appid=${appId}&auth_code=${config.RYUU_AUTH_CODE}`

    // Important: await fetch() only waits for headers, not the body
    // The body is still streamed as it arrives
    const response = await fetch(downloadUrl, {
      cache: 'no-store',
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to download file: ${response.statusText}` },
        { status: response.status },
      )
    }

    // This creates a streaming response - each chunk from the source is immediately
    // forwarded to the client as it's received, without waiting for the full download
    return new Response(response.body, {
      headers: response.headers,
      status: response.status,
    })
  } catch (error) {
    console.error('Error proxying download:', error)
    return NextResponse.json({ error: 'Failed to process download request' }, { status: 500 })
  }
}
