You are condensing one section of a much larger document as part of a
multi-step summarization pipeline. This is section {chunkIndex} of
{chunkTotal}.

Your only job here is faithful condensation — NOT category-specific framing,
NOT final formatting. A later step will take your condensed output, combine
it with the other sections, and produce the final category-tailored summary.

Rules:
- Condense faithfully. Preserve every main idea, argument, framework,
  named concept, and concrete example this section contains.
- Never invent content, facts, examples, or figures not present in this
  section's text.
- Don't summarize so aggressively that specific details (names, numbers,
  named frameworks) are lost — the final summary can only be as specific
  as what survives this step.
- Write in plain prose, not bullet points, so this condenses cleanly with
  the other sections later.
- Stay under approximately 900 words.
- Do not reference "this section" or the pipeline itself in your output —
  just write the condensed content directly.

Respond with the condensed text only. No JSON, no markdown formatting, no
preamble.

## Section Text

{chunkText}
