// "Add to cart" flourish: a few rice grains arc from the clicked
// button into the navbar cart icon ([data-cart-icon]), which then bumps.
// Pure DOM + Web Animations API, so no React state or re-renders are involved.
// Skipped entirely when the user prefers reduced motion.

const DEFAULT_PARTICLE = { shape: "grain" as const, colors: ["#EBCB6E", "#FBF7EE", "#D4A62A", "#FBF7EE"] };

/** `particle` sets the grains' shape and colours (rice grains by default). */
export function flyGrainsToCart(
  source: HTMLElement,
  count = 6,
  particle: { shape: "grain" | "bulb"; colors: string[] } = DEFAULT_PARTICLE,
) {
  const bulb = particle.shape === "bulb";
  const [w, h] = bulb ? [10, 10] : [10, 5];
  if (typeof window === "undefined") return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const target = document.querySelector<HTMLElement>("[data-cart-icon]");
  if (!target) return;

  const s = source.getBoundingClientRect();
  const t = target.getBoundingClientRect();
  const sx = s.left + s.width / 2;
  const sy = s.top + s.height / 2;
  const dx = t.left + t.width / 2 - sx;
  const dy = t.top + t.height / 2 - sy;

  for (let i = 0; i < count; i++) {
    const grain = document.createElement("span");
    grain.setAttribute("aria-hidden", "true");
    Object.assign(grain.style, {
      position: "fixed",
      left: `${sx - w / 2}px`,
      top: `${sy - h / 2}px`,
      width: `${w}px`,
      height: `${h}px`,
      borderRadius: bulb ? "50% 50% 46% 46% / 58% 58% 42% 42%" : "9999px",
      background: particle.colors[i % particle.colors.length],
      boxShadow: "0 0 0 1px rgba(166,126,18,0.4)",
      pointerEvents: "none",
      zIndex: "100",
    });
    document.body.appendChild(grain);

    // Quadratic Bézier arc: control point above the midpoint, jittered per grain.
    const cx = dx * 0.5 + (Math.random() - 0.5) * 80;
    const cy = Math.min(0, dy) - 80 - Math.random() * 60;
    const spin = (Math.random() - 0.5) * 720;
    const frames: Keyframe[] = [];
    const steps = 10;
    for (let k = 0; k <= steps; k++) {
      const u = k / steps;
      const x = 2 * (1 - u) * u * cx + u * u * dx;
      const y = 2 * (1 - u) * u * cy + u * u * dy;
      frames.push({
        transform: `translate(${x}px, ${y}px) rotate(${spin * u}deg) scale(${1 - 0.5 * u})`,
        opacity: u > 0.85 ? 0.3 : 1,
      });
    }

    const anim = grain.animate(frames, {
      duration: 650 + i * 40,
      delay: i * 50,
      easing: "cubic-bezier(0.4, 0, 0.6, 1)",
      fill: "backwards",
    });
    anim.onfinish = () => grain.remove();
    anim.oncancel = () => grain.remove();
  }

  target.animate([{ transform: "scale(1)" }, { transform: "scale(1.25)" }, { transform: "scale(1)" }], {
    duration: 320,
    delay: 650,
    easing: "ease-out",
  });
}
