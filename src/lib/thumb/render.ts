// Client-side thumbnail compositor. Everything is laid out in a 1920×1080 design space and
// scaled to the output size, so text and shapes stay razor sharp at 3840×2160.
import type { Concept, Layout, Palette, Style } from "./options";

export const W = 1920;
export const H = 1080;

export type RenderOptions = {
  concept: Concept;
  style: Style;
  font: { family: string; weight: number; tight: boolean };
  subFont: string;
  uppercase: boolean;
  textScale: number;
  bg: HTMLImageElement | null;
  flipBg: boolean;
  photo: HTMLImageElement | null;
  photoShape: "rounded" | "circle";
  showArrow: boolean;
  showBadge: boolean;
  showEmoji: boolean;
  showSubtext: boolean;
  vignette: boolean;
  channel: string;
  seed: number;
};

type Ctx = CanvasRenderingContext2D;
type Box = { x: number; y: number; w: number; h: number };

const EMOJI_FONT = '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif';

function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hexToRgb(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
const rgba = (hex: string, a: number) => `rgba(${hexToRgb(hex).join(",")},${a})`;
const luminance = (hex: string) => {
  const [r, g, b] = hexToRgb(hex).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

/** Where the subject sits for each text layout. */
function focal(layout: Layout): [number, number] {
  return layout === "left" ? [1420, 540] : layout === "right" ? [500, 540] : layout === "top" ? [960, 780] : layout === "bottom" ? [960, 320] : [960, 540];
}

const mirror = (l: Layout): Layout => (l === "left" ? "right" : l === "right" ? "left" : l);

// ---------- Backgrounds ----------

function drawCover(ctx: Ctx, img: HTMLImageElement, box: Box) {
  const r = Math.max(box.w / img.naturalWidth, box.h / img.naturalHeight);
  const w = img.naturalWidth * r;
  const h = img.naturalHeight * r;
  ctx.drawImage(img, box.x + (box.w - w) / 2, box.y + (box.h - h) / 2, w, h);
}

function blob(ctx: Ctx, x: number, y: number, r: number, color: string, a: number) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, rgba(color, a));
  g.addColorStop(1, rgba(color, 0));
  ctx.fillStyle = g;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
}

function grain(ctx: Ctx, amount: number, rnd: () => number) {
  if (amount <= 0) return;
  const tile = document.createElement("canvas");
  tile.width = tile.height = 192;
  const t = tile.getContext("2d")!;
  const data = t.createImageData(192, 192);
  for (let i = 0; i < data.data.length; i += 4) {
    const v = rnd() * 255;
    data.data[i] = data.data[i + 1] = data.data[i + 2] = v;
    data.data[i + 3] = 255 * amount;
  }
  t.putImageData(data, 0, 0);
  ctx.save();
  ctx.globalCompositeOperation = "overlay";
  ctx.fillStyle = ctx.createPattern(tile, "repeat")!;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
}

