import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "REOS Foundry — Real Estate Operating System",
  description: "REOS Foundry is a transaction system of record for real estate brokerages. It delivers closing readiness, audit-grade narratives, and authority enforcement.",
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
