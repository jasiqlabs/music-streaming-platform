/**
 * POST /api/v1/fan/stream/access - request playback URL via MediaAccessService.
 */

import { Router } from "express";
import { requireAuth } from "../../common/auth/requireAuth";
import { requestPlaybackAccess } from "../../modules/media/media-access.service";
import {
  MediaNotFoundException,
  MediaNotReadyException,
  MediaAccessDeniedException,
  MediaInvalidTokenException
} from "../../shared/exceptions/media.exception";

const router = Router();

router.post("/access", requireAuth, async (req: any, res: any) => {
  const correlationId = req?.correlationId || "-";
  const contentId = Number(req.body?.contentId);

  if (!Number.isFinite(contentId) || contentId <= 0) {
    return res.status(400).json({
      success: false,
      message: "contentId required",
      correlationId
    });
  }

  try {
    const result = await requestPlaybackAccess({
      contentId,
      userId: req.user?.id ?? null
    });
    return res.json({
      success: true,
      mediaId: result.mediaId,
      playbackUrl: result.playbackUrl,
      expiresIn: result.expiresIn,
      contentType: result.contentType,
      contentLength: result.contentLength,
      correlationId
    });
  } catch (err: any) {
    if (err instanceof MediaNotFoundException) {
      return res.status(404).json({ success: false, message: "Content not found", correlationId });
    }
    if (err instanceof MediaNotReadyException) {
      return res.status(403).json({ success: false, message: err.message, correlationId });
    }
    if (err instanceof MediaAccessDeniedException) {
      return res.status(403).json({ success: false, message: err.message, correlationId });
    }
    if (err instanceof MediaInvalidTokenException) {
      return res.status(401).json({ success: false, message: err.message, correlationId });
    }
    console.error("[stream/access] error", err);
    return res.status(500).json({
      success: false,
      message: "Failed to get playback access",
      correlationId
    });
  }
});

export default router;
