'use client'

import { Button } from '@payloadcms/ui'
import { useRouter } from 'next/navigation'
import { adminClient } from 'payload-auth-plugin/client'

const { signin } = adminClient()

export const AuthComponent = () => {
  const router = useRouter()

  const handleGoogleSignin = async () => {
    const { data, message, isSuccess, isError } = await signin().oauth('google')
    if (isError) {
      console.log(message)
    }
    if (isSuccess) {
      router.push('/')
    }
  }

  return (
    <Button onClick={handleGoogleSignin} type="button">
      Sign in with Google
    </Button>
  )
}
