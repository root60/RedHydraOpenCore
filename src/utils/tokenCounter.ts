/**
 * Real-time Token Counter Utilities for RedHydra OpenCore
 * Provides precise client-side estimation based on standard BPE (Byte Pair Encoding) approximations
 * and multimodal asset schemas.
 */

export interface TokenBreakdown {
  promptTokens: number;
  attachmentTokens: number;
  contextTokens: number;
  totalRequestEstimate: number;
  maxLimit: number;
  usedPercentage: number;
}

export interface MessageTokenData {
  name: string;
  text: number;
  attachment: number;
  total: number;
  role: 'user' | 'assistant' | 'system';
}

/**
 * Compiles the last 10 messages for chart breakdowns
 */
export function getLast10MessagesTokenData(
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string; attachment?: { name: string; type: string; size: number; content: string } }>
): MessageTokenData[] {
  if (!messages || messages.length === 0) return [];
  const last10 = messages.slice(-10);
  return last10.map((msg, index) => {
    const textTokens = estimateTextTokens(msg.content);
    const attachmentTokens = estimateAttachmentTokens(msg.attachment);
    const order = messages.length - last10.length + index + 1;
    const roleLabel = msg.role === 'user' ? 'User' : msg.role === 'assistant' ? 'AI' : 'Sys';
    return {
      name: `#${order} ${roleLabel}`,
      text: textTokens,
      attachment: attachmentTokens,
      total: textTokens + attachmentTokens,
      role: msg.role
    };
  });
}

/**
 * Estimates the token count of a given string.
 * Uses a hybrid approach accounting for English words (~1.3 tokens per word),
 * standard ASCII characters (~4 chars per token), and raw CJK/multibyte/emoji sequences (~1-2 tokens per char).
 */
export function estimateTextTokens(text: string | null | undefined): number {
  if (!text) return 0;
  
  // Quick baseline
  const length = text.length;
  if (length === 0) return 0;
  
  // Count non-ASCII characters (CJK, emojis, special math symbols)
  const asciiOnly = text.replace(/[^\x00-\x7F]/g, '');
  const nonAsciiCount = length - asciiOnly.length;
  
  // Standard English words estimation
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  
  // Character level fallback for long unbroken strings (scripts, logs, URLs)
  const charBasedEstimate = Math.ceil(asciiOnly.length / 3.8);
  const wordBasedEstimate = Math.ceil(wordCount * 1.3);
  
  // We take a smart maximum or weighted average to stay safe and close to actual tiktoken / gemini counts
  const baseAsciiEstimate = Math.max(charBasedEstimate, wordBasedEstimate);
  
  return baseAsciiEstimate + (nonAsciiCount * 1.5);
}

/**
 * Estimates token cost of an attached file.
 * Handles text files (code, json, txt) by reading content,
 * or images/multimodal files using standard LLM vision token bounds.
 */
export function estimateAttachmentTokens(file: { name: string; type: string; size: number; content: string } | null | undefined): number {
  if (!file) return 0;
  
  // If it's an image, Gemini/OpenAI vision models typically use a fixed layout cost or scale
  if (file.type.startsWith('image/')) {
    // Standard vision model base token cost (e.g. Gemini uses ~258 tokens per low-res grid)
    return 258;
  }
  
  // If it's a PDF, DOCX or large spreadsheet, the content might be plain text or structured
  if (file.content) {
    const isTextLike = file.type.includes('text') || 
                       file.type.includes('json') || 
                       file.type.includes('javascript') || 
                       file.type.includes('typescript') || 
                       file.type.includes('python') || 
                       file.name.endsWith('.md') || 
                       file.name.endsWith('.txt') || 
                       file.name.endsWith('.py') || 
                       file.name.endsWith('.js') || 
                       file.name.endsWith('.ts') || 
                       file.name.endsWith('.tsx') || 
                       file.name.endsWith('.json') || 
                       file.name.endsWith('.yaml') || 
                       file.name.endsWith('.yml') || 
                       file.name.endsWith('.csv');
                       
    if (isTextLike) {
      return estimateTextTokens(file.content);
    }
    
    // Fallback based on base64 content size or raw string length
    return Math.ceil(file.content.length / 4);
  }
  
  // Safe sizing fallback (approx 1 token per 4 bytes)
  return Math.ceil(file.size / 4);
}

/**
 * Calculates current state token information.
 * @param userInput Current input string typed by user
 * @param attachment Selected file object (if any)
 * @param history Recent message history to calculate accumulated context
 * @param provider Active AI service provider to weigh limits
 */
export function getRealtimeUsage(
  userInput: string,
  attachment: { name: string; type: string; size: number; content: string } | null | undefined,
  history: Array<{ role: 'user' | 'assistant' | 'system'; content: string; attachment?: { name: string; type: string; size: number; content: string } }> = [],
  provider: string = 'built-in-opencore'
): TokenBreakdown {
  const promptTokens = estimateTextTokens(userInput);
  const attachmentTokens = estimateAttachmentTokens(attachment);
  
  // Context tokens (past conversation logs)
  let contextTokens = 0;
  history.forEach(msg => {
    // Skip formatting system helpers if necessary, but count main messages
    if (msg.role !== 'system') {
      contextTokens += estimateTextTokens(msg.content);
      if (msg.attachment) {
        contextTokens += estimateAttachmentTokens(msg.attachment);
      }
    }
  });
  
  const totalRequestEstimate = promptTokens + attachmentTokens + contextTokens;
  
  // Limit configurations based on known thresholds or default free-tier bounds (250K)
  let maxLimit = 250000; // Default Google AI Studio 250K Free Tier Input limit
  if (provider === 'openai') {
    maxLimit = 128000; // GPT-4o context window
  } else if (provider === 'openrouter') {
    maxLimit = 200000; // Standard Anthropic 200k limit
  } else if (provider === 'built-in-opencore') {
    maxLimit = 250000; // Gemini-3.5-flash standard active sandbox quota
  }
  
  const usedPercentage = Math.min(100, Math.max(0, (totalRequestEstimate / maxLimit) * 100));
  
  return {
    promptTokens,
    attachmentTokens,
    contextTokens,
    totalRequestEstimate,
    maxLimit,
    usedPercentage
  };
}

