/**
 * Sanitize user input before interpolation into LLM prompts.
 *
 * Prompt injection prevention: strips structural prompt characters and
 * known injection patterns, and enforces a length cap.
 */

const INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?previous\s+instructions/gi,
  /ignore\s+(all\s+)?above\s+instructions/gi,
  /disregard\s+(all\s+)?previous/gi,
  /you\s+are\s+now/gi,
  /new\s+instructions:/gi,
  /^system\s*:/gim,
  /^assistant\s*:/gim,
  /^user\s*:/gim,
  /^human\s*:/gim,
];

export function sanitizePromptInput(input: string, maxLength = 500): string {
  let cleaned = input;

  // Strip backticks, which can break prompt structure
  cleaned = cleaned.replace(/`/g, '');

  // Collapse 3+ consecutive newlines into 2
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');

  // Remove known prompt-injection patterns
  for (const pattern of INJECTION_PATTERNS) {
    cleaned = cleaned.replace(pattern, '');
  }

  // Enforce length limit
  if (cleaned.length > maxLength) {
    cleaned = cleaned.slice(0, maxLength);
  }

  return cleaned.trim();
}
