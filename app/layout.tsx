import type { Metadata } from "next";
import { Allura, Cormorant_Garamond, Manrope } from "next/font/google";
import "./globals.css";

const display = Cormorant_Garamond({ variable: "--font-display", subsets: ["latin"], weight: ["400", "500", "600"] });
const sans = Manrope({ variable: "--font-sans", subsets: ["latin"], weight: ["400", "500", "600", "700"] });
const script = Allura({ variable: "--font-script", subsets: ["latin"], weight: "400" });

export const metadata: Metadata = {
  title: "Sheer Elegance | Luxury Hair Studio in Lagos",
  description: "Healthy hair, considered styling and an experience designed entirely around you. Book your Sheer Elegance appointment.",
  icons: { icon: "/sheer-elegance-logo.png", shortcut: "/sheer-elegance-logo.png" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body className={`${display.variable} ${sans.variable} ${script.variable}`}>{children}</body></html>;
}
