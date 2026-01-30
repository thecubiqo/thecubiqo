import { NextRequest, NextResponse } from 'next/server'
import { getAllSettings, setSetting } from '@/lib/settings'
import { z } from 'zod'

const updateSettingSchema = z.object({
  key: z.string().min(1),
  value: z.string(),
})

// GET /api/settings - Get all settings
export async function GET() {
  try {
    const settings = await getAllSettings()
    // Also return as array for compatibility
    const settingsArray = Object.entries(settings).map(([key, value]) => ({
      key,
      value,
    }))
    return NextResponse.json({ settings: settingsArray, settingsObj: settings })
  } catch (error) {
    console.error('Error fetching settings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    )
  }
}

// POST /api/settings - Update a setting
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = updateSettingSchema.parse(body)

    await setSetting(data.key, data.value)

    return NextResponse.json({
      message: 'Setting updated successfully',
      key: data.key,
      value: data.value,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error updating setting:', error)
    return NextResponse.json(
      { error: 'Failed to update setting' },
      { status: 500 }
    )
  }
}

