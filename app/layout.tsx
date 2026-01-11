import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "REOS Foundry — Real Estate Operating System",
  description: "REOS Foundry is a transaction system of record for real estate brokerages. It delivers closing readiness, audit-grade narratives, and authority enforcement.",
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
