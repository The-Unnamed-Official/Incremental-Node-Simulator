import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NodeShift v2 — Breach. Build. Overclock.",
  description: "A neon pixel incremental breach simulator with endless progression.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
