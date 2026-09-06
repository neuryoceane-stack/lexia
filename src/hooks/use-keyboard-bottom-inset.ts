"use client";

import { useEffect, useState } from "react";

/**
 * Hauteur occupée par le clavier virtuel (px depuis le bas du layout viewport).
 * 0 quand le clavier est fermé ou sur desktop.
 */
export function useKeyboardBottomInset(): number {
  const [inset, setInset] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const update = () => {
      const vv = window.visualViewport;
      if (!vv) {
        setInset(0);
        return;
      }
      const next = Math.max(
        0,
        Math.round(window.innerHeight - vv.height - vv.offsetTop)
      );
      setInset(next);
    };

    update();
    const vv = window.visualViewport;
    vv?.addEventListener("resize", update);
    vv?.addEventListener("scroll", update);
    window.addEventListener("resize", update);

    return () => {
      vv?.removeEventListener("resize", update);
      vv?.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  return inset;
}
