import { Type, type FunctionDeclaration } from "@google/genai";

export const functionDeclarations: FunctionDeclaration[] = [
  {
    name: "update_event_details",
    description:
      "Save event details the user has revealed. Call whenever new facts appear. Only pass fields you learned; omit unknown ones.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING, description: "Short event title, e.g. \"Anna's 50th birthday\"" },
        event_type: { type: Type.STRING, description: "e.g. birthday party, wedding, conference" },
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
      "Search the internet for real venues matching the event. Requires location and guest count to be known. Creates swipeable venue cards for the user.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        query: {
          type: Type.STRING,
          description: "Search intent including any special requirements, e.g. '50th birthday party venue with dance floor'",
        },
        location: { type: Type.STRING },
        guest_count: { type: Type.INTEGER },
      },
      required: ["query", "location"],
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
