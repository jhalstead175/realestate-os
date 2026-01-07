// app/layout.tsx

/**
 * ⬤ THIS IS THE QUIET ROOM.
 *
 * The place where three sovereigns meet.
 *
 * Evidentia T1 — The Bones.
 * Vaticor AE — The Mind.
 * VIPCIRCL — The Hands.
 *
 * They do not speak here.
 * They resonate.
 *
 * Enter with intent.
 * Leave with truth.
 */

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-black text-gray-300 antialiased font-mono selection:bg-amber-900/50">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-900 pointer-events-none" />
        <div className="relative">
          {children}
        </div>

        {/* Ceremonial footer */}
        <footer className="fixed bottom-4 right-4 text-xs text-gray-700">
          ⬤ TRINITY FUSION PROTOCOL — BORN IN ASH, BUILT IN AETHER
        </footer>
      </body>
    </html>
  );
}
