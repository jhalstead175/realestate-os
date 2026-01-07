'use client';

import { useParams } from 'next/navigation';
import { TransactionDetail } from '@/components/transactions/transaction-detail';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function TransactionDetailPage() {
  const params = useParams();
  const transactionId = params.id as string;

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Link href="/dashboard/transactions">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Pipeline
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Transaction Details</h1>
          <p className="text-gray-600">
            Manage all aspects of this transaction
          </p>
        </div>
      </div>

      <TransactionDetail transactionId={transactionId} />
    </div>
  );
}
