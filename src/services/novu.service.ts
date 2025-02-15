import { env } from '@/config'
import { Novu } from '@novu/api'

export const novu = new Novu({ secretKey: env.NOVU_SECRET_KEY })
