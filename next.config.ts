import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /** Natif (.node) — requis pour unpdf `renderPageAsImage` côté serveur */
  serverExternalPackages: ["@napi-rs/canvas"],
};

export default nextConfig;
