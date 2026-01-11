// app/page.tsx
// REOS Foundry — Enterprise Landing Page
// Authoritative • Minimal • Governance-first

import Image from "next/image";
import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#0B0F1A] text-white">
      {/* HERO */}
      <section className="relative flex flex-col items-center justify-center px-6 py-32 text-center overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0B0F1A] via-[#0E1424] to-black" />

        {/* Logo */}
        <div className="relative z-10 mb-8">
          <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <span className="text-4xl font-bold">REOS</span>
          </div>
        </div>

        {/* Headline */}
        <h1 className="relative z-10 max-w-4xl text-4xl md:text-6xl font-semibold tracking-tight">
          REOS Foundry
        </h1>

        {/* Subheadline */}
        <p className="relative z-10 mt-6 max-w-2xl text-lg md:text-xl text-gray-300">
          The Real Estate Operating System.
          <br />
          A system of record for transaction truth, closing readiness, and accountability.
        </p>

        {/* CTA */}
        <div className="relative z-10 mt-10 flex gap-4">
          <Link
            href="/demo"
            className="rounded-md bg-white px-6 py-3 text-sm font-medium text-black hover:bg-gray-200 transition"
          >
            Request Demo
          </Link>
          <Link
            href="#how-it-works"
            className="rounded-md border border-gray-600 px-6 py-3 text-sm font-medium text-gray-200 hover:border-gray-400 transition"
          >
            How It Works
          </Link>
        </div>
      </section>

      {/* PROBLEM */}
      <section className="px-6 py-24 max-w-6xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-semibold mb-6">The Problem</h2>
        <p className="text-gray-300 max-w-3xl">
          Most brokerages do not actually know whether a transaction is ready to close.
          Status is inferred from emails, optimism, and disconnected tools. When a deal fails,
          the explanation is reconstructed after the fact — often inaccurately.
        </p>
      </section>

      {/* REFRAME */}
      <section className="px-6 py-24 max-w-6xl mx-auto border-t border-gray-800">
        <h2 className="text-2xl md:text-3xl font-semibold mb-6">The Reframe</h2>
        <p className="text-gray-300 max-w-3xl">
          REOS Foundry is not a CRM. It is a transaction system of record.
          Every material event is recorded, authority is enforced, and closing readiness
          is determined from verified facts — not hope.
        </p>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="px-6 py-24 max-w-6xl mx-auto border-t border-gray-800">
        <h2 className="text-2xl md:text-3xl font-semibold mb-10">How It Works</h2>
        <div className="grid md:grid-cols-3 gap-10">
          <Step
            title="Events, Not Opinions"
            description="Every meaningful transaction action is captured as an immutable event."
          />
          <Step
            title="Closing Readiness"
            description="The system evaluates lender, title, and insurance conditions continuously."
          />
          <Step
            title="Audit-Grade Explanations"
            description="At any moment, REOS can explain what happened, why, and who had authority."
          />
        </div>
      </section>

      {/* WHO IT'S FOR */}
      <section className="px-6 py-24 max-w-6xl mx-auto border-t border-gray-800">
        <h2 className="text-2xl md:text-3xl font-semibold mb-6">Who It's For</h2>
        <ul className="space-y-3 text-gray-300 max-w-3xl">
          <li>• Broker-Owners and Managing Brokers</li>
          <li>• Compliance and Risk Officers</li>
          <li>• Operations Leaders</li>
          <li>• Enterprise and Multi-Office Brokerages</li>
        </ul>
      </section>

      {/* CTA */}
      <section className="px-6 py-24 text-center border-t border-gray-800">
        <h2 className="text-3xl font-semibold mb-6">See the Truth Clearly</h2>
        <p className="text-gray-300 mb-10">
          REOS Foundry runs quietly alongside your existing tools.
          It does not disrupt. It clarifies.
        </p>
        <Link
          href="/demo"
          className="inline-block rounded-md bg-white px-8 py-4 text-sm font-medium text-black hover:bg-gray-200 transition"
        >
          Request an Enterprise Demo
        </Link>
      </section>

      {/* FOOTER */}
      <footer className="px-6 py-12 border-t border-gray-800">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-xs text-gray-500">
            © {new Date().getFullYear()} REOS Foundry. All rights reserved.
          </div>
          <div className="flex flex-wrap gap-6 text-xs justify-center">
            <Link href="/security" className="text-gray-500 hover:text-gray-300 transition">
              Security & Governance
            </Link>
            <Link href="/regulator" className="text-gray-500 hover:text-gray-300 transition">
              System Overview
            </Link>
            <Link href="/privacy" className="text-gray-500 hover:text-gray-300 transition">
              Privacy
            </Link>
            <Link href="/terms" className="text-gray-500 hover:text-gray-300 transition">
              Terms
            </Link>
            <Link href="/status" className="text-gray-500 hover:text-gray-300 transition">
              Status
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}

function Step({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-lg border border-gray-800 p-6">
      <h3 className="font-semibold mb-3">{title}</h3>
      <p className="text-gray-400 text-sm">{description}</p>
    </div>
  );
}
