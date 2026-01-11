// app/demo/page.tsx
// Demo Request Page

'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function DemoRequestPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    role: '',
    agentCount: '',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // TODO: Send to your backend/email service
    console.log('Demo request:', formData);

    setSubmitted(true);
  };

  if (submitted) {
    return (
      <main className="min-h-screen bg-[#0B0F1A] text-white flex items-center justify-center px-6">
        <div className="max-w-md text-center">
          <div className="mb-6 text-6xl">✓</div>
          <h1 className="text-3xl font-semibold mb-4">Request Received</h1>
          <p className="text-gray-300 mb-8">
            Thank you for your interest in REOS Foundry. We'll be in touch within 24 hours to schedule your executive demo.
          </p>
          <Link
            href="/"
            className="inline-block rounded-md border border-gray-600 px-6 py-3 text-sm font-medium text-gray-200 hover:border-gray-400 transition"
          >
            Back to Home
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0B0F1A] text-white">
      <div className="max-w-2xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="mb-12">
          <Link href="/" className="text-gray-400 hover:text-white text-sm mb-4 inline-block">
            ← Back to Home
          </Link>
          <h1 className="text-4xl font-semibold mb-4">Request an Enterprise Demo</h1>
          <p className="text-gray-300">
            See how REOS Foundry provides transaction certainty for enterprise brokerages.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-2">
              Full Name *
            </label>
            <input
              type="text"
              id="name"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 rounded-md bg-[#1a1f2e] border border-gray-700 text-white focus:outline-none focus:border-gray-500"
              placeholder="John Smith"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-2">
              Email *
            </label>
            <input
              type="email"
              id="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-3 rounded-md bg-[#1a1f2e] border border-gray-700 text-white focus:outline-none focus:border-gray-500"
              placeholder="john@brokerage.com"
            />
          </div>

          <div>
            <label htmlFor="company" className="block text-sm font-medium mb-2">
              Brokerage Name *
            </label>
            <input
              type="text"
              id="company"
              required
              value={formData.company}
              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              className="w-full px-4 py-3 rounded-md bg-[#1a1f2e] border border-gray-700 text-white focus:outline-none focus:border-gray-500"
              placeholder="Acme Realty"
            />
          </div>

          <div>
            <label htmlFor="role" className="block text-sm font-medium mb-2">
              Your Role *
            </label>
            <select
              id="role"
              required
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="w-full px-4 py-3 rounded-md bg-[#1a1f2e] border border-gray-700 text-white focus:outline-none focus:border-gray-500"
            >
              <option value="">Select role...</option>
              <option value="broker-owner">Broker-Owner / Principal Broker</option>
              <option value="managing-broker">Managing Broker</option>
              <option value="coo">COO / Operations Leader</option>
              <option value="compliance">Compliance / Risk Officer</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label htmlFor="agentCount" className="block text-sm font-medium mb-2">
              Number of Agents
            </label>
            <select
              id="agentCount"
              value={formData.agentCount}
              onChange={(e) => setFormData({ ...formData, agentCount: e.target.value })}
              className="w-full px-4 py-3 rounded-md bg-[#1a1f2e] border border-gray-700 text-white focus:outline-none focus:border-gray-500"
            >
              <option value="">Select range...</option>
              <option value="1-50">1-50</option>
              <option value="50-100">50-100</option>
              <option value="100-300">100-300</option>
              <option value="300-500">300-500</option>
              <option value="500+">500+</option>
            </select>
          </div>

          <div>
            <label htmlFor="message" className="block text-sm font-medium mb-2">
              Message (Optional)
            </label>
            <textarea
              id="message"
              rows={4}
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              className="w-full px-4 py-3 rounded-md bg-[#1a1f2e] border border-gray-700 text-white focus:outline-none focus:border-gray-500"
              placeholder="Tell us about your brokerage and what challenges you're facing..."
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-md bg-white px-6 py-4 text-sm font-medium text-black hover:bg-gray-200 transition"
          >
            Request Demo
          </button>

          <p className="text-xs text-gray-500 text-center">
            By submitting this form, you agree to be contacted about REOS Foundry.
          </p>
        </form>
      </div>
    </main>
  );
}
