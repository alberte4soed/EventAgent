import { Type, type FunctionDeclaration } from "@google/genai";

export const functionDeclarations: FunctionDeclaration[] = [
  {
    name: "update_event_details",
    description:
      "Save wedding details the user has revealed. Call whenever new facts appear. Only pass fields you learned; omit unknown ones.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING, description: "Short wedding title, e.g. \"Emma & James's Wedding\"" },
        event_type: { type: Type.STRING, description: "e.g. full wedding, ceremony only, elopement, reception" },
        location: { type: Type.STRING, description: "City or area, e.g. Copenhagen" },
        guest_count: { type: Type.INTEGER },
        event_date: { type: Type.STRING, description: "ISO date YYYY-MM-DD if known" },
        budget: { type: Type.STRING, description: "Free-form budget, e.g. 'around 50k DKK'" },
        requirements: {
          type: Type.OBJECT,
          description: "Any other requirements as key/value, e.g. {\"catering\": \"vegetarian options\"}",
          properties: {},
        },
      },
    },
  },
  {
    name: "search_venues",
    description:
      "Research real wedding venues or local vendors on the internet, verified against Google Places (ratings, reviews, photos, contact info). Creates swipeable cards for the user. Venues require location and guest count. Non-venue categories (florist, photographer, musician, caterer) should only be searched once the venue or at least the location is settled — vendors are local to it.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        query: {
          type: Type.STRING,
          description: "Search intent including any special requirements, e.g. 'garden wedding venue with outdoor ceremony space'",
        },
        location: { type: Type.STRING },
        guest_count: { type: Type.INTEGER },
        category: {
          type: Type.STRING,
          enum: ["venue", "florist", "photographer", "musician", "caterer", "planner", "other"],
          description: "What to search for. Defaults to venue.",
        },
      },
      required: ["query", "location"],
    },
  },
  {
    name: "mark_venue_chosen",
    description:
      "Record that the couple has decided on their wedding venue. Call when the user clearly commits to one venue ('we're going with X'). Unlocks the vendors and invites stages. Pass the venue id from the board; if they booked a venue outside Kalas, omit venue_id and set booked_externally instead.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        venue_id: { type: Type.STRING, description: "Id of the chosen venue on the board" },
        booked_externally: {
          type: Type.BOOLEAN,
          description: "True when the venue was booked outside Kalas",
        },
      },
    },
  },
  {
    name: "find_venue_email",
    description:
      "Find the booking/contact email address for one liked venue that is missing an email. Pass the venue id from the search results.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        venue_id: { type: Type.STRING },
        venue_name: { type: Type.STRING },
        website: { type: Type.STRING },
      },
      required: ["venue_id", "venue_name"],
    },
  },
  {
    name: "draft_invite_text",
    description:
      "Draft the couple's wedding invitation wording. Only call once venue and date are known (or the user insists). Write warm, correctly formatted invitation text using the couple's names, date and venue. The user reviews the wording card and orders prints from the invites page.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        wording: {
          type: Type.STRING,
          description: "Complete invitation text, line-broken as it should appear on the card",
        },
        style: {
          type: Type.STRING,
          description: "Short style label, e.g. 'classic formal', 'playful garden'",
        },
      },
      required: ["wording"],
    },
  },
  {
    name: "propose_email_draft",
    description:
      "Propose the master quote-request email that will be personalized and sent to every liked venue. The body MUST contain the {{venue_name}} placeholder. The user reviews it in the UI before anything is sent.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        subject: { type: Type.STRING },
        body_template: {
          type: Type.STRING,
          description: "Plain-text email body containing {{venue_name}}",
        },
      },
      required: ["subject", "body_template"],
    },
  },
];
