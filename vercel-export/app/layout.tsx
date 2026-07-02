import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "3D Memory Match Adventure - Impact Hub Egypt",
  description: "An interactive, premium 3D memory-matching educational game by Impact Hub Egypt, designed for children aged 3–6 to improve memory, concentration, and multilingual vocabulary.",
  referrer: "no-referrer",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
