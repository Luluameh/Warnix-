// lib/qwen/parse.ts
// JSON extraction helpers. LLMs sometimes wrap JSON in markdown code fences.
// These helpers safely extract and validate JSON from LLM responses.

export class ParseError extends Error {
  constructor(
    message: string,
    public readonly raw: string,
    public readonly agentId?: string,
  ) {
    super(message);
    this.name = 'ParseError';
  }
}

/**
 * Extract and parse JSON from an LLM response string.
 * Handles:
 *   - Raw JSON
 *   - JSON wrapped in ```json ... ``` code fences
 *   - JSON wrapped in ``` ... ``` code fences
 *   - JSON with leading/trailing whitespace
 */
export function extractJSON<T>(raw: string, agentId?: string): T {
  const trimmed = raw.trim();

  // Strategy 1: try parsing directly
  try {
    return JSON.parse(trimmed) as T;
  } catch {
    // continue
  }

  // Strategy 2: extract from ```json ... ``` block
  const jsonFenceMatch = trimmed.match(/```json\s*([\s\S]*?)```/i);
  if (jsonFenceMatch?.[1]) {
    try {
      return JSON.parse(jsonFenceMatch[1].trim()) as T;
    } catch {
      // continue
    }
  }

  // Strategy 3: extract from ``` ... ``` block
  const fenceMatch = trimmed.match(/```\s*([\s\S]*?)```/);
  if (fenceMatch?.[1]) {
    try {
      return JSON.parse(fenceMatch[1].trim()) as T;
    } catch {
      // continue
    }
  }

  // Strategy 4: find first { ... } or [ ... ] substring
  const firstBrace = trimmed.indexOf('{');
  const firstBracket = trimmed.indexOf('[');
  const start =
    firstBrace === -1 ? firstBracket :
    firstBracket === -1 ? firstBrace :
    Math.min(firstBrace, firstBracket);

  if (start !== -1) {
    const lastBrace  = trimmed.lastIndexOf('}');
    const lastBracket = trimmed.lastIndexOf(']');
    const end = Math.max(lastBrace, lastBracket);

    if (end > start) {
      try {
        return JSON.parse(trimmed.slice(start, end + 1)) as T;
      } catch {
        // continue
      }
    }
  }

  throw new ParseError(
    `Failed to extract JSON from LLM response (agent: ${agentId ?? 'unknown'})`,
    raw,
    agentId,
  );
}

/**
 * Safely get a number field from a parsed object, clamped to [min, max].
 */
export function safeNumber(
  obj: Record<string, unknown>,
  key: string,
  fallback: number,
  min = 0,
  max = 1,
): number {
  const val = obj[key];
  if (typeof val !== 'number' || isNaN(val)) return fallback;
  return Math.max(min, Math.min(max, val));
}

/**
 * Safely get a string array from a parsed object.
 */
export function safeStringArray(obj: Record<string, unknown>, key: string): string[] {
  const val = obj[key];
  if (!Array.isArray(val)) return [];
  return val.filter((v): v is string => typeof v === 'string');
}

/**
 * Safely get a string from a parsed object.
 */
export function safeString(obj: Record<string, unknown>, key: string, fallback = ''): string {
  const val = obj[key];
  return typeof val === 'string' ? val : fallback;
}
