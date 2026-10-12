// Subtle 3D tilt + glare on cards that follow a mouse or pen. Touch is left alone so scrolling stays smooth.
import { useEffect, type RefObject } from "react";

export function useTiltCards(root: RefObject<HTMLElement | null>, selector: string, maxDeg = 7) {
  useEffect(() => {
    const el = root.current;
    if (!el || window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    let active: HTMLElement | null = null;
    const reset = (card: HTMLElement) => { card.style.removeProperty("--rx"); card.style.removeProperty("--ry"); card.classList.remove("is-tilting"); };
    const move = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      const card = (e.target as HTMLElement | null)?.closest<HTMLElement>(selector) ?? null;
      if (active && active !== card) reset(active);
      active = card;
      if (!card) return;
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
      card.classList.add("is-tilting");
      card.style.setProperty("--rx", `${((0.5 - py) * maxDeg).toFixed(2)}deg`);
      card.style.setProperty("--ry", `${((px - 0.5) * maxDeg).toFixed(2)}deg`);
      card.style.setProperty("--gx", `${(px * 100).toFixed(0)}%`);
      card.style.setProperty("--gy", `${(py * 100).toFixed(0)}%`);
    };
    const leave = () => { if (active) reset(active); active = null; };
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerleave", leave);
    return () => { el.removeEventListener("pointermove", move); el.removeEventListener("pointerleave", leave); };
  }, [root, selector, maxDeg]);
}