function drawProcedural(ctx: Ctx, style: Style, p: Palette, layout: Layout, rnd: () => number) {
  const [fx, fy] = focal(layout);
  const base = ctx.createLinearGradient(0, 0, W, H);
  base.addColorStop(0, p.bg1);
  base.addColorStop(1, p.bg2);
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, W, H);

  switch (style) {
    case "Bold & Viral":
    case "Cartoon": {
      const rays = 28;
      ctx.save();
      ctx.translate(fx, fy);
      for (let i = 0; i < rays; i++) {
        if (i % 2) continue;
        const a0 = (i / rays) * Math.PI * 2;
        const a1 = ((i + 1) / rays) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(a0) * 2600, Math.sin(a0) * 2600);
        ctx.lineTo(Math.cos(a1) * 2600, Math.sin(a1) * 2600);
        ctx.closePath();
        ctx.fillStyle = style === "Cartoon" ? "rgba(255,255,255,.18)" : rgba(p.bg2, 0.55);
        ctx.fill();
      }
      ctx.restore();
      blob(ctx, fx, fy, 620, style === "Cartoon" ? "#ffffff" : p.accent, 0.55);
      if (style === "Cartoon") {
        ctx.fillStyle = "rgba(255,255,255,.22)";
        for (let y = 0; y < H; y += 34)
          for (let x = (y / 34) % 2 ? 17 : 0; x < W; x += 34) {
            const d = Math.hypot(x - fx, y - fy) / 1400;
            ctx.beginPath();
            ctx.arc(x, y, Math.max(0, 7 * (1 - d)), 0, Math.PI * 2);
            ctx.fill();
          }
      }
      break;
    }
    case "Minimal": {
      ctx.fillStyle = p.bg1;
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = p.bg2;
      ctx.beginPath();
      ctx.arc(fx, fy, 470, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = p.accent;
      ctx.beginPath();
      ctx.arc(fx + 300, fy - 300, 46, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case "Cinematic":
    case "Documentary": {
      blob(ctx, fx, fy, 900, p.bg2, 0.9);
      const streak = ctx.createLinearGradient(0, fy - 160, 0, fy + 160);
      streak.addColorStop(0, rgba(p.accent, 0));
      streak.addColorStop(0.5, rgba(p.accent, style === "Cinematic" ? 0.28 : 0.12));
      streak.addColorStop(1, rgba(p.accent, 0));
      ctx.fillStyle = streak;
      ctx.fillRect(0, fy - 160, W, 320);
      for (let i = 0; i < (style === "Cinematic" ? 26 : 8); i++)
        blob(ctx, rnd() * W, rnd() * H, 30 + rnd() * 110, rnd() > 0.5 ? p.accent : "#ffffff", 0.08 + rnd() * 0.22);
      break;
    }
    case "Gaming": {
      ctx.save();
      ctx.rotate(-0.35);
      for (let i = -10; i < 30; i++) {
        ctx.fillStyle = i % 3 ? rgba(p.bg2, 0.35) : rgba(p.accent, 0.12);
        ctx.fillRect(i * 140, -800, 50 + rnd() * 40, 3000);
      }
      ctx.restore();
      ctx.strokeStyle = rgba(p.accent, 0.12);
      ctx.lineWidth = 2;
      const r = 46;
      for (let y = 0; y < H + r; y += r * 1.5)
        for (let x = 0; x < W + r; x += r * Math.sqrt(3)) {
          const ox = (Math.round(y / (r * 1.5)) % 2) * ((r * Math.sqrt(3)) / 2);
          ctx.beginPath();
          for (let k = 0; k < 6; k++) {
            const a = (Math.PI / 3) * k + Math.PI / 6;
            ctx.lineTo(x + ox + r * Math.cos(a), y + r * Math.sin(a));
          }
          ctx.closePath();
          ctx.stroke();
        }
      blob(ctx, fx, fy, 700, p.accent, 0.35);
      break;
    }
    case "Tech": {
      ctx.strokeStyle = rgba(p.accent, 0.09);
      ctx.lineWidth = 1.5;
      for (let x = 0; x <= W; x += 64) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, H);
        ctx.stroke();
      }
      for (let y = 0; y <= H; y += 64) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(W, y);
        ctx.stroke();
      }
      ctx.save();
      ctx.shadowColor = p.accent;
      ctx.shadowBlur = 18;
      for (let i = 0; i < 18; i++) {
        let x = Math.round((rnd() * W) / 64) * 64;
        let y = Math.round((rnd() * H) / 64) * 64;
        ctx.strokeStyle = rgba(p.accent, 0.45);
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x, y);
        for (let s = 0; s < 4; s++) {
          if (s % 2) x += (rnd() > 0.5 ? 1 : -1) * 64 * (1 + Math.floor(rnd() * 4));
          else y += (rnd() > 0.5 ? 1 : -1) * 64 * (1 + Math.floor(rnd() * 3));
          ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.fillStyle = p.accent;
        ctx.beginPath();
        ctx.arc(x, y, 7, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
      blob(ctx, fx, fy, 650, p.accent, 0.3);
      break;
    }
    case "Neon": {
      ctx.fillStyle = p.bg1;
      ctx.fillRect(0, 0, W, H);
      blob(ctx, fx, fy, 800, p.bg2, 0.9);
      const second = "#22d3ee";
      ctx.save();
      ctx.lineWidth = 10;
      for (const [c, shape] of [
        [p.accent, 0],
        [second, 1],
        [p.accent, 2],
      ] as const) {
        ctx.strokeStyle = c;
        ctx.shadowColor = c;
        ctx.shadowBlur = 50;
        ctx.beginPath();
        if (shape === 0) ctx.arc(fx, fy, 380, 0, Math.PI * 2);
        else if (shape === 1) {
          ctx.moveTo(fx - 520, fy + 380);
          ctx.lineTo(fx, fy - 470);
          ctx.lineTo(fx + 520, fy + 380);
          ctx.closePath();
        } else ctx.rect(fx - 620, fy - 300, 1240, 600);
        ctx.globalAlpha = shape === 2 ? 0.35 : 0.85;
        ctx.stroke();
        ctx.stroke();
      }
      ctx.restore();
      const floor = ctx.createLinearGradient(0, H * 0.7, 0, H);
      floor.addColorStop(0, "rgba(0,0,0,0)");
      floor.addColorStop(1, rgba(p.accent, 0.25));
      ctx.fillStyle = floor;
      ctx.fillRect(0, H * 0.7, W, H * 0.3);
      break;
    }
    case "Retro": {
      const horizon = H * 0.62;
      const sky = ctx.createLinearGradient(0, 0, 0, horizon);
      sky.addColorStop(0, p.bg1);
      sky.addColorStop(1, p.bg2);
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, W, horizon);
      const sx = fx;
      const sr = 330;
      ctx.save();
      ctx.beginPath();
      ctx.arc(sx, horizon - 60, sr, 0, Math.PI * 2);
      ctx.clip();
      const sun = ctx.createLinearGradient(0, horizon - 60 - sr, 0, horizon - 60 + sr);
      sun.addColorStop(0, p.accent);
      sun.addColorStop(1, p.bg2);
      ctx.fillStyle = sun;
      ctx.fillRect(sx - sr, horizon - 60 - sr, sr * 2, sr * 2);
      ctx.fillStyle = p.bg2;
      for (let i = 0; i < 7; i++) ctx.fillRect(sx - sr, horizon - 60 + i * 44 - 20, sr * 2, 6 + i * 3);
      ctx.restore();
      ctx.fillStyle = p.bg1;
      ctx.fillRect(0, horizon, W, H - horizon);
      ctx.strokeStyle = p.accent;
      ctx.lineWidth = 3;
      ctx.shadowColor = p.accent;
      ctx.shadowBlur = 14;
      for (let i = -14; i <= 14; i++) {
        ctx.beginPath();
        ctx.moveTo(W / 2 + i * 40, horizon);
        ctx.lineTo(W / 2 + i * 260, H);
        ctx.stroke();
      }
      for (let k = 1; k < 9; k++) {
        const y = horizon + (H - horizon) * (k / 8) ** 1.8;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(W, y);
        ctx.stroke();
      }
      ctx.shadowBlur = 0;
      break;
    }
    case "Luxury": {
      const g = ctx.createRadialGradient(fx, fy, 0, fx, fy, 1300);
      g.addColorStop(0, p.bg2);
      g.addColorStop(1, p.bg1);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
      const sheen = ctx.createLinearGradient(0, 0, W, H);
      sheen.addColorStop(0.35, rgba(p.accent, 0));
      sheen.addColorStop(0.5, rgba(p.accent, 0.12));
      sheen.addColorStop(0.65, rgba(p.accent, 0));
      ctx.fillStyle = sheen;
      ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = rgba(p.accent, 0.7);
      ctx.lineWidth = 3;
      ctx.strokeRect(46, 46, W - 92, H - 92);
      ctx.lineWidth = 1.5;
      ctx.strokeRect(62, 62, W - 124, H - 124);
      for (let i = 0; i < 40; i++) blob(ctx, rnd() * W, rnd() * H, 4 + rnd() * 14, p.accent, 0.5 + rnd() * 0.5);
      break;
    }
    case "Educational": {
      ctx.strokeStyle = "rgba(255,255,255,.08)";
      ctx.lineWidth = 2;
      for (let x = 0; x <= W; x += 48) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, H);
        ctx.stroke();
      }
      for (let y = 0; y <= H; y += 48) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(W, y);
        ctx.stroke();
      }
      ctx.strokeStyle = "rgba(255,255,255,.2)";
      ctx.lineWidth = 6;
      ctx.lineCap = "round";
      for (let i = 0; i < 14; i++) {
        const x = rnd() * W;
        const y = rnd() * H;
        const s = 24 + rnd() * 30;
        ctx.beginPath();
        const kind = Math.floor(rnd() * 3);
        if (kind === 0) ctx.arc(x, y, s, 0, Math.PI * 2);
        else if (kind === 1) {
          ctx.moveTo(x - s, y);
          ctx.lineTo(x + s, y);
          ctx.moveTo(x, y - s);
          ctx.lineTo(x, y + s);
        } else {
          ctx.moveTo(x - s, y + s);
          ctx.lineTo(x, y - s);
          ctx.lineTo(x + s, y + s);
          ctx.closePath();
        }
        ctx.stroke();
      }
      blob(ctx, fx, fy, 640, p.accent, 0.25);
      break;
    }
    case "Vlog": {
      for (let i = 0; i < 7; i++) blob(ctx, rnd() * W, rnd() * H, 300 + rnd() * 400, "#ffffff", 0.12 + rnd() * 0.12);
      const leak = ctx.createLinearGradient(W, 0, W * 0.5, H * 0.6);
      leak.addColorStop(0, "rgba(255,240,200,.55)");
      leak.addColorStop(1, "rgba(255,240,200,0)");
      ctx.fillStyle = leak;
      ctx.fillRect(0, 0, W, H);
      break;
    }
    default: {
      // Modern
      blob(ctx, fx, fy, 720, p.accent, 0.3);
      blob(ctx, fx - 500, fy + 420, 600, p.bg2, 0.8);
      blob(ctx, W - fx, 120, 520, p.bg2, 0.6);
      ctx.strokeStyle = "rgba(255,255,255,.05)";
      ctx.lineWidth = 2;
      for (let i = -H; i < W; i += 44) {
        ctx.beginPath();
        ctx.moveTo(i, H);
        ctx.lineTo(i + H, 0);
        ctx.stroke();
      }
    }
  }
}

