'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  Home, 
  Users, 
  DollarSign, 
  Calendar, 
  FileText,
  CheckCircle,
  AlertCircle,
  Clock,
  Mail,
  Phone,
  MapPin,
  Building,
  User,
  Download,
  Upload,
  Share2,
  MoreVertical
} from 'lucide-react';
import { format } from 'date-fns';
import { TransactionTimeline } from './transaction-timeline';
import { TransactionChecklist } from './transaction-checklist';
import { TransactionDocuments } from './transaction-documents';
import { TransactionFinances } from './transaction-finances';

interface TransactionDetailProps {
const StatusIcon = getStatusIcon(transaction.status);
const daysToClose = calculateDaysToClose();

return (
  <div className="space-y-6">
    {/* Transaction Header */}
    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
      <div>
        <div className="flex items-center space-x-3">
          <h1 className="text-2xl font-bold">
            {transaction.transaction_number}
          </h1>
          <Badge className={`${getStatusColor(transaction.status)} px-3 py-1`}>
            <StatusIcon className="h-3 w-3 mr-1" />
            {transaction.status.replace('_', ' ')}
          </Badge>
        </div>
        <div className="flex items-center text-gray-600 mt-1">
          <MapPin className="h-4 w-4 mr-1" />
          <span>{transaction.property_address}, {transaction.property_city}, {transaction.property_state}</span>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <Button variant="outline" size="sm">
          <Edit className="h-4 w-4 mr-2" />
          Edit
        </Button>
        <Button variant="outline" size="sm">
          <Share2 className="h-4 w-4 mr-2" />
          Share
        </Button>
        <Button variant="outline" size="sm">
          <Printer className="h-4 w-4 mr-2" />
          Print
        </Button>
      </div>
    </div>

    {/* Quick Stats */}
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Card>
        <CardContent className="p-4">
          <div className="text-sm text-gray-600">Purchase Price</div>
          <div className="text-xl font-bold">
            {formatCurrency(transaction.accepted_price || transaction.offer_price)}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="text-sm text-gray-600">Earnest Money</div>
          <div className="text-xl font-bold">
            {formatCurrency(transaction.earnest_money)}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {transaction.earnest_money_holder || 'Not specified'}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="text-sm text-gray-600">Contract Date</div>
          <div className="text-xl font-bold">
            {transaction.contract_date ? format(new Date(transaction.contract_date), 'MMM d') : 'Not set'}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="text-sm text-gray-600">Closing Date</div>
          <div className="text-xl font-bold">
            {transaction.closing_date ? format(new Date(transaction.closing_date), 'MMM d') : 'Not set'}
          </div>
          {daysToClose && (
            <div className="text-xs text-gray-500 mt-1">
              {daysToClose} days to close
            </div>
          )}
        </CardContent>
      </Card>
    </div>

    {/* Main Content */}
    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
      <TabsList className="grid grid-cols-5 lg:grid-cols-8">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="timeline">Timeline</TabsTrigger>
        <TabsTrigger value="checklist">Checklist</TabsTrigger>
        <TabsTrigger value="documents">Documents</TabsTrigger>
        <TabsTrigger value="finances">Finances</TabsTrigger>
        <TabsTrigger value="parties">Parties</TabsTrigger>
        <TabsTrigger value="contingencies">Contingencies</TabsTrigger>
        <TabsTrigger value="notes">Notes</TabsTrigger>
      </TabsList>

      {/* Overview Tab */}
      <TabsContent value="overview" className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Property Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Home className="h-5 w-5 mr-2" />
                  Property Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm text-gray-600">Address</Label>
                    <div className="font-medium">{transaction.property_address}</div>
                    <div className="text-sm text-gray-600">
                      {transaction.property_city}, {transaction.property_state} {transaction.property_zip}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm text-gray-600">List Price</Label>
                      <div className="font-medium">{formatCurrency(transaction.list_price)}</div>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-600">Accepted Price</Label>
                      <div className="font-medium text-green-600">
                        {formatCurrency(transaction.accepted_price)}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Transaction Checklist Preview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CheckCircle className="h-5 w-5 mr-2" />
                  Upcoming Tasks
                </CardTitle>
                <CardDescription>
                  Critical tasks that need attention
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TransactionChecklist transactionId={transactionId} preview={true} />
              </CardContent>
            </Card>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Transaction Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Transaction Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Status</span>
                  <Badge className={getStatusColor(transaction.status)}>
                    {transaction.status.replace('_', ' ')}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Transaction #</span>
                  <span className="font-mono text-sm">{transaction.transaction_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Created</span>
                  <span className="text-sm">
                    {format(new Date(transaction.created_at), 'MMM d, yyyy')}
                  </span>
                </div>
                <Separator />
                <div className="space-y-2">
                  <div className="flex justify-between font-medium">
                    <span>Listing Agent</span>
                    <span>{transaction.listing_agent_name}</span>
                  </div>
                  <div className="flex justify-between font-medium">
                    <span>Buyer's Agent</span>
                    <span>{transaction.buyer_agent_name}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Service Providers */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Building className="h-5 w-5 mr-2" />
                  Service Providers
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {transaction.title_company && (
                  <div>
                    <div className="text-sm text-gray-600">Title Company</div>
                    <div className="font-medium">{transaction.title_company}</div>
                    {transaction.title_officer && (
                      <div className="text-sm text-gray-600">{transaction.title_officer}</div>
                    )}
                  </div>
                )}
                {transaction.lender && (
                  <div>
                    <div className="text-sm text-gray-600">Lender</div>
                    <div className="font-medium">{transaction.lender}</div>
                    {transaction.loan_officer && (
                      <div className="text-sm text-gray-600">{transaction.loan_officer}</div>
                    )}
                  </div>
                )}
                {transaction.inspector && (
                  <div>
                    <div className="text-sm text-gray-600">Inspector</div>
                    <div className="font-medium">{transaction.inspector}</div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </TabsContent>

      {/* Other Tabs */}
      <TabsContent value="timeline">
        <TransactionTimeline transactionId={transactionId} />
      </TabsContent>

      <TabsContent value="checklist">
        <TransactionChecklist transactionId={transactionId} />
      </TabsContent>

      <TabsContent value="documents">
        <TransactionDocuments transactionId={transactionId} />
      </TabsContent>

      <TabsContent value="finances">
        <TransactionFinances transactionId={transactionId} />
      </TabsContent>

      <TabsContent value="parties">
        <TransactionParties transaction={transaction} />
      </TabsContent>

      <TabsContent value="contingencies">
        <Card>
          <CardHeader>
            <CardTitle>Contingencies</CardTitle>
            <CardDescription>
              Track all contingencies and their status
</CardDescription>
          </CardHeader>
          <CardContent>
            {transaction.contingencies ? (
              <div className="space-y-4">
                {Object.entries(transaction.contingencies).map(([key, value]: [string, any]) => (
                  <div key={key} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium capitalize">{key.replace('_', ' ')}</div>
                      {value.deadline && (
                        <div className="text-sm text-gray-600">
                          Due: {format(new Date(value.deadline), 'MMM d, yyyy')}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      {value.satisfied ? (
                        <Badge className="bg-green-100 text-green-800">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Satisfied
                        </Badge>
                      ) : value.active ? (
                        <Badge className="bg-yellow-100 text-yellow-800">
                          <Clock className="h-3 w-3 mr-1" />
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="outline">Not Active</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No contingencies specified</p>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="notes">
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
            <CardDescription>
              Additional notes and comments about this transaction
            </CardDescription>
          </CardHeader>
          <CardContent>
            {transaction.notes ? (
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="whitespace-pre-wrap">{transaction.notes}</p>
              </div>
            ) : (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No notes yet</p>
                <Button className="mt-4" variant="outline">
                  <Edit className="h-4 w-4 mr-2" />
                  Add Note
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  </div>
);
 