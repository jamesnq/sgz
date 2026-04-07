import { defaultLogo } from '@/utilities/constants'
import { cn } from '@/lib/utils'

interface Props {
  className?: string
  loading?: 'lazy' | 'eager'
  priority?: 'auto' | 'high' | 'low'
}

export const Logo = (props: Props) => {
  const { loading: loadingFromProps, priority: priorityFromProps, className } = props

  const loading = loadingFromProps || 'lazy'
  const priority = priorityFromProps || 'low'

  return (
    /* eslint-disable @next/next/no-img-element */
    <img
      alt="Sub Game Zone Logo"
      loading={loading}
      fetchPriority={priority}
      decoding="async"
      className={cn('max-w-[12rem] w-full h-[40px]', className)}
      src={defaultLogo}
    />
  )
}
