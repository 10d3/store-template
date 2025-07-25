/* eslint-disable @typescript-eslint/no-explicit-any */

// Custom error class for product CRUD operations
export class ProductCrudError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'ProductCrudError';
  }
}