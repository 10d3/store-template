/**
 * Generates a non-sequential, human-readable order ID.
 * Format: VIT-XXXXXX (6 random alphanumeric chars, no ambiguous chars like 0/O/1/I)
 * Example: VIT-K7M2PQ
 *
 * This intentionally does NOT use autoincrement so order volume cannot be inferred.
 */
const CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateOrderId(): string {
    let result = "";
    for (let i = 0; i < 6; i++) {
        result += CHARS[Math.floor(Math.random() * CHARS.length)];
    }
    return `VIT-${result}`;
}
