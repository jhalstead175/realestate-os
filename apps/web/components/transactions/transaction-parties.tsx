'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  User,
  Mail,
  Phone,
  Building,
  Home,
  Briefcase,
  MapPin,
  Calendar,
  MessageSquare,
  FileText,
  Edit,
  Copy,
  Share2,
  MoreVertical
} from 'lucide-react';
import { format } from 'date-fns';

interface TransactionPartiesProps {
  transaction: any;
}

export function TransactionParties({ transaction }: TransactionPartiesProps) {
  const parties = [
    {
      type: 'buyer',
      title: 'Buyer',
      name: transaction.buyer_name,
      email: transaction.buyer_email,
      phone: transaction.buyer_phone,
      icon: User,
      color: 'bg-blue-50 border-blue-200',
      textColor: 'text-blue-700',
    },
    {
      type: 'seller',
      title: 'Seller',
      name: transaction.seller_name,
      email: transaction.seller_email,
      phone: transaction.seller_phone,
      icon: Home,
      color: 'bg-green-50 border-green-200',
      textColor: 'text-green-700',
    },
    {
      type: 'listing_agent',
      title: 'Listing Agent',
      name: transaction.listing_agent_name,
      icon: Briefcase,
      color: 'bg-purple-50 border-purple-200',
      textColor: 'text-purple-700',
    },
    {
      type: 'buyer_agent',
      title: 'Buyer\'s Agent',
      name: transaction.buyer_agent_name,
      icon: Briefcase,
      color: 'bg-orange-50 border-orange-200',
      textColor: 'text-orange-700',
    },
  ];

  const serviceProviders = [
    {
      title: 'Title Company',
      name: transaction.title_company,
      contact: transaction.title_officer,
      phone: transaction.title_phone,
      email: transaction.title_email,
      icon: Building,
    },
    {
      title: 'Lender',
      name: transaction.lender,
      contact: transaction.loan_officer,
      phone: transaction.lender_phone,
      email: transaction.lender_email,
      icon: FileText,
    },
    {
      title: 'Inspector',
      name: transaction.inspector,
      phone: transaction.inspector_phone,
      email: transaction.inspector_email,
      icon: Home,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Main Parties */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {parties.map((party) => {
          const Icon = party.icon;
          
          return (
            <Card key={party.type} className={party.color}>
              <CardHeader>
                <CardTitle className={`flex items-center ${party.textColor}`}>
                  <Icon className="h-5 w-5 mr-2" />
                  {party.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {party.name ? (
                  <div className="space-y-4">
                    <div>
                      <div className="font-bold text-lg">{party.name}</div>
                      {party.email && (
                        <div className="flex items-center text-gray-600 mt-1">
                          <Mail className="h-4 w-4 mr-2" />
                          {party.email}
                        </div>
                      )}
                      {party.phone && (
                        <div className="flex items-center text-gray-600 mt-1">
                          <Phone className="h-4 w-4 mr-2" />
                          {party.phone}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" className="flex-1">
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Message
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1">
                        <FileText className="h-4 w-4 mr-2" />
                        Documents
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <div className="text-gray-400 mb-2">No {party.title.toLowerCase()} assigned</div>
                    <Button size="sm" variant="outline">
                      <Edit className="h-4 w-4 mr-2" />
                      Assign {party.title}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Service Providers */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Service Providers</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {serviceProviders.map((provider) => (
            <Card key={provider.title}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center">
                  <provider.icon className="h-4 w-4 mr-2" />
                  {provider.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {provider.name ? (
                  <div className="space-y-2">
                    <div className="font-medium">{provider.name}</div>
                    {provider.contact && (
                      <div className="text-sm text-gray-600">{provider.contact}</div>
                    )}
                    {provider.phone && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Phone className="h-3 w-3 mr-1" />
                        {provider.phone}
                      </div>
                    )}
                    {provider.email && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Mail className="h-3 w-3 mr-1" />
                        {provider.email}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-sm text-gray-500">Not assigned</div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Contact Log */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Recent Communications</span>
            <Button size="sm" variant="outline">
              <MessageSquare className="h-4 w-4 mr-2" />
              Log Communication
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                    <MessageSquare className="h-5 w-5 text-gray-600" />
                  </div>
                  <div>
                    <div className="font-medium">Email sent to Buyer</div>
                    <div className="text-sm text-gray-600">
                      Purchase agreement details and next steps
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-600">Today, 2:30 PM</div>
                  <Badge variant="outline" className="mt-1">
                    Email
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}