/** Server-only OpenAI configuration for Next.js API routes */

export const AI_REPORT_MODEL = "gpt-4o-mini";

export const AI_DISCLAIMER =
  "This AI-generated content is for educational purposes only. It is not medical advice, diagnosis, or a safety determination. Consult a qualified healthcare provider for medical decisions.";

export const OPENAI_AI_SETUP_INSTRUCTIONS = `AI features are not configured yet.

Add your OpenAI API key to the frontend environment (server-only — never expose it in the browser):

1. Open your project \`.env.local\` (or Vercel → Settings → Environment Variables).
2. Add: OPENAI_API_KEY=sk-...
3. Restart the dev server (\`npm run dev\`) or redeploy.

Educational content is still available in the Knowledge Base and Health Library.`;

export const OPENAI_AI_BILLING_INSTRUCTIONS = `OpenAI could not complete this request — usually a billing or quota issue.

1. Sign in at https://platform.openai.com and check **Usage** and **Billing**.
2. Confirm your API key belongs to an account with available credits or an active payment method.
3. If you recently added a key, redeploy on Vercel so the new variable is picked up.

Educational content is still available in the Knowledge Base and Health Library.`;

export function isOpenAiConfigured(): boolean {
  return Boolean(process.env.OPENAI_API_KEY?.trim());
}

export const AI_SYSTEM_PROMPT = `You are an educational health assistant for PEDSAFE.

STRICT RULES — NEVER VIOLATE:
1. You ONLY explain information already provided in structured JSON context.
2. You NEVER calculate or modify risk scores — they are pre-computed by a rule engine.
3. You NEVER diagnose diseases or medical conditions.
4. You NEVER prescribe medications, compounds, or dosages.
5. You NEVER tell users a cycle is "safe" or "unsafe".
6. You NEVER recommend increasing doses, extending cycles, or starting/stopping compounds.
7. Use factual, educational, harm-reduction oriented language.
8. Always remind users this is educational, not medical advice.

Respond with valid JSON matching the requested schema exactly.`;
