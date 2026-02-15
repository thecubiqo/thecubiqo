/**
 * Admin Journal Analytics API
 * Provides engagement metrics for journal feature
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Support both old and new env var names (fallback pattern)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL1 || process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY1 || process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn('Missing Supabase environment variables - using build defaults')
}

const supabaseAdmin = createClient(
  supabaseUrl || 'http://localhost:54321',
  supabaseServiceKey || 'fake-key-for-build'
)

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/journal
 * Get journal engagement analytics
 * 
 * NOTE: This endpoint currently has no authentication.
 * TODO: Add admin authentication middleware before production deployment.
 */
export async function GET(request: NextRequest) {
  try {
    // Check for required environment variables at runtime
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL1 || process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY1 || process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Server configuration error: Missing database credentials' 
        },
        { status: 500 }
      )
    }
    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '30')

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    // Get total entries
    const { count: totalEntries } = await supabaseAdmin
      .from('journal_entries')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startDate.toISOString())

    // Get unique users
    const { data: uniqueUsers } = await supabaseAdmin
      .from('journal_entries')
      .select('user_id')
      .gte('created_at', startDate.toISOString())
      .not('user_id', 'is', null)

    const uniqueUserCount = new Set(uniqueUsers?.map(e => e.user_id)).size

    // Get entries by day (for chart)
    const { data: entriesByDay } = await supabaseAdmin
      .from('journal_entries')
      .select('created_at')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true })

    // Group by day
    const dayMap = new Map<string, number>()
    entriesByDay?.forEach(entry => {
      const day = new Date(entry.created_at).toISOString().split('T')[0]
      dayMap.set(day, (dayMap.get(day) || 0) + 1)
    })

    const dailyData = Array.from(dayMap.entries()).map(([date, count]) => ({
      date,
      count
    }))

    // Get mood distribution
    const { data: moodData } = await supabaseAdmin
      .from('journal_entries')
      .select('mood')
      .gte('created_at', startDate.toISOString())

    const moodDistribution = moodData?.reduce((acc, entry) => {
      const mood = entry.mood || 'neutral'
      acc[mood] = (acc[mood] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Get average duration and word count
    const { data: statsData } = await supabaseAdmin
      .from('journal_entries')
      .select('duration_seconds, word_count')
      .gte('created_at', startDate.toISOString())

    const avgDuration = statsData?.length
      ? Math.round(statsData.reduce((sum, e) => sum + (e.duration_seconds || 0), 0) / statsData.length / 60)
      : 0

    const avgWordCount = statsData?.length
      ? Math.round(statsData.reduce((sum, e) => sum + (e.word_count || 0), 0) / statsData.length)
      : 0

    // Get completion rate from analytics
    const { data: analyticsData } = await supabaseAdmin
      .from('journal_analytics')
      .select('completion_rate')
      .gte('created_at', startDate.toISOString())

    const avgCompletionRate = analyticsData?.length
      ? Math.round(analyticsData.reduce((sum, a) => sum + (a.completion_rate || 0), 0) / analyticsData.length)
      : 0

    // Get email queue stats
    const { count: emailsQueued } = await supabaseAdmin
      .from('email_queue')
      .select('*', { count: 'exact', head: true })
      .eq('type', 'journal_summary')
      .gte('created_at', startDate.toISOString())

    const { count: emailsSent } = await supabaseAdmin
      .from('email_queue')
      .select('*', { count: 'exact', head: true })
      .eq('type', 'journal_summary')
      .eq('status', 'sent')
      .gte('created_at', startDate.toISOString())

    // Get recent entries (last 10)
    const { data: recentEntries } = await supabaseAdmin
      .from('journal_entries')
      .select('id, created_at, mood, word_count, duration_seconds, user_id')
      .order('created_at', { ascending: false })
      .limit(10)

    return NextResponse.json({
      success: true,
      period: `Last ${days} days`,
      stats: {
        totalEntries: totalEntries || 0,
        uniqueUsers: uniqueUserCount,
        avgDurationMinutes: avgDuration,
        avgWordCount: avgWordCount,
        avgCompletionRate: avgCompletionRate,
        emailsQueued: emailsQueued || 0,
        emailsSent: emailsSent || 0
      },
      charts: {
        dailyEntries: dailyData,
        moodDistribution: moodDistribution || {}
      },
      recentEntries: recentEntries?.map(e => ({
        id: e.id,
        date: new Date(e.created_at).toLocaleDateString(),
        mood: e.mood,
        wordCount: e.word_count,
        durationMinutes: Math.floor((e.duration_seconds || 0) / 60),
        userId: e.user_id ? `User ${e.user_id.substring(0, 8)}...` : 'Guest'
      })) || []
    })
  } catch (error) {
    console.error('[Admin Journal Analytics] Error:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch journal analytics' 
      },
      { status: 500 }
    )
  }
}
