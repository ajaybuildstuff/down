import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "down. — Going Live 25 November 2026",
  description:
    "A new social space, built for real life. Initial username collection opens 11 November 2026. Global launch on 25 November 2026.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body>{children}</body>
    </html>
  );
}
