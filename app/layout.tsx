import type { Metadata } from "next";
import { Allura, Cormorant_Garamond, Manrope } from "next/font/google";
import "./globals.css";

const display = Cormorant_Garamond({ variable: "--font-display", subsets: ["latin"], weight: ["400", "500", "600"] });
const sans = Manrope({ variable: "--font-sans", subsets: ["latin"], weight: ["400", "500", "600", "700"] });
const script = Allura({ variable: "--font-script", subsets: ["latin"], weight: "400" });
const siteUrl = process.env.SITE_URL ?? "http://localhost:3000";
const socialImage = "/sheer-elegance-logo.png";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Sheer Elegance | Luxury Hair Studio ",
  description: "Healthy hair, considered styling and an experience designed entirely around you. Book your Sheer Elegance appointment.",
  icons: { icon: "/sheer-elegance-logo.png", shortcut: "/sheer-elegance-logo.png" },
  openGraph: {
    title: "Sheer Elegance | Luxury Hair Studio",
    description: "Healthy hair, considered styling and an experience designed entirely around you. Book your Sheer Elegance appointment.",
    url: siteUrl,
    siteName: "Oreoluwa Sheer Elegance",
    images: [{ url: socialImage, width: 1200, height: 630, alt: "Oreoluwa Sheer Elegance" }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Sheer Elegance | Luxury Hair Studio",
    description: "Healthy hair, considered styling and an experience designed entirely around you. Book your Sheer Elegance appointment.",
    images: [socialImage],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body className={`${display.variable} ${sans.variable} ${script.variable}`}>{children}</body></html>;
}
