import type { Metadata } from "next";
import { profile, skills } from "@/data/profile";
import { STYLES as LOGO_STYLES, TYPES as LOGO_TYPES } from "@/lib/logo/options";
import { STYLES as THUMB_STYLES } from "@/lib/thumb/options";

export const SITE = profile.site;
export const abs = (path: string) => new URL(path, SITE).toString();

// Next merges metadata shallowly, so a page that sets openGraph/twitter must restate every field.
export function pageMeta({ title, description, path, image }: { title: string; description: string; path: string; image?: string }): Metadata {
  const images = [image ? { url: image } : { url: "/og.jpg", width: 1200, height: 630 }];
  const full = path === "/" ? title : `${title} — ${profile.name}`;
  return {
    title: path === "/" ? { absolute: title } : title,
    description,
    alternates: { canonical: path },
    openGraph: { title: full, description, url: path, siteName: profile.name, images, type: "website", locale: "en_US" },
    twitter: { card: "summary_large_image", title: full, description, images: images.map((i) => i.url) },
  };
}

export type Lab = {
  slug: "qa-lab" | "logo-lab" | "thumbnail-lab";
  name: string;
  title: string; // <title> — keyword-led, the brand template adds " — Salman Sadiq"
  description: string;
  category: string;
  free: boolean;
  features: string[];
  steps: { name: string; text: string }[];
  faq: { q: string; a: string }[];
};

export const labs: Lab[] = [
  {
    slug: "qa-lab",
    name: "QA Lab",
    title: "QA Lab — AI Website Tester with PDF Bug Reports",
    description:
      "AI-driven website QA: give a URL and a test login, watch an AI tester drive a real browser on mobile and desktop, and get a PDF bug report with screenshots, speed, accessibility and SEO checks.",
    category: "DeveloperApplication",
    free: false,
    features: [
      "Real headless Chromium on a phone viewport and a desktop viewport, side by side",
      "AI agent follows the flow you describe — sign-up, checkout, dashboard",
      "Performance, accessibility (axe-core), broken-link, layout and SEO checks",
      "PDF report with a quality score and every bug with a screenshot",
    ],
    steps: [
      { name: "Enter the site", text: "Paste the URL, an optional test login and the flow you want checked." },
      { name: "Watch it test", text: "An AI tester drives a real browser on mobile and desktop at the same time, live." },
      { name: "Get the report", text: "Download a PDF with a quality score and every bug with screenshots, speed, accessibility and SEO findings." },
    ],
    faq: [
      {
        q: "What does QA Lab test?",
        a: "Functional flows you describe (sign-up, login, checkout, dashboards), plus responsive layout on a 390px phone and a desktop viewport, page speed, accessibility with axe-core, broken links and basic SEO.",
      },
      {
        q: "Is QA Lab free to use?",
        a: "QA Lab runs a real browser and an AI model for every test, so access is by passcode. Contact Salman Sadiq at salman.sadiq123@gmail.com to get one.",
      },
      {
        q: "What do I get at the end of a run?",
        a: "A downloadable PDF bug report with an overall quality score, each issue with a screenshot and steps to reproduce, and the performance, accessibility and SEO results.",
      },
      {
        q: "Is it safe to give it a test account?",
        a: "Use a dedicated test account, never a real customer or admin login. Credentials are used only for the run and are not stored.",
      },
      {
        q: "Who built QA Lab?",
        a: "Salman Sadiq, a Graphic Designer and QA Engineer at Kakushin in Rawalpindi, Pakistan, who QA-tests web and mobile products before release.",
      },
    ],
  },
  {
    slug: "logo-lab",
    name: "Logo Lab",
    title: "Logo Lab — Free AI Logo Generator (SVG & PNG)",
    description:
      "Free AI logo generator: describe your brand, pick a style and get four vector logo directions designed with Google Gemini — download each as SVG or PNG.",
    category: "DesignApplication",
    free: true,
    features: [
      "Four logo directions per brief, as clean vector SVG",
      `Styles: ${LOGO_STYLES.join(", ")}`,
      `Logo types: ${LOGO_TYPES.join(", ")}`,
      "Download as SVG or PNG — no sign-up",
    ],
    steps: [
      { name: "Describe the brand", text: "Enter the brand name, what it does and any colours or ideas you have in mind." },
      { name: "Pick a style", text: `Choose a style (${LOGO_STYLES.slice(0, 4).join(", ")} and more) and a logo type.` },
      { name: "Download", text: "Gemini drafts four vector logo directions; download the ones you like as SVG or PNG." },
    ],
    faq: [
      { q: "Is Logo Lab free?", a: "Yes. Logo Lab is free with no sign-up; there is only a short cool-down if you generate a very large number of logos in a few minutes." },
      { q: "What file formats can I download?", a: "Every logo is a real vector SVG, so it scales to any size. You can also download a PNG." },
      {
        q: "What logo styles are available?",
        a: `${LOGO_STYLES.join(", ")} — as an icon with name, a wordmark, a lettermark or an emblem.`,
      },
      {
        q: "Can I use the logos commercially?",
        a: "They are AI-drafted starting points. Check that a logo is distinctive and not similar to an existing trademark before you use it; for a finished identity, Salman Sadiq offers professional logo and brand design.",
      },
      { q: "Which AI model makes the logos?", a: "Google Gemini writes the vector artwork; the site turns it into clean, downloadable SVG files." },
    ],
  },
  {
    slug: "thumbnail-lab",
    name: "Thumbnail Lab",
    title: "Thumbnail Lab — Free AI YouTube Thumbnail Maker in 4K",
    description:
      "Free AI YouTube thumbnail maker: describe your video, pick a style and get three 4K (3840×2160) thumbnail designs by Google Gemini — edit the text and colours, then download PNG or a YouTube-ready JPG.",
    category: "DesignApplication",
    free: true,
    features: [
      "Three thumbnail concepts per video, each with its own hook, palette and layout",
      "Rendered at native 4K (3840×2160), 16:9",
      `Styles: ${THUMB_STYLES.join(", ")}`,
      "Edit headline, colours and layout in the browser; download PNG or YouTube-ready JPG under 2 MB",
    ],
    steps: [
      { name: "Describe the video", text: "Enter the video title or topic — every field is optional, including niche, mood and style." },
      { name: "Pick a concept", text: "Gemini writes the hook and art-directs three thumbnail concepts." },
      { name: "Fine-tune and download", text: "Adjust text and colours, then download a crisp 3840×2160 PNG or YouTube-ready JPG." },
    ],
    faq: [
      { q: "Is Thumbnail Lab free?", a: "Yes, it's free with no sign-up or watermark." },
      {
        q: "What size are the thumbnails?",
        a: "3840×2160 pixels (4K, 16:9). YouTube recommends at least 1280×720, so the 4K file stays sharp on every screen; the JPG download is kept under YouTube's 2 MB limit.",
      },
      { q: "What thumbnail styles can I choose?", a: `${THUMB_STYLES.join(", ")}.` },
      {
        q: "How does the AI design a thumbnail?",
        a: "Google Gemini writes a short hook headline, picks a colour palette and layout, and directs the background art; your browser then renders the text and graphics at full 4K resolution.",
      },
      { q: "Can I edit the thumbnail after it's generated?", a: "Yes. You can change the headline, colours and layout before downloading." },
    ],
  },
];

