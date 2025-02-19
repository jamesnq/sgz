'use client'

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'

import type { Theme, ThemeContextType } from './types'

import canUseDOM from '@/utilities/canUseDOM'
import { ToastContainer } from 'react-toastify'
import { defaultTheme, getImplicitPreference, themeLocalStorageKey } from './shared'
import { themeIsValid } from './types'
import { env } from '@/config'
import { useAuth } from '../Auth'

function ChatwootLoader() {
  const { theme } = useTheme()
  const { user } = useAuth()

  useEffect(() => {
    if (user === undefined) return

    const SCRIPT_URL = `${env.NEXT_PUBLIC_CHATWOOT_BASE_URL}/packs/js/sdk.js`
    const onReady = (): void => {
      if (!user) return
      // @ts-expect-error ignore
      window.$chatwoot.setUser(user?.email, {
        email: user?.email,
        name: user?.email.split('@')[0],
      })

      // window.$chatwoot.setCustomAttributes({
      //   company: 'nameFriendly',
      // })
    }
    const onError = (error: unknown): void => {
      // @ts-expect-error ignore
      window.$chatwoot.setUser(user?.email, {
        email: user?.email,
      })

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

const initialContext: ThemeContextType = {
  setTheme: () => null,
  theme: undefined,
}

const ThemeContext = createContext(initialContext)

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [theme, setThemeState] = useState<Theme | undefined>(
    canUseDOM ? (document.documentElement.getAttribute('data-theme') as Theme) : undefined,
  )

  const setTheme = useCallback((themeToSet: Theme | null) => {
    if (themeToSet === null) {
      window.localStorage.removeItem(themeLocalStorageKey)
      const implicitPreference = getImplicitPreference()
      document.documentElement.setAttribute('data-theme', implicitPreference || '')
      if (implicitPreference) setThemeState(implicitPreference)
    } else {
      setThemeState(themeToSet)
      window.localStorage.setItem(themeLocalStorageKey, themeToSet)
      document.documentElement.setAttribute('data-theme', themeToSet)
    }
  }, [])

  useEffect(() => {
    let themeToSet: Theme = defaultTheme
    const preference = window.localStorage.getItem(themeLocalStorageKey)

    if (themeIsValid(preference)) {
      themeToSet = preference
    } else {
      const implicitPreference = getImplicitPreference()

      if (implicitPreference) {
        themeToSet = implicitPreference
      }
    }

    document.documentElement.setAttribute('data-theme', themeToSet)
    setThemeState(themeToSet)
  }, [])

  return (
    <ThemeContext.Provider value={{ setTheme, theme }}>
      {children}
      <ToastContainer
        position="top-center"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme={theme}
      />
      <ChatwootLoader />
    </ThemeContext.Provider>
  )
}

export const useTheme = (): ThemeContextType => useContext(ThemeContext)
