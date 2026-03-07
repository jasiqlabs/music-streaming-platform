/**
 * Provider-neutral storage exceptions. Section 28.
 */

export class StorageProviderNotConfiguredException extends Error {
  constructor(provider: string) {
    super(`Storage provider not configured or invalid: ${provider}`);
    this.name = "StorageProviderNotConfiguredException";
  }
}

export class StorageUploadFailedException extends Error {
  constructor(message: string, public readonly storageKey?: string) {
    super(message);
    this.name = "StorageUploadFailedException";
  }
}

export class StorageDeleteFailedException extends Error {
  constructor(message: string, public readonly storageKey?: string) {
    super(message);
    this.name = "StorageDeleteFailedException";
  }
}

export class StorageReadFailedException extends Error {
  constructor(message: string, public readonly storageKey?: string) {
    super(message);
    this.name = "StorageReadFailedException";
  }
}

export class StoragePathTraversalException extends Error {
  constructor() {
    super("Path traversal not allowed");
    this.name = "StoragePathTraversalException";
  }
}
