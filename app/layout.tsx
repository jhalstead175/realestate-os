import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "REOS Foundry - Transaction System of Record",
  description: "The Real Estate Operating System. A system of record for transaction truth, closing readiness, and accountability.",
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
