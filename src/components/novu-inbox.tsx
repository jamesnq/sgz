'use client'

import { env } from '@/config'
import { NovuChannel } from '@/payload-types'
import { useAuth } from '@/providers/Auth'
import payloadClient from '@/utilities/payloadClient'
import { Inbox } from '@novu/react'
import { useQuery } from '@tanstack/react-query'
import { BellIcon } from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Button } from './ui/button'
export function NovuInboxAdmin() {
  const router = useRouter()
  const pathname = usePathname()
  const { data: channels } = useQuery({
    queryKey: ['novuChannels'],
    queryFn: async () => {
      return await payloadClient.find({
        collection: 'novu-channels',
      })
    },
    select: (x) => x.docs,
  })

  const [curChannel, setCurChannel] = useState<NovuChannel | undefined>()
  useEffect(() => {
    if (!channels || channels.length === 0) return

    setCurChannel(channels[0])
  }, [channels])
  if (!curChannel) return <></>
  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      <select
        value={curChannel.subscriberId}
        onChange={(e) => setCurChannel(channels?.find((x) => x.subscriberId === e.target.value))}
        style={{
          marginRight: '0.5rem',
          padding: '0.5rem',
          border: '1px solid #ccc',
          borderRadius: '0.25rem',
        }}
      >
        {channels?.map((channel) => (
          <option key={channel.subscriberId} value={channel.subscriberId}>
            {channel.subscriberId}
          </option>
        ))}
      </select>
      <Inbox
        key={curChannel.subscriberId}
        appearance={{
          elements: {
            popoverContent: {
              zIndex: 9999,
            },
          },
          variables: {
            colorBackground: 'var(--theme-bg)',
            colorPrimary: 'red',
            colorSecondary: 'doc-controls__label',
            colorForeground: 'var(--theme-text)',
            colorPrimaryForeground: 'doc-controls__value',
            colorSecondaryForeground: 'doc-controls__label',
          },
        }}
        renderBell={(unreadCount) => (
          <Button
            className="relative"
            variant="ghost"
            size={'icon'}
            style={{
              width: '2rem',
              height: '2rem',
              borderRadius: '9999px',
            }}
          >
            <BellIcon />
            {unreadCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: '-0.125rem',
                  right: '-0.125rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minWidth: '0.625rem',
                  height: '20px',
                  width: '20px',
                  fontWeight: 'bold',
                  color: 'white',
                  backgroundColor: '#ef4444',
                  borderRadius: '9999px',
                  padding: '0 0.125rem',
                  fontSize: unreadCount > 10 ? '10px' : '12px',
                }}
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </Button>
        )}
        applicationIdentifier={env.NEXT_PUBLIC_NOVU_APPLICATION_IDENTIFIER}
        subscriberId={curChannel.subscriberId}
        subscriberHash={curChannel.hash}
        routerPush={(path: string) => {
          console.log('🚀 ~ NovuInboxAdmin ~ path:', path)
          console.log('🚀 ~ NovuInboxAdmin ~ pathname:', pathname)

          if (pathname !== path) router.push(path)
        }}
        placement="bottom-end"
      />
    </div>
  )
}

export default function NovuInbox() {
  const router = useRouter()

  const { user } = useAuth()
  if (!user?.id || !user.novuHash) return <></>
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
          'new-order': 'Đơn hàng mới',
          'order-update': 'Đơn hàng cập nhật',
        },
        locale: 'vi-VN',
      }}
      appearance={{
        elements: {
          popoverContent: {
            zIndex: 9999,
          },
        },
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
      subscriberHash={user.novuHash}
      routerPush={(path: string) => router.push(path)}
      placement="bottom-end"
    />
  )
}
