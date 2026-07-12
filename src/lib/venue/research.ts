import { Type, type Schema } from "@google/genai";

export interface VenuePracticalItem {
  key: string;
  value: string;
}

export interface VenuePackageItem {
  name: string;
  desc: string;
  price: string;
  featured?: boolean;
}

/** Persisted on venues.venue_research after a research run. */
export interface VenueResearchProfile {
  briefing: string[];
  highlights: string[];
  practical: VenuePracticalItem[];
  packages: VenuePackageItem[];
  directions: string | null;
  researched_at: string;
}

export interface ExtractedVenueResearch {
  briefing: string[];
  description?: string | null;
  capacity?: string | null;
  price_hint?: string | null;
  highlights?: string[];
  practical?: VenuePracticalItem[];
  packages?: VenuePackageItem[];
  directions?: string | null;
  website?: string | null;
  email?: string | null;
  phone?: string | null;
  why_fit?: string | null;
}

export const venueResearchSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    briefing: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "3-5 bullet points with the most important facts for a couple",
    },
    description: { type: Type.STRING, nullable: true },
    capacity: { type: Type.STRING, nullable: true },
    price_hint: { type: Type.STRING, nullable: true },
    highlights: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
    practical: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          key: { type: Type.STRING },
          value: { type: Type.STRING },
        },
        required: ["key", "value"],
      },
    },
    packages: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          desc: { type: Type.STRING },
          price: { type: Type.STRING },
          featured: { type: Type.BOOLEAN, nullable: true },
        },
        required: ["name", "desc", "price"],
      },
    },
    directions: { type: Type.STRING, nullable: true },
    website: { type: Type.STRING, nullable: true },
    email: { type: Type.STRING, nullable: true },
    phone: { type: Type.STRING, nullable: true },
    why_fit: { type: Type.STRING, nullable: true },
  },
  required: ["briefing", "highlights", "practical", "packages"],
};

export function buildVenueResearchProfile(
  extracted: ExtractedVenueResearch
): VenueResearchProfile {
  return {
    briefing: extracted.briefing.filter(Boolean).slice(0, 6),
    highlights: (extracted.highlights ?? []).filter(Boolean).slice(0, 12),
    practical: (extracted.practical ?? []).filter((p) => p.key?.trim() && p.value?.trim()),
    packages: (extracted.packages ?? [])
      .filter((p) => p.name?.trim() && p.price?.trim())
      .map((p) => ({
        name: p.name.trim(),
        desc: p.desc?.trim() ?? "",
        price: p.price.trim(),
        featured: p.featured ?? false,
      })),
    directions: extracted.directions?.trim() || null,
    researched_at: new Date().toISOString(),
  };
}
