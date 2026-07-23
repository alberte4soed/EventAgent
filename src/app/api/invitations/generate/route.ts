import { NextRequest } from "next/server";
import { Type, type Schema } from "@google/genai";
import { createClient } from "@/lib/supabase/server";
import { getGemini, GEMINI_MODEL } from "@/lib/gemini/client";
import { logAgentError } from "@/lib/gemini/log";
import { getTemplateMeta } from "@/kalas/invitations/templates.meta";
import { coerceInvitationData, defaultDataFor } from "@/kalas/invitations/data";
import type { InvitationData, Language } from "@/kalas/invitations/types";

export const maxDuration = 120;

/** Brief §5 base prompt — used verbatim. */
const SYSTEM_PROMPT = `You are a wedding stationer writing digital invitation copy. You receive raw
facts about a couple and a target TEMPLATE with a fixed VOICE and DATE STYLE.
Rewrite the facts into polished, correct invitation wording that matches the
template's voice exactly. Rules:
- VOICE=formal  → traditional, third-person, elegant ("request the honour of your presence").
- VOICE=modern  → clean, minimal, confident, short lines, no clichés.
- VOICE=romantic→ warm, lyrical, first-person plural, gentle.
- VOICE=playful → light and joyful but still tasteful; never gimmicky.
- DATE STYLE=longformal → spell it out ("Saturday · the twenty-second of May 2027").
- DATE STYLE=numeric → "22.05.2027" (respect the user's locale order).
- DATE STYLE=roman → "The 3rd of October 2027".
- Derive a two-letter monogram from the initials if the template uses one.
- Keep names exactly as given. Never invent venues, dates, or facts not provided.
- Match the requested LANGUAGE (da or en) for labels and RSVP text; keep proper names untouched.
- If NOTES are provided, weave their spirit (setting, feeling, story) into the wording without inventing hard facts.
- If a TONE override is provided, nudge the wording toward it (formal / warm / short / playful) while staying within the template's VOICE.
- Return ONLY a JSON array of 2-3 objects matching the InvitationData schema. No markdown, no prose, no backticks.`;

const variantSchema: Schema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      partnerA: { type: Type.STRING },
      partnerB: { type: Type.STRING },
      monogram: { type: Type.STRING },
      label: { type: Type.STRING },
      introLines: { type: Type.ARRAY, items: { type: Type.STRING } },
      displayDate: { type: Type.STRING },
      isoDate: { type: Type.STRING },
      time: { type: Type.STRING },
      venue: { type: Type.STRING },
      venueDetail: { type: Type.STRING },
      closing: { type: Type.STRING },
      rsvpLabel: { type: Type.STRING },
      language: { type: Type.STRING },
    },
    required: ["partnerA", "partnerB", "label", "introLines", "displayDate", "isoDate", "venue", "language"],
  },
};

/**
 * POST /api/invitations/generate — rewrite the couple's raw facts into 2–3
 * template-voiced InvitationData variants. Gemini only (server-side key). Falls
 * back to a deterministic default so the preview is never empty.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json()) as {
    templateId?: string;
    partnerA?: string;
    partnerB?: string;
    isoDate?: string;
    venue?: string;
    venueDetail?: string;
    notes?: string;
    tone?: string;
    language?: Language;
  };

  const meta = getTemplateMeta(body.templateId ?? "");
  if (!meta) return Response.json({ error: "Unknown template" }, { status: 400 });

  const language: Language = body.language === "en" ? "en" : "da";
  const TONES = ["formal", "warm", "short", "playful"] as const;
  const tone = TONES.includes(body.tone as (typeof TONES)[number]) ? body.tone : undefined;
  const base = defaultDataFor(meta, {
    partnerA: body.partnerA,
    partnerB: body.partnerB,
    isoDate: body.isoDate,
    venue: body.venue,
    venueDetail: body.venueDetail,
    language,
  });

  const userMessage = JSON.stringify({
    facts: {
      partnerA: body.partnerA ?? "",
      partnerB: body.partnerB ?? "",
      isoDate: body.isoDate ?? "",
      venue: body.venue ?? "",
      venueDetail: body.venueDetail ?? "",
      notes: body.notes ?? "",
    },
    template: {
      id: meta.id,
      voice: meta.voice,
      dateStyle: meta.dateStyle,
      language,
      tone: tone ?? null,
      hasCountdown: meta.interactive === "countdown",
      hasMonogram: meta.monogram,
    },
    schema: "InvitationData = { partnerA, partnerB, monogram, label, introLines[], displayDate, isoDate, time?, venue, venueDetail?, closing?, rsvpLabel?, language }",
    instruction: "Return a JSON array of 2-3 InvitationData objects. isoDate must echo the provided isoDate. displayDate must follow the template dateStyle.",
  });

  async function generate(): Promise<InvitationData[] | null> {
    const ai = getGemini();
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: userMessage,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        responseMimeType: "application/json",
        responseSchema: variantSchema,
        temperature: 0.7,
      },
    });
    const raw = JSON.parse((response.text ?? "[]").replace(/```json|```/g, "").trim());
    if (!Array.isArray(raw) || raw.length === 0) return null;
    return raw.slice(0, 3).map((v) => coerceInvitationData({ ...v, isoDate: body.isoDate || base.isoDate }, base));
  }

  let variants: InvitationData[] | null = null;
  try {
    variants = await generate();
  } catch (err) {
    logAgentError("invitations.generate", err);
  }
  if (!variants) {
    try {
      variants = await generate();
    } catch (err) {
      logAgentError("invitations.generate.retry", err);
    }
  }

  // Deterministic fallback — always renders something.
  if (!variants || variants.length === 0) {
    variants = [base];
  }

  return Response.json({ variants });
}
