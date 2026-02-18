/**
 * Example: Using Cubiqo Communication Fields
 * 
 * This file demonstrates how to use the auto-generated Cubiqo email
 * and phone fields in your application code.
 */

import { createClient } from '@/lib/supabase/server'
import { getCurrentProfile } from '@/lib/auth/actions'

// ============================================================================
// EXAMPLE 1: Get Current User's Communication Details
// ============================================================================

export async function getUserCommunicationDetails() {
  const profile = await getCurrentProfile()
  
  if (!profile) {
    console.log('User not authenticated')
    return null
  }

  return {
    handle: profile.handle,           // e.g., "CQ#12345"
    email: profile.cubiqo_email,      // e.g., "alice@yourcubiqo.com"
    phone: profile.cubiqo_phone,      // e.g., "+1-CUBIQO-12345"
    personalEmail: profile.email,     // e.g., "alice@gmail.com"
  }
}

// ============================================================================
// EXAMPLE 2: Send Morning Reminder (Mock Implementation)
// ============================================================================

export async function sendMorningReminder(userId: string, message: string) {
  const supabase = await createClient()
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('cubiqo_phone, display_name')
    .eq('id', userId)
    .single()

  if (!profile?.cubiqo_phone) {
    throw new Error('User does not have a Cubiqo phone number')
  }

  // TODO: Integrate with Twilio or similar service
  console.log(`📞 Calling ${profile.cubiqo_phone}...`)
  console.log(`   Message: "${message}"`)
  console.log(`   User: ${profile.display_name}`)
  
  // Mock response
  return {
    success: true,
    phone: profile.cubiqo_phone,
    timestamp: new Date().toISOString(),
  }
}

// ============================================================================
// EXAMPLE 3: Send Research Email (Mock Implementation)
// ============================================================================

export async function sendResearchEmail(userId: string, subject: string, body: string) {
  const supabase = await createClient()
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('cubiqo_email, display_name')
    .eq('id', userId)
    .single()

  if (!profile?.cubiqo_email) {
    throw new Error('User does not have a Cubiqo email')
  }

  // TODO: Integrate with Resend or similar email service
  console.log(`📧 Sending email to ${profile.cubiqo_email}...`)
  console.log(`   From: noreply@cubiqo.ai`)
  console.log(`   To: ${profile.cubiqo_email}`)
  console.log(`   Subject: ${subject}`)
  console.log(`   Recipient: ${profile.display_name}`)
  
  // Mock response
  return {
    success: true,
    email: profile.cubiqo_email,
    messageId: `msg_${Date.now()}`,
    timestamp: new Date().toISOString(),
  }
}

// ============================================================================
// EXAMPLE 4: Find User by Cubiqo Email
// ============================================================================

export async function findUserByEmail(cubiqoEmail: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('cubiqo_email', cubiqoEmail)
    .single()

  if (error || !data) {
    console.error('User not found:', error?.message)
    return null
  }

  return data
}

// ============================================================================
// EXAMPLE 5: List All User Communication Channels
// ============================================================================

export async function listUserCommunicationChannels(userId: string) {
  const supabase = await createClient()
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('handle, email, phone, cubiqo_email, cubiqo_phone, display_name')
    .eq('id', userId)
    .single()

  if (!profile) {
    return []
  }

  const channels = [
    {
      type: 'personal_email',
      value: profile.email,
      verified: true,
      description: 'User\'s personal email address'
    },
    {
      type: 'cubiqo_email',
      value: profile.cubiqo_email,
      verified: true,
      description: 'Cubiqo-managed email for platform communications'
    },
    {
      type: 'personal_phone',
      value: profile.phone,
      verified: false, // May need verification
      description: 'User\'s personal phone number'
    },
    {
      type: 'cubiqo_phone',
      value: profile.cubiqo_phone,
      verified: true,
      description: 'Cubiqo-managed phone for platform communications'
    },
  ].filter(channel => channel.value) // Only include channels with values

  return channels
}

// ============================================================================
// EXAMPLE 6: Batch Communication to Multiple Users
// ============================================================================

export async function sendBatchCommunication(
  userIds: string[],
  type: 'email' | 'phone',
  content: { subject?: string; message: string }
) {
  const supabase = await createClient()
  
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, display_name, cubiqo_email, cubiqo_phone')
    .in('id', userIds)

  if (!profiles || profiles.length === 0) {
    return { success: false, sent: 0, failed: userIds.length }
  }

  const results = profiles.map(profile => {
    const contact = type === 'email' ? profile.cubiqo_email : profile.cubiqo_phone
    
    if (!contact) {
      return { userId: profile.id, success: false, reason: 'No contact info' }
    }

    if (type === 'email') {
      // TODO: Send email via service
      console.log(`📧 Sending email to ${contact}`)
    } else {
      // TODO: Send SMS/call via service
      console.log(`📞 Calling ${contact}`)
    }

    return { userId: profile.id, success: true, contact }
  })

  const successful = results.filter(r => r.success).length
  const failed = results.filter(r => !r.success).length

  return {
    success: failed === 0,
    sent: successful,
    failed,
    results,
  }
}

// ============================================================================
// EXAMPLE 7: Type-Safe Communication Field Access
// ============================================================================

import type { Profile } from '@/types'

export function formatCommunicationInfo(profile: Profile): string {
  const lines = []
  
  if (profile.display_name) {
    lines.push(`Name: ${profile.display_name}`)
  }
  
  if (profile.handle) {
    lines.push(`Handle: ${profile.handle}`)
  }
  
  if (profile.cubiqo_email) {
    lines.push(`Cubiqo Email: ${profile.cubiqo_email}`)
  }
  
  if (profile.cubiqo_phone) {
    lines.push(`Cubiqo Phone: ${profile.cubiqo_phone}`)
  }
  
  return lines.join('\n')
}

// ============================================================================
// USAGE EXAMPLES
// ============================================================================

// In an API route:
// export async function POST(request: Request) {
//   const { userId, message } = await request.json()
//   const result = await sendMorningReminder(userId, message)
//   return Response.json(result)
// }

// In a server component:
// const details = await getUserCommunicationDetails()
// console.log(details?.email)  // alice@yourcubiqo.com
// console.log(details?.phone)  // +1-CUBIQO-12345

// In a scheduled task:
// const userIds = await getAllActiveUserIds()
// await sendBatchCommunication(userIds, 'email', {
//   subject: 'Your daily summary',
//   message: 'Here is what happened today...'
// })
