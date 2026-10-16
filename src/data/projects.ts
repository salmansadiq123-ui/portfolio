import images from "./images.json";

export type Shot = { src: string; w: number; h: number };

export type Category = "Social Campaign" | "Brand Identity" | "Editorial & Print" | "Illustration";

export type Project = {
  slug: keyof typeof images;
  name: string;
  tagline: string;
  description: string;
  categories: Category[];
  type: "Kakushin product" | "Kakushin client" | "Freelance & earlier";
  url?: string;
  year: string;
  accent: string;
  deliverables: string[];
  shots: Shot[];
};

type ProjectInput = Omit<Project, "shots">;

const list: ProjectInput[] = [
  {
    slug: "dementiabuddy",
    name: "Dementia Buddy",
    tagline: "Empathy-first campaigns for early cognitive change",
    description:
      "A sensitive health brand that needed to speak to families and caregivers without fear. I built a purple-led system of soft dispersion portraits, question-mark motifs and calm typographic posters that turn the quiet early signs of dementia into conversations — including a World Alzheimer's Day series.",
    categories: ["Social Campaign", "Illustration"],
    type: "Kakushin client",
    url: "https://dementiabuddy.app",
    year: "2026",
    accent: "#8b3fd1",
    deliverables: ["Campaign system", "Awareness posters", "Infographics", "App visuals"],
  },
  {
    slug: "mysizer",
    name: "MySizer",
    tagline: "Fashion-tech that fits — a bold geometric look",
    description:
      "MySizer removes the guesswork from online sizing. The campaign mixes editorial fashion photography with geometric cut-outs, oversized type and a punchy teal / orange / violet palette so every post reads like a magazine spread.",
    categories: ["Social Campaign", "Brand Identity"],
    type: "Kakushin product",
    url: "https://mysizer.app",
    year: "2026",
    accent: "#ff6a3d",
    deliverables: ["Campaign art direction", "Social sets", "Seasonal posts"],
  },
  {
    slug: "mt4life",
    name: "MT4Life",
    tagline: "A 100+ page personal-growth handbook",
    description:
      "Full editorial design for the MT4Life programme: module covers, worksheets, habit trackers and scoring sheets, wrapped in an explosive colour-dot visual language, plus a series of character illustrations and motivational social posts.",
    categories: ["Editorial & Print", "Illustration"],
    type: "Kakushin client",
    url: "http://mt4life.com",
    year: "2026",
    accent: "#e2453c",
    deliverables: ["Book layout", "Worksheets", "Character art", "Social posts"],
  },
  {
    slug: "founders12",
    name: "Founders12",
    tagline: "A 12-week startup programme, designed week by week",
    description:
      "Weekly founder workbooks, printable handbooks, cohort winner announcements, carousels and an ongoing comic-strip series following a founder (and his cat) through startup life. A modular system that ships every single week.",
    categories: ["Editorial & Print", "Social Campaign", "Illustration"],
    type: "Kakushin product",
    url: "https://founders12.com",
    year: "2025 — 26",
    accent: "#3d7a2f",
    deliverables: ["Workbooks", "Comic strips", "Carousels", "Announcements"],
  },
  {
    slug: "founders6",
    name: "Founders6",
    tagline: "Idea to MVP in six weeks",
    description:
      "Launch and recruitment campaigns for a six-week founder sprint: application drives, info-session invites, roadmap infographics and conceptual 3D-style visuals — snails on skateboards included.",
    categories: ["Social Campaign"],
    type: "Kakushin product",
    url: "https://founders6.com",
    year: "2026",
    accent: "#1f6fe5",
    deliverables: ["Launch campaign", "Infographics", "Event posts"],
  },
  {
    slug: "kakushin",
    name: "Kakushin",
    tagline: "The studio's own voice on AI and startups",
    description:
      "Kakushin's social channel: a fact series, an observation series, AI-optimization tips, weekly news, team spotlights and hand-drawn comic strips. A magenta-and-violet system that keeps a high posting cadence looking premium.",
    categories: ["Social Campaign", "Brand Identity"],
    type: "Kakushin product",
    url: "https://kakushin.io",
    year: "2025 — 26",
    accent: "#e5197d",
    deliverables: ["Content series", "Templates", "Comic strips", "Team posts"],
  },
  {
    slug: "l3arn",
    name: "L3arn",
    tagline: "Learning, one clear step at a time",
    description:
      "Conceptual photo-manipulation posts for an e-learning platform — pencils as skyscrapers, pens as portals — built around learning statistics, plus an AI-tools icon set and seasonal campaigns.",
    categories: ["Social Campaign", "Illustration"],
    type: "Kakushin product",
    url: "https://l3arn.org",
    year: "2025 — 26",
    accent: "#13a3b4",
    deliverables: ["Concept visuals", "Icon set", "Seasonal posts"],
  },
  {
    slug: "aihumanizer",
    name: "AI Humanizer",
    tagline: "Sound human, not robotic",
    description:
      "Logo and launch content for an AI-text humanizer. The visual story contrasts cold, digital textures with warm, organic ones — split brains, robot-and-human hands, pixel-to-paint transitions.",
    categories: ["Social Campaign", "Brand Identity"],
    type: "Kakushin product",
    url: "https://www.aihumanizer.live",
    year: "2026",
    accent: "#1c6fb0",
    deliverables: ["Logo", "Launch campaign"],
  },
  {
    slug: "ecoclean",
    name: "EcoClean Cyprus",
    tagline: "Chemical-free cleaning, told like a story",
    description:
      "Logo plus campaigns for a bio-safe cleaning company in Cyprus: a friendly mascot, Father's Day posters, and a World Environment Day series mixing editorial watercolour with darkly funny illustrated posters.",
    categories: ["Brand Identity", "Illustration", "Social Campaign"],
    type: "Kakushin client",
    url: "https://ecoclean.com.cy",
    year: "2026",
    accent: "#5a9e3a",
    deliverables: ["Logo", "Mascot", "Poster series"],
  },
  {
    slug: "movesense",
    name: "Move Sense AI",
    tagline: "Spotting childhood movement concerns earlier",
    description:
      "Logo and explainer campaign for a paediatric movement-analysis app — warm home photography, motion-tracking overlays and clear three-step infographics.",
    categories: ["Brand Identity", "Social Campaign"],
    type: "Kakushin client",
    year: "2026",
    accent: "#6a3df0",
    deliverables: ["Logo", "Explainers", "Infographics"],
  },
  {
    slug: "medresearch",
    name: "MedResearch AI",
    tagline: "AI-assisted research hypotheses",
    description:
      "A clinical-blue launch series for an AI medical research tool, combining a custom cross-and-coat mark with holographic, data-driven healthcare imagery.",
    categories: ["Social Campaign"],
    type: "Kakushin product",
    year: "2026",
    accent: "#1f5fbf",
    deliverables: ["Launch posts", "Brand mark"],
  },
  {
    slug: "readmycup",
    name: "ReadMyCup",
    tagline: "A seven-day comic series",
    description:
      "An illustrated comic series for a coffee-reading app: a Greek grandmother reads the cups of an influencer, a crypto bro, a founder and more — one character per day.",
    categories: ["Illustration", "Social Campaign"],
    type: "Kakushin product",
    url: "https://www.readmycup.com",
    year: "2026",
    accent: "#a8692e",
    deliverables: ["Comic series", "Characters"],
  },
  {
    slug: "riddl3",
    name: "Riddl3",
    tagline: "A playful riddle identity",
    description: "Logo and a riddle-a-day post system with multiple layout variations for an engagement brand.",
    categories: ["Brand Identity", "Social Campaign"],
    type: "Kakushin product",
    year: "2026",
    accent: "#2f6aa3",
    deliverables: ["Logo", "Post templates"],
  },
  {
    slug: "dinabite",
    name: "Dinabite",
    tagline: "Social media, simplified",
    description: "Humorous, relatable posts for an AI social-media assistant aimed at small business owners.",
    categories: ["Social Campaign"],
    type: "Kakushin client",
    url: "https://app.dinabite.ai",
    year: "2026",
    accent: "#e5274a",
    deliverables: ["Social posts"],
  },
  {
    slug: "eightmin",
    name: "8 Minutes",
    tagline: "Wellbeing in eight minutes",
    description: "A heart-in-infinity logo and calm, breathing-paced gradient posts for a wellbeing app.",
    categories: ["Brand Identity", "Social Campaign"],
    type: "Kakushin product",
    url: "https://8min.me",
    year: "2026",
    accent: "#4fb7a4",
    deliverables: ["Logo", "Social posts"],
  },
  {
    slug: "ainte",
    name: "AINTE",
    tagline: "A prospectus for AI healthcare triage",
    description: "Logo and a full multi-page prospectus covering features, audience, brand guidelines and content strategy.",
    categories: ["Editorial & Print", "Brand Identity"],
    type: "Kakushin client",
    url: "https://ainte.org",
    year: "2026",
    accent: "#4a5cf0",
    deliverables: ["Logo", "Prospectus"],
  },
  {
    slug: "identity",
    name: "Logo Lab",
    tagline: "Marks for FoundersX, SocialB, InvestLoop & more",
    description:
      "A selection of logo explorations and final marks made at Kakushin — FoundersX, SocialB, EcoClean, InvestLoop, HealthGenAI and others.",
    categories: ["Brand Identity"],
    type: "Kakushin product",
    year: "2025 — 26",
    accent: "#f2b705",
    deliverables: ["Logos", "Explorations", "Icon marks"],
  },
  {
    slug: "earlier",
    name: "Earlier Work",
    tagline: "Gold Pine, Golden Home, InterHome & more",
    description:
      "Identities, web layouts and ads from before Kakushin — Gold Pine Murree, Golden Home, InterHome Enterprises, Wings Visa Consultants, GreenShade, Hafsum Coffee and product concepts.",
    categories: ["Brand Identity", "Social Campaign"],
    type: "Freelance & earlier",
    year: "2019 — 25",
    accent: "#c9a24a",
    deliverables: ["Logos", "Web layouts", "Ads"],
  },
];

export const projects: Project[] = list.map((p) => ({ ...p, shots: images[p.slug] }));
export const categories: Category[] = ["Social Campaign", "Brand Identity", "Editorial & Print", "Illustration"];
export const totalShots = projects.reduce((n, p) => n + p.shots.length, 0);
export const getProject = (slug: string) => projects.find((p) => p.slug === slug);
