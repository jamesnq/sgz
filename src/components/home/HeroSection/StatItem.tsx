import React from 'react'

interface StatItemProps {
  icon: React.ReactNode
  value: number
  label: string
}

export const StatItem = ({ icon, value, label }: StatItemProps) => {
  return (
    <div className="flex items-center justify-start gap-4 group cursor-default">
      <div className="w-12 h-12 shrink-0 rounded-full bg-sgz-primary/20 flex items-center justify-center text-sgz-primary group-hover:scale-110 group-hover:bg-sgz-primary/30 transition-all">
        {icon}
      </div>
      <div className="flex flex-col">
        <span className="text-2xl md:text-3xl font-black bg-clip-text text-transparent bg-gradient-to-br from-white to-gray-400">
          {value.toLocaleString()}
        </span>
        <span className="text-sgz-textMuted text-xs font-semibold uppercase tracking-widest mt-1">
          {label}
        </span>
      </div>
    </div>
  )
}
