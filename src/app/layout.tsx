import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Providers } from "@/components/providers";
import { PwaRegister } from "@/components/pwa-register";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "LEXIVA — Apprendre du vocabulaire",
  description: "Listes de vocabulaire, révisions et suivi de progression",
  manifest: "/manifest.json",
  icons: { icon: "/logo.png", apple: "/logo.png" },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Lexiva",
  },
};

export const viewport: Viewport = {
  themeColor: "#6C3FC8",
  /** Clavier virtuel par-dessus le contenu (évite le redimensionnement du layout). */
  interactiveWidget: "overlays-content",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className={`${inter.variable} font-sans antialiased`}>
        <Providers>
          <PwaRegister />
          {children}
        </Providers>
      </body>
    </html>
  );
}