// ---------- Text ----------

type Line = { words: string[]; width: number };

function wrap(ctx: Ctx, words: string[], maxW: number): Line[] {
  const lines: Line[] = [];
  const space = ctx.measureText(" ").width;
  let cur: string[] = [];
  let curW = 0;
  for (const w of words) {
    const ww = ctx.measureText(w).width;
    if (cur.length && curW + space + ww > maxW) {
      lines.push({ words: cur, width: curW });
      cur = [w];
      curW = ww;
    } else {
      curW += (cur.length ? space : 0) + ww;
      cur.push(w);
    }
  }
  if (cur.length) lines.push({ words: cur, width: curW });
  return lines;
}

const norm = (s: string) => s.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "");

function textBoxes(layout: Layout, hasPhoto: boolean): { box: Box; align: CanvasTextAlign; valign: "top" | "middle" | "bottom" } {
  if (layout === "left" || (layout === "center" && hasPhoto)) return { box: { x: 90, y: 90, w: hasPhoto ? 1000 : 1060, h: 900 }, align: "left", valign: "middle" };
  if (layout === "right") return { box: { x: W - 90 - (hasPhoto ? 1000 : 1060), y: 90, w: hasPhoto ? 1000 : 1060, h: 900 }, align: "right", valign: "middle" };
  if (layout === "top") return { box: { x: 120, y: 60, w: W - 240, h: 470 }, align: "center", valign: "top" };
  if (layout === "bottom") return { box: { x: 120, y: H - 60 - 470, w: W - 240, h: 470 }, align: "center", valign: "bottom" };
  return { box: { x: 150, y: 120, w: W - 300, h: 840 }, align: "center", valign: "middle" };
}

