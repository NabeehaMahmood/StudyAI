// backend/src/services/llmService.js
// Calls LM Studio's OpenAI-compatible chat/completions endpoint

const OpenAI = require('openai');
const config = require('../config');
const logger = require('../utils/logger');

const openai = new OpenAI({
  baseURL: config.lmStudio.baseUrl,
  apiKey: 'lm-studio',
});

/**
 * Send a chat completion request to LM Studio.
 *
 * WHY temperature 0.1?
 * - Near-zero temperature makes the model deterministic and factual.
 * - 0.0 can cause degenerate repetition in some models; 0.1 provides
 *   minimal variance while keeping outputs grounded.
 * - Combined with top_p=0.9, this further constrains sampling to the
 *   most probable tokens, reducing hallucination risk.
 *
 * @param {Array<{ role: string, content: string }>} messages
 * @param {object} opts - Override default LLM parameters
 * @returns {Promise<{ content: string, usage: object, inferenceLatencyMs: number }>}
 */
async function chatCompletion(messages, opts = {}) {
  const startTime = Date.now();

  const response = await openai.chat.completions.create({
    model: config.lmStudio.chatModel,
    messages,
    temperature: opts.temperature ?? config.llm.temperature,
    max_tokens: opts.maxTokens ?? config.llm.maxTokens,
    top_p: opts.topP ?? config.llm.topP,
    stream: false,
    // Prevent the model from using tools or function calls
    // Ensure deterministic behavior
  });

  const inferenceLatencyMs = Date.now() - startTime;
  const content = response.choices[0]?.message?.content || '';
  const usage = response.usage || {};

  logger.info(
    `LLM inference: ${inferenceLatencyMs}ms | tokens: prompt=${usage.prompt_tokens || '?'} completion=${usage.completion_tokens || '?'}`
  );

  return { content, usage, inferenceLatencyMs };
}

/**
 * Streaming chat completion for real-time response delivery.
 * Returns an async iterable of content deltas.
 *
 * @param {Array<{ role: string, content: string }>} messages
 * @param {object} opts
 * @returns {AsyncIterable<string>}
 */
async function* chatCompletionStream(messages, opts = {}) {
  const stream = await openai.chat.completions.create({
    model: config.lmStudio.chatModel,
    messages,
    temperature: opts.temperature ?? config.llm.temperature,
    max_tokens: opts.maxTokens ?? config.llm.maxTokens,
    top_p: opts.topP ?? config.llm.topP,
    stream: true,
  });

  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta?.content;
    if (delta) {
      yield delta;
    }
  }
}

module.exports = { chatCompletion, chatCompletionStream };
