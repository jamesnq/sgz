import * as React from "react"
import { useState, useRef, useEffect } from "react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

export const FilterTooltip = ({
  label,
  children,
}: {
  label: string
  children: (textRef: React.RefObject<HTMLSpanElement | null>) => React.ReactNode
}) => {
  const [isOverflowing, setIsOverflowing] = useState(false)
  const textRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const checkOverflow = () => {
      if (textRef.current) {
        setIsOverflowing(textRef.current.scrollWidth > textRef.current.clientWidth)
      }
    }
    checkOverflow()
    const timeout = setTimeout(checkOverflow, 100)
    window.addEventListener('resize', checkOverflow)
    return () => {
      clearTimeout(timeout)
      window.removeEventListener('resize', checkOverflow)
    }
  }, [label])

  if (!isOverflowing) {
    return <>{children(textRef)}</>
  }

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>{children(textRef)}</TooltipTrigger>
        <TooltipContent
          side="top"
          className="bg-[#16161e] text-white border-[#48474c] shadow-lg max-w-[250px] break-words text-center"
        >
          <p>{label}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
