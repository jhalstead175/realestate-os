'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { 
  Mail, 
  Phone, 
  Calendar, 
  FileText, 
  MessageSquare, 
  CheckCircle, 
  UserPlus,
  Star,
  Tag,
  Clock,
  Eye
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

interface LeadActivity {
  id: string;
  activity_type: string;
  activity_data: any;
  performed_by: string;
  created_at: string;
  user?: {
    first_name: string;
    last_name: string;
    avatar_url: string;
  };
}

interface LeadActivityFeedProps {
  leadId: string;
  limit?: number;
}

const activityIcons = {
  created: UserPlus,
  status_changed: CheckCircle,
  note_added: MessageSquare,
  email_sent: Mail,
  email_received: Mail,
  call_made: Phone,
  call_received: Phone,
  meeting_scheduled: Calendar,
  meeting_completed: Calendar,
  task_created: FileText,
  task_completed: CheckCircle,
  lead_score_changed: Star,
  property_viewed: Eye,
  document_sent: FileText,
  document_signed: FileText,
};

const activityColors = {
  created: 'bg-blue-100 text-blue-800',
  status_changed: 'bg-green-100 text-green-800',
  note_added: 'bg-yellow-100 text-yellow-800',
  email_sent: 'bg-indigo-100 text-indigo-800',
  email_received: 'bg-purple-100 text-purple-800',
  call_made: 'bg-cyan-100 text-cyan-800',
  call_received: 'bg-cyan-100 text-cyan-800',
  meeting_scheduled: 'bg-orange-100 text-orange-800',
  meeting_completed: 'bg-green-100 text-green-800',
  task_created: 'bg-gray-100 text-gray-800',
  task_completed: 'bg-green-100 text-green-800',
  lead_score_changed: 'bg-amber-100 text-amber-800',
  property_viewed: 'bg-pink-100 text-pink-800',
  document_sent: 'bg-gray-100 text-gray-800',
  document_signed: 'bg-green-100 text-green-800',
};

export function LeadActivityFeed({ leadId, limit }: LeadActivityFeedProps) {
  const [activities, setActivities] = useState<LeadActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    loadActivities();
  }, [leadId]);

  const loadActivities = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('lead_activities')
        .select('*, user:profiles(first_name, last_name, avatar_url)')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: false })
        .limit(limit || 50);

      if (!error && data) {
        setActivities(data);
      }
    } catch (error) {
      console.error('Error loading activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActivityMessage = (activity: LeadActivity) => {
    const { activity_type, activity_data } = activity;
    
    switch (activity_type) {
      case 'created':
        return 'Lead was created';
      case 'status_changed':
        return `Status changed from ${activity_data.old_status} to ${activity_data.new_status}`;
      case 'note_added':
        return `Note added: "${activity_data.note.substring(0, 100)}${activity_data.note.length > 100 ? '...' : ''}"`;
      case 'email_sent':
        return `Email sent: "${activity_data.subject}"`;
      case 'email_received':
        return `Email received: "${activity_data.subject}"`;
      case 'call_made':
        return `Call made${activity_data.duration ? ` (${activity_data.duration} mins)` : ''}`;
      case 'call_received':
        return `Call received${activity_data.duration ? ` (${activity_data.duration} mins)` : ''}`;
      case 'meeting_scheduled':
        return `Meeting scheduled: ${activity_data.title}`;
      case 'meeting_completed':
        return `Meeting completed: ${activity_data.title}`;
      case 'task_created':
        return `Task created: "${activity_data.title}"`;
      case 'task_completed':
        return `Task completed: "${activity_data.title}"`;
      case 'lead_score_changed':
        return `Lead score changed from ${activity_data.old_score} to ${activity_data.new_score}`;
      case 'property_viewed':
        return `Viewed property: ${activity_data.property_address}`;
      case 'document_sent':
        return `Document sent: "${activity_data.document_name}"`;
      case 'document_signed':
        return `Document signed: "${activity_data.document_name}"`;
      default:
        return activity_type.replace('_', ' ');
    }
  };

  const getInitials = (user: any) => {
    if (user?.first_name && user?.last_name) {
      return `${user.first_name[0]}${user.last_name[0]}`.toUpperCase();
    }
    return 'U';
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-start space-x-3 animate-pulse">
            <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-8">
        <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">No activity yet</h3>
        <p className="text-gray-600">
          Start interacting with this lead to see activity here
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {activities.map((activity) => {
        const IconComponent = activityIcons[activity.activity_type as keyof typeof activityIcons];
        const colorClass = activityColors[activity.activity_type as keyof typeof activityColors];
        
        return (
          <div key={activity.id} className="flex items-start space-x-3 group">
            <div className="relative">
              <Avatar className="h-10 w-10">
                {activity.user?.avatar_url ? (
                  <AvatarImage src={activity.user.avatar_url} />
                ) : null}
                <AvatarFallback className="bg-gray-100">
                  {getInitials(activity.user)}
                </AvatarFallback>
              </Avatar>
              <div className={`absolute -bottom-1 -right-1 h-6 w-6 rounded-full border-2 border-white flex items-center justify-center ${colorClass}`}>
                {IconComponent && <IconComponent className="h-3 w-3" />}
              </div>
            </div>
            
            <div className="flex-1 space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="font-medium">
                    {activity.user?.first_name} {activity.user?.last_name}
                  </span>
                  <Badge className={colorClass}>
                    {activity.activity_type.replace('_', ' ')}
                  </Badge>
                </div>
                <div className="flex items-center text-sm text-gray-500">
                  <Clock className="h-3 w-3 mr-1" />
                  {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                </div>
              </div>
              
              <p className="text-gray-700">
                {getActivityMessage(activity)}
              </p>
              
              {activity.activity_data?.metadata && (
                <div className="text-sm text-gray-500">
                  {Object.entries(activity.activity_data.metadata).map(([key, value]) => (
                    <div key={key}>
                      {key}: {String(value)}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}