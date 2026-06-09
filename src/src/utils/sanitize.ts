/**
 * Security utilities for input sanitization.
 * Prevents XSS, script injection, and SQL-style attacks on user inputs
 * before they are stored in Firestore or sent via WhatsApp/email.
 */

/**
 * Strip HTML tags, script content, and dangerous characters from a string.
 */
export const sanitizeText = (input: string): string => {
  if (!input) return "";
  return input
    // Remove HTML tags
    .replace(/<[^>]*>/g, "")
    // Remove script-related patterns
    .replace(/javascript:/gi, "")
    .replace(/on\w+\s*=/gi, "")
    // Remove null bytes
    .replace(/\0/g, "")
    // Trim whitespace
    .trim();
};

/**
 * Sanitize a phone number — only allow digits, +, spaces, hyphens.
 */
export const sanitizePhone = (input: string): string => {
  if (!input) return "";
  return input.replace(/[^\d+\-\s()]/g, "").trim();
};

/**
 * Sanitize an email — basic cleanup, lowercase.
 */
export const sanitizeEmail = (input: string): string => {
  if (!input) return "";
  return input
    .replace(/<[^>]*>/g, "")
    .replace(/\s/g, "")
    .toLowerCase()
    .trim();
};

/**
 * Validate that an object doesn't contain excessively long strings
 * which could be used for denial-of-service via Firestore writes.
 */
export const validateFieldLengths = (data: Record<string, any>, maxLength: number = 2000): boolean => {
  for (const key of Object.keys(data)) {
    const value = data[key];
    if (typeof value === "string" && value.length > maxLength) {
      return false;
    }
  }
  return true;
};
