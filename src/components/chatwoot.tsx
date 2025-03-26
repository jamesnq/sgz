'use client'

import { useEffect } from 'react'

import { env } from '@/config'
import { User } from '@/payload-types'
import { useTheme } from '@/providers/Theme'
import { useAuth } from '@/providers/Auth'

function chatwootSetUser(user: User | null) {
  if (!user) return
  // @ts-expect-error ignore
  window.$chatwoot.setUser(user?.email, {
    email: user?.email,
    name: user?.email.split('@')[0],
    identifier_hash: user?.chatwootHash,
  })
}
export function ChatwootLoader() {
  const { theme } = useTheme()
  const { user } = useAuth()

  useEffect(() => {
    if (user === undefined) return

    const SCRIPT_URL = `${env.NEXT_PUBLIC_CHATWOOT_BASE_URL}/packs/js/sdk.js`
    const onReady = (): void => {
      chatwootSetUser(user)
    }
    const onError = (error: unknown): void => {
      chatwootSetUser(null)
      console.log(error)
    }

    window.addEventListener('chatwoot:ready', onReady)

    window.addEventListener('chatwoot:error', onError)
    const loadChatwoot = () => {
      // @ts-expect-error ignore
      window.chatwootSettings = {
        locale: 'vi_VN',
        darkMode: theme,
        position: 'right',
        type: 'standard',
        launcherTitle: '',
      }

      const script = document.createElement('script')
      script.src = SCRIPT_URL
      script.defer = true
      script.async = true

      script.onload = () => {
        // @ts-expect-error ignore
        if (window.chatwootSDK) {
          // @ts-expect-error ignore
          window.chatwootSDK.run({
            websiteToken: env.NEXT_PUBLIC_CHATWOOT_WEBSITE_TOKEN,
            baseUrl: env.NEXT_PUBLIC_CHATWOOT_BASE_URL,
          })
        }
      }

      document.body.appendChild(script)
    }

    loadChatwoot()

    // Clean up script when the component unmounts
    return () => {
      const existingScript = document.querySelector(`script[src="${SCRIPT_URL}"]`)

      if (existingScript) {
        document.body.removeChild(existingScript)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  return null
}
