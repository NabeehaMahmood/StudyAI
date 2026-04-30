// backend/src/services/promptService.js
// Constructs strict RAG prompts that prevent hallucination

/**
 * Build the system prompt for RAG-based Q&A.
 *
 * Design principles:
 * - FORCES the model to answer ONLY from provided context
 * - REQUIRES explicit "not found" response when info is missing
 * - MANDATES citation of chunk IDs for traceability
 * - Uses low temperature (set at inference time) for factual consistency
 * - Separates context clearly from instructions to avoid prompt injection
 */
function buildSystemPrompt() {
  return `You are a precise academic study assistant. Your ONLY purpose is to answer questions using EXCLUSIVELY the context provided below.

STRICT RULES — VIOLATION OF ANY RULE IS FORBIDDEN:

1. ONLY use information explicitly stated in the CONTEXT sections below.
2. NEVER use your training data, prior knowledge, or make assumptions beyond the context.
3. If the answer is NOT found in the context, respond EXACTLY with:
   "⚠️ This information was not found in the uploaded document. Please check if the relevant section was uploaded or rephrase your question."
4. For EVERY claim in your answer, cite the source using [Chunk X] where X is the chunk index number.
5. If the context partially answers the question, state clearly what was found and what was NOT found.
6. Keep answers concise, factual, and well-structured.
7. Use bullet points or numbered lists for multi-part answers.
8. Do NOT add opinions, interpretations, or speculations.
9. If asked to do something outside Q&A (like writing code, stories, etc.), respond:
   "I can only answer questions about the uploaded documents."

RESPONSE FORMAT:
- Start with a direct answer
- Support with evidence from context (cite chunks)
- End with a brief summary if the answer is long`;
}

/**
 * Build the user message with context chunks and question.
 *
 * @param {Array<{ id: string, text: string, metadata: object, score: number }>} chunks
 * @param {string} query
 * @returns {string}
 */
function buildUserPromptWithContext(chunks, query) {
  const contextSections = chunks
    .map((chunk, idx) => {
      const chunkIndex = chunk.metadata?.chunkIndex ?? idx;
      return `--- CONTEXT CHUNK ${chunkIndex} (Relevance: ${(chunk.score * 100).toFixed(1)}%) ---
${chunk.text}
--- END CHUNK ${chunkIndex} ---`;
    })
    .join('\n\n');

  return `CONTEXT (from uploaded document):
${contextSections}

QUESTION: ${query}

Remember: Answer ONLY from the context above. Cite chunk numbers. Say "not found" if the information is missing.`;
}

/**
 * Assemble full messages array for the OpenAI-compatible chat API.
 *
 * @param {Array} chunks - Retrieved context chunks
 * @param {string} query - User question
 * @param {Array} chatHistory - Previous messages for multi-turn (optional)
 * @returns {Array<{ role: string, content: string }>}
 */
function buildMessages(chunks, query, chatHistory = []) {
  const messages = [{ role: 'system', content: buildSystemPrompt() }];

  // Include recent chat history (last 4 exchanges) for conversational context
  const recentHistory = chatHistory.slice(-8); // 4 pairs of user/assistant
  for (const msg of recentHistory) {
    messages.push({ role: msg.role, content: msg.content });
  }

  messages.push({ role: 'user', content: buildUserPromptWithContext(chunks, query) });

  return messages;
}

module.exports = { buildSystemPrompt, buildUserPromptWithContext, buildMessages };
