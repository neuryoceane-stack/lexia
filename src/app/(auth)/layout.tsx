"use client";

import { useEffect, useRef, useCallback } from "react";

const WORDS = [
  "serendipity", "bonjour", "Heimweh", "ephemeral",
  "vocabulaire", "vellichor", "merci", "schadenfreude",
  "liberté", "nostalgia", "Weltschmerz", "aurora",
  "résoudre", "lacuna", "sublime", "saudade", "éphémère",
  "wanderlust", "mot", "palabra", "Wort", "parola",
  "apprendre", "mémoriser", "réviser", "lexique",
  "hiraeth", "soleil", "renaissance", "querencia",
  "語彙", "암기", "词汇", "漢字", "逃げる",
];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);

  const spawnWord = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;

    const span = document.createElement("span");
    const word = WORDS[Math.floor(Math.random() * WORDS.length)];
    const fontSize = 10 + Math.random() * 5;
    const duration = 7 + Math.random() * 10;
    const left = Math.random() * (el.offsetWidth - 120);

    span.textContent = word;
    Object.assign(span.style, {
      position: "absolute",
      left: `${left}px`,
      top: "0px",
      fontSize: `${fontSize}px`,
      fontWeight: "500",
      color: "#6C3FC8",
      opacity: "0",
      pointerEvents: "none",
      whiteSpace: "nowrap",
      animation: `floatWord ${duration}s linear forwards`,
      zIndex: "1",
    });

    el.appendChild(span);
    setTimeout(() => span.remove(), (duration + 1) * 1000);
  }, []);

  useEffect(() => {
    for (let i = 0; i < 18; i++) {
      setTimeout(spawnWord, i * 400);
    }
    const interval = setInterval(spawnWord, 600);
    return () => clearInterval(interval);
  }, [spawnWord]);

  return (
    <>
      <style>{`
        @keyframes floatWord {
          0%   { transform: translateY(-20px); opacity: 0; }
          8%   { opacity: 0.18; }
          85%  { opacity: 0.14; }
          100% { transform: translateY(100vh); opacity: 0; }
        }
      `}</style>
      <div
        ref={containerRef}
        className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4"
        style={{ background: "#EDE9FE" }}
      >
        <div className="relative w-full max-w-[320px]" style={{ zIndex: 10 }}>
          {children}
        </div>
      </div>
    </>
  );
}
