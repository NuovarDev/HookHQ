import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HookHQ",
  description:
    "Open source Event Destinations infrastructure for webhooks, queues, retries, portals, and operator control.",
  icons: {
    icon: "/logo.svg",
    shortcut: "/logo.svg",
    apple: "/logo.svg",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
