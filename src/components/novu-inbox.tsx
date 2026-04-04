'use client'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { config } from '@/config'
import { useAuth } from '@/providers/Auth'
import payloadClient from '@/utilities/payloadClient'
import { Inbox, NovuProvider, useNovu } from '@novu/react'
import { useQuery } from '@tanstack/react-query'
import { BellIcon } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { PaginatedDocs } from 'payload'
import { useEffect, useMemo, useState } from 'react'
import { Button } from './ui/button'

// Define the NovuChannel type
interface NovuChannel {
  id: string
  subscriberId: string
  hash: string
  label?: string
}

// LocalStorage key for saving channel preference
const CHANNEL_PREFERENCE_KEY = 'sgz-novu-channel-preference'

// Custom hook to handle Novu notifications with debounce
function useNovuNotifications() {
  const { on } = useNovu()
  const router = useRouter()
  const [isReloading, setIsReloading] = useState(false)
  useEffect(() => {
    on('notifications.notification_received', ({ result }) => {
      if (typeof window === 'undefined') return
      if (result.redirect) {
        const currentPath = window.location.pathname

        if (!isReloading && currentPath === result.redirect.url) {
          setIsReloading(true)
          router.refresh()
          setIsReloading(false)
        }
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return null
}

// Simple component to use the hook
function NovuNotificationHandler() {
  useNovuNotifications()
  return null
}

export default function NovuInbox() {
  const router = useRouter()
  const { user } = useAuth()
  const [currentChannel, setCurrentChannel] = useState<{
    subscriberId: string
    hash: string
    label?: string
  } | null>(null)
  const [savedPreferenceId, setSavedPreferenceId] = useState<string | null>(null)

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
    refetchOnWindowFocus: false,
    select: (x: PaginatedDocs<NovuChannel>) => x.docs,
    enabled: !!hasAdditionalRoles && !!user?.id,
  })

  // Load saved preference ID from localStorage
  useEffect(() => {
    try {
      const savedId = localStorage.getItem(CHANNEL_PREFERENCE_KEY)
      if (savedId) {
        setSavedPreferenceId(savedId)
      }
    } catch (error) {
      console.error('Error loading channel preference:', error)
    }
  }, [])

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

  // Set channel based on preference or default
  useEffect(() => {
    if (!user?.id || !user.novuHash || !channels || channels.length === 0) return

    // If we have a saved preference and it exists in the channels
    if (savedPreferenceId) {
      const savedChannel = channels.find((channel) => channel.subscriberId === savedPreferenceId)

      if (savedChannel) {
        setCurrentChannel({
          subscriberId: savedChannel.subscriberId,
          hash: savedChannel.hash,
          label: savedChannel.label,
        })
        return
      }
    }

    // If no saved preference or it's not found, use the first channel (user channel)
    if (channels.length > 0) {
      const userChannel = channels[0] as NovuChannel
      setCurrentChannel({
        subscriberId: userChannel.subscriberId,
        hash: userChannel.hash,
        label: userChannel.label,
      })
    }
  }, [user, channels, savedPreferenceId])

  // Save channel preference to localStorage when it changes
  useEffect(() => {
    if (currentChannel) {
      try {
        localStorage.setItem(CHANNEL_PREFERENCE_KEY, currentChannel.subscriberId)
      } catch (error) {
        console.error('Error saving channel preference:', error)
      }
    }
  }, [currentChannel])

  if (!user?.id || !user.novuHash || !currentChannel) return <></>

  return (
    <div className="flex items-center">
      <NovuProvider
        applicationIdentifier={config.NEXT_PUBLIC_NOVU_APPLICATION_IDENTIFIER}
        subscriberId={currentChannel.subscriberId}
        subscriberHash={currentChannel.hash}
      >
        <NovuNotificationHandler />
      </NovuProvider>

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
          variables: {
            colorBackground: 'hsl(var(--background))',
            colorPrimary: 'red',
            colorSecondary: 'hsl(var(--secondary))',
            colorForeground: 'hsl(var(--foreground))',
            colorPrimaryForeground: 'hsl(var(--primary-foreground))',
            colorSecondaryForeground: 'hsl(var(--secondary-foreground))',
          },
        } as any}
        renderBell={(unreadCount: any) => (
          <Button className="rounded-full relative w-8 h-8 !p-0 !py-2.5 !px-0 flex items-center justify-center transition-colors" variant="ghost">
            <BellIcon className="size-5 text-sgz-primary" />
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
        applicationIdentifier={config.NEXT_PUBLIC_NOVU_APPLICATION_IDENTIFIER}
        subscriberId={currentChannel.subscriberId}
        subscriberHash={currentChannel.hash}
        routerPush={(path: string) =>
          window.location.href == path ? router.refresh() : router.push(path)
        }
        placement="bottom-end"
      />
    </div>
  )
}
