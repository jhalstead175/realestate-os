'use client';

import { Lead } from '@realestate-os/shared';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  DollarSign, 
  Home, 
  Users, 
  FileText,
  MessageSquare,
  Activity,
  Star,
  Tag,
  Clock,
  User
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { LeadActivityFeed } from './lead-activity-feed';
import { LeadTasks } from './lead-tasks';
import { LeadCommunications } from './lead-communications';
import { LeadScoreIndicator } from './lead-score-indicator';

interface LeadDetailProps {
  lead: Lead;
  onClose?: () => void;
}

export function LeadDetail({ lead, onClose }: LeadDetailProps) {
  const getInitials = () => {
    if (lead.first_name && lead.last_name) {
      return `${lead.first_name[0]}${lead.last_name[0]}`.toUpperCase();
    }
    return lead.email[0].toUpperCase();
  };

  const getStatusColor = (status: string) => {
    const colors = {
      new: 'bg-blue-100 text-blue-800',
      contacted: 'bg-yellow-100 text-yellow-800',
      qualified: 'bg-green-100 text-green-800',
      unqualified: 'bg-red-100 text-red-800',
      converted: 'bg-purple-100 text-purple-800',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      {/* Lead Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center space-x-4">
          <Avatar className="h-16 w-16">
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-xl">
              {getInitials()}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-bold">
              {lead.first_name} {lead.last_name}
            </h1>
            <div className="flex items-center space-x-2 mt-1">
              <Badge className={getStatusColor(lead.status)}>
                {lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}
              </Badge>
              <LeadScoreIndicator score={lead.lead_score} showLabel />
              <Badge variant="outline">{lead.source}</Badge>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <MessageSquare className="h-4 w-4 mr-2" />
            Send Message
          </Button>
          <Button size="sm" className="bg-gradient-to-r from-blue-600 to-indigo-600">
            <Activity className="h-4 w-4 mr-2" />
            Log Activity
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="communications">Communications</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Lead Info Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Lead Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center">
                    <Mail className="h-4 w-4 mr-3 text-gray-400" />
                    <div>
                      <div className="font-medium">Email</div>
                      <div className="text-sm text-gray-600">{lead.email}</div>
                    </div>
                  </div>
                  {lead.phone && (
                    <div className="flex items-center">
                      <Phone className="h-4 w-4 mr-3 text-gray-400" />
                      <div>
                        <div className="font-medium">Phone</div>
                        <div className="text-sm text-gray-600">{lead.phone}</div>
                      </div>
                    </div>
                  )}
                  {lead.preferred_locations && lead.preferred_locations.length > 0 && (
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-3 text-gray-400" />
                      <div>
                        <div className="font-medium">Preferred Locations</div>
                        <div className="text-sm text-gray-600">
                          {lead.preferred_locations.join(', ')}
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-3 text-gray-400" />
                    <div>
                      <div className="font-medium">Created</div>
                      <div className="text-sm text-gray-600">
                        {format(new Date(lead.created_at), 'PPP')}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Budget & Preferences Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <DollarSign className="h-5 w-5 mr-2" />
                  Budget & Preferences
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {(lead.budget_min || lead.budget_max) && (
                  <div className="space-y-2">
                    <div className="font-medium">Budget Range</div>
                    <div className="flex items-center space-x-2">
                      {lead.budget_min && (
                        <Badge variant="outline">
                          Min: ${lead.budget_min.toLocaleString()}
                        </Badge>
                      )}
                      {lead.budget_max && (
                        <Badge variant="outline">
                          Max: ${lead.budget_max.toLocaleString()}
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
                {(lead.bedrooms_min || lead.bedrooms_max) && (
                  <div className="space-y-2">
                    <div className="font-medium">Bedrooms</div>
                    <div className="flex items-center space-x-2">
                      {lead.bedrooms_min && (
                        <Badge variant="outline">
                          Min: {lead.bedrooms_min}
                        </Badge>
                      )}
                      {lead.bedrooms_max && (
                        <Badge variant="outline">
                          Max: {lead.bedrooms_max}
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
                {lead.notes && (
                  <div className="space-y-2">
                    <div className="font-medium">Notes</div>
                    <p className="text-sm text-gray-600">{lead.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Activity className="h-5 w-5 mr-2" />
                  Quick Actions
                </CardTitle>
                <CardDescription>
                  Common actions for this lead
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full justify-start" variant="outline">
                  <Mail className="h-4 w-4 mr-2" />
                  Send Email Template
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <Phone className="h-4 w-4 mr-2" />
                  Schedule Call
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <Home className="h-4 w-4 mr-2" />
                  Send Property Suggestions
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <Users className="h-4 w-4 mr-2" />
                  Assign to Team Member
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <FileText className="h-4 w-4 mr-2" />
                  Create Task
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <Tag className="h-4 w-4 mr-2" />
                  Add Tags
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity Preview */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Latest interactions with this lead
              </CardDescription>
            </CardHeader>
            <CardContent>
              <LeadActivityFeed leadId={lead.id} limit={5} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity">
          <LeadActivityFeed leadId={lead.id} />
        </TabsContent>

        {/* Tasks Tab */}
        <TabsContent value="tasks">
          <LeadTasks leadId={lead.id} />
        </TabsContent>

        {/* Communications Tab */}
        <TabsContent value="communications">
          <LeadCommunications leadId={lead.id} />
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents">
          <Card>
            <CardHeader>
              <CardTitle>Documents</CardTitle>
              <CardDescription>
                All documents shared with this lead
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No documents yet</h3>
                <p className="text-gray-600 mb-4">
                  Share contracts, disclosures, or other documents with this lead
                </p>
                <Button className="bg-gradient-to-r from-blue-600 to-indigo-600">
                  Upload Document
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}