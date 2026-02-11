/**
 * Action Parser
 * Parses AI responses to extract action blocks that should be rendered as ActionCards
 * 
 * Format in AI response:
 * [ACTION:email]
 * {"to":["user@example.com"],"subject":"Hello","body":"..."}
 * [/ACTION]
 * 
 * This allows the AI to embed actionable items in its responses
 */

import type { Action, ActionType, EmailAction, MessageAction, OrderAction } from './action-types'
import { v4 as uuidv4 } from 'uuid'

// Pattern to match action blocks in AI responses
const ACTION_PATTERN = /\[ACTION:(\w+)\]\s*([\s\S]*?)\s*\[\/ACTION\]/g

export interface ParsedResponse {
    text: string  // The response with action blocks removed
    actions: Action[]  // Extracted actions
}

/**
 * Parse an AI response to extract action blocks
 */
export function parseActionsFromResponse(response: string): ParsedResponse {
    const actions: Action[] = []
    let textWithoutActions = response

    // Find all action blocks
    const matches = [...response.matchAll(ACTION_PATTERN)]

    for (const match of matches) {
        const [fullMatch, actionType, jsonContent] = match

        try {
            const actionData = JSON.parse(jsonContent.trim())
            const action = createAction(actionType as ActionType, actionData)
            if (action) {
                actions.push(action)
            }
        } catch (e) {
            console.error('Failed to parse action:', e)
        }

        // Remove the action block from text
        textWithoutActions = textWithoutActions.replace(fullMatch, '')
    }

    return {
        text: textWithoutActions.trim(),
        actions
    }
}

/**
 * Create an Action object from parsed data
 */
function createAction(type: ActionType, data: Record<string, unknown>): Action | null {
    const baseAction = {
        id: uuidv4(),
        status: 'pending' as const,
        createdAt: new Date(),
        risk: (data.risk as 'low' | 'medium' | 'high') || 'low',
        title: (data.title as string) || getDefaultTitle(type),
        description: (data.description as string) || '',
        metadata: data.metadata as Record<string, unknown> | undefined
    }

    switch (type) {
        case 'email':
            return {
                ...baseAction,
                type: 'email',
                to: (data.to as string[]) || [],
                cc: data.cc as string[] | undefined,
                bcc: data.bcc as string[] | undefined,
                subject: (data.subject as string) || '',
                body: (data.body as string) || '',
                attachments: data.attachments as { name: string; url: string }[] | undefined
            } as EmailAction

        case 'message':
            return {
                ...baseAction,
                type: 'message',
                platform: (data.platform as MessageAction['platform']) || 'whatsapp',
                recipient: (data.recipient as string) || '',
                message: (data.message as string) || '',
                media: data.media as MessageAction['media']
            } as MessageAction

        case 'order':
            return {
                ...baseAction,
                type: 'order',
                platform: (data.platform as OrderAction['platform']) || 'other',
                items: (data.items as OrderAction['items']) || [],
                total: (data.total as number) || 0,
                deliveryAddress: data.deliveryAddress as string | undefined,
                deliveryTime: data.deliveryTime as string | undefined
            } as OrderAction

        case 'payment':
            return {
                ...baseAction,
                type: 'payment',
                amount: (data.amount as number) || 0,
                currency: (data.currency as string) || 'USD',
                recipient: (data.recipient as string) || '',
                method: (data.method as 'bank' | 'venmo' | 'paypal' | 'crypto' | 'other') || 'other',
                note: data.note as string | undefined
            }

        case 'calendar_event':
            return {
                ...baseAction,
                type: 'calendar_event',
                eventTitle: (data.eventTitle as string) || '',
                startTime: (data.startTime as string) || '',
                endTime: (data.endTime as string) || '',
                location: data.location as string | undefined,
                attendees: data.attendees as string[] | undefined
            }

        case 'social_post':
            return {
                ...baseAction,
                type: 'social_post',
                platform: (data.platform as 'twitter' | 'linkedin' | 'instagram' | 'threads') || 'twitter',
                content: (data.content as string) || '',
                media: data.media as { type: 'image' | 'video'; url: string }[] | undefined,
                scheduledFor: data.scheduledFor ? new Date(data.scheduledFor as string) : undefined
            }

        case 'system_command':
            return {
                ...baseAction,
                type: 'system_command',
                risk: 'high', // System commands are always high risk
                command: (data.command as string) || '',
                workingDirectory: data.workingDirectory as string | undefined,
                requiresSudo: data.requiresSudo as boolean | undefined
            }

        case 'file_operation':
            return {
                ...baseAction,
                type: 'file_operation',
                operation: (data.operation as 'create' | 'edit' | 'delete' | 'move' | 'rename') || 'create',
                path: (data.path as string) || '',
                content: data.content as string | undefined,
                destination: data.destination as string | undefined
            }

        case 'booking':
            return {
                ...baseAction,
                type: 'booking',
                service: (data.service as string) || '',
                date: (data.date as string) || '',
                time: (data.time as string) || '',
                duration: data.duration as number | undefined,
                location: data.location as string | undefined,
                notes: data.notes as string | undefined
            }

        case 'generic':
        default:
            return {
                ...baseAction,
                type: 'generic',
                actionLabel: (data.actionLabel as string) || 'Confirm',
                details: data as Record<string, unknown>
            }
    }
}

function getDefaultTitle(type: ActionType): string {
    const titles: Record<ActionType, string> = {
        email: 'Send Email',
        message: 'Send Message',
        order: 'Place Order',
        payment: 'Send Payment',
        booking: 'Make Booking',
        calendar_event: 'Create Event',
        social_post: 'Post to Social',
        file_operation: 'File Operation',
        system_command: 'Run Command',
        generic: 'Action'
    }
    return titles[type]
}

/**
 * Check if a response contains any actions
 */
export function hasActions(response: string): boolean {
    return ACTION_PATTERN.test(response)
}