export const getLab = (slug: Lab["slug"]) => labs.find((l) => l.slug === slug)!;

const PERSON_ID = `${SITE}/#person`;
const WEBSITE_ID = `${SITE}/#website`;

export const siteJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Person",
      "@id": PERSON_ID,
      name: profile.name,
      jobTitle: profile.role,
      url: SITE,
      image: abs("/og.jpg"),
      email: `mailto:${profile.email}`,
      worksFor: { "@type": "Organization", name: "Kakushin" },
      address: { "@type": "PostalAddress", addressLocality: "Rawalpindi", addressCountry: "PK" },
      knowsAbout: [...skills.craft, ...skills.qa, ...skills.design],
      sameAs: [profile.linkedin, profile.behance],
    },
    {
      "@type": "WebSite",
      "@id": WEBSITE_ID,
      url: SITE,
      name: profile.name,
      description: "Portfolio of Salman Sadiq, Graphic Designer & QA Engineer, with free AI design and QA tools.",
      publisher: { "@id": PERSON_ID },
      inLanguage: "en",
    },
  ],
};

export const breadcrumbs = (items: { name: string; path: string }[]) => ({
  "@type": "BreadcrumbList",
  itemListElement: [{ name: "Home", path: "/" }, ...items].map((it, i) => ({
    "@type": "ListItem",
    position: i + 1,
    name: it.name,
    item: abs(it.path),
  })),
});

export function labJsonLd(lab: Lab) {
  const url = abs(`/${lab.slug}`);
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebApplication",
        "@id": `${url}#app`,
        name: lab.name,
        url,
        description: lab.description,
        applicationCategory: lab.category,
        operatingSystem: "Any (web browser)",
        browserRequirements: "Requires JavaScript",
        featureList: lab.features,
        isAccessibleForFree: lab.free,
        ...(lab.free ? { offers: { "@type": "Offer", price: "0", priceCurrency: "USD" } } : {}),
        creator: { "@id": PERSON_ID },
        isPartOf: { "@id": WEBSITE_ID },
      },
      {
        "@type": "HowTo",
        name: `How to use ${lab.name}`,
        step: lab.steps.map((s, i) => ({ "@type": "HowToStep", position: i + 1, name: s.name, text: s.text })),
      },
      {
        "@type": "FAQPage",
        mainEntity: lab.faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
      },
      breadcrumbs([{ name: lab.name, path: `/${lab.slug}` }]),
    ],
  };
}

// JSON.stringify output is safe inside <script> once "<" is escaped.
export const jsonLd = (data: object) => ({ __html: JSON.stringify(data).replace(/</g, "\\u003c") });
