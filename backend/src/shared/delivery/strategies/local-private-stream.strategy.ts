/**
 * Local private stream delivery. Section 22.1.
 * Returns backend route /media/stream/:mediaId?token=...
 * Actual streaming with Range support is handled by the stream route.
 */

import type { IMediaDeliveryStrategy } from "../interfaces/media-delivery-strategy.interface";
import type { GeneratePlaybackAccessParams, PlaybackAccessResult } from "../interfaces/media-delivery-strategy.interface";
import { getMediaConfig } from "../../../config/media.config";

export class LocalPrivateStreamStrategy implements IMediaDeliveryStrategy {
  async generatePlaybackAccess(params: GeneratePlaybackAccessParams): Promise<PlaybackAccessResult> {
    const { mediaId, expiresInSeconds, token } = params;
    const config = getMediaConfig();
    const baseUrl = config.appBaseUrl.replace(/\/$/, "");
    const route = config.localPrivateStreamRoute.replace(/^\//, "");
    const playbackUrl = `${baseUrl}/${route}/${mediaId}?token=${encodeURIComponent(token)}`;
    return {
      playbackUrl,
      expiresIn: expiresInSeconds
    };
  }
}
