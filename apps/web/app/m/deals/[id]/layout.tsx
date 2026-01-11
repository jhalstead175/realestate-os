/**
 * Mobile Deal Layout
 *
 * Simple navigation between mobile views.
 * Large tap targets, text over icons, calm design.
 */

'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';

export default function MobileDealLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { id: string };
}) {
  const pathname = usePathname();
  const dealId = params.id;

  const tabs = [
    { label: 'Summary', href: `/m/deals/${dealId}/summary` },
    { label: 'Timeline', href: `/m/deals/${dealId}/timeline` },
    { label: 'Messages', href: `/m/deals/${dealId}/messages` },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Tab Navigation */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="flex">
          {tabs.map((tab) => {
            const isActive = pathname === tab.href;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`flex-1 text-center py-4 text-sm font-medium transition-colors ${
                  isActive
                    ? 'text-gray-900 border-b-2 border-gray-900'
                    : 'text-gray-500'
                }`}
              >
                {tab.label}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Content */}
      {children}
    </div>
  );
}
