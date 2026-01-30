import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { BetaAnalyticsDataClient } from '@google-analytics/data'

// GET /api/domains/[id]/analytics - Get analytics data for a domain
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    let range = searchParams.get('range') || '30d'
    
    // Normalize date range format (handle both '7d' and '7days' formats)
    if (range === '7days') range = '7d'
    if (range === '30days') range = '30d'
    if (range === '90days') range = '90d'

    // Get domain with Google Analytics ID
    const domain = await prisma.domain.findUnique({
      where: { id },
    })

    if (!domain) {
      return NextResponse.json(
        { error: 'Domain not found' },
        { status: 404 }
      )
    }

    if (!domain.googleAnalyticsId) {
      return NextResponse.json(
        { error: 'Google Analytics ID not configured for this domain' },
        { status: 400 }
      )
    }

    // Get Google Analytics credentials from settings
    const { getGoogleAnalyticsServiceAccount } = await import('@/lib/settings')
    const gaMeasurementId = domain.googleAnalyticsId
    
    // For GA4 Data API, we need the property ID (numeric), not the measurement ID (G-XXXXX)
    // Extract property ID from measurement ID or use it directly if it's already a property ID
    // Note: Users should enter the GA4 Property ID (numeric) in the domain settings
    // The measurement ID format is G-XXXXXXXXXX, but the API needs the numeric property ID
    let gaPropertyId = gaMeasurementId
    
    // If it's in G-XXXXXXXXXX format, we'll need to look it up or ask user to provide property ID
    // For now, assume they enter the numeric property ID directly
    if (gaMeasurementId.startsWith('G-')) {
      // Try to extract or use as-is - in production, you'd want to map measurement ID to property ID
      // For now, return an error asking for property ID
      return NextResponse.json(
        { error: 'Please enter the GA4 Property ID (numeric), not the Measurement ID (G-XXXXX). You can find it in GA4 Admin > Property Settings.' },
        { status: 400 }
      )
    }
    
    const gaCredentials = await getGoogleAnalyticsServiceAccount()

    if (!gaCredentials) {
      return NextResponse.json(
        { error: 'Google Analytics Service Account credentials not configured. Please add your service account JSON in Settings > Google Analytics Service Account Credentials.' },
        { status: 400 }
      )
    }

    // Initialize Analytics Data API client
    let analyticsDataClient: BetaAnalyticsDataClient
    try {
      let credentials
      if (typeof gaCredentials === 'string') {
        credentials = JSON.parse(gaCredentials)
      } else {
        credentials = gaCredentials
      }
      
      analyticsDataClient = new BetaAnalyticsDataClient({
        credentials: {
          client_email: credentials.client_email,
          private_key: credentials.private_key.replace(/\\n/g, '\n'),
        },
      })
    } catch (error) {
      console.error('Error parsing GA credentials:', error)
      return NextResponse.json(
        { error: 'Invalid Google Analytics credentials format. Please check your service account JSON in Settings.' },
        { status: 400 }
      )
    }

    // Calculate date range
    const endDate = new Date()
    const startDate = new Date()
    switch (range) {
      case '7d':
        startDate.setDate(endDate.getDate() - 7)
        break
      case '30d':
        startDate.setDate(endDate.getDate() - 30)
        break
      case '90d':
        startDate.setDate(endDate.getDate() - 90)
        break
      default:
        startDate.setDate(endDate.getDate() - 30)
    }

    const startDateStr = startDate.toISOString().split('T')[0]
    const endDateStr = endDate.toISOString().split('T')[0]

    try {
      // Fetch overview metrics
      const [overviewResponse, dailyResponse, pagesResponse, sourcesResponse, devicesResponse] = await Promise.all([
        // Overview metrics
        analyticsDataClient.runReport({
          property: `properties/${gaPropertyId}`,
          dateRanges: [
            {
              startDate: startDateStr,
              endDate: endDateStr,
            },
          ],
          metrics: [
            { name: 'activeUsers' },
            { name: 'newUsers' },
            { name: 'sessions' },
            { name: 'screenPageViews' },
            { name: 'bounceRate' },
            { name: 'averageSessionDuration' },
          ],
        }),
        // Daily data
        analyticsDataClient.runReport({
          property: `properties/${gaPropertyId}`,
          dateRanges: [
            {
              startDate: startDateStr,
              endDate: endDateStr,
            },
          ],
          dimensions: [{ name: 'date' }],
          metrics: [
            { name: 'activeUsers' },
            { name: 'sessions' },
            { name: 'screenPageViews' },
          ],
          orderBys: [
            {
              dimension: { dimensionName: 'date' },
            },
          ],
        }),
        // Top pages
        analyticsDataClient.runReport({
          property: `properties/${gaPropertyId}`,
          dateRanges: [
            {
              startDate: startDateStr,
              endDate: endDateStr,
            },
          ],
          dimensions: [{ name: 'pagePath' }],
          metrics: [{ name: 'screenPageViews' }],
          orderBys: [
            {
              metric: { metricName: 'screenPageViews' },
              desc: true,
            },
          ],
          limit: 10,
        }),
        // Traffic sources
        analyticsDataClient.runReport({
          property: `properties/${gaPropertyId}`,
          dateRanges: [
            {
              startDate: startDateStr,
              endDate: endDateStr,
            },
          ],
          dimensions: [{ name: 'sessionSource' }],
          metrics: [{ name: 'sessions' }],
          orderBys: [
            {
              metric: { metricName: 'sessions' },
              desc: true,
            },
          ],
          limit: 5,
        }),
        // Devices
        analyticsDataClient.runReport({
          property: `properties/${gaPropertyId}`,
          dateRanges: [
            {
              startDate: startDateStr,
              endDate: endDateStr,
            },
          ],
          dimensions: [{ name: 'deviceCategory' }],
          metrics: [{ name: 'sessions' }],
        }),
      ])

      // Process overview data
      const overviewRow = overviewResponse[0].rows?.[0]
      const overview = {
        users: parseInt(overviewRow?.metricValues?.[0]?.value || '0'),
        newUsers: parseInt(overviewRow?.metricValues?.[1]?.value || '0'),
        sessions: parseInt(overviewRow?.metricValues?.[2]?.value || '0'),
        pageViews: parseInt(overviewRow?.metricValues?.[3]?.value || '0'),
        bounceRate: parseFloat(overviewRow?.metricValues?.[4]?.value || '0') * 100,
        avgSessionDuration: parseFloat(overviewRow?.metricValues?.[5]?.value || '0'),
      }

      // Process daily data
      const dailyData =
        dailyResponse[0].rows?.map((row) => ({
          date: row.dimensionValues?.[0]?.value || '',
          users: parseInt(row.metricValues?.[0]?.value || '0'),
          sessions: parseInt(row.metricValues?.[1]?.value || '0'),
          pageViews: parseInt(row.metricValues?.[2]?.value || '0'),
        })) || []

      // Process top pages
      const topPages =
        pagesResponse[0].rows?.map((row) => ({
          page: row.dimensionValues?.[0]?.value || 'Unknown',
          views: parseInt(row.metricValues?.[0]?.value || '0'),
        })) || []

      // Process traffic sources
      const trafficSources =
        sourcesResponse[0].rows?.map((row) => ({
          source: row.dimensionValues?.[0]?.value || 'Unknown',
          sessions: parseInt(row.metricValues?.[0]?.value || '0'),
        })) || []

      // Process devices
      const devices =
        devicesResponse[0].rows?.map((row) => ({
          device: row.dimensionValues?.[0]?.value || 'Unknown',
          sessions: parseInt(row.metricValues?.[0]?.value || '0'),
        })) || []

      return NextResponse.json({
        analytics: {
          overview,
          dailyData,
          topPages,
          trafficSources,
          devices,
        },
      })
    } catch (error: any) {
      console.error('Error fetching GA data:', error)
      
      // Provide more helpful error messages
      let errorMessage = 'Failed to fetch analytics data'
      let errorDetails = error.message || 'Unknown error'
      
      if (error.message?.includes('PERMISSION_DENIED') || error.message?.includes('403')) {
        errorMessage = 'Permission denied. Please ensure the service account has access to this GA4 property.'
        errorDetails = 'The service account needs to be granted Viewer access in Google Analytics Admin.'
      } else if (error.message?.includes('NOT_FOUND') || error.message?.includes('404')) {
        errorMessage = 'Property not found. Please verify the GA4 Property ID is correct.'
        errorDetails = `Property ID: ${gaPropertyId}. Check GA4 Admin > Property Settings for the correct numeric ID.`
      } else if (error.message?.includes('INVALID_ARGUMENT')) {
        errorMessage = 'Invalid property ID format.'
        errorDetails = 'Please ensure you entered the numeric Property ID (e.g., 521849674), not the Measurement ID (G-XXXXX).'
      }
      
      return NextResponse.json(
        {
          error: errorMessage,
          details: errorDetails,
          propertyId: gaPropertyId,
        },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Error in analytics API:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    )
  }
}

