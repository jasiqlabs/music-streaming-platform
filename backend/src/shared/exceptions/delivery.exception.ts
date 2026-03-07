/**
 * Delivery-layer exceptions. Section 28.
 */

export class DeliveryStrategyNotAvailableException extends Error {
  constructor(provider?: string) {
    super(provider ? `Delivery strategy not available for provider: ${provider}` : "Delivery strategy not available");
    this.name = "DeliveryStrategyNotAvailableException";
  }
}

export class DeliveryFailedException extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DeliveryFailedException";
  }
}
