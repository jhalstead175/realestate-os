'use client';

import { Button } from '@/components/ui/button';
import { UserPlus, Mail, Phone, Calendar } from 'lucide-react';

export function QuickActions() {
  return (
    <div className="space-y-2">
      <Button className="w-full justify-start" variant="outline" disabled>
        <UserPlus className="h-4 w-4 mr-2" />
        Add New Lead
      </Button>
      <Button className="w-full justify-start" variant="outline" disabled>
        <Mail className="h-4 w-4 mr-2" />
        Send Email Campaign
      </Button>
      <Button className="w-full justify-start" variant="outline" disabled>
        <Phone className="h-4 w-4 mr-2" />
        Make a Call
      </Button>
      <Button className="w-full justify-start" variant="outline" disabled>
        <Calendar className="h-4 w-4 mr-2" />
        Schedule Meeting
      </Button>
    </div>
  );
}
