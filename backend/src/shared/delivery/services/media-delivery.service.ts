/**
 * Selects and invokes the appropriate delivery strategy. Section 10.
 * local -> LocalPrivateStreamStrategy; firebase/s3 -> SignedUrlDeliveryStrategy.
 */

import type { IMediaDeliveryStrategy } from "../interfaces/media-delivery-strategy.interface";
import type { GeneratePlaybackAccessParams, PlaybackAccessResult } from "../interfaces/media-delivery-strategy.interface";
import { getStorageConfig } from "../../../config/storage.config";
import { DeliveryStrategyNotAvailableException } from "../../exceptions/delivery.exception";
import { LocalPrivateStreamStrategy } from "../strategies/local-private-stream.strategy";
import { SignedUrlDeliveryStrategy } from "../strategies/signed-url-delivery.strategy";

let localStrategy: LocalPrivateStreamStrategy | null = null;
let signedUrlStrategy: SignedUrlDeliveryStrategy | null = null;

function getLocalStrategy(): IMediaDeliveryStrategy {
  if (!localStrategy) localStrategy = new LocalPrivateStreamStrategy();
  return localStrategy;
}

function getSignedUrlStrategy(): IMediaDeliveryStrategy {
  if (!signedUrlStrategy) signedUrlStrategy = new SignedUrlDeliveryStrategy();
  return signedUrlStrategy;
}

export function getDeliveryStrategyForProvider(provider: string): IMediaDeliveryStrategy {
  if (provider === "local") return getLocalStrategy();
  if (provider === "firebase" || provider === "s3") return getSignedUrlStrategy();
  throw new DeliveryStrategyNotAvailableException(provider);
}

export async function generatePlaybackAccess(params: GeneratePlaybackAccessParams): Promise<PlaybackAccessResult> {
  const strategy = getDeliveryStrategyForProvider(params.storageProvider);
  return strategy.generatePlaybackAccess(params);
}
