/**
 * Media Generation Types
 * Types for image and video generation requests and responses
 */

export type ImageSize = '1024x1024' | '1024x1792' | '1792x1024'
export type ImageQuality = 'standard' | 'hd'
export type ImageStyle = 'vivid' | 'natural'

export interface ImageGenerationRequest {
  prompt: string
  size?: ImageSize
  quality?: ImageQuality
  style?: ImageStyle
  sessionId?: string
}

export interface ImageGenerationResponse {
  url: string
  prompt: string
  revisedPrompt?: string
  size: ImageSize
  quality: ImageQuality
  style: ImageStyle
  provider: 'openai'
  createdAt: string
}

export type VideoStatus = 'pending' | 'processing' | 'completed' | 'failed'

export interface VideoGenerationRequest {
  prompt: string
  duration?: number
  sessionId?: string
}

export interface VideoGenerationResponse {
  status: VideoStatus
  message: string
  prompt: string
  createdAt: string
}

export interface MediaError {
  error: string
  code?: string
}
