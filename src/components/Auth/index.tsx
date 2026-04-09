'use client'

import { Button } from '@payloadcms/ui'
import { useRouter } from 'next/navigation'
import { appClient } from 'payload-auth-plugin/client'

const { signin } = appClient({ name: 'app' })

export const AuthComponent = () => {
  const router = useRouter()

  const handleGoogleSignin = async () => {
    const { message, isSuccess, isError } = await signin().oauth('google')
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
