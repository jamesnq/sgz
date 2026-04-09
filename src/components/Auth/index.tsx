'use client'

import { Button } from '@payloadcms/ui'
import { useRouter } from 'next/navigation'
import { adminClient } from 'payload-auth-plugin/client'

const { signin } = adminClient()

export const AuthComponent = () => {
  const router = useRouter()

  const handleGoogleSignin = async () => {
    const { message, isSuccess, isError } = await signin().oauth('google')
    if (isError) {
      console.log(message)
    }
    if (isSuccess) {
      const searchParams = new URLSearchParams(window.location.search)
      const defaultRedirect = window.location.pathname.startsWith('/admin') ? '/admin' : '/'
      const redirectURL = searchParams.get('redirect') || defaultRedirect
      router.push(redirectURL)
    }
  }

  return (
    <Button onClick={handleGoogleSignin} type="button">
      Sign in with Google
    </Button>
  )
}