function photoBox(layout: Layout, shape: "rounded" | "circle"): Box {
  const eff = layout === "center" ? "left" : layout;
  if (shape === "circle") {
    const r = eff === "top" || eff === "bottom" ? 300 : 400;
    const [cx, cy] = eff === "left" ? [1470, 560] : eff === "right" ? [450, 560] : eff === "top" ? [960, 790] : [960, 300];
    return { x: cx - r, y: cy - r, w: r * 2, h: r * 2 };
  }
  if (eff === "left") return { x: 1150, y: 110, w: 680, h: 1010 };
  if (eff === "right") return { x: 90, y: 110, w: 680, h: 1010 };
  if (eff === "top") return { x: 610, y: 560, w: 700, h: 560 };
  return { x: 610, y: 40, w: 700, h: 500 };
}

function drawPhoto(ctx: Ctx, img: HTMLImageElement, box: Box, shape: "rounded" | "circle", p: Palette, tilt: number) {
  ctx.save();
  ctx.translate(box.x + box.w / 2, box.y + box.h / 2);
  ctx.rotate(tilt);
  ctx.translate(-box.w / 2, -box.h / 2);
  const path = new Path2D();
  if (shape === "circle") path.arc(box.w / 2, box.h / 2, box.w / 2, 0, Math.PI * 2);
  else path.roundRect(0, 0, box.w, box.h, 44);
  ctx.save();
  ctx.shadowColor = rgba(p.accent, 0.9);
  ctx.shadowBlur = 80;
  ctx.fillStyle = p.accent;
  ctx.fill(path);
  ctx.restore();
  ctx.save();
  ctx.clip(path);
  drawCover(ctx, img, { x: 0, y: 0, w: box.w, h: box.h });
  ctx.restore();
  ctx.lineWidth = 16;
  ctx.strokeStyle = "#ffffff";
  ctx.stroke(path);
  ctx.restore();
}

