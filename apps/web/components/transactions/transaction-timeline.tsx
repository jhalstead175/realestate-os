'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Calendar,
  FileText,
  CheckCircle,
  AlertCircle,
  DollarSign,
  Home,
  Users,
  Clock,
  Mail,
  Phone,
  ArrowRight
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

interface TransactionTimelineProps {
  transactionId: string;
}

interface TimelineEvent {
  id: string;
  event_type: string;
  event_data: any;
  performed_by_name: string;
  created_at: string;
}

const eventIcons = {
  created: Calendar,
  status_changed: ArrowRight,
  offer_made: DollarSign,
  offer_accepted: CheckCircle,
  inspection_scheduled: Calendar,
  inspection_completed: CheckCircle,
  appraisal_ordered: DollarSign,
  appraisal_received: FileText,
  loan_approved: CheckCircle,
  title_ordered: FileText,
  closing_scheduled: Calendar,
  closing_completed: CheckCircle,
  funds_released: DollarSign,
  keys_delivered: Home,
  note_added: FileText,
  document_uploaded: FileText,
  document_signed: CheckCircle,
  task_completed: CheckCircle,
  deadline_missed: AlertCircle,
};

const eventColors = {
  created: 'bg-blue-500',
  status_changed: 'bg-purple-500',
  offer_made: 'bg-green-500',
  offer_accepted: 'bg-emerald-500',
  inspection_scheduled: 'bg-orange-500',
  inspection_completed: 'bg-green-500',
  appraisal_ordered: 'bg-yellow-500',
  appraisal_received: 'bg-lime-500',
  loan_approved: 'bg-emerald-500',
  title_ordered: 'bg-indigo-500',
  closing_scheduled: 'bg-rose-500',
  closing_completed: 'bg-green-500',
  funds_released: 'bg-teal-500',
  keys_delivered: 'bg-cyan-500',
  note_added: 'bg-gray-500',
  document_uploaded: 'bg-blue-500',
  document_signed: 'bg-green-500',
  task_completed: 'bg-emerald-500',
  deadline_missed: 'bg-red-500',
};

export function TransactionTimeline({ transactionId }: TransactionTimelineProps) {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    loadEvents();
  }, [transactionId]);

  const loadEvents = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('transaction_events')
        .select('*')
        .eq('transaction_id', transactionId)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setEvents(data);
      }
    } catch (error) {
      console.error('Error loading timeline events:', error);
    } finally {
      setLoading(false);
    }
  };

  const getEventMessage = (event: TimelineEvent) => {
    const { event_type, event_data } = event;
    
    switch (event_type) {
      case 'created':
        return 'Transaction was created';
      case 'offer_accepted':
        return `Offer accepted for $${event_data.offer_amount?.toLocaleString() || 'unknown amount'}`;
      case 'inspection_completed':
        return 'Home inspection completed';
      case 'document_signed':
        return `Document signed: ${event_data.document_name || 'Unknown document'}`;
      case 'task_completed':
        return `Task completed: ${event_data.task_title || 'Unknown task'}`;
      case 'closing_scheduled':
        return 'Closing date scheduled';
      case 'closing_completed':
        return 'Transaction closed successfully';
      default:
        return event_type.replace(/_/g, ' ');
    }
  };

  const getEventDetails = (event: TimelineEvent) => {
    const details = [];
    
    if (event.event_data?.note) {
      details.push(event.event_data.note);
    }
    
    if (event.event_data?.inspector) {
      details.push(`Inspector: ${event.event_data.inspector}`);
    }
    
    if (event.event_data?.findings) {
      details.push(`Findings: ${event.event_data.findings}`);
    }
    
    return details;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-start space-x-4 animate-pulse">
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

  if (events.length === 0) {
    return (
      <div className="text-center py-12">
        <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">No timeline events yet</h3>
        <p className="text-gray-600 mb-4">
          Start adding tasks, documents, and updates to see the timeline here.
        </p>
        <Button variant="outline">
          Add First Event
        </Button>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Timeline line */}
      <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gray-200"></div>
      
      <div className="space-y-8">
        {events.map((event, index) => {
          const EventIcon = eventIcons[event.event_type as keyof typeof eventIcons] || Calendar;
          const eventColor = eventColors[event.event_type as keyof typeof eventColors] || 'bg-gray-500';
          const details = getEventDetails(event);
          
          return (
            <div key={event.id} className="relative flex items-start space-x-4 group">
              {/* Timeline dot */}
              <div className={`relative z-10 flex-shrink-0 w-10 h-10 rounded-full ${eventColor} flex items-center justify-center`}>
                <EventIcon className="h-5 w-5 text-white" />
              </div>
              
              {/* Content */}
              <div className="flex-1 bg-white p-4 rounded-lg border shadow-sm group-hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="font-semibold text-gray-900">
                      {getEventMessage(event)}
                    </h4>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge variant="outline" className="capitalize">
                        {event.event_type.replace(/_/g, ' ')}
                      </Badge>
                      <span className="text-sm text-gray-500">
                        by {event.performed_by_name || 'System'}
                      </span>
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">
                    {formatDistanceToNow(new Date(event.created_at), { addSuffix: true })}
                  </div>
                </div>
                
                {details.length > 0 && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                    {details.map((detail, idx) => (
                      <p key={idx} className="text-sm text-gray-600">
                        {detail}
                      </p>
                    ))}
                  </div>
                )}
                
                {event.event_data && Object.keys(event.event_data).length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {Object.entries(event.event_data).map(([key, value]) => {
                      if (typeof value === 'string' && value.length > 50) return null;
                      if (key === 'note' || key === 'inspector' || key === 'findings') return null;
                      
                      return (
                        <Badge key={key} variant="secondary" className="text-xs">
                          {key}: {String(value)}
                        </Badge>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}