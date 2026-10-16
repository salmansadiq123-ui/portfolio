export const profile = {
  name: "Salman Sadiq",
  role: "Graphic Designer & QA Engineer",
  location: "Rawalpindi, Pakistan",
  email: "salman.sadiq123@gmail.com",
  phones: ["+92 303 0566286", "+92 330 7477731"],
  // Set this to your Behance profile URL to show the link across the site.
  behance: "",
  site: "https://salmansadiq.com",
};

export const experience = [
  {
    role: "Graphic Designer & QA Engineer",
    company: "Kakushin",
    place: "Bahria Town, Rawalpindi",
    period: "Dec 2025 — Present",
    points: [
      "Design logos, UI icons, publications, posters and social campaigns for 20+ internal products and client brands.",
      "QA-test web and mobile products before release — functional, UI and cross-device checks with clear, reproducible bug reports.",
      "Own brand consistency across digital and print while shipping on tight weekly deadlines.",
    ],
  },
  {
    role: "Graphic Designer",
    company: "Golden Home",
    place: "Islamabad",
    period: "May 2024 — Nov 2025",
    points: [
      "Multi-channel marketing: brochures, posters and social media sets.",
      "Contributed product layout concepts in design sprint sessions.",
    ],
  },
  {
    role: "Graphic Designer",
    company: "Gold Pine Murree",
    place: "Islamabad",
    period: "Dec 2021 — Dec 2023",
    points: [
      "Built visual identities, brand guidelines and promotional collateral.",
      "Produced vector artwork, custom iconography and marketing media.",
    ],
  },
  {
    role: "Graphic Designer",
    company: "InterHome Enterprises",
    place: "Islamabad",
    period: "Dec 2019 — Dec 2021",
    points: ["Led layout design and visual assets for digital and print campaigns."],
  },
  {
    role: "Store Officer",
    company: "Global Laboratories",
    place: "Islamabad",
    period: "Apr 2017 — Dec 2018",
    points: ["Inventory operations, stock analysis and procurement guidance."],
  },
  {
    role: "IT Officer",
    company: "Mr. Cabin Public High School",
    place: "Rawalpindi",
    period: "2014 — 2016",
    points: ["Ran IT infrastructure and network security; designed and built the school website."],
  },
];

export const skills = {
  design: ["Adobe Illustrator", "Adobe Photoshop", "Figma", "Canva", "AI image direction", "Wireframing", "Prototyping"],
  craft: ["Brand identity", "Logo design", "Social campaigns", "Editorial layout", "Iconography", "Comic & character art"],
  qa: ["Functional testing", "UI / visual QA", "Cross-device testing", "Regression checks", "Bug reporting", "Test cases"],
  web: ["HTML / CSS", "Front-end & back-end basics", "Website maintenance", "IT administration", "Network security"],
};

// Products Salman has QA-tested at Kakushin (public URLs only).
export const qaProducts = [
  { name: "Founders12", url: "https://founders12.com", kind: "Web platform + dashboard" },
  { name: "FoundersX", url: "http://foundersx.org", kind: "Web platform" },
  { name: "8 Minutes", url: "https://8min.me", kind: "3D web experience" },
  { name: "MySizer", url: "https://mysizer.app", kind: "Fashion-tech web app" },
  { name: "MT4Life", url: "http://mt4life.com", kind: "Learning platform" },
  { name: "Interactive Whiteboard", url: "http://interactive.kakushin.io", kind: "Real-time web app" },
  { name: "Bookmi", url: "https://bookmihub.com", kind: "Booking app · iOS & web" },
  { name: "Dementia Buddy", url: "https://dementiabuddy.app", kind: "Mobile app · Android & iOS" },
  { name: "ReadMyCup", url: "https://www.readmycup.com", kind: "Mobile app" },
  { name: "Autom8", url: "https://app.autom8tech.ai", kind: "Fleet dashboard" },
];

export const education = [
  "Diploma in Web Development — NIE, Islamabad",
  "Frontend Web Designing Certificate — NIE",
  "Backend Web Development Certificate — NIE",
  "Intermediate, Pre-Engineering — FBISE",
];

// ——— CV (/cv) ———
export const cv = {
  summary:
    "Graphic designer and QA engineer with 6+ years in brand, marketing and digital product design, and a background in web development and IT operations. I design identities, campaigns and UI assets in Illustrator, Photoshop and Figma, then test the products they ship in — functional, visual and cross-device — with clear, reproducible bug reports.",
  // Fuller bullets for the CV, keyed by company; falls back to the site's `points`.
  points: {
    Kakushin: [
      "Design logos, UI icons, publications, posters and social campaigns for 20+ internal products and client brands.",
      "QA-test web and mobile products before release — functional, UI and cross-device checks with reproducible bug reports.",
      "Partner with product and marketing teams to turn requirements into cohesive design solutions.",
      "Own brand consistency across digital and print while shipping on tight weekly deadlines.",
    ],
    "Golden Home": [
      "Produced multi-channel marketing: brochures, posters and social media sets.",
      "Contributed product layout concepts in collaborative design sprint sessions.",
      "Kept every public-facing asset aligned with brand standards across concurrent deliverables.",
    ],
    "Gold Pine Murree": [
      "Built visual identities, brand guidelines and promotional collateral.",
      "Produced vector artwork, custom iconography and marketing media for digital and print.",
      "Shaped creative concepts around sales and customer-acquisition goals.",
    ],
    "InterHome Enterprises": [
      "Led layout design and visual assets for digital marketing and print campaigns.",
      "Supported lead designers in building consistent visual strategies across channels.",
    ],
    "Global Laboratories": [
      "Supervised inventory operations, incoming stock validation and documentation.",
      "Used stock analysis to set reorder thresholds and guide procurement.",
    ],
    "Mr. Cabin Public High School": [
      "Managed IT infrastructure, network security, vendor procurement and troubleshooting.",
      "Designed and built the school website and ran internal SMS communications.",
    ],
  } as Record<string, string[]>,
  skills: [
    { label: "Design tools", items: ["Adobe Illustrator", "Adobe Photoshop", "Figma", "Canva", "AI image direction"] },
    { label: "Design", items: ["Brand identity", "Logo design", "Social campaigns", "Editorial layout", "Iconography", "Wireframing & prototyping"] },
    { label: "Quality assurance", items: ["Functional testing", "UI / visual QA", "Cross-device testing", "Regression checks", "Test cases", "Bug reporting"] },
    { label: "Web & IT", items: ["HTML / CSS", "Front-end & back-end basics", "Website maintenance", "Network security", "IT administration"] },
  ],
  certifications: [
    { name: "Diploma in Web Development", org: "6 months · National Institute of Electronics (NIE), Islamabad" },
    { name: "Certificates — Frontend Web Design, Backend Web Development, Web Development", org: "NIE, Islamabad" },
  ],
  academics: [
    { name: "Intermediate, Pre-Engineering", org: "FBISE, Islamabad" },
    { name: "Matriculation, Science", org: "FBISE, Islamabad" },
  ],
  languages: ["English (professional) · Urdu (native)"],
};
