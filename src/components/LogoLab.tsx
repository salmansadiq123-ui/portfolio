"use client";

import { useState } from "react";
import { STYLES, TYPES } from "@/lib/logo/options";

type Logo = { title: string; concept: string; palette: string[]; svg: string };

const toDataUri = (svg: string) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "logo";

function save(href: string, filename: string) {
  const a = document.createElement("a");
  a.href = href;
  a.download = filename;
  a.click();
}

function downloadSvg(logo: Logo, name: string, i: number) {
  const url = URL.createObjectURL(new Blob([logo.svg], { type: "image/svg+xml" }));
  save(url, `${slug(name)}-logo-${i + 1}.svg`);
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

function downloadPng(logo: Logo, name: string, i: number) {
  const img = new Image();
  img.onload = () => {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 2048;
    canvas.getContext("2d")!.drawImage(img, 0, 0, 2048, 2048);
    save(canvas.toDataURL("image/png"), `${slug(name)}-logo-${i + 1}.png`);
  };
  img.src = toDataUri(logo.svg);
}

export default function LogoLab() {
  const [name, setName] = useState("");
  const [tagline, setTagline] = useState("");
  const [about, setAbout] = useState("");
  const [colors, setColors] = useState("");
  const [style, setStyle] = useState<(typeof STYLES)[number]>("Modern");
  const [type, setType] = useState<(typeof TYPES)[number]>("Icon + name");
  const [logos, setLogos] = useState<Logo[]>([]);
  const [madeFor, setMadeFor] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function generate(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!name.trim()) return setError("Enter a brand name.");
    setBusy(true);
    try {
      const res = await fetch("/api/logo/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, tagline, about, colors, style, type }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? `Request failed (${res.status})`);
      setLogos(data.logos);
      setMadeFor(name.trim());
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="lab">
      <form className="lab__form" onSubmit={generate}>
        <label className="field">
          <span>Brand name</span>
          <input type="text" maxLength={40} placeholder="e.g. Northwind" value={name} onChange={(e) => setName(e.target.value)} disabled={busy} />
        </label>
        <label className="field">
          <span>Tagline <em>optional</em></span>
          <input type="text" maxLength={60} placeholder="e.g. Coffee roasters" value={tagline} onChange={(e) => setTagline(e.target.value)} disabled={busy} />
        </label>
        <label className="field field--wide">
          <span>What does the brand do? <em>optional</em></span>
          <textarea
            rows={2}
            maxLength={300}
            placeholder="e.g. A small-batch coffee roaster in Lahore, warm and handcrafted, selling online and in a café."
            value={about}
            onChange={(e) => setAbout(e.target.value)}
            disabled={busy}
          />
        </label>
        <div className="field field--wide">
          <span>Style</span>
          <div className="lab__devices logo__chips">
            {STYLES.map((s) => (
              <button key={s} type="button" className={`chip ${style === s ? "is-on" : ""}`} aria-pressed={style === s} onClick={() => setStyle(s)} disabled={busy}>
                {s}
              </button>
            ))}
          </div>
        </div>
        <div className="field">
          <span>Logo type</span>
          <div className="lab__devices logo__chips">
            {TYPES.map((t) => (
              <button key={t} type="button" className={`chip ${type === t ? "is-on" : ""}`} aria-pressed={type === t} onClick={() => setType(t)} disabled={busy}>
                {t}
              </button>
            ))}
          </div>
        </div>
        <label className="field">
          <span>Colours <em>optional</em></span>
          <input type="text" maxLength={80} placeholder="e.g. deep green and cream" value={colors} onChange={(e) => setColors(e.target.value)} disabled={busy} />
        </label>
        <div className="lab__actions field--wide">
          <button type="submit" className="btn" disabled={busy}>
            {busy ? "Designing…" : logos.length ? "Generate new logos" : "Generate logos"}
          </button>
          <p className="lab__fine">Gemini draws four directions as vector SVG, usually in 15–40 seconds. Free to use; a few runs per visitor every 10 minutes.</p>
          {error && <p className="lab__error" role="alert">{error}</p>}
        </div>
      </form>

      {(busy || logos.length > 0) && (
        <div className="logo__grid" aria-busy={busy}>
          {busy
            ? Array.from({ length: 4 }, (_, i) => <div key={i} className="logo__card logo__card--loading" />)
            : logos.map((logo, i) => (
                <figure key={i} className="logo__card">
                  {/* eslint-disable-next-line @next/next/no-img-element -- generated SVG, rendered as an image so it can't run scripts */}
                  <img src={toDataUri(logo.svg)} alt={`${madeFor} logo: ${logo.title}`} />
                  <figcaption>
                    <b>{logo.title}</b>
                    {logo.concept && <p>{logo.concept}</p>}
                    {logo.palette.length > 0 && (
                      <div className="logo__palette">
                        {logo.palette.map((c) => (
                          <i key={c} style={{ background: c }} title={c} />
                        ))}
                      </div>
                    )}
                    <div className="logo__dl">
                      <button type="button" className="chip" onClick={() => downloadSvg(logo, madeFor, i)}>SVG</button>
                      <button type="button" className="chip" onClick={() => downloadPng(logo, madeFor, i)}>PNG</button>
                    </div>
                  </figcaption>
                </figure>
              ))}
        </div>
      )}
    </div>
  );
}
