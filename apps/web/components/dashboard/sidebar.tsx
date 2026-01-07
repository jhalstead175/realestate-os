'use client';

import { Button } from '@/components/ui/button';
import {
  Home,
  Users,
  FileText,
  DollarSign,
  Calendar,
  Settings,
  BarChart3,
  Bell,
  HelpCircle,
  LogOut,
  PlusCircle
} from 'lucide-react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Leads', href: '/dashboard/leads', icon: Users },
  { name: 'Transactions', href: '/dashboard/transactions', icon: FileText },
  { name: 'Properties', href: '/dashboard/properties', icon: Home },
  { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
  { name: 'Calendar', href: '/dashboard/calendar', icon: Calendar },
  { name: 'Finances', href: '/dashboard/finances', icon: DollarSign },
  { name: 'Notifications', href: '/dashboard/notifications', icon: Bell },
];

export function DashboardSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:block w-64 border-r bg-white">
      <div className="flex h-full flex-col">
        <div className="p-6">
          <Button className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
            <PlusCircle className="h-4 w-4 mr-2" />
            New Transaction
          </Button>
        </div>
        
        <nav className="flex-1 space-y-1 px-3">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
            
            return (
              <a
                key={item.name}
                href={item.href}
                className={cn(
                  'flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border border-blue-200'
                    : 'text-gray-700 hover:bg-gray-100'
                )}
              >
                <Icon className={cn('h-5 w-5 mr-3', isActive ? 'text-blue-600' : 'text-gray-400')} />
                {item.name}
              </a>
            );
          })}
        </nav>
        
        <div className="border-t p-4">
          <div className="space-y-2">
            <a
              href="/dashboard/settings"
              className="flex items-center rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              <Settings className="h-5 w-5 mr-3 text-gray-400" />
              Settings
            </a>
            <a
              href="/dashboard/help"
              className="flex items-center rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              <HelpCircle className="h-5 w-5 mr-3 text-gray-400" />
              Help & Support
            </a>
            <a
              href="/logout"
              className="flex items-center rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
            >
              <LogOut className="h-5 w-5 mr-3" />
              Logout
            </a>
          </div>
        </div>
      </div>
    </aside>
  );
}
