import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { Link, router, usePage } from '@inertiajs/react'
import { Bell, Check } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { echo, echoIsConfigured } from '@laravel/echo-react'
import { type SharedData } from '@/types'
import {
  formatNotificationBody,
  formatNotificationTimestamp,
  formatNotificationTitle,
  isNotificationUnread,
  notificationAccentKey,
  type NotificationItem,
} from '@/lib/notification-utils'
import { cn } from '@/lib/utils'

export default function NotificationBell() {
  const page = usePage<SharedData & { notifications: { unread_count: number, recent: NotificationItem[] } }>()
  const { notifications, auth } = page.props
  const refreshingRef = useRef(false)

  useEffect(() => {
    const userId = auth?.user?.id

    if (!userId) {
      return
    }

    const channelName = `App.Models.User.${userId}`
    const echoInstance = echoIsConfigured() ? echo() : null

    if (!echoInstance) {
      return
    }

    const channel = echoInstance.private(channelName)

    const handleBroadcastNotification = () => {
      if (refreshingRef.current) {
        return
      }

      refreshingRef.current = true

      router.reload({
        only: ['notifications'],
        onFinish: () => {
          refreshingRef.current = false
        },
        onError: () => {
          refreshingRef.current = false
        },
      })
    }

    channel.notification(handleBroadcastNotification)

    return () => {
      echoInstance.leave(channelName)
    }
  }, [auth?.user?.id])

  const unread = notifications?.unread_count ?? 0
  const recent = notifications?.recent ?? []

  const items = recent.map((notification) => {
    const timestamp = formatNotificationTimestamp(notification.created_at)
    return {
      notification,
      title: formatNotificationTitle(notification),
      body: formatNotificationBody(notification),
      timestamp,
      unread: isNotificationUnread(notification),
      accent: notificationAccentKey(notification),
    }
  })

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="group relative h-9 w-9">
          <Bell className="size-5 opacity-80 transition group-hover:opacity-100" />
          {unread > 0 && (
            <span className="absolute -right-1 -top-1 inline-flex min-h-[1.25rem] min-w-[1.25rem] items-center justify-center rounded-full bg-red-600 px-1.5 text-[10px] font-semibold leading-none text-white shadow">
              {unread > 99 ? '99+' : unread}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-96" align="end" sideOffset={8}>
        <DropdownMenuLabel className="flex items-center justify-between py-2">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Bell className="size-4 opacity-70" />
            <span>Notifications</span>
          </div>
          <Badge variant={unread > 0 ? 'secondary' : 'outline'} className="rounded-full px-2 py-0 text-[10px] uppercase tracking-wide">
            {unread > 0 ? `${unread} unread` : 'Up to date'}
          </Badge>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {unread > 0 && (
          <div className="px-3 pb-3">
            <button
              type="button"
              onClick={() => router.post('/notifications/read-all')}
              className="inline-flex items-center gap-2 rounded-md bg-neutral-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-neutral-800 dark:bg-neutral-700 dark:hover:bg-neutral-600"
            >
              <Check className="size-3.5" />
              Mark all as read
            </button>
          </div>
        )}
        {items.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-6 py-10 text-center text-sm text-neutral-500">
            <Bell className="size-6 opacity-40" />
            <div className="space-y-1">
              <p className="font-medium text-neutral-700 dark:text-neutral-200">You&apos;re all caught up</p>
              <p className="text-xs text-neutral-500">Recent in-app updates will appear here.</p>
            </div>
          </div>
        ) : (
          <div className="max-h-96 space-y-2 overflow-auto px-2 pb-2">
            {items.map(({ notification, title, body, timestamp, unread, accent }) => (
              <DropdownMenuItem
                key={notification.id}
                className={cn(
                  'group relative flex flex-col gap-2 rounded-lg border border-transparent bg-neutral-50 px-3 py-2 text-left transition hover:bg-white dark:bg-neutral-900/70 dark:hover:bg-neutral-900',
                  unread && 'border-blue-200 shadow-sm dark:border-blue-400/40',
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2">
                    <span
                      className={cn(
                        'mt-1 inline-flex h-2.5 w-2.5 rounded-full ring-2 ring-offset-1 ring-offset-white transition dark:ring-offset-neutral-950',
                        accentDotClass(accent),
                        unread ? 'scale-100 opacity-100' : 'scale-75 opacity-60',
                      )}
                    />
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{title}</span>
                      <span className="text-xs text-neutral-500 dark:text-neutral-400">{timestamp.relative}</span>
                    </div>
                  </div>
                  {unread && (
                    <button
                      type="button"
                      onClick={() => router.post(`/notifications/${notification.id}/read`)}
                      className="shrink-0 rounded-md border border-neutral-200 px-2 py-1 text-[11px] font-semibold text-neutral-600 transition hover:border-neutral-300 hover:text-neutral-900 dark:border-neutral-700 dark:text-neutral-300 dark:hover:border-neutral-600 dark:hover:text-white"
                    >
                      Mark read
                    </button>
                  )}
                </div>
                <p className="line-clamp-3 text-xs leading-relaxed text-neutral-600 dark:text-neutral-300">{body}</p>
              </DropdownMenuItem>
            ))}
          </div>
        )}
        <DropdownMenuSeparator />
        <div className="flex items-center justify-end px-3 py-2">
          <Link href="/notifications" className="text-xs font-medium text-blue-600 transition hover:text-blue-700 hover:underline">
            View all
          </Link>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function accentDotClass(accent: string) {
  switch (accent) {
    case 'created':
      return 'bg-emerald-500 ring-emerald-100 dark:bg-emerald-400 dark:ring-emerald-500/40'
    case 'updated':
      return 'bg-blue-500 ring-blue-100 dark:bg-blue-400 dark:ring-blue-500/40'
    case 'deleted':
      return 'bg-rose-500 ring-rose-100 dark:bg-rose-400 dark:ring-rose-500/40'
    default:
      return 'bg-neutral-400 ring-neutral-200 dark:bg-neutral-500 dark:ring-neutral-600/40'
  }
}
