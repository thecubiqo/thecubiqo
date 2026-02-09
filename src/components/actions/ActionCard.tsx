'use client'

/**
 * ActionCard Component
 * Displays a prepared action for user confirmation
 * Pattern: "AI prepares, human confirms"
 */

import { useState } from 'react'
import type { Action, ActionCardProps } from '@/lib/actions/action-types'

// Risk level colors
const riskColors = {
    low: 'border-green-500/30 bg-green-500/5',
    medium: 'border-yellow-500/30 bg-yellow-500/5',
    high: 'border-red-500/30 bg-red-500/5'
}

const riskBadges = {
    low: 'bg-green-500/20 text-green-400',
    medium: 'bg-yellow-500/20 text-yellow-400',
    high: 'bg-red-500/20 text-red-400'
}

// Action type icons
const actionIcons: Record<string, string> = {
    email: '📧',
    message: '💬',
    order: '🛒',
    payment: '💳',
    booking: '📅',
    calendar_event: '🗓️',
    social_post: '📱',
    file_operation: '📁',
    system_command: '⚙️',
    generic: '✨'
}

export function ActionCard({ action, onConfirm, onCancel, onEdit, isLoading }: ActionCardProps) {
    const [confirming, setConfirming] = useState(false)

    const handleConfirm = async () => {
        setConfirming(true)
        try {
            await onConfirm(action.id)
        } finally {
            setConfirming(false)
        }
    }

    return (
        <div className={`
      rounded-xl border p-4 transition-all
      ${riskColors[action.risk]}
      ${action.status === 'confirmed' ? 'opacity-60' : ''}
      ${action.status === 'cancelled' ? 'opacity-40 line-through' : ''}
    `}>
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                    <span className="text-2xl">{actionIcons[action.type]}</span>
                    <div>
                        <h3 className="font-semibold text-white">{action.title}</h3>
                        <p className="text-xs text-gray-400">{action.description}</p>
                    </div>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded ${riskBadges[action.risk]}`}>
                    {action.risk} risk
                </span>
            </div>

            {/* Content based on action type */}
            <div className="mb-4">
                {renderActionContent(action)}
            </div>

            {/* Actions */}
            {action.status === 'pending' && (
                <div className="flex items-center justify-end gap-2">
                    {onEdit && (
                        <button
                            onClick={() => onEdit(action.id)}
                            className="px-3 py-1.5 text-sm text-gray-400 hover:text-white transition-colors"
                        >
                            Edit
                        </button>
                    )}
                    <button
                        onClick={() => onCancel(action.id)}
                        disabled={confirming || isLoading}
                        className="px-3 py-1.5 text-sm text-gray-400 hover:text-white transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={confirming || isLoading}
                        className={`
              px-4 py-1.5 text-sm font-medium rounded-lg transition-all
              ${action.risk === 'high'
                                ? 'bg-red-600 hover:bg-red-500 text-white'
                                : action.risk === 'medium'
                                    ? 'bg-yellow-600 hover:bg-yellow-500 text-black'
                                    : 'bg-green-600 hover:bg-green-500 text-white'
                            }
              disabled:opacity-50
            `}
                    >
                        {confirming ? 'Confirming...' : getConfirmLabel(action)}
                    </button>
                </div>
            )}

            {action.status === 'confirmed' && (
                <div className="text-center text-sm text-green-400">
                    ✓ Confirmed
                </div>
            )}

            {action.status === 'cancelled' && (
                <div className="text-center text-sm text-gray-500">
                    Cancelled
                </div>
            )}
        </div>
    )
}

// Get the confirm button label based on action type
function getConfirmLabel(action: Action): string {
    switch (action.type) {
        case 'email': return '✓ Send Email'
        case 'message': return '✓ Send Message'
        case 'order': return '✓ Place Order'
        case 'payment': return '✓ Send Payment'
        case 'booking': return '✓ Book Now'
        case 'calendar_event': return '✓ Create Event'
        case 'social_post': return '✓ Post'
        case 'file_operation': return '✓ Execute'
        case 'system_command': return '✓ Run Command'
        default: return '✓ Confirm'
    }
}

// Render action-specific content
function renderActionContent(action: Action) {
    switch (action.type) {
        case 'email':
            return (
                <div className="bg-black/30 rounded-lg p-3 space-y-2 text-sm">
                    <div className="flex gap-2">
                        <span className="text-gray-500 w-12">To:</span>
                        <span className="text-white">{action.to.join(', ')}</span>
                    </div>
                    <div className="flex gap-2">
                        <span className="text-gray-500 w-12">Subject:</span>
                        <span className="text-white">{action.subject}</span>
                    </div>
                    <div className="border-t border-gray-700 pt-2 mt-2">
                        <p className="text-gray-300 whitespace-pre-wrap">{action.body}</p>
                    </div>
                </div>
            )

        case 'message':
            return (
                <div className="bg-black/30 rounded-lg p-3 space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-gray-400">
                        <span className="capitalize">{action.platform}</span>
                        <span>→</span>
                        <span className="text-white">{action.recipient}</span>
                    </div>
                    <p className="text-gray-300">{action.message}</p>
                </div>
            )

        case 'order':
            return (
                <div className="bg-black/30 rounded-lg p-3 space-y-2 text-sm">
                    <div className="text-gray-400 mb-2">{action.platform}</div>
                    {action.items.map((item, i) => (
                        <div key={i} className="flex justify-between text-gray-300">
                            <span>{item.quantity}x {item.name}</span>
                            <span>${item.price.toFixed(2)}</span>
                        </div>
                    ))}
                    <div className="border-t border-gray-700 pt-2 mt-2 flex justify-between font-semibold text-white">
                        <span>Total</span>
                        <span>${action.total.toFixed(2)}</span>
                    </div>
                </div>
            )

        case 'payment':
            return (
                <div className="bg-black/30 rounded-lg p-3 text-sm">
                    <div className="text-3xl font-bold text-white text-center mb-2">
                        {action.currency} {action.amount.toFixed(2)}
                    </div>
                    <div className="text-center text-gray-400">
                        to {action.recipient} via {action.method}
                    </div>
                    {action.note && (
                        <div className="text-center text-gray-500 mt-2">"{action.note}"</div>
                    )}
                </div>
            )

        case 'calendar_event':
            return (
                <div className="bg-black/30 rounded-lg p-3 space-y-2 text-sm">
                    <div className="font-medium text-white">{action.eventTitle}</div>
                    <div className="text-gray-400">
                        {action.startTime} - {action.endTime}
                    </div>
                    {action.location && (
                        <div className="text-gray-400">📍 {action.location}</div>
                    )}
                </div>
            )

        case 'system_command':
            return (
                <div className="bg-black/30 rounded-lg p-3 text-sm font-mono">
                    <div className="text-green-400">$ {action.command}</div>
                    {action.requiresSudo && (
                        <div className="text-red-400 text-xs mt-1">⚠️ Requires sudo</div>
                    )}
                </div>
            )

        default:
            return (
                <div className="bg-black/30 rounded-lg p-3 text-sm text-gray-400">
                    {action.description}
                </div>
            )
    }
}

// Container for multiple action cards
export function ActionCardList({
    actions,
    onConfirm,
    onCancel,
    onEdit
}: {
    actions: Action[]
    onConfirm: (actionId: string) => Promise<void>
    onCancel: (actionId: string) => void
    onEdit?: (actionId: string) => void
}) {
    if (actions.length === 0) return null

    return (
        <div className="space-y-3">
            <div className="text-sm text-gray-400 flex items-center gap-2">
                <span>🎯</span>
                <span>{actions.filter(a => a.status === 'pending').length} action(s) ready for your approval</span>
            </div>
            {actions.map(action => (
                <ActionCard
                    key={action.id}
                    action={action}
                    onConfirm={onConfirm}
                    onCancel={onCancel}
                    onEdit={onEdit}
                />
            ))}
        </div>
    )
}
