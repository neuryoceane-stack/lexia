import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, DM_Sans } from "next/font/google";
import { Providers } from "@/components/providers";
import { PwaRegister } from "@/components/pwa-register";
import { BRAND_NAME, BRAND_SHORT } from "@/lib/brand";
import { designTokens } from "@/lib/design-tokens";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  weight: ["700"],
  display: "swap",
});

const title = `${BRAND_NAME} — Apprendre du vocabulaire`;
const description = "Listes de vocabulaire, révisions et suivi de progression";

export const metadata: Metadata = {
  title,
  description,
  applicationName: BRAND_NAME,
  manifest: "/manifest.json",
  icons: {
    icon: [{ url: "/favicon.ico", sizes: "32x32", type: "image/x-icon" }],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: BRAND_SHORT,
  },
  openGraph: {
    title,
    description,
    siteName: BRAND_NAME,
    type: "website",
    locale: "fr_FR",
  },
};

export const viewport: Viewport = {
  themeColor: designTokens.ink,
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
      <body className={`${dmSans.variable} ${bricolage.variable} font-sans antialiased`}>
        <Providers>
          <PwaRegister />
          {children}
        </Providers>
      </body>
    </html>
  );
}
