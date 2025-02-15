'use client'

import { env } from '@/config'
import { useAuth } from '@/providers/Auth'
import { Inbox } from '@novu/react'
import { BellIcon } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { dark } from '@novu/react/themes'
import { Button } from './ui/button'
export default function NovuInbox() {
  const router = useRouter()
  const { user } = useAuth()
  if (!user?.id) return <></>
  return (
    <Inbox
      localization={{
        'inbox.filters.dropdownOptions.unread': 'Chỉ chưa đọc',
        'inbox.filters.dropdownOptions.default': 'Chưa đọc & đã đọc',
        'inbox.filters.dropdownOptions.archived': 'Đã lưu trữ',
        'inbox.filters.labels.unread': 'Chưa đọc',
        'inbox.filters.labels.default': 'Thông báo',
        'inbox.filters.labels.archived': 'Đã lưu trữ',
        'notifications.emptyNotice': 'Không có thông báo',
        'notifications.actions.readAll': 'Đánh dấu tất cả là đã đọc',
        'notifications.actions.archiveAll': 'Lưu trữ tất cả',
        'notifications.actions.archiveRead': 'Lưu trữ đã đọc',
        'notification.actions.read.tooltip': 'Đánh dấu là đã đọc',
        'notification.actions.unread.tooltip': 'Đánh dấu là chưa đọc',
        'notifications.newNotifications': ({ notificationCount }: { notificationCount: number }) =>
          `${notificationCount > 99 ? '99+' : notificationCount} ${
            notificationCount === 1 ? 'thông báo' : 'thông báo'
          } mới`,
        'notification.actions.archive.tooltip': 'Lưu trữ',
        'notification.actions.unarchive.tooltip': 'Bỏ lưu trữ',
        'preferences.title': 'Tùy chọn Thông báo',
        'preferences.global': 'Tùy chọn Chung',
        'preferences.workflow.disabled.notice':
          'Liên hệ quản trị viên để bật quản lý đăng ký cho thông báo quan trọng này.',
        'preferences.workflow.disabled.tooltip': 'Liên hệ quản trị viên để chỉnh sửa',
        dynamic: {
          welcome: 'Xin chào',
        },
        locale: 'vi-VN',
      }}
      appearance={{
        elements: { root: {} },
        variables: {
          colorBackground: 'hsl(var(--background))',
          colorPrimary: 'red',
          colorSecondary: 'hsl(var(--secondary))',
          colorForeground: 'hsl(var(--foreground))',
          colorPrimaryForeground: 'hsl(var(--primary-foreground))',
          colorSecondaryForeground: 'hsl(var(--secondary-foreground))',
        },
      }}
      renderBell={(unreadCount) => (
        <Button className="rounded-full relative w-8 h-8" variant="ghost" size={'icon'}>
          <BellIcon />
          {unreadCount > 0 && (
            <span
              className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[0.625rem] h-[20px] w-[20px] font-bold text-white bg-red-500 rounded-full px-0.5"
              style={{ fontSize: unreadCount > 10 ? '10px' : '12px' }}
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Button>
      )}
      applicationIdentifier={env.NEXT_PUBLIC_NOVU_APPLICATION_IDENTIFIER}
      subscriberId={user.id.toString()}
      // TODO security issue
      // subscriberHash=""
      routerPush={(path: string) => router.push(path)}
    />
  )
}
