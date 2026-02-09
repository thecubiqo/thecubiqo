/**
 * Action Types
 * Types for the "AI prepares, human confirms" pattern
 */

export type ActionStatus = 'pending' | 'confirmed' | 'cancelled' | 'expired'

export type ActionType =
    | 'email'
    | 'message'
    | 'order'
    | 'payment'
    | 'booking'
    | 'file_operation'
    | 'system_command'
    | 'social_post'
    | 'calendar_event'
    | 'generic'

export interface BaseAction {
    id: string
    type: ActionType
    title: string
    description: string
    status: ActionStatus
    createdAt: Date
    expiresAt?: Date
    risk: 'low' | 'medium' | 'high'
    metadata?: Record<string, unknown>
}

export interface EmailAction extends BaseAction {
    type: 'email'
    to: string[]
    cc?: string[]
    bcc?: string[]
    subject: string
    body: string
    attachments?: { name: string; url: string }[]
}

export interface MessageAction extends BaseAction {
    type: 'message'
    platform: 'whatsapp' | 'telegram' | 'discord' | 'slack' | 'sms'
    recipient: string
    message: string
    media?: { type: 'image' | 'video' | 'file'; url: string }[]
}

export interface OrderAction extends BaseAction {
    type: 'order'
    platform: 'ubereats' | 'doordash' | 'amazon' | 'instacart' | 'other'
    items: { name: string; quantity: number; price: number }[]
    total: number
    deliveryAddress?: string
    deliveryTime?: string
}

export interface PaymentAction extends BaseAction {
    type: 'payment'
    amount: number
    currency: string
    recipient: string
    method: 'bank' | 'venmo' | 'paypal' | 'crypto' | 'other'
    note?: string
}

export interface BookingAction extends BaseAction {
    type: 'booking'
    service: string
    date: string
    time: string
    duration?: number
    location?: string
    notes?: string
}

export interface CalendarEventAction extends BaseAction {
    type: 'calendar_event'
    eventTitle: string
    startTime: string
    endTime: string
    location?: string
    attendees?: string[]
    description?: string
}

export interface SocialPostAction extends BaseAction {
    type: 'social_post'
    platform: 'twitter' | 'linkedin' | 'instagram' | 'threads'
    content: string
    media?: { type: 'image' | 'video'; url: string }[]
    scheduledFor?: Date
}

export interface FileOperationAction extends BaseAction {
    type: 'file_operation'
    operation: 'create' | 'edit' | 'delete' | 'move' | 'rename'
    path: string
    content?: string
    destination?: string
}

export interface SystemCommandAction extends BaseAction {
    type: 'system_command'
    command: string
    workingDirectory?: string
    requiresSudo?: boolean
}

export interface GenericAction extends BaseAction {
    type: 'generic'
    actionLabel: string
    details: Record<string, unknown>
}

export type Action =
    | EmailAction
    | MessageAction
    | OrderAction
    | PaymentAction
    | BookingAction
    | CalendarEventAction
    | SocialPostAction
    | FileOperationAction
    | SystemCommandAction
    | GenericAction

// Action Card props
export interface ActionCardProps {
    action: Action
    onConfirm: (actionId: string) => Promise<void>
    onCancel: (actionId: string) => void
    onEdit?: (actionId: string) => void
    isLoading?: boolean
}
