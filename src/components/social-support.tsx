'use client'

import { useEffect, useRef, useState } from 'react'
import { ArrowUpRight, Headset, MessageCircle, X } from 'lucide-react'

const FACEBOOK_LINK = 'https://www.facebook.com/subgamezoneoffical'
const DISCORD_LINK = 'https://discord.gg/WVqbFsEm2V'

export function SocialSupport() {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Close when clicking outside or pressing Escape
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('touchstart', handleClickOutside)
      document.addEventListener('keydown', handleKeyDown)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  return (
    <div ref={containerRef} className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Popover Support Card */}
      <div
        className={`mb-3 w-80 max-w-[calc(100vw-2rem)] rounded-2xl border border-zinc-800 bg-zinc-900/95 shadow-2xl shadow-black/60 backdrop-blur-xl transition-all duration-300 ease-out origin-bottom-right ${
          isOpen
            ? 'translate-y-0 scale-100 opacity-100 pointer-events-auto'
            : 'pointer-events-none translate-y-3 scale-95 opacity-0'
        }`}
      >
        {/* Card Header */}
        <div className="flex items-start justify-between border-b border-zinc-800/80 bg-zinc-950/40 p-4 pb-3">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-xl border border-violet-500/30 bg-violet-500/15 text-violet-400">
              <Headset className="size-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-zinc-100">Hỗ Trợ Khách Hàng</h3>
              <div className="mt-0.5 flex items-center gap-1.5">
                <span className="relative flex size-2">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex size-2 rounded-full bg-emerald-500"></span>
                </span>
                <span className="text-xs font-medium text-emerald-400">Sẵn sàng hỗ trợ</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => setIsOpen(false)}
            className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
            aria-label="Đóng popup hỗ trợ"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Channels List */}
        <div className="flex flex-col gap-2 p-3">
          {/* Facebook Option */}
          <a
            href={FACEBOOK_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-800/50 p-3 transition-all duration-200 hover:border-[#1877F2]/40 hover:bg-[#1877F2]/10"
          >
            <div className="flex items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#1877F2] text-white shadow-md shadow-[#1877F2]/30 transition-transform group-hover:scale-105">
                <svg className="size-5 fill-current" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </div>
              <div className="text-left">
                <div className="flex items-center gap-1.5 text-sm font-medium text-zinc-100 transition-colors group-hover:text-blue-400">
                  Facebook Messenger
                </div>
                <div className="mt-0.5 text-xs text-zinc-400">Chat trực tiếp với tư vấn viên</div>
              </div>
            </div>
            <ArrowUpRight className="size-4 shrink-0 text-zinc-500 transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-blue-400" />
          </a>

          {/* Discord Option */}
          <a
            href={DISCORD_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-800/50 p-3 transition-all duration-200 hover:border-[#5865F2]/40 hover:bg-[#5865F2]/10"
          >
            <div className="flex items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#5865F2] text-white shadow-md shadow-[#5865F2]/30 transition-transform group-hover:scale-105">
                <svg className="size-5 fill-current" viewBox="0 0 24 24">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                </svg>
              </div>
              <div className="text-left">
                <div className="flex items-center gap-1.5 text-sm font-medium text-zinc-100 transition-colors group-hover:text-indigo-400">
                  Discord Server
                </div>
                <div className="mt-0.5 text-xs text-zinc-400">Cộng đồng & Hỗ trợ kỹ thuật</div>
              </div>
            </div>
            <ArrowUpRight className="size-4 shrink-0 text-zinc-500 transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-indigo-400" />
          </a>
        </div>

        {/* Card Footer */}
        <div className="flex items-center justify-between border-t border-zinc-800/80 bg-zinc-950/60 px-4 py-2.5 text-[11px] text-zinc-400">
          <span>Giờ làm việc: 9h30 - 23h00</span>
          <span className="text-zinc-500">Sub Game Zone</span>
        </div>
      </div>

      {/* Main Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-label={isOpen ? 'Đóng hỗ trợ' : 'Mở hỗ trợ'}
        className={`group relative flex items-center gap-2.5 rounded-full px-4 py-3 shadow-xl transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer select-none ${
          isOpen
            ? 'border border-zinc-700 bg-zinc-800 text-zinc-200 shadow-zinc-950/50 hover:bg-zinc-700 hover:text-white'
            : 'bg-linear-to-r from-violet-600 via-purple-600 to-indigo-600 text-white shadow-violet-600/30 hover:from-violet-500 hover:to-indigo-500'
        }`}
      >
        {isOpen ? (
          <>
            <X className="size-5 transition-transform duration-200 group-hover:rotate-90 text-zinc-300" />
            <span className="text-sm font-medium">Đóng</span>
          </>
        ) : (
          <>
            <span className="relative flex size-2.5">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex size-2.5 rounded-full bg-emerald-500"></span>
            </span>
            <MessageCircle className="size-5" />
            <span className="text-sm font-semibold">Hỗ Trợ</span>
          </>
        )}
      </button>
    </div>
  )
}
