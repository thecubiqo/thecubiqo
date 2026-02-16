
const TELEGRAM_API_BASE = 'https://api.telegram.org/bot'

export interface TelegramUpdate {
    update_id: number
    message?: {
        message_id: number
        from: {
            id: number
            is_bot: boolean
            first_name: string
            username?: string
            language_code?: string
        }
        chat: {
            id: number
            first_name: string
            username?: string
            type: string
        }
        date: number
        text?: string
    }
}

export class TelegramClient {
    private token: string

    constructor(token: string) {
        this.token = token
    }

    async sendMessage(chatId: number | string, text: string): Promise<void> {
        const url = `${TELEGRAM_API_BASE}${this.token}/sendMessage`
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                chat_id: chatId,
                text: text,
            }),
        })

        if (!response.ok) {
            const error = await response.json()
            console.error('Failed to send Telegram message:', error)
            throw new Error(`Telegram API Error: ${error.description || response.statusText}`)
        }
    }

    async setWebhook(url: string, secretToken?: string): Promise<void> {
        const apiUrl = `${TELEGRAM_API_BASE}${this.token}/setWebhook`
        const body: any = { url }

        if (secretToken) {
            body.secret_token = secretToken
        }

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        })

        if (!response.ok) {
            const error = await response.json()
            throw new Error(`Failed to set webhook: ${error.description}`)
        }
    }

    // Placeholder for processing updates - in real app this would connect to Agent engine
    async processUpdate(update: TelegramUpdate) {
        if (!update.message || !update.message.text) return

        const chatId = update.message.chat.id
        const text = update.message.text
        const user = update.message.from

        console.log(`Received message from ${user.first_name} (${user.id}): ${text}`)

        // TODO: Connect to Agent Engine here.
        // For now, simple echo/stub response
        if (text === '/start') {
            await this.sendMessage(chatId, `Hello ${user.first_name}! I am your AI assistant. I'm currently being deployed, so my brain is still warming up.`)
        } else {
            await this.sendMessage(chatId, `I received: "${text}". Integration is working!`)
        }
    }
}
