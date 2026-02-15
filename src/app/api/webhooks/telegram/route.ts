
import { NextResponse } from 'next/server'
import { TelegramClient, TelegramUpdate } from '@/lib/integrations/telegram'

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
const TELEGRAM_SECRET_TOKEN = process.env.TELEGRAM_SECRET_TOKEN

export async function POST(request: Request) {
    if (!TELEGRAM_BOT_TOKEN) {
        console.error('TELEGRAM_BOT_TOKEN is not set')
        return NextResponse.json({ error: 'Configuration Error' }, { status: 500 })
    }

    // Verify secret token if configured (recommended for security)
    const secretToken = request.headers.get('x-telegram-bot-api-secret-token')
    if (TELEGRAM_SECRET_TOKEN && secretToken !== TELEGRAM_SECRET_TOKEN) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const update: TelegramUpdate = await request.json()
        const client = new TelegramClient(TELEGRAM_BOT_TOKEN)

        // Process update asynchronously to avoid timeouts
        // In Vercel serverless, we should ideally use `waitUntil` or a queue, 
        // but for now we'll just await the basic processing which is fast.
        await client.processUpdate(update)

        return NextResponse.json({ ok: true })
    } catch (error: any) {
        console.error('Error processing Telegram webhook:', error)
        return NextResponse.json(
            { error: 'Internal Server Error', details: error.message },
            { status: 500 }
        )
    }
}

export async function GET() {
    return NextResponse.json({ status: 'Telegram Webhook Active' })
}
