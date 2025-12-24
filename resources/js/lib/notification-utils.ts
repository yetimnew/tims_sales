export type NotificationData = {
  type?: string
  title?: string
  message?: string
  payload?: Record<string, unknown>
  [key: string]: unknown
}

export type NotificationItem = {
  id: string
  type: string
  read_at?: string | null
  created_at?: string | null
  data: NotificationData
}

export type NotificationFeedResponse = {
  unread_count: number
  data: NotificationItem[]
  meta: {
    current_page: number
    per_page: number
    total: number
    last_page: number
    has_more: boolean
    next_page: number | null
    previous_page: number | null
  }
}

const RELATIVE_TIME_FORMATTER = new Intl.RelativeTimeFormat(undefined, {
  numeric: 'auto',
})

const ABSOLUTE_TIME_FORMATTER = new Intl.DateTimeFormat(undefined, {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

const RELATIVE_SEGMENTS: Array<{ unit: Intl.RelativeTimeFormatUnit; ms: number }> = [
  { unit: 'year', ms: 1000 * 60 * 60 * 24 * 365 },
  { unit: 'month', ms: 1000 * 60 * 60 * 24 * 30 },
  { unit: 'week', ms: 1000 * 60 * 60 * 24 * 7 },
  { unit: 'day', ms: 1000 * 60 * 60 * 24 },
  { unit: 'hour', ms: 1000 * 60 * 60 },
  { unit: 'minute', ms: 1000 * 60 },
  { unit: 'second', ms: 1000 },
]

export function formatNotificationTitle(notification: NotificationItem): string {
  const data = notification.data ?? {}

  const explicitTitle = getString(data, 'title')
  if (explicitTitle) {
    return explicitTitle
  }

  const typeKey = notificationTypeKey(notification)
  if (typeKey) {
    return humanizeTypeKey(typeKey)
  }

  const fallback = notification.type ?? ''

  if (fallback) {
    return fallback
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/([\w-]+\\)/g, '')
      .replace(/\s+/g, ' ')
      .trim()
  }

  return 'Notification'
}

export function formatNotificationBody(notification: NotificationItem): string {
  const data = notification.data ?? {}
  const payload = getObject(data, 'payload') ?? {}

  const message = getString(data, 'message')
  if (message) {
    return message
  }

  const plate = getString(payload, 'plate') ?? getString(payload, 'truck_plate') ?? ''
  const driverName = getString(payload, 'name') ?? ''
  const driverCode =
    getString(payload, 'driver_code') ?? getString(payload, 'driverid') ?? ''

  const actorName = getActorName(payload) ?? getActorName(data)
  const changes = getObject(payload, 'changes') ?? getObject(data, 'changes')

  const descriptor = buildDescriptor({ driverName, driverCode, plate })

  if (changes) {
    const changeKeys = Object.keys(changes)
    const summary = changeKeys.slice(0, 3).join(', ')
    if (descriptor) {
      return `${descriptor} updated (${summary}${changeKeys.length > 3 ? ', …' : ''})`
    }
    return `Details updated (${summary}${changeKeys.length > 3 ? ', …' : ''})`
  }

  if (descriptor && actorName) {
    return `${descriptor} by ${actorName}`
  }

  if (descriptor) {
    return descriptor
  }

  if (actorName) {
    return `Performed by ${actorName}`
  }

  return 'Open the notification to view details.'
}

export function formatNotificationTimestamp(iso?: string | null): {
  relative: string
  absolute: string
} {
  if (!iso) {
    return { relative: 'Just now', absolute: '' }
  }

  const parsed = new Date(iso)
  if (Number.isNaN(parsed.getTime())) {
    return { relative: 'Just now', absolute: '' }
  }

  const diff = parsed.getTime() - Date.now()

  for (const { unit, ms } of RELATIVE_SEGMENTS) {
    if (Math.abs(diff) >= ms || unit === 'second') {
      const value = Math.round(diff / ms)
      return {
        relative: RELATIVE_TIME_FORMATTER.format(value, unit),
        absolute: ABSOLUTE_TIME_FORMATTER.format(parsed),
      }
    }
  }

  return {
    relative: 'Just now',
    absolute: ABSOLUTE_TIME_FORMATTER.format(parsed),
  }
}

export function isNotificationUnread(notification: NotificationItem): boolean {
  return !notification.read_at
}

export function notificationAccentKey(notification: NotificationItem): string {
  const typeKey = notificationTypeKey(notification)

  if (typeKey) {
    if (typeKey.includes('.created')) {
      return 'created'
    }
    if (typeKey.includes('.updated')) {
      return 'updated'
    }
    if (typeKey.includes('.deleted')) {
      return 'deleted'
    }
  }

  if (notification.type.includes('Created')) {
    return 'created'
  }
  if (notification.type.includes('Updated')) {
    return 'updated'
  }
  if (notification.type.includes('Deleted')) {
    return 'deleted'
  }
  return 'default'
}

export function notificationTypeKey(notification: NotificationItem): string | null {
  const data = notification.data ?? {}
  return getString(data, 'type')
}

export function formatNotificationTypeLabel(notification: NotificationItem): string {
  const typeKey = notificationTypeKey(notification)
  if (typeKey) {
    return humanizeTypeKey(typeKey)
  }

  return formatNotificationTitle(notification)
}

function getString(object: Record<string, unknown>, key: string): string | null {
  const value = object[key]
  return typeof value === 'string' && value.trim() !== '' ? value.trim() : null
}

function getObject(object: Record<string, unknown>, key: string): Record<string, unknown> | null {
  const value = object[key]
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>
  }
  return null
}

function getActorName(object: Record<string, unknown>): string | null {
  const actor = object['actor']
  if (actor && typeof actor === 'object' && !Array.isArray(actor) && 'name' in actor) {
    const name = (actor as { name?: unknown }).name
    if (typeof name === 'string' && name.trim() !== '') {
      return name.trim()
    }
  }
  return null
}

function humanizeTypeKey(typeKey: string): string {
  return typeKey
    .split('.')
    .filter(Boolean)
    .map((segment) => segment.replace(/[-_]/g, ' '))
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ')
}

function buildDescriptor(values: { driverName?: string; driverCode?: string; plate?: string }): string {
  const { driverName, driverCode, plate } = values

  if (driverName && driverCode) {
    return `${driverName} (${driverCode})`
  }

  if (driverName) {
    return driverName
  }

  if (driverCode) {
    return `Driver ${driverCode}`
  }

  if (plate) {
    return `Plate ${plate}`
  }

  return ''
}
