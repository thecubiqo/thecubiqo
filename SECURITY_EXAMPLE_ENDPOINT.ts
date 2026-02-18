/**
 * Example Secured API Endpoint
 * 
 * This is a reference implementation showing how to use all Phase 1 security features:
 * 1. Admin authentication
 * 2. Rate limiting
 * 3. Input validation
 * 4. Proper error handling
 * 
 * Copy this pattern to other endpoints!
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/admin'
import { enforceRateLimit, getRequestIdentifier, RateLimits } from '@/lib/security/rate-limit'
import { validateRequest, adminAnalyticsQuerySchema, formatValidationErrors } from '@/lib/validation/schemas'

/**
 * GET /api/admin/example
 * Example secured endpoint with all security best practices
 */
export async function GET(request: NextRequest) {
  // STEP 1: Admin Authentication
  // This checks if the user is authenticated AND has admin privileges
  const authResult = await requireAdmin(request)
  if (!authResult.authorized) {
    return authResult.response // Returns 401 or 403
  }

  const { user } = authResult

  // STEP 2: Rate Limiting
  // Prevent abuse by limiting requests per user/IP
  const identifier = getRequestIdentifier(request, user.id)
  const rateLimitResponse = enforceRateLimit(
    identifier,
    RateLimits.ADMIN.limit,
    RateLimits.ADMIN.windowMs
  )
  if (rateLimitResponse) {
    return rateLimitResponse // Returns 429 Too Many Requests
  }

  // STEP 3: Input Validation
  // Parse and validate query parameters
  const { searchParams } = new URL(request.url)
  const queryParams = {
    days: searchParams.get('days') || '30',
    startDate: searchParams.get('startDate') || undefined,
    endDate: searchParams.get('endDate') || undefined
  }

  const validation = validateRequest(adminAnalyticsQuerySchema, queryParams)
  if (!validation.success) {
    return NextResponse.json(
      {
        success: false,
        error: 'Invalid query parameters',
        details: formatValidationErrors(validation.errors)
      },
      { status: 400 }
    )
  }

  const validParams = validation.data

  // STEP 4: Business Logic
  // Now safely process the request with validated data
  try {
    // Your actual business logic here
    const result = {
      message: 'This is a secured endpoint',
      requestedBy: user.email,
      params: validParams,
      timestamp: new Date().toISOString()
    }

    return NextResponse.json({
      success: true,
      data: result
    })
  } catch (error) {
    // STEP 5: Error Handling
    console.error('[Admin Example] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error'
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/example
 * Example secured POST endpoint with body validation
 */
export async function POST(request: NextRequest) {
  // STEP 1: Admin Authentication
  const authResult = await requireAdmin(request)
  if (!authResult.authorized) {
    return authResult.response
  }

  const { user } = authResult

  // STEP 2: Rate Limiting (stricter for write operations)
  const identifier = getRequestIdentifier(request, user.id)
  const rateLimitResponse = enforceRateLimit(
    identifier,
    RateLimits.STRICT.limit, // 5 per minute for writes
    RateLimits.STRICT.windowMs
  )
  if (rateLimitResponse) {
    return rateLimitResponse
  }

  // STEP 3: Input Validation (for POST body)
  try {
    const body = await request.json()
    
    // Example: validate against a schema
    // const validation = validateRequest(yourSchema, body)
    // if (!validation.success) {
    //   return NextResponse.json(
    //     { success: false, error: formatValidationErrors(validation.errors) },
    //     { status: 400 }
    //   )
    // }

    // STEP 4: Business Logic
    const result = {
      message: 'Data received and validated',
      userId: user.id,
      body: body,
      timestamp: new Date().toISOString()
    }

    return NextResponse.json({
      success: true,
      data: result
    }, { status: 201 })
  } catch (error) {
    // Handle JSON parse errors
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid JSON in request body'
        },
        { status: 400 }
      )
    }

    // Handle other errors
    console.error('[Admin Example POST] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error'
      },
      { status: 500 }
    )
  }
}

/**
 * QUICK REFERENCE: How to secure ANY endpoint
 * 
 * For Admin Endpoints:
 * 1. Import: import { requireAdmin } from '@/lib/auth/admin'
 * 2. Add at start: const authResult = await requireAdmin(request)
 * 3. Check: if (!authResult.authorized) return authResult.response
 * 
 * For Rate Limiting:
 * 1. Import: import { enforceRateLimit, getRequestIdentifier, RateLimits } from '@/lib/security/rate-limit'
 * 2. Get ID: const identifier = getRequestIdentifier(request, userId)
 * 3. Check: const rateLimitResponse = enforceRateLimit(identifier, RateLimits.STANDARD.limit, RateLimits.STANDARD.windowMs)
 * 4. Return if blocked: if (rateLimitResponse) return rateLimitResponse
 * 
 * For Input Validation:
 * 1. Import: import { validateRequest, yourSchema, formatValidationErrors } from '@/lib/validation/schemas'
 * 2. Validate: const validation = validateRequest(yourSchema, data)
 * 3. Check: if (!validation.success) return error response
 * 4. Use: const validData = validation.data
 */
