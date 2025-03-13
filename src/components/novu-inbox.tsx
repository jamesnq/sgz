'use client'

import { env } from '@/config'
import { useAuth } from '@/providers/Auth'
import { Inbox } from '@novu/react'
import { BellIcon } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Button } from './ui/button'
import { useEffect, useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import payloadClient from '@/utilities/payloadClient'
import { PaginatedDocs } from 'payload'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

// Define the NovuChannel type
interface NovuChannel {
  id: string
  subscriberId: string
  hash: string
  label?: string
}

export default function NovuInbox() {
  const router = useRouter()
  const { user } = useAuth()
  const [currentChannel, setCurrentChannel] = useState<{
    subscriberId: string
    hash: string
    label?: string
  } | null>(null)

  // Check if user has roles other than just "user"
  const hasAdditionalRoles = user?.roles && user.roles.some((role) => role !== 'user')

  // Fetch channels if user has additional roles
  const { data: fetchedChannels } = useQuery({
    queryKey: ['novuChannels'],
    queryFn: async () => {
      return await payloadClient.find({
        collection: 'novu-channels',
      })
    },
    select: (x: PaginatedDocs<NovuChannel>) => x.docs,
    enabled: !!hasAdditionalRoles && !!user?.id,
  })

  // Combine user with fetched channels
  const channels = useMemo(() => {
    if (!user?.id || !user.novuHash) return []

    // Create user channel
    const userChannel: NovuChannel = {
      id: user.id.toString(),
      subscriberId: user.id.toString(),
      hash: user.novuHash,
      label: 'user',
    }

    // If no additional channels, just return user channel
    if (!fetchedChannels || fetchedChannels.length === 0) {
      return [userChannel]
    }

    // Add user channel to the beginning of the array
    return [userChannel, ...fetchedChannels]
  }, [user, fetchedChannels])

  // Set initial channel
  useEffect(() => {
    if (!user?.id || !user.novuHash) return

    // Always set user channel as default if no channel is selected
    if (!currentChannel) {
      setCurrentChannel({
        subscriberId: user.id.toString(),
        hash: user.novuHash,
        label: 'user',
      })
    }
  }, [user, currentChannel])

  if (!user?.id || !user.novuHash || !currentChannel) return <></>
  console.log('🚀 ~ channels ~ channels:', channels)

  return (
    <div className="flex items-center">
      {hasAdditionalRoles && channels && channels.length > 1 && (
        <Select
          value={currentChannel.subscriberId}
          onValueChange={(value) => {
            const selected = channels.find((channel) => channel.subscriberId === value)
            if (selected && selected.subscriberId && selected.hash) {
              setCurrentChannel({
                subscriberId: selected.subscriberId,
                hash: selected.hash,
                label: selected.label,
              })
            }
          }}
        >
          <SelectTrigger className="w-auto min-w-[140px] max-w-[180px] mr-2 h-8 text-xs">
            <SelectValue placeholder="Select channel" />
          </SelectTrigger>
          <SelectContent>
            {channels.map((channel: NovuChannel) => (
              <SelectItem
                key={channel.subscriberId}
                value={channel.subscriberId}
                className="text-xs"
              >
                {channel.label || channel.subscriberId}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      <Inbox
        key={currentChannel.subscriberId}
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
          'notifications.newNotifications': ({
            notificationCount,
          }: {
            notificationCount: number
          }) =>
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
            <BellIcon className="text-highlight" />
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
        subscriberId={currentChannel.subscriberId}
        subscriberHash={currentChannel.hash}
        routerPush={(path: string) => router.push(path)}
        placement="bottom-end"
      />
    </div>
  )
}
