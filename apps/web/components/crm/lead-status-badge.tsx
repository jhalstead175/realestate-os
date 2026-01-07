'use client';

import { Badge } from '@/components/ui/badge';

interface LeadStatusBadgeProps {
  status: string;
}

export function LeadStatusBadge({ status }: LeadStatusBadgeProps) {
  const variants: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    new: { label: 'New', variant: 'default' },
    contacted: { label: 'Contacted', variant: 'secondary' },
    qualified: { label: 'Qualified', variant: 'default' },
    converted: { label: 'Converted', variant: 'default' },
    lost: { label: 'Lost', variant: 'destructive' },
  };

  const config = variants[status] || { label: status, variant: 'outline' };

  return <Badge variant={config.variant}>{config.label}</Badge>;
}
