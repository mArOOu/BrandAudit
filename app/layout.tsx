import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BrandAudit — Clearer brands, stronger direction",
  description: "A considered workspace for building professional brand audit reports.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
