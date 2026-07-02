import OpenAI from "openai";
import type { RawExtractedMarker } from "@/lib/bloodwork/match-markers";
import { BLOODWORK_EXTRACTION_MODEL } from "@/lib/ai/extraction-config";

const SYSTEM_PROMPT = `You extract structured lab bloodwork results from medical lab reports.
Return ONLY valid JSON matching this schema:
{
  "markers": [
    {
      "name": "marker name as printed on the report",
      "value": 123.4,
      "unit": "mg/dL",
      "reference_low": 0,
      "reference_high": 100
    }
  ]
}
Rules:
- Include every numeric lab result you can read (CBC, liver, kidney, lipids, hormones, metabolic, etc.).
- Use null for reference_low or reference_high when only one bound is shown (e.g. "<5" → reference_high: 5, reference_low: null).
- value must be a number (parse "<5" as 5 with appropriate reference bounds).
- Do not invent markers not present on the report.
- Ignore patient demographics, billing, and non-lab text.`;

const USER_TEXT_PROMPT =
  "Extract all bloodwork marker results from this lab report text. Return JSON only.";

const USER_IMAGE_PROMPT =
  "Extract all bloodwork marker results from this lab report image. Return JSON only.";

function getClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }
  return new OpenAI({ apiKey });
}

function parseMarkersJson(content: string): RawExtractedMarker[] {
  const parsed = JSON.parse(content) as {
    markers?: Array<{
      name?: string;
      value?: number | string;
      unit?: string;
      reference_low?: number | string | null;
      reference_high?: number | string | null;
    }>;
  };

  if (!Array.isArray(parsed.markers)) {
    throw new Error("AI response did not include a markers array");
  }

  return parsed.markers
    .map((m) => {
      const value =
        typeof m.value === "number"
          ? m.value
          : parseFloat(String(m.value ?? "").replace(/[<>]/g, ""));
      const reference_low =
        m.reference_low == null || m.reference_low === ""
          ? null
          : Number(m.reference_low);
      const reference_high =
        m.reference_high == null || m.reference_high === ""
          ? null
          : Number(m.reference_high);

      return {
        name: String(m.name ?? "").trim(),
        value,
        unit: String(m.unit ?? "").trim(),
        reference_low: Number.isFinite(reference_low) ? reference_low : null,
        reference_high: Number.isFinite(reference_high) ? reference_high : null,
      };
    })
    .filter((m) => m.name && Number.isFinite(m.value));
}

async function callOpenAi(
  userContent: OpenAI.Chat.Completions.ChatCompletionContentPart[]
): Promise<RawExtractedMarker[]> {
  const client = getClient();
  const response = await client.chat.completions.create({
    model: BLOODWORK_EXTRACTION_MODEL,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userContent },
    ],
    response_format: { type: "json_object" },
    temperature: 0.1,
    max_tokens: 4000,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("Empty response from OpenAI");
  }

  const markers = parseMarkersJson(content);
  if (markers.length === 0) {
    throw new Error("No markers could be extracted from this file");
  }

  return markers;
}

export async function extractMarkersFromImage(
  buffer: Buffer,
  mimeType: string
): Promise<RawExtractedMarker[]> {
  const base64 = buffer.toString("base64");
  return callOpenAi([
    { type: "text", text: USER_IMAGE_PROMPT },
    {
      type: "image_url",
      image_url: { url: `data:${mimeType};base64,${base64}`, detail: "high" },
    },
  ]);
}

export async function extractMarkersFromPdfText(text: string): Promise<RawExtractedMarker[]> {
  const trimmed = text.replace(/\s+/g, " ").trim();
  if (trimmed.length < 40) {
    throw new Error(
      "Could not read enough text from this PDF. Try uploading a JPG or PNG photo of the report instead."
    );
  }

  return callOpenAi([
    {
      type: "text",
      text: `${USER_TEXT_PROMPT}\n\n--- LAB REPORT TEXT ---\n${trimmed.slice(0, 120000)}`,
    },
  ]);
}

export async function extractMarkersFromFile(
  buffer: Buffer,
  mimeType: string,
  fileName: string
): Promise<RawExtractedMarker[]> {
  if (mimeType.startsWith("image/")) {
    return extractMarkersFromImage(buffer, mimeType);
  }

  if (mimeType === "application/pdf" || fileName.toLowerCase().endsWith(".pdf")) {
    const pdfParse = (await import("pdf-parse")).default;
    const parsed = await pdfParse(buffer);
    return extractMarkersFromPdfText(parsed.text ?? "");
  }

  throw new Error(`Unsupported file type: ${mimeType || "unknown"}`);
}
