import { validateEnv } from "./env.validation";

export interface MediaConfig {
  appBaseUrl: string;
  localPrivateStreamRoute: string;
  mediaSignedTokenSecret: string;
  mediaUrlTtlSeconds: number;
  maxUploadAudioBytes: number;
  maxUploadVideoBytes: number;
  maxUploadImageBytes: number;
}

export function getMediaConfig(): MediaConfig {
  const env = validateEnv();
  return {
    appBaseUrl: env.appBaseUrl,
    localPrivateStreamRoute: env.localPrivateStreamRoute,
    mediaSignedTokenSecret: env.mediaSignedTokenSecret,
    mediaUrlTtlSeconds: env.mediaUrlTtlSeconds,
    maxUploadAudioBytes: env.maxUploadAudioMb * 1024 * 1024,
    maxUploadVideoBytes: env.maxUploadVideoMb * 1024 * 1024,
    maxUploadImageBytes: env.maxUploadImageMb * 1024 * 1024
  };
}
