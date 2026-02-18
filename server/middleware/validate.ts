/**
 * Input validation helpers for Express route handlers.
 * Returns an error message string if validation fails, or null if valid.
 */

export function validateStringLength(
  value: unknown,
  maxLength: number,
  fieldName: string
): string | null {
  if (typeof value !== 'string') return null;
  if (value.length > maxLength) {
    return `${fieldName} exceeds maximum length of ${maxLength} characters`;
  }
  return null;
}

export function validateBase64Size(
  value: unknown,
  maxMB: number,
  fieldName: string
): string | null {
  if (typeof value !== 'string') return null;
  // Base64 encodes 3 bytes into 4 chars; decoded size ~ base64Length * 3/4
  const decodedBytes = (value.length * 3) / 4;
  const decodedMB = decodedBytes / (1024 * 1024);
  if (decodedMB > maxMB) {
    return `${fieldName} exceeds maximum size of ${maxMB}MB`;
  }
  return null;
}
