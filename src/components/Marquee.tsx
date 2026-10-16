import { projects } from "@/data/projects";

const names = projects.filter((p) => p.slug !== "identity" && p.slug !== "earlier").map((p) => p.name);

function Track({ hidden }: { hidden?: boolean }) {
  return (
    <div className="marquee__track" aria-hidden={hidden}>
      {names.map((n) => (
        <span className="marquee__item" key={n}>
          {n}
        </span>
      ))}
    </div>
  );
}

export default function Marquee() {
  return (
    <div className="marquee" aria-label="Brands I have designed for">
      <Track />
      <Track hidden />
    </div>
  );
}
