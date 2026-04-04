'use client'

import { Button } from '@payloadcms/ui'
import { useRouter } from 'next/navigation'
import { AuthClient } from 'payload-auth-plugin/client'

const authClient = new AuthClient('sgz-admin-auth')

export const AuthComponent = () => {
  const router = useRouter()

  const handleGoogleSignin = async () => {
    try {
      authClient.signin().oauth('google')
    } catch (e) {
      console.log(e)
    }
  }

  return (
    <Button onClick={handleGoogleSignin} type="button">
      Sign in with Google
    </Button>
  )
}
