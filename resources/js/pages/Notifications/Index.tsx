import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Head, usePage, router } from '@inertiajs/react'
import { Bell, Check, MailOpen } from 'lucide-react'
import {
    formatNotificationBody,
    formatNotificationTimestamp,
    formatNotificationTitle,
    formatNotificationTypeLabel,
    isNotificationUnread,
    notificationAccentKey,
    type NotificationItem,
} from '@/lib/notification-utils'
import { cn } from '@/lib/utils'
import AppLayout from '@/layouts/app-layout'
import { type BreadcrumbItem } from '@/types'

type PageProps = {
  notifications: {
    unread_count: number
    recent: NotificationItem[]
  }
}

const breadcrumbs: BreadcrumbItem[] = [
        {
                title: 'Notifications',
                href: '/notifications',
        },
]

export default function NotificationsIndex() {
    const page = usePage<PageProps>()
    const { notifications } = page.props
    const [markAllPending, setMarkAllPending] = useState(false)
    const [markingId, setMarkingId] = useState<string | null>(null)

    const items = notifications.recent.map((notification) => {
        const timestamp = formatNotificationTimestamp(notification.created_at)

        return {
            notification,
            title: formatNotificationTitle(notification),
            body: formatNotificationBody(notification),
            timestamp,
            unread: isNotificationUnread(notification),
            accent: notificationAccentKey(notification),
            typeLabel: formatNotificationTypeLabel(notification),
        }
    })

    const markAllAsRead = () => {
        if (markAllPending) {
            return
        }

        setMarkAllPending(true)
        router.post('/notifications/read-all', undefined, {
            preserveState: true,
            preserveScroll: true,
            onFinish: () => setMarkAllPending(false),
        })
    }

    const markSingleAsRead = (id: string) => {
        if (markingId) {
            return
        }

        setMarkingId(id)
        router.post(`/notifications/${id}/read`, undefined, {
            preserveState: true,
            preserveScroll: true,
            onFinish: () => setMarkingId(null),
        })
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Notifications" />

            <div className="flex flex-col gap-6 px-4 py-6">
                <div className="space-y-1">
                    <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-50">Notifications</h1>
                    <p className="max-w-3xl text-sm text-neutral-600 dark:text-neutral-400">
                        Stay up to date with the latest activity across your fleet.
                    </p>
                </div>

                <div className="grid gap-6">
                    <Card>
                        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                                    <Bell className="size-5" />
                                    In-app notifications
                                </CardTitle>
                                <CardDescription>Manage recent events and keep your team aligned.</CardDescription>
                            </div>
                            <Badge variant={notifications.unread_count > 0 ? 'secondary' : 'outline'} className="w-fit rounded-full px-3 py-1 text-xs uppercase tracking-wide">
                                {notifications.unread_count > 0 ? `${notifications.unread_count} unread` : 'All caught up'}
                            </Badge>
                        </CardHeader>
                        <CardFooter className="flex items-center justify-between border-t border-neutral-200 bg-neutral-50 px-6 py-3 text-sm leading-none dark:border-neutral-800 dark:bg-neutral-900/60">
                            <span className="text-neutral-600 dark:text-neutral-400">Unread notifications</span>
                            <span className="font-semibold text-neutral-900 dark:text-neutral-100">{notifications.unread_count}</span>
                        </CardFooter>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <CardTitle className="text-base font-semibold">Recent activity</CardTitle>
                                <CardDescription>Notifications expire after they are archived or older than 30 days.</CardDescription>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={markAllAsRead}
                                    disabled={markAllPending || notifications.unread_count === 0}
                                >
                                    <Check className="mr-2 size-4" />
                                    Mark all as read
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {items.length === 0 ? (
                                <div className="flex flex-col items-start gap-3 rounded-lg border border-dashed border-neutral-300 bg-white px-8 py-12 text-left dark:border-neutral-800 dark:bg-neutral-900/40">
                                    <MailOpen className="size-10 text-neutral-300" />
                                    <div className="space-y-1">
                                        <p className="text-sm font-semibold text-neutral-700 dark:text-neutral-200">Nothing new to review</p>
                                        <p className="text-sm text-neutral-500">We&apos;ll notify you here as soon as something changes.</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-4 text-left">
                                    {items.map(({ notification, title, body, timestamp, unread, accent, typeLabel }) => (
                                        <article
                                            key={notification.id}
                                            className={cn(
                                                'relative overflow-hidden rounded-xl border border-neutral-200 bg-white p-4 text-left shadow-sm transition hover:border-neutral-300 dark:border-neutral-800 dark:bg-neutral-900/80 dark:hover:border-neutral-700',
                                                unread && 'border-blue-200 shadow-md dark:border-blue-400/40',
                                            )}
                                        >
                                            <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                                <div className="flex items-start gap-3">
                                                    <span
                                                        className={cn(
                                                            'mt-0.5 inline-flex h-3 w-3 rounded-full ring-2 ring-offset-2 ring-offset-white transition dark:ring-offset-neutral-950',
                                                            accentDotClass(accent),
                                                            unread ? 'opacity-100' : 'opacity-60',
                                                        )}
                                                    />
                                                    <div className="space-y-1 text-left">
                                                        <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">{title}</h3>
                                                        <p className="text-xs text-neutral-500 dark:text-neutral-400">{timestamp.absolute || timestamp.relative}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Badge variant="outline" className="rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wide">
                                                        {typeLabel}
                                                    </Badge>
                                                    {unread && (
                                                        <Button
                                                            type="button"
                                                            variant="secondary"
                                                            size="sm"
                                                            onClick={() => markSingleAsRead(notification.id)}
                                                            disabled={markingId === notification.id}
                                                        >
                                                            <Check className="mr-1.5 size-4" />
                                                            {markingId === notification.id ? 'Marking…' : 'Mark as read'}
                                                        </Button>
                                                    )}
                                                </div>
                                            </header>
                                            <p className="mt-3 text-sm leading-relaxed text-neutral-700 dark:text-neutral-200">{body}</p>
                                        </article>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
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
