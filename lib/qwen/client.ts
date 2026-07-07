// lib/qwen/client.ts
// Qwen Cloud API client — OpenAI-compatible endpoint.
// All agents use qwen-plus (uniform model, simpler, sufficient).

export const QWEN_MODEL = 'qwen-plus';
const QWEN_BASE_URL = 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1';

export interface QwenMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface QwenResponseBody {
  choices: Array<{
    message: { content: string; role: string };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  model: string;
}

export class QwenError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly agentId?: string,
  ) {
    super(message);
    this.name = 'QwenError';
  }
}

export interface QwenCallOptions {
  model?: string;
  /** Force JSON object output from the model */
  jsonMode?: boolean;
  /** For error reporting */
  agentId?: string;
  /** Max tokens (default: 2048) */
  maxTokens?: number;
}

/**
 * Call the Qwen Cloud API.
 * Returns the raw string content of the first choice.
 */
export async function callQwen(
  messages: QwenMessage[],
  options: QwenCallOptions = {},
): Promise<string> {
  const apiKey = process.env.QWEN_API_KEY;
  if (!apiKey) {
    throw new QwenError('QWEN_API_KEY environment variable is not set');
  }

  const model = options.model ?? QWEN_MODEL;

  const requestBody: Record<string, unknown> = {
    model,
    messages,
    max_tokens: options.maxTokens ?? 2048,
  };

  if (options.jsonMode) {
    requestBody['response_format'] = { type: 'json_object' };
  }

  let response: Response;
  try {
    response = await fetch(`${QWEN_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });
  } catch (err) {
    throw new QwenError(
      `Network error calling Qwen API: ${err instanceof Error ? err.message : String(err)}`,
      undefined,
      options.agentId,
    );
  }

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'unknown error');
    throw new QwenError(
      `Qwen API returned ${response.status}: ${errorText}`,
      response.status,
      options.agentId,
    );
  }

  const data = await response.json() as QwenResponseBody;
  const content = data.choices?.[0]?.message?.content;

  if (typeof content !== 'string' || content.trim() === '') {
    throw new QwenError(
      `Qwen API returned empty content for agent ${options.agentId ?? 'unknown'}`,
      undefined,
      options.agentId,
    );
  }

  return content;
}

/**
 * Build a system + user message pair.
 * Convenience wrapper for single-turn calls.
 */
export function buildMessages(systemPrompt: string, userMessage: string): QwenMessage[] {
  return [
    { role: 'system', content: systemPrompt },
    { role: 'user',   content: userMessage },
  ];
}
