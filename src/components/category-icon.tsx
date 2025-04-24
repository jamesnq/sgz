'use client'

import StringToSVG from '@/components/ui/string-to-svg'
import { Category } from '@/payload-types'
import { ChartColumnStacked } from 'lucide-react'
import { DynamicIcon } from 'lucide-react/dynamic'

function IconRender({
  icon,
  width,
  height,
  className,
  inheritColor = true,
  ...props
}: React.SVGProps<SVGSVGElement> & { icon: string | undefined | null; inheritColor?: boolean }) {
  if (!icon) return <ChartColumnStacked size={width || 24} height={height || 24} {...props} />
  if (icon.startsWith('<')) {
    return (
      <StringToSVG
        fill="none"
        svgString={icon}
        className={className}
        width={width || 24}
        height={height || 24}
        inheritColor={inheritColor}
        {...props}
      />
    )
  }
  return <DynamicIcon size={width || 24} name={icon as any} {...props} />
}

export function CategoryIcon({ category, size }: { category: Category; size?: number }) {
  return <IconRender icon={category.icon} width={size} height={size} />
}
