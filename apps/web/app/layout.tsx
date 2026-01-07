// app/layout.tsx
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <title>⬤ Obsidian Reality — Birthed in Ceremony</title>
        <meta name="description" content="A cinematic rite of ascension. Forged in ash and aether." />
      </head>
      <body className="bg-black text-gray-300 antialiased font-mono overflow-hidden">
        {/* Resonance overlay */}
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-br from-gray-900/30 via-transparent to-black/50" />
        </div>

        <div className="relative z-10">
          {children}
        </div>

        {/* Ceremonial sigil in corner */}
        <div className="fixed bottom-4 right-4 text-xs text-gray-700">
          ⬤ BIRTHED IN VOID. FORGED IN GOLD.
        </div>
      </body>
    </html>
  );
}
