import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { SmoothScrollProvider } from "@/components/providers/SmoothScrollProvider";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

export const metadata: Metadata = {
  title: "NexusOps — AI Command Center",
  description:
    "Dual-module AI platform: Memory Engine for team knowledge + AutoFix Engine for production incident resolution. One unified cockpit.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${outfit.variable}`}>
      <body
        className="font-sans antialiased bg-background text-foreground selection:bg-primary-yellow selection:text-black"
      >
        <SmoothScrollProvider>
          <Providers>
            {children}
          </Providers>
        </SmoothScrollProvider>
      </body>
    </html>
  );
}
