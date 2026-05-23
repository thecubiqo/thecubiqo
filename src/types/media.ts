export type MediaType = 'image' | 'audio' | 'video' | 'video_clip';
export type GenerationStatus = 'queued' | 'pending' | 'processing' | 'completed' | 'complete' | 'failed' | 'expired' | 'cancelled';

export interface MediaGenerationJob {
  id: string;
  userId: string;
  sessionId: string | null;
  mediaType: MediaType;
  prompt: string;
  modelUsed: string;
  status: GenerationStatus;
  storageUrl: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  completedAt: string | null;
  expiresAt: string | null;
}

export interface GenerateMediaRequest {
  prompt: string;
  mediaType: MediaType;
  sessionId?: string;
  taskId?: string;
  style?: string;
  aspectRatio?: '1:1' | '16:9' | '9:16';
  negativePrompt?: string;
}
