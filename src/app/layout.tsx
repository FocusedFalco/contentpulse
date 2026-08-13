import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ContentPulse | Content Performance & Editorial Intelligence",
  description: "Aggregated multi-channel content performance analytics and automated narrative-driven editorial reports using Gemini.",
  metadataBase: new URL("http://localhost:3000"),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <title>ContentPulse | Content Performance & Editorial Intelligence</title>
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
