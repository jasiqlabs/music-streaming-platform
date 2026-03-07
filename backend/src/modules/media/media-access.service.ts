/**
 * Centralized media access service. Section 18.
 * Validates: Auth, Media Status (READY), Visibility, Entitlement; then issues playback URL via delivery strategy.
 */

import { getContentForAccess, checkMediaEntitlement, type VisibilityType } from "../../shared/security/media-authz.service";
import { createPlaybackToken } from "../../shared/security/signed-media-token.service";
import { generatePlaybackAccess } from "../../shared/delivery/services/media-delivery.service";
import { isContentEligibleForPlayback } from "./media-policy.service";
import { getMediaConfig } from "../../config/media.config";
import {
  MediaNotFoundException,
  MediaNotReadyException,
  MediaAccessDeniedException
} from "../../shared/exceptions/media.exception";
import type { PlaybackAccessResponse } from "./media.types";

export interface RequestPlaybackInput {
  contentId: number;
  userId: number | null;
}

/**
 * Main entry: validate everything then return playback URL (or throw).
 * No controller should issue playback URLs without this service.
 */
export async function requestPlaybackAccess(input: RequestPlaybackInput): Promise<PlaybackAccessResponse> {
  const { contentId, userId } = input;

  const content = await getContentForAccess(contentId);
  if (!content) {
    throw new MediaNotFoundException(contentId);
  }

  const status = (content.status || "DRAFT").toString().toUpperCase();
  const isApproved = Boolean(content.is_approved);

  if (!isContentEligibleForPlayback(status, isApproved)) {
    throw new MediaNotReadyException(contentId, status);
  }

  const visibility = (content.visibility || "PROTECTED") as VisibilityType;
  const subscriptionRequired = Boolean(content.subscription_required);

  const entitlement = await checkMediaEntitlement(
    userId ?? null,
    content.artist_id,
    visibility,
    subscriptionRequired
  );

  if (!entitlement.allowed) {
    throw new MediaAccessDeniedException(entitlement.reason || "Access denied");
  }

  let storageKey = content.storage_key;
  const storageProvider = (content.storage_provider || "local").toString().toLowerCase();

  // Legacy content: no storage_key, use media_url as direct URL (backend serves /uploads via static)
  if (!storageKey && content.media_url) {
    const config = getMediaConfig();
    const base = config.appBaseUrl.replace(/\/$/, "");
    const path = (content.media_url as string).startsWith("/") ? content.media_url : `/${content.media_url}`;
    return {
      mediaId: contentId,
      playbackUrl: `${base}${path}`,
      expiresIn: config.mediaUrlTtlSeconds
    };
  }

  if (!storageKey) {
    throw new MediaNotReadyException(contentId, "no storage key");
  }

  const config = getMediaConfig();
  const expiresInSeconds = config.mediaUrlTtlSeconds;

  if (!userId && visibility === "PROTECTED") {
    throw new MediaAccessDeniedException("Authentication required for protected content");
  }

  const token = createPlaybackToken(contentId, userId ?? 0, expiresInSeconds);

  const result = await generatePlaybackAccess({
    mediaId: contentId,
    storageProvider,
    storageKey: storageKey as string,
    contentType: content.mime_type ?? undefined,
    contentLength: content.file_size_bytes ?? undefined,
    visibility,
    userId: userId ?? 0,
    expiresInSeconds,
    token
  });

  return {
    mediaId: contentId,
    playbackUrl: result.playbackUrl,
    expiresIn: result.expiresIn,
    contentType: result.contentType,
    contentLength: result.contentLength
  };
}
