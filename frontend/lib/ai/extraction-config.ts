/** Server-only bloodwork extraction configuration (OPENAI_API_KEY). */

export const BLOODWORK_EXTRACTION_MODEL = "gpt-4o-mini";

export const OPENAI_SETUP_INSTRUCTIONS = `Automatic bloodwork extraction is not configured.

Add your OpenAI API key to the frontend environment (server-only — never expose it in the browser):

1. Open your project \`.env.local\` (or Vercel → Settings → Environment Variables).
2. Add: OPENAI_API_KEY=sk-...
3. Restart the dev server (\`npm run dev\`) or redeploy.

You can still enter marker values manually from your uploaded report.`;

export function isOpenAiExtractionConfigured(): boolean {
  return Boolean(process.env.OPENAI_API_KEY?.trim());
}
