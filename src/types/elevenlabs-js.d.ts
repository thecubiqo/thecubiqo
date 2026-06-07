declare module '@elevenlabs/elevenlabs-js' {
  export class ElevenLabsClient {
    constructor(options: { apiKey: string });
    textToSpeech: {
      stream(
        voiceId: string,
        options: {
          text: string;
          modelId?: string;
          outputFormat?: string;
          voiceSettings?: {
            stability?: number;
            similarityBoost?: number;
          };
        }
      ): Promise<ReadableStream<Uint8Array>>;
    };
  }
}
