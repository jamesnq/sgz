import { defaultLogo } from '@/utilities/constants'
import { cn } from '@/lib/utils'

interface Props {
  className?: string
  height?: number
  loading?: 'lazy' | 'eager'
  priority?: 'auto' | 'high' | 'low'
  width?: number
}

export const Logo = (props: Props) => {
  const {
    loading: loadingFromProps,
    priority: priorityFromProps,
    className,
    width = 40,
    height = 40,
  } = props

  const loading = loadingFromProps || 'lazy'
  const priority = priorityFromProps || 'low'

  return (
    /* eslint-disable @next/next/no-img-element */
    <img
      alt="Sub Game Zone Logo"
      loading={loading}
      fetchPriority={priority}
      decoding="async"
      width={width}
      height={height}
      className={cn('max-w-[12rem] w-auto h-[40px]', className)}
      src={defaultLogo}
    />
  )
}
