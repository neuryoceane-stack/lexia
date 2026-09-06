"use client";

import { useEffect, useState } from "react";

export type VisualViewportLayout = {
  /** Hauteur visible (px) — rétrécit quand le clavier s'ouvre. */
  height: number;
  /** Décalage vertical du viewport visible (iOS). */
  offsetTop: number;
  /** Hauteur occupée par le clavier depuis le bas (px). */
  keyboardInset: number;
};

function readVisualViewportLayout(): VisualViewportLayout {
  if (typeof window === "undefined") {
    return { height: 0, offsetTop: 0, keyboardInset: 0 };
  }
  const vv = window.visualViewport;
  if (!vv) {
    return {
      height: window.innerHeight,
      offsetTop: 0,
      keyboardInset: 0,
    };
  }
  const keyboardInset = Math.max(
    0,
    Math.round(window.innerHeight - vv.height - vv.offsetTop)
  );
  return {
    height: Math.round(vv.height),
    offsetTop: Math.round(vv.offsetTop),
    keyboardInset,
  };
}

/**
 * Dimensions du viewport visible — permet de caler le layout dictée mobile
 * au-dessus du clavier sans scroll ni contenu coupé.
 */
export function useVisualViewportLayout(): VisualViewportLayout {
  const [layout, setLayout] = useState<VisualViewportLayout>(() =>
    readVisualViewportLayout()
  );

  useEffect(() => {
    const update = () => setLayout(readVisualViewportLayout());

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

  return layout;
}

/** @deprecated Préférer useVisualViewportLayout().keyboardInset */
export function useKeyboardBottomInset(): number {
  return useVisualViewportLayout().keyboardInset;
}
