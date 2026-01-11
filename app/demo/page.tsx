// app/demo/page.tsx
// Demo Request Page

'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function DemoPage() {
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    email: '',
    role: '',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // TODO: Send to backend/email service
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
            Your request has been routed to the founding team. We'll respond within 24 hours.
          </p>
          <Link
            href="/"
            className="inline-block rounded-md border border-gray-600 px-6 py-3 text-sm font-medium text-gray-200 hover:border-gray-400 transition"
          >
            ← Back to Home
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0B0F1A] text-white px-6 py-24">
      <div className="max-w-xl mx-auto">
        <h1 className="text-3xl font-semibold mb-6">Request an Enterprise Demo</h1>
        <p className="text-gray-300 mb-10">
          We run a quiet, limited number of pilots. This form routes directly to the founding team.
          No calendars. No automation spam.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            label="Full Name"
            value={formData.name}
            onChange={(value) => setFormData({ ...formData, name: value })}
          />
          <Input
            label="Company"
            value={formData.company}
            onChange={(value) => setFormData({ ...formData, company: value })}
          />
          <Input
            label="Email"
            type="email"
            value={formData.email}
            onChange={(value) => setFormData({ ...formData, email: value })}
          />
          <Input
            label="Role"
            value={formData.role}
            onChange={(value) => setFormData({ ...formData, role: value })}
          />
          <Textarea
            label="What prompted your interest?"
            value={formData.message}
            onChange={(value) => setFormData({ ...formData, message: value })}
          />

          <button
            type="submit"
            className="w-full rounded-md bg-white px-6 py-3 text-sm font-medium text-black hover:bg-gray-200 transition"
          >
            Submit Request
          </button>
        </form>

        <p className="text-xs text-gray-500 mt-6">
          Submitting this form does not subscribe you to marketing communications.
        </p>

        <Link href="/" className="inline-block mt-8 text-sm text-gray-400 hover:text-white">
          ← Back to home
        </Link>
      </div>
    </main>
  );
}

function Input({
  label,
  type = 'text',
  value,
  onChange,
}: {
  label: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="block text-sm mb-2 text-gray-300">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md bg-transparent border border-gray-700 px-4 py-3 text-sm focus:outline-none focus:border-gray-400"
      />
    </div>
  );
}

function Textarea({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="block text-sm mb-2 text-gray-300">{label}</label>
      <textarea
        rows={4}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md bg-transparent border border-gray-700 px-4 py-3 text-sm focus:outline-none focus:border-gray-400"
      />
    </div>
  );
}
