"use client";

import { useEffect, useRef, useState } from "react";
import { Anton, Bangers, Bebas_Neue, Bungee, Montserrat, Permanent_Marker, Playfair_Display, Russo_One, Space_Grotesk } from "next/font/google";
import {
  FONTS,
  MOODS,
  NICHES,
  PALETTES,
  paletteFromArray,
  POSITIONS,
  STYLE_FONT,
  STYLES,
  type Concept,
  type FontName,
  type Layout,
  type Mood,
  type Niche,
  type PaletteName,
  type Position,
  type Style,
} from "@/lib/thumb/options";
import { renderThumbnail, type RenderOptions } from "@/lib/thumb/render";

const anton = Anton({ weight: "400", subsets: ["latin"], display: "swap", preload: false });
const bebas = Bebas_Neue({ weight: "400", subsets: ["latin"], display: "swap", preload: false });
const montserrat = Montserrat({ weight: ["700", "900"], subsets: ["latin"], display: "swap", preload: false });
const bangers = Bangers({ weight: "400", subsets: ["latin"], display: "swap", preload: false });
const russo = Russo_One({ weight: "400", subsets: ["latin"], display: "swap", preload: false });
const grotesk = Space_Grotesk({ weight: "700", subsets: ["latin"], display: "swap", preload: false });
const playfair = Playfair_Display({ weight: "900", subsets: ["latin"], display: "swap", preload: false });
const bungee = Bungee({ weight: "400", subsets: ["latin"], display: "swap", preload: false });
const marker = Permanent_Marker({ weight: "400", subsets: ["latin"], display: "swap", preload: false });

const FONT_MAP: Record<FontName, { f: { className: string; style: { fontFamily: string } }; weight: number; tight: boolean }> = {
  Anton: { f: anton, weight: 400, tight: true },
  "Bebas Neue": { f: bebas, weight: 400, tight: true },
  Montserrat: { f: montserrat, weight: 900, tight: false },
  Bangers: { f: bangers, weight: 400, tight: true },
  "Russo One": { f: russo, weight: 400, tight: false },
  "Space Grotesk": { f: grotesk, weight: 700, tight: false },
  "Playfair Display": { f: playfair, weight: 900, tight: false },
  Bungee: { f: bungee, weight: 400, tight: false },
  "Permanent Marker": { f: marker, weight: 400, tight: false },
};
const SUB_FONT = montserrat.style.fontFamily;

type Bg = { img: HTMLImageElement | null; state: "loading" | "ai" | "designed"; photoInScene: boolean; note?: string };
type Photo = { dataUrl: string; img: HTMLImageElement };
type Design = {
  font: FontName;
  textScale: number;
  uppercase: boolean;
  showArrow: boolean;
  showBadge: boolean;
  showEmoji: boolean;
  showSubtext: boolean;
  vignette: boolean;
  useAiArt: boolean;
  flipBg: boolean;
  photoShape: "rounded" | "circle";
  seed: number;
};

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 50) || "thumbnail";
const loadImage = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Image failed to load"));
    img.src = src;
  });

