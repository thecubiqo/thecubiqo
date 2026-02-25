/**
 * Image Agent - Image Generation Subagent
 * 
 * Generates images using AI models (DALL-E, Stable Diffusion, etc.)
 * for UI mockups, logos, and marketing materials.
 * 
 * @module emergent/subagents/image-agent
 */

import OpenAI from 'openai'
import type { SubAgentRequest, ToolResponse, GenerateImageParams } from '../agent-types'
import { ValidationError } from '../agent-types'

/**
 * Execute image generation agent
 * 
 * @param request - Subagent request
 * @returns Tool response with image URL
 */
export async function executeImageAgent(
  request: SubAgentRequest
): Promise<ToolResponse> {
  const params = request.params as unknown as GenerateImageParams

  try {
    // Validate params
    if (!params.prompt || params.prompt.trim().length === 0) {
      throw new ValidationError('Prompt is required')
    }

    if (params.prompt.length > 1000) {
      throw new ValidationError('Prompt must be less than 1000 characters')
    }

    const validSizes = ['256x256', '512x512', '1024x1024']
    if (params.size && !validSizes.includes(params.size)) {
      throw new ValidationError(`Size must be one of: ${validSizes.join(', ')}`)
    }

    const validStyles = ['vivid', 'natural']
    if (params.style && !validStyles.includes(params.style)) {
      throw new ValidationError(`Style must be one of: ${validStyles.join(', ')}`)
    }

    // Check for OpenAI API key — gracefully degrade to placeholder if not configured
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      // Graceful fallback: return placeholder when DALL-E is not configured
      const imageUrl = `https://placehold.co/${params.size || '512x512'}/png?text=${encodeURIComponent(params.prompt.slice(0, 50))}`
      return {
        success: true,
        data: {
          url: imageUrl,
          prompt: params.prompt,
          size: params.size || '512x512',
          style: params.style || 'natural'
        },
        error: null,
        metadata: {
          model: 'placeholder',
          note: 'OPENAI_API_KEY not configured — using placeholder image'
        }
      }
    }

    // Call OpenAI DALL-E 3 API
    const openai = new OpenAI({ apiKey })

    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt: params.prompt,
      n: 1,
      size: (params.size as '256x256' | '512x512' | '1024x1024') || '1024x1024',
      style: params.style || 'natural',
      response_format: 'url',
    })

    const firstImage = response.data?.[0]
    const imageUrl = firstImage?.url
    if (!imageUrl) {
      throw new Error('No image URL returned from DALL-E')
    }

    return {
      success: true,
      data: {
        url: imageUrl,
        prompt: params.prompt,
        size: params.size || '1024x1024',
        style: params.style || 'natural',
        revisedPrompt: firstImage?.revised_prompt
      },
      error: null,
      metadata: {
        model: 'dall-e-3',
        revisedPrompt: firstImage?.revised_prompt
      }
    }
  } catch (error) {
    return {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : 'Image generation failed'
    }
  }
}