function drawArrow(ctx: Ctx, from: [number, number], to: [number, number], p: Palette) {
  const [x0, y0] = from;
  const [x1, y1] = to;
  const cx = (x0 + x1) / 2;
  const cy = Math.min(y0, y1) - 180;
  const ang = Math.atan2(y1 - cy, x1 - cx);
  const head = (c: string, scale: number) => {
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.moveTo(x1 + Math.cos(ang) * 30 * scale, y1 + Math.sin(ang) * 30 * scale);
    ctx.lineTo(x1 + Math.cos(ang + 2.5) * 80 * scale, y1 + Math.sin(ang + 2.5) * 80 * scale);
    ctx.lineTo(x1 + Math.cos(ang - 2.5) * 80 * scale, y1 + Math.sin(ang - 2.5) * 80 * scale);
    ctx.closePath();
    ctx.fill();
  };
  ctx.save();
  ctx.lineCap = "round";
  ctx.shadowColor = "rgba(0,0,0,.5)";
  ctx.shadowBlur = 20;
  for (const [c, w] of [
    [p.stroke, 52],
    [p.accent, 30],
  ] as const) {
    ctx.strokeStyle = c;
    ctx.lineWidth = w;
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.quadraticCurveTo(cx, cy, x1 - Math.cos(ang) * 40, y1 - Math.sin(ang) * 40);
    ctx.stroke();
    head(c, w === 52 ? 1.3 : 1);
  }
  ctx.restore();
}