function save(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}
const toBlob = (canvas: HTMLCanvasElement, type: string, q?: number) =>
  new Promise<Blob>((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Export failed"))), type, q));

/** Shrinks an uploaded photo so it can be sent to the AI and drawn quickly. */
async function readPhoto(file: File): Promise<Photo> {
  const src = URL.createObjectURL(file);
  try {
    const img = await loadImage(src);
    const scale = Math.min(1, 1024 / Math.max(img.naturalWidth, img.naturalHeight));
    const c = document.createElement("canvas");
    c.width = Math.round(img.naturalWidth * scale);
    c.height = Math.round(img.naturalHeight * scale);
    c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
    const dataUrl = c.toDataURL("image/jpeg", 0.88);
    return { dataUrl, img: await loadImage(dataUrl) };
  } finally {
    URL.revokeObjectURL(src);
  }
}

const initialDesign = (style: Style): Design => ({
  font: STYLE_FONT[style],
  textScale: 1,
  uppercase: !["Minimal", "Luxury", "Vlog"].includes(style),
  showArrow: style === "Bold & Viral" || style === "Educational",
  showBadge: true,
  showEmoji: style !== "Minimal" && style !== "Luxury" && style !== "Documentary",
  showSubtext: true,
  vignette: style === "Cinematic" || style === "Documentary" || style === "Bold & Viral",
  useAiArt: true,
  flipBg: false,
  photoShape: style === "Bold & Viral" || style === "Cartoon" ? "circle" : "rounded",
  seed: 7,
});

export default function ThumbnailLab() {
  // Brief
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [topics, setTopics] = useState("");
  const [niche, setNiche] = useState<Niche>("Auto");
  const [style, setStyle] = useState<Style>("Modern");
  const [mood, setMood] = useState<Mood>("Exciting");
  const [paletteName, setPaletteName] = useState<PaletteName>("Auto");
  const [colors, setColors] = useState("");
  const [text, setText] = useState("");
  const [position, setPosition] = useState<Position>("Auto");
  const [channel, setChannel] = useState("");
  const [count, setCount] = useState(3);
  const [photo, setPhoto] = useState<Photo | null>(null);
  const [photoToAi, setPhotoToAi] = useState(true);

  // Results
  const [concepts, setConcepts] = useState<Concept[]>([]);
  const [bgs, setBgs] = useState<Bg[]>([]);
  const [madeWith, setMadeWith] = useState<{ style: Style; mood: Mood; title: string }>({ style: "Modern", mood: "Exciting", title: "" });
  const [selected, setSelected] = useState(0);
  const [design, setDesign] = useState<Design>(initialDesign("Modern"));
  const [busy, setBusy] = useState(false);
  const [exporting, setExporting] = useState("");
  const [error, setError] = useState("");
  const [fontsReady, setFontsReady] = useState(0);
  const runId = useRef(0);

  const editorRef = useRef<HTMLCanvasElement>(null);
  const cardRefs = useRef<(HTMLCanvasElement | null)[]>([]);
  const editorWrap = useRef<HTMLDivElement>(null);

  // Canvas only uses a web font once it has loaded, so wait for the chosen ones before drawing.
  useEffect(() => {
    const fm = FONT_MAP[design.font];
    Promise.all([
      document.fonts.load(`${fm.weight} 100px ${fm.f.style.fontFamily}`),
      document.fonts.load(`700 50px ${SUB_FONT}`),
      document.fonts.load(`900 50px ${SUB_FONT}`),
    ])
      .catch(() => null)
      .then(() => setFontsReady((n) => n + 1));
  }, [design.font]);

  const optionsFor = (i: number): RenderOptions | null => {
    const concept = concepts[i];
    if (!concept) return null;
    const bg = bgs[i];
    const fm = FONT_MAP[design.font];
    const aiBg = design.useAiArt && bg?.state === "ai" ? bg.img : null;
    return {
      concept,
      style: madeWith.style,
      font: { family: fm.f.style.fontFamily, weight: fm.weight, tight: fm.tight },
      subFont: SUB_FONT,
      uppercase: design.uppercase,
      textScale: design.textScale,
      bg: aiBg,
      flipBg: design.flipBg,
      photo: photo && !(aiBg && bg?.photoInScene) ? photo.img : null,
      photoShape: design.photoShape,
      showArrow: design.showArrow,
      showBadge: design.showBadge,
      showEmoji: design.showEmoji,
      showSubtext: design.showSubtext,
      vignette: design.vignette,
      channel: channel.trim(),
      seed: design.seed + i * 101,
    };
  };

  // Redraw previews whenever anything that affects them changes.
  useEffect(() => {
    concepts.forEach((_, i) => {
      const c = cardRefs.current[i];
      const o = optionsFor(i);
      if (c && o) renderThumbnail(c, 960, o);
    });
    const o = optionsFor(selected);
    if (editorRef.current && o) renderThumbnail(editorRef.current, 1920, o);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- optionsFor reads exactly these values
  }, [concepts, bgs, design, selected, photo, channel, fontsReady, madeWith]);

  async function generate(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!title.trim()) return setError("Enter your video title.");
    const run = ++runId.current;
    setBusy(true);
    setConcepts([]);
    setBgs([]);
    const palette = PALETTES[paletteName] ? paletteFromArray(PALETTES[paletteName]!) : null;
    const layout = position === "Auto" ? null : (position.toLowerCase() as Layout);
    try {
      const res = await fetch("/api/thumbnail/concepts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description, topics, niche, style, mood, colors, palette, text, layout, channel, count, hasPhoto: !!photo }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? `Request failed (${res.status})`);
      if (run !== runId.current) return;
      const list: Concept[] = data.concepts;
      setConcepts(list);
      setSelected(0);
      setMadeWith({ style, mood, title: title.trim() });
      setDesign((d) => ({ ...initialDesign(style), seed: d.seed }));
      setBgs(list.map(() => ({ img: null, state: data.images ? "loading" : "designed", photoInScene: false })));
      setBusy(false);
      if (data.images) {
        // Paint backgrounds one after another: the free image quota is per minute.
        for (let i = 0; i < list.length; i++) {
          if (run !== runId.current) return;
          const bg = await fetchBackground(list[i], style, mood, photo && photoToAi ? photo.dataUrl : "");
          if (run !== runId.current) return;
          setBgs((prev) => prev.map((b, j) => (j === i ? bg : b)));
          if (bg.state === "designed" && /quota|limit|unavailable|configured|free tier/i.test(bg.note ?? "")) {
            // No point asking again for the rest; fall back to designed backgrounds.
            setBgs((prev) => prev.map((b) => (b.state === "loading" ? { ...bg } : b)));
            break;
          }
        }
      }
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  async function fetchBackground(concept: Concept, s: Style, m: Mood, photoData: string): Promise<Bg> {
    try {
      const res = await fetch("/api/thumbnail/image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ concept, style: s, mood: m, photo: photoData || undefined }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.image) return { img: null, state: "designed", photoInScene: false, note: data?.error ?? "AI art unavailable" };
      return { img: await loadImage(data.image), state: "ai", photoInScene: !!data.photoInScene };
    } catch (e) {
      return { img: null, state: "designed", photoInScene: false, note: (e as Error).message };
    }
  }

  async function regenerateArt() {
    const i = selected;
    const run = runId.current;
    setBgs((prev) => prev.map((b, j) => (j === i ? { ...b, state: "loading" } : b)));
    const bg = await fetchBackground(concepts[i], madeWith.style, madeWith.mood, photo && photoToAi ? photo.dataUrl : "");
    if (run !== runId.current) return;
    setBgs((prev) => prev.map((b, j) => (j === i ? bg : b)));
  }

  async function exportAs(kind: "png4k" | "jpg4k" | "yt") {
    const o = optionsFor(selected);
    if (!o) return;
    setExporting(kind);
    try {
      const c = document.createElement("canvas");
      const name = slug(madeWith.title);
      if (kind === "yt") {
        renderThumbnail(c, 1280, o);
        // YouTube's upload limit is 2 MB.
        let q = 0.95;
        let blob = await toBlob(c, "image/jpeg", q);
        while (blob.size > 2_000_000 && q > 0.5) blob = await toBlob(c, "image/jpeg", (q -= 0.07));
        save(blob, `${name}-youtube-1280x720.jpg`);
      } else {
        renderThumbnail(c, 3840, o);
        save(await toBlob(c, kind === "png4k" ? "image/png" : "image/jpeg", 0.95), `${name}-4k-3840x2160.${kind === "png4k" ? "png" : "jpg"}`);
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setExporting("");
    }
  }

  const edit = (patch: Partial<Concept>) => setConcepts((prev) => prev.map((c, j) => (j === selected ? { ...c, ...patch } : c)));
  const editPalette = (key: keyof Concept["palette"], value: string) =>
    setConcepts((prev) => prev.map((c, j) => (j === selected ? { ...c, palette: { ...c.palette, [key]: value } } : c)));
  const set = <K extends keyof Design>(k: K, v: Design[K]) => setDesign((d) => ({ ...d, [k]: v }));

  const current = concepts[selected];
  const currentBg = bgs[selected];

  return (
    <div className="lab thumb">
      {/* Mount every display font so its @font-face is present for the canvas. */}
      <div className="thumb__fontload" aria-hidden>
        {FONTS.map((f) => (
          <span key={f} className={FONT_MAP[f].f.className}>
            Aa
          </span>
        ))}
      </div>

      <form className="lab__form" onSubmit={generate}>
        <label className="field field--wide">
          <span>Video title</span>
          <input type="text" maxLength={120} placeholder="e.g. I built a 4K thumbnail maker with free AI" value={title} onChange={(e) => setTitle(e.target.value)} disabled={busy} />
        </label>
        <label className="field field--wide">
          <span>Video description <em>optional — the more context, the better the hook</em></span>
          <textarea
            rows={3}
            maxLength={1000}
            placeholder="What happens in the video, who it's for, the big payoff or surprise…"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={busy}
          />
        </label>
        <label className="field">
          <span>Topics / keywords <em>optional</em></span>
          <input type="text" maxLength={200} placeholder="e.g. AI, design, Gemini, YouTube growth" value={topics} onChange={(e) => setTopics(e.target.value)} disabled={busy} />
        </label>
        <label className="field">
          <span>Niche</span>
          <select value={niche} onChange={(e) => setNiche(e.target.value as Niche)} disabled={busy}>
            {NICHES.map((n) => (
              <option key={n}>{n}</option>
            ))}
          </select>
        </label>

        <div className="field field--wide">
          <span>Design style</span>
          <div className="lab__devices logo__chips">
            {STYLES.map((s) => (
              <button key={s} type="button" className={`chip ${style === s ? "is-on" : ""}`} aria-pressed={style === s} onClick={() => setStyle(s)} disabled={busy}>
                {s}
              </button>
            ))}
          </div>
        </div>
        <div className="field field--wide">
          <span>Emotion</span>
          <div className="lab__devices logo__chips">
            {MOODS.map((m) => (
              <button key={m} type="button" className={`chip ${mood === m ? "is-on" : ""}`} aria-pressed={mood === m} onClick={() => setMood(m)} disabled={busy}>
                {m}
              </button>
            ))}
          </div>
        </div>
        <div className="field field--wide">
          <span>Colour palette</span>
          <div className="lab__devices logo__chips">
            {(Object.keys(PALETTES) as PaletteName[]).map((n) => {
              const pal = PALETTES[n];
              return (
                <button key={n} type="button" className={`chip thumb__pal ${paletteName === n ? "is-on" : ""}`} aria-pressed={paletteName === n} onClick={() => setPaletteName(n)} disabled={busy}>
                  {pal && (
                    <i aria-hidden>
                      {pal.slice(0, 3).map((c) => (
                        <b key={c} style={{ background: c }} />
                      ))}
                    </i>
                  )}
                  {n}
                </button>
              );
            })}
          </div>
        </div>
        {paletteName === "Auto" && (
          <label className="field">
            <span>Colour wishes <em>optional</em></span>
            <input type="text" maxLength={80} placeholder="e.g. red and yellow, high contrast" value={colors} onChange={(e) => setColors(e.target.value)} disabled={busy} />
          </label>
        )}
        <label className="field">
          <span>Text on thumbnail <em>optional — AI writes it if empty</em></span>
          <input type="text" maxLength={60} placeholder="e.g. FREE 4K THUMBNAILS" value={text} onChange={(e) => setText(e.target.value)} disabled={busy} />
        </label>
        <div className="field">
          <span>Text position</span>
          <div className="lab__devices logo__chips">
            {POSITIONS.map((p) => (
              <button key={p} type="button" className={`chip ${position === p ? "is-on" : ""}`} aria-pressed={position === p} onClick={() => setPosition(p)} disabled={busy}>
                {p}
              </button>
            ))}
          </div>
        </div>
        <label className="field">
          <span>Channel name <em>optional</em></span>
          <input type="text" maxLength={40} placeholder="e.g. @salmansadiq" value={channel} onChange={(e) => setChannel(e.target.value)} disabled={busy} />
        </label>

        <div className="field">
          <span>Your photo <em>optional</em></span>
          <div className="thumb__photo">
            {photo ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element -- local preview of the user's upload */}
                <img src={photo.dataUrl} alt="Your uploaded photo" />
                <button type="button" className="chip" onClick={() => setPhoto(null)} disabled={busy}>
                  Remove
                </button>
              </>
            ) : (
              <label className="chip thumb__upload">
                Upload face / product photo
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  disabled={busy}
                  onChange={async (e) => {
                    const f = e.target.files?.[0];
                    e.target.value = "";
                    if (!f) return;
                    try {
                      setPhoto(await readPhoto(f));
                    } catch {
                      setError("Couldn't read that image.");
                    }
                  }}
                />
              </label>
            )}
          </div>
          {photo && (
            <label className="thumb__check">
              <input type="checkbox" checked={photoToAi} onChange={(e) => setPhotoToAi(e.target.checked)} disabled={busy} />
              Blend me into the AI artwork (sends the photo to Google Gemini)
            </label>
          )}
        </div>
        <div className="field">
          <span>Variations</span>
          <div className="lab__devices logo__chips">
            {[1, 2, 3].map((n) => (
              <button key={n} type="button" className={`chip ${count === n ? "is-on" : ""}`} aria-pressed={count === n} onClick={() => setCount(n)} disabled={busy}>
                {n}
              </button>
            ))}
          </div>
        </div>

        <div className="lab__actions field--wide">
          <button type="submit" className="btn" disabled={busy}>
            {busy ? "Designing…" : concepts.length ? "Generate new thumbnails" : "Generate thumbnails"}
          </button>
          <p className="lab__fine">
            Gemini writes the hook and art-directs each concept, then paints the background. Text and graphics are rendered at a true 3840×2160. Free to use; a few runs per visitor
            every 10 minutes.
          </p>
          {error && (
            <p className="lab__error" role="alert">
              {error}
            </p>
          )}
        </div>
      </form>

      {busy && (
        <div className="thumb__grid" aria-busy>
          {Array.from({ length: count }, (_, i) => (
            <div key={i} className="thumb__card thumb__card--loading" />
          ))}
        </div>
      )}

      {concepts.length > 0 && (
        <>
          <div className="thumb__grid">
            {concepts.map((c, i) => (
              <button
                key={i}
                type="button"
                className={`thumb__card ${selected === i ? "is-on" : ""}`}
                aria-pressed={selected === i}
                onClick={() => {
                  setSelected(i);
                  editorWrap.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
              >
                <span className="thumb__canvas">
                  <canvas ref={(el) => void (cardRefs.current[i] = el)} aria-label={`Thumbnail concept ${i + 1}: ${c.headline}`} role="img" />
                  {bgs[i]?.state === "loading" && <em className="thumb__status mono">Painting AI art…</em>}
                </span>
                <span className="thumb__meta">
                  <b>{c.title}</b>
                  {c.rationale && <small>{c.rationale}</small>}
                </span>
              </button>
            ))}
          </div>

          {current && (
            <div className="thumb__editor" ref={editorWrap}>
              <div className="thumb__stage">
                <div className="thumb__canvas thumb__canvas--big">
                  <canvas ref={editorRef} role="img" aria-label={`Selected thumbnail: ${current.headline}`} />
                  {currentBg?.state === "loading" && <em className="thumb__status mono">Painting AI art…</em>}
                </div>
                <div className="thumb__dl">
                  <button type="button" className="btn" onClick={() => exportAs("png4k")} disabled={!!exporting}>
                    {exporting === "png4k" ? "Rendering…" : "Download 4K PNG"}
                  </button>
                  <button type="button" className="btn btn--ghost" onClick={() => exportAs("jpg4k")} disabled={!!exporting}>
                    {exporting === "jpg4k" ? "Rendering…" : "4K JPG"}
                  </button>
                  <button type="button" className="btn btn--ghost" onClick={() => exportAs("yt")} disabled={!!exporting}>
                    {exporting === "yt" ? "Rendering…" : "YouTube-ready JPG (<2 MB)"}
                  </button>
                </div>
                <p className="lab__fine">
                  {currentBg?.state === "ai"
                    ? "Background painted by Gemini; headline, graphics and effects rendered sharp at 3840×2160."
                    : currentBg?.state === "designed"
                      ? `Using a designed background${currentBg.note ? ` (${currentBg.note.replace(/\.$/, "")})` : ""}. Everything is rendered natively at 3840×2160.`
                      : "Painting the AI background…"}
                </p>
              </div>

              <div className="thumb__controls">
                <label className="field">
                  <span>Headline</span>
                  <input type="text" maxLength={60} value={current.headline} onChange={(e) => edit({ headline: e.target.value })} />
                </label>
                <div className="thumb__row">
                  <label className="field">
                    <span>Highlight word</span>
                    <input type="text" maxLength={30} value={current.highlight} onChange={(e) => edit({ highlight: e.target.value })} />
                  </label>
                  <label className="field">
                    <span>Badge</span>
                    <input type="text" maxLength={10} value={current.badge} onChange={(e) => edit({ badge: e.target.value })} />
                  </label>
                </div>
                <div className="thumb__row">
                  <label className="field">
                    <span>Subtext</span>
                    <input type="text" maxLength={40} value={current.subtext} onChange={(e) => edit({ subtext: e.target.value })} />
                  </label>
                  <label className="field">
                    <span>Emoji</span>
                    <input type="text" maxLength={8} value={current.emoji} onChange={(e) => edit({ emoji: e.target.value })} />
                  </label>
                </div>
                <div className="field">
                  <span>Text position</span>
                  <div className="lab__devices logo__chips">
                    {(["left", "right", "center", "top", "bottom"] as Layout[]).map((l) => (
                      <button key={l} type="button" className={`chip ${current.layout === l ? "is-on" : ""}`} aria-pressed={current.layout === l} onClick={() => edit({ layout: l })}>
                        {l[0].toUpperCase() + l.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="thumb__row">
                  <label className="field">
                    <span>Font</span>
                    <select value={design.font} onChange={(e) => set("font", e.target.value as FontName)}>
                      {FONTS.map((f) => (
                        <option key={f}>{f}</option>
                      ))}
                    </select>
                  </label>
                  <label className="field">
                    <span>Text size</span>
                    <input type="range" min={0.6} max={1.3} step={0.05} value={design.textScale} onChange={(e) => set("textScale", Number(e.target.value))} />
                  </label>
                </div>
                <div className="field">
                  <span>Colours</span>
                  <div className="thumb__colors">
                    {(
                      [
                        ["bg1", "Back 1"],
                        ["bg2", "Back 2"],
                        ["accent", "Accent"],
                        ["text", "Text"],
                        ["stroke", "Outline"],
                      ] as const
                    ).map(([k, label]) => (
                      <label key={k}>
                        <input type="color" value={current.palette[k]} onChange={(e) => editPalette(k, e.target.value)} />
                        <small>{label}</small>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="field">
                  <span>Elements</span>
                  <div className="lab__devices logo__chips">
                    {(
                      [
                        ["uppercase", "UPPERCASE"],
                        ["showBadge", "Badge"],
                        ["showSubtext", "Subtext"],
                        ["showEmoji", "Emoji"],
                        ["showArrow", "Arrow"],
                        ["vignette", "Vignette"],
                      ] as const
                    ).map(([k, label]) => (
                      <button key={k} type="button" className={`chip ${design[k] ? "is-on" : ""}`} aria-pressed={design[k]} onClick={() => set(k, !design[k])}>
                        {label}
                      </button>
                    ))}
                    {photo && (
                      <button type="button" className="chip" onClick={() => set("photoShape", design.photoShape === "circle" ? "rounded" : "circle")}>
                        Photo: {design.photoShape}
                      </button>
                    )}
                  </div>
                </div>
                <div className="field">
                  <span>Background</span>
                  <div className="lab__devices logo__chips">
                    <button type="button" className={`chip ${design.useAiArt && currentBg?.state === "ai" ? "is-on" : ""}`} aria-pressed={design.useAiArt && currentBg?.state === "ai"} onClick={() => set("useAiArt", !design.useAiArt)} disabled={currentBg?.state !== "ai"}>
                      AI art
                    </button>
                    <button type="button" className={`chip ${design.flipBg ? "is-on" : ""}`} aria-pressed={design.flipBg} onClick={() => set("flipBg", !design.flipBg)}>
                      Flip
                    </button>
                    <button type="button" className="chip" onClick={() => set("seed", design.seed + 1)}>
                      Shuffle design
                    </button>
                    <button type="button" className="chip" onClick={regenerateArt} disabled={currentBg?.state === "loading"}>
                      Repaint AI art
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
