"use client";

import { motion } from "motion/react";
import Reveal from "./Reveal";
import { skills } from "@/data/profile";

const swatches = ["#ff4a1c", "#8b3fd1", "#13a3b4", "#f2b705", "#5a9e3a", "#e5197d", "#f0ebe1"];

function Orbit() {
  return (
    <svg className="cell__art" viewBox="0 0 200 200" aria-hidden>
      {[90, 66, 42].map((r, i) => (
        <motion.g
          key={r}
          animate={{ rotate: i % 2 ? -360 : 360 }}
          transition={{ duration: 18 + i * 6, repeat: Infinity, ease: "linear" }}
          style={{ originX: "100px", originY: "100px" }}
        >
          <circle cx="100" cy="100" r={r} fill="none" stroke="rgba(13,12,11,.35)" strokeDasharray="2 6" />
          <circle cx={100 + r} cy="100" r={5 - i} fill="#0d0c0b" />
        </motion.g>
      ))}
    </svg>
  );
}

export default function Services() {
  return (
    <section className="section wrap" id="services">
      <div className="section__head">
        <div>
          <span className="eyebrow">Capabilities</span>
          <h2 className="section__title">
            What I <span className="serif">bring</span>
          </h2>
        </div>
        <p className="section__aside">A designer&apos;s eye with a tester&apos;s discipline — and enough web and IT background to talk to developers in their language.</p>
      </div>

      <div className="bento">
        <Reveal className="cell cell--a">
          <div>
            <h3>Brand identity &amp; campaigns</h3>
            <p>
              Logos, guidelines and campaign systems that stay consistent across hundreds of posts — for health-tech, fashion,
              education and startup brands.
            </p>
            <div className="palette" aria-hidden>
              {swatches.map((c) => (
                <i key={c} style={{ background: c }} />
              ))}
            </div>
          </div>
          <div className="cell__tags">
            {skills.craft.map((s) => (
              <span key={s}>{s}</span>
            ))}
          </div>
        </Reveal>

        <Reveal className="cell cell--b" delay={0.1}>
          <Orbit />
          <h3 style={{ position: "relative" }}>Quality assurance</h3>
          <div>
            <p>Functional, visual and cross-device testing before anything ships.</p>
            <div className="cell__tags">
              {skills.qa.map((s) => (
                <span key={s}>{s}</span>
              ))}
            </div>
          </div>
        </Reveal>

        <Reveal className="cell cell--c">
          <div className="typespec" aria-hidden>
            Aa<span className="serif" style={{ color: "var(--accent)" }}>g</span>
          </div>
          <div>
            <h3>Editorial &amp; print</h3>
            <p>Workbooks, handbooks, prospectuses and printable PDFs — 100+ page layouts.</p>
          </div>
        </Reveal>

        <Reveal className="cell cell--d" delay={0.1}>
          <h3>Tools</h3>
          <div className="cell__tags">
            {skills.design.map((s) => (
              <span key={s}>{s}</span>
            ))}
          </div>
        </Reveal>

        <Reveal className="cell cell--e" delay={0.2}>
          <h3>Web &amp; IT</h3>
          <p>A web development diploma plus years of IT administration — I understand how the things I design get built.</p>
          <div className="cell__tags">
            {skills.web.map((s) => (
              <span key={s}>{s}</span>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
