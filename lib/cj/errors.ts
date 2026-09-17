/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Error thrown for any failed CJ Dropshipping API interaction.
 * Mirrors the ProductCrudError style used elsewhere in the codebase.
 */
export class CjApiError extends Error {
  constructor(
    message: string,
    /** CJ envelope `code` (e.g. 200 on success) or a synthetic code like "AUTH_MISSING" */
    public code: string | number,
    /** CJ `requestId` when available — useful when reporting issues to CJ support */
    public requestId?: string,
    public details?: any
  ) {
    super(message);
    this.name = "CjApiError";
  }
}