export function renderThumbnail(canvas: HTMLCanvasElement, width: number, o: RenderOptions) {
  const s = width / W;
  canvas.width = Math.round(width);
  canvas.height = Math.round((width * H) / W);
  const ctx = canvas.getContext("2d")!;
  ctx.setTransform(s, 0, 0, s, 0, 0);
  ctx.imageSmoothingQuality = "high";
  const rnd = rng(o.seed);
  const c = o.concept;
  const p = c.palette;
  const style = o.style;
  const hasPhoto = !!o.photo;
  const lightText = luminance(p.text) > 0.4;

  // 1. Background
  ctx.save();
  if (o.flipBg) {
    ctx.translate(W, 0);
    ctx.scale(-1, 1);
  }
  if (o.bg) {
    ctx.fillStyle = p.bg1;
    ctx.fillRect(0, 0, W, H);
    drawCover(ctx, o.bg, { x: 0, y: 0, w: W, h: H });
  } else drawProcedural(ctx, style, p, o.flipBg ? mirror(c.layout) : c.layout, rnd);
  ctx.restore();

  // 2. Readability scrim behind the text
  const shade = lightText ? "#000000" : "#ffffff";
  const strength = o.bg ? 0.62 : 0.32;
  const { box, align, valign } = textBoxes(c.layout, hasPhoto);
  const eff = c.layout === "center" && hasPhoto ? "left" : c.layout;
  let scrim: CanvasGradient;
  if (eff === "left") scrim = ctx.createLinearGradient(0, 0, W * 0.72, 0);
  else if (eff === "right") scrim = ctx.createLinearGradient(W, 0, W * 0.28, 0);
  else if (eff === "top") scrim = ctx.createLinearGradient(0, 0, 0, H * 0.7);
  else if (eff === "bottom") scrim = ctx.createLinearGradient(0, H, 0, H * 0.3);
  else {
    scrim = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, W * 0.6);
    scrim.addColorStop(0, rgba(shade, strength * 0.7));
    scrim.addColorStop(1, rgba(shade, strength * 0.2));
  }
  if (eff !== "center") {
    scrim.addColorStop(0, rgba(shade, strength));
    scrim.addColorStop(1, rgba(shade, 0));
  }
  ctx.fillStyle = scrim;
  ctx.fillRect(0, 0, W, H);

  if (o.vignette) {
    const v = ctx.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, W * 0.75);
    v.addColorStop(0, "rgba(0,0,0,0)");
    v.addColorStop(1, "rgba(0,0,0,.6)");
    ctx.fillStyle = v;
    ctx.fillRect(0, 0, W, H);
  }
  grain(ctx, style === "Documentary" ? 0.22 : style === "Cinematic" ? 0.14 : o.bg ? 0 : 0.06, rnd);

  // 3. Creator photo (only when the AI didn't already paint them into the scene)
  const playful = style === "Bold & Viral" || style === "Cartoon" || style === "Vlog";
  let pbox: Box | null = null;
  if (o.photo) {
    pbox = photoBox(c.layout, o.photoShape);
    drawPhoto(ctx, o.photo, pbox, o.photoShape, p, playful ? 0.03 : 0);
  }

  // 4. Headline block: badge + headline + subtext, fitted to the text box
  const fam = o.font.family;
  const weight = o.font.weight;
  const raw = o.uppercase ? c.headline.toUpperCase() : c.headline;
  const words = raw.split(/\s+/).filter(Boolean);
  const hl = new Set(c.highlight.split(/\s+/).map(norm).filter(Boolean));
  const lineH = o.font.tight ? 0.96 : 1.08;
  const maxLines = words.length <= 2 ? 2 : words.length <= 6 ? 3 : 4;
  const badgeH = o.showBadge && c.badge ? 110 : 0;
  const subH = o.showSubtext && c.subtext ? 110 : 0;
  const availH = box.h - badgeH - subH;

  let size = Math.round(300 * o.textScale);
  let lines: Line[] = [];
  for (; size > 40; size -= 6) {
    ctx.font = `${weight} ${size}px ${fam}`;
    lines = wrap(ctx, words, box.w);
    if (lines.length <= maxLines && lines.every((l) => l.width <= box.w) && lines.length * size * lineH <= availH) break;
  }
  const textH = lines.length * size * lineH;
  const blockH = badgeH + textH + subH;
  let y0 = valign === "top" ? box.y : valign === "bottom" ? box.y + box.h - blockH : box.y + (box.h - blockH) / 2;
  const anchorX = align === "left" ? box.x : align === "right" ? box.x + box.w : box.x + box.w / 2;

  ctx.save();
  if (playful) {
    ctx.translate(anchorX, y0 + blockH / 2);
    ctx.rotate(-0.04);
    ctx.translate(-anchorX, -(y0 + blockH / 2));
  }

  // Badge
  if (badgeH) {
    ctx.font = `800 64px ${o.subFont}`;
    const label = c.badge.toUpperCase();
    const bw = ctx.measureText(label).width + 64;
    const bx = align === "left" ? box.x : align === "right" ? box.x + box.w - bw : box.x + (box.w - bw) / 2;
    ctx.save();
    ctx.translate(bx + bw / 2, y0 + 45);
    ctx.rotate(-0.05);
    ctx.shadowColor = "rgba(0,0,0,.45)";
    ctx.shadowBlur = 24;
    ctx.fillStyle = p.accent;
    ctx.beginPath();
    ctx.roundRect(-bw / 2, -45, bw, 90, 18);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = luminance(p.accent) > 0.45 ? "#111111" : "#ffffff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(label, 0, 4);
    ctx.restore();
    y0 += badgeH;
  }

  // Headline
  const boxHighlight = style === "Modern" || style === "Educational" || style === "Minimal" || style === "Tech";
  const neon = style === "Neon";
  const soft = style === "Minimal" || style === "Luxury";
  ctx.font = `${weight} ${size}px ${fam}`;
  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "left";
  ctx.lineJoin = "round";
  const space = ctx.measureText(" ").width;
  lines.forEach((line, li) => {
    const baseline = y0 + size * lineH * li + size * (o.font.tight ? 0.86 : 0.84);
    let x = align === "left" ? box.x : align === "right" ? box.x + box.w - line.width : box.x + (box.w - line.width) / 2;
    for (const w of line.words) {
      const ww = ctx.measureText(w).width;
      const isHl = hl.has(norm(w));
      let fill = isHl && !boxHighlight ? p.accent : p.text;
      if (isHl && boxHighlight) {
        ctx.save();
        ctx.fillStyle = p.accent;
        ctx.shadowColor = "rgba(0,0,0,.35)";
        ctx.shadowBlur = 30;
        ctx.beginPath();
        ctx.roundRect(x - size * 0.08, baseline - size * 0.82, ww + size * 0.16, size * 0.98, size * 0.12);
        ctx.fill();
        ctx.restore();
        fill = luminance(p.accent) > 0.45 ? "#111111" : "#ffffff";
      }
      ctx.save();
      if (neon) {
        ctx.shadowColor = isHl ? p.accent : "#22d3ee";
        ctx.shadowBlur = size * 0.25;
        ctx.fillStyle = fill;
        ctx.fillText(w, x, baseline);
        ctx.fillText(w, x, baseline);
      } else {
        ctx.shadowColor = "rgba(0,0,0,.55)";
        ctx.shadowBlur = soft ? 30 : 40;
        ctx.shadowOffsetY = soft ? 6 : 14;
        if (!soft && !(isHl && boxHighlight)) {
          ctx.lineWidth = size * (playful || style === "Gaming" ? 0.17 : 0.11);
          ctx.strokeStyle = p.stroke;
          ctx.strokeText(w, x, baseline);
          ctx.shadowColor = "transparent";
        }
        ctx.fillStyle = fill;
        ctx.fillText(w, x, baseline);
      }
      ctx.restore();
      x += ww + space;
    }
  });
  const textMid = y0 + textH / 2;
  y0 += textH;

  // Subtext pill
  if (subH) {
    ctx.font = `700 54px ${o.subFont}`;
    const label = o.uppercase ? c.subtext.toUpperCase() : c.subtext;
    const sw = Math.min(box.w, ctx.measureText(label).width + 60);
    const sx = align === "left" ? box.x : align === "right" ? box.x + box.w - sw : box.x + (box.w - sw) / 2;
    const sy = y0 + 22;
    ctx.fillStyle = lightText ? "rgba(0,0,0,.6)" : "rgba(255,255,255,.75)";
    ctx.beginPath();
    ctx.roundRect(sx, sy, sw, 78, 39);
    ctx.fill();
    ctx.fillStyle = p.text;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(label, sx + sw / 2, sy + 42, sw - 40);
  }
  ctx.restore();

  // 5. Arrow pointing from the text towards the subject
  if (o.showArrow) {
    const [fx, fy] = pbox ? [pbox.x + pbox.w / 2, pbox.y + pbox.h * 0.42] : focal(c.layout);
    // Start beside the widest line so the arrow never crosses the headline; skip it when there is no room.
    const maxW = Math.max(0, ...lines.map((l) => l.width));
    if (eff === "left" && fx - 230 - (box.x + maxW + 70) > 220) drawArrow(ctx, [box.x + maxW + 70, textMid], [fx - 230, fy + 40], p);
    else if (eff === "right" && box.x + box.w - maxW - 70 - (fx + 230) > 220) drawArrow(ctx, [box.x + box.w - maxW - 70, textMid], [fx + 230, fy + 40], p);
    else if (eff === "top") drawArrow(ctx, [W * 0.22, 520], [fx - 300, fy], p);
    else if (eff === "bottom") drawArrow(ctx, [W * 0.22, 560], [fx - 300, fy + 60], p);
  }

  // 6. Emoji sticker on the subject side
  if (o.showEmoji && c.emoji) {
    const [ex, ey] = eff === "right" ? [200, 190] : eff === "bottom" ? [W - 200, 190] : eff === "top" ? [W - 200, H - 230] : [W - 200, 190];
    ctx.save();
    ctx.font = `200px ${EMOJI_FONT}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.shadowColor = "rgba(0,0,0,.5)";
    ctx.shadowBlur = 30;
    ctx.translate(ex, ey);
    ctx.rotate(0.12);
    ctx.fillText(c.emoji, 0, 0);
    ctx.restore();
  }

  // 7. Channel tag, bottom-left (YouTube puts the video length bottom-right)
  if (o.channel) {
    ctx.font = `700 40px ${o.subFont}`;
    const label = o.channel.startsWith("@") ? o.channel : `@${o.channel}`;
    const tw = ctx.measureText(label).width + 48;
    ctx.fillStyle = "rgba(0,0,0,.55)";
    ctx.beginPath();
    ctx.roundRect(40, H - 100, tw, 62, 31);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(label, 64, H - 67);
  }
}
