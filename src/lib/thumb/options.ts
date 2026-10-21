// Shared by the Thumbnail Lab form, the canvas renderer and the API routes.
export const STYLES = [
  "Modern",
  "Bold & Viral",
  "Minimal",
  "Cinematic",
  "Gaming",
  "Tech",
  "Neon",
  "Retro",
  "Luxury",
  "Cartoon",
  "Educational",
  "Vlog",
  "Documentary",
] as const;
export type Style = (typeof STYLES)[number];

export const MOODS = ["Exciting", "Shocking", "Curious", "Inspiring", "Funny", "Serious", "Calm", "Dramatic"] as const;
export type Mood = (typeof MOODS)[number];

export const NICHES = [
  "Auto",
  "Tech & Gadgets",
  "Gaming",
  "Education & Tutorials",
  "Business & Finance",
  "Vlog & Lifestyle",
  "Travel",
  "Food & Cooking",
  "Fitness & Health",
  "Beauty & Fashion",
  "Music",
  "News & Commentary",
  "Science",
  "Kids & Animation",
  "Sports",
  "Motivation",
] as const;
export type Niche = (typeof NICHES)[number];

export const POSITIONS = ["Auto", "Left", "Right", "Center", "Top", "Bottom"] as const;
export type Position = (typeof POSITIONS)[number];
export type Layout = "left" | "right" | "center" | "top" | "bottom";
export const LAYOUTS: Layout[] = ["left", "right", "center", "top", "bottom"];

export const PALETTES = {
  Auto: null,
  Fire: ["#1a0500", "#7a1300", "#ffb703", "#ffffff", "#000000"],
  Ocean: ["#021526", "#03346e", "#22d3ee", "#ffffff", "#001018"],
  Neon: ["#0b0118", "#2a0a4a", "#39ff14", "#ffffff", "#000000"],
  Sunset: ["#2b0a3d", "#c2185b", "#ffd166", "#ffffff", "#1b0026"],
  Mono: ["#0d0d0d", "#2b2b2b", "#ffe14d", "#ffffff", "#000000"],
  Pastel: ["#fde2e4", "#cddafd", "#ff5d8f", "#1d1d3b", "#ffffff"],
  Gold: ["#0c0a07", "#2d2414", "#d4af37", "#f8f1df", "#000000"],
  Forest: ["#0b1d13", "#1f4d2e", "#b5e48c", "#ffffff", "#03100a"],
} as const;
export type PaletteName = keyof typeof PALETTES;

/** bg1, bg2, accent, text, stroke */
export type Palette = { bg1: string; bg2: string; accent: string; text: string; stroke: string };

export const paletteFromArray = (a: readonly string[]): Palette => ({ bg1: a[0], bg2: a[1], accent: a[2], text: a[3], stroke: a[4] });

// Sensible palette per style, used when the AI doesn't give a valid one.
export const STYLE_PALETTE: Record<Style, Palette> = {
  Modern: paletteFromArray(["#0f172a", "#4338ca", "#facc15", "#ffffff", "#000000"]),
  "Bold & Viral": paletteFromArray(["#d00000", "#ffba08", "#ffee32", "#ffffff", "#000000"]),
  Minimal: paletteFromArray(["#f4f1ea", "#e5ded0", "#e63946", "#111111", "#ffffff"]),
  Cinematic: paletteFromArray(["#05070d", "#1b2735", "#f4a261", "#ffffff", "#000000"]),
  Gaming: paletteFromArray(["#07020f", "#3a0ca3", "#00f5d4", "#ffffff", "#000000"]),
  Tech: paletteFromArray(["#020617", "#0c4a6e", "#38bdf8", "#ffffff", "#000000"]),
  Neon: paletteFromArray(["#05000d", "#1a0033", "#ff2bd6", "#ffffff", "#000000"]),
  Retro: paletteFromArray(["#1b0b3a", "#ff3d7f", "#ffd319", "#ffffff", "#240046"]),
  Luxury: paletteFromArray(["#0a0806", "#2a2117", "#d4af37", "#f8f1df", "#000000"]),
  Cartoon: paletteFromArray(["#00b4d8", "#90e0ef", "#ff006e", "#ffffff", "#111111"]),
  Educational: paletteFromArray(["#0b3d91", "#1e88e5", "#ffd60a", "#ffffff", "#001233"]),
  Vlog: paletteFromArray(["#ff7b54", "#ffd56b", "#ffffff", "#ffffff", "#3a1c0b"]),
  Documentary: paletteFromArray(["#0b0b0b", "#2d2a26", "#e9c46a", "#f1f1f1", "#000000"]),
};

// Plain-language art direction for the AI, per style.
export const STYLE_BRIEF: Record<Style, string> = {
  Modern: "clean modern design, smooth gradients, soft depth, crisp lighting, premium creator look",
  "Bold & Viral": "maximum-energy viral YouTube look, saturated colours, high contrast, dramatic lighting, exaggerated scale",
  Minimal: "minimal design, lots of negative space, one strong subject, flat soft colours",
  Cinematic: "cinematic film still, moody teal-and-orange grade, shallow depth of field, volumetric light",
  Gaming: "esports gaming aesthetic, neon rim light, speed lines, dark background with glowing accents",
  Tech: "sleek technology aesthetic, dark blue, glowing UI holograms, product-shot lighting",
  Neon: "neon-noir, glowing neon tubes, dark wet surfaces, magenta and cyan glow",
  Retro: "80s synthwave retro, sunset gradient, chrome, grid horizon",
  Luxury: "luxury editorial, black and gold, soft studio light, rich textures",
  Cartoon: "bright 3D cartoon / Pixar-like illustration, playful, bold shapes",
  Educational: "friendly explainer look, clear diagrams and icons, bright and trustworthy",
  Vlog: "warm lifestyle vlog photo, natural light, candid and friendly",
  Documentary: "documentary photography, gritty, desaturated, realistic, dramatic shadows",
};

// Display fonts; the keys are resolved to real font families in the browser (see ThumbnailLab).
export const FONTS = ["Anton", "Bebas Neue", "Montserrat", "Bangers", "Russo One", "Space Grotesk", "Playfair Display", "Bungee", "Permanent Marker"] as const;
export type FontName = (typeof FONTS)[number];

export const STYLE_FONT: Record<Style, FontName> = {
  Modern: "Montserrat",
  "Bold & Viral": "Anton",
  Minimal: "Space Grotesk",
  Cinematic: "Bebas Neue",
  Gaming: "Russo One",
  Tech: "Space Grotesk",
  Neon: "Bebas Neue",
  Retro: "Bungee",
  Luxury: "Playfair Display",
  Cartoon: "Bangers",
  Educational: "Montserrat",
  Vlog: "Permanent Marker",
  Documentary: "Bebas Neue",
};

/** One thumbnail direction from the AI. */
export type Concept = {
  title: string;
  rationale: string;
  headline: string;
  highlight: string;
  subtext: string;
  badge: string;
  emoji: string;
  layout: Layout;
  palette: Palette;
  imagePrompt: string;
};

export const isHex = (c: unknown): c is string => typeof c === "string" && /^#[0-9a-f]{6}$/i.test(c);
