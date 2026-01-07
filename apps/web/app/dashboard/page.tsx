'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  TrendingUp, 
  DollarSign, 
  Target, 
  Mail, 
  Phone, 
  Calendar,
  ArrowUp,
  ArrowDown,
  MoreVertical
} from 'lucide-react';
import { LeadsTable } from '@/components/crm/leads-table';
import { LeadFunnelChart } from '@/components/crm/lead-funnel-chart';
import { RecentActivity } from '@/components/crm/recent-activity';
import { QuickActions } from '@/components/crm/quick-actions';
import { format, subDays } from 'date-fns';

interface DashboardMetrics {
  totalLeads: number;
  newLeadsToday: number;
  leadsContacted: number;
  leadsQualified: number;
  conversionRate: number;
  avgLeadScore: number;
  hotLeads: number;
  revenuePipeline: number;
}

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalLeads: 0,
    newLeadsToday: 0,
    leadsContacted: 0,
    leadsQualified: 0,
    conversionRate: 0,
    avgLeadScore: 0,
    hotLeads: 0,
    revenuePipeline: 0,
  });
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Load metrics
      const today = format(new Date(), 'yyyy-MM-dd');
      const weekAgo = format(subDays(new Date(), 7), 'yyyy-MM-dd');

      // Get total leads
      const { count: totalLeads } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true });

      // Get new leads today
      const { count: newLeadsToday } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', `${today}T00:00:00`);

      // Get contacted leads
      const { count: leadsContacted } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'contacted');

      // Get qualified leads
      const { count: leadsQualified } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'qualified');

      // Get average lead score
      const { data: leadScores } = await supabase
        .from('leads')
        .select('lead_score')
        .not('lead_score', 'is', null);

      const avgLeadScore = leadScores?.length 
        ? leadScores.reduce((sum, lead) => sum + lead.lead_score, 0) / leadScores.length
        : 0;

      // Get hot leads (score > 70)
      const { count: hotLeads } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .gt('lead_score', 70);

      // Get conversion rate (qualified / total)
      const conversionRate = totalLeads ? (leadsQualified || 0) / totalLeads * 100 : 0;

      // Get recent leads for table
      const { data: recentLeads } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      setMetrics({
        totalLeads: totalLeads || 0,
        newLeadsToday: newLeadsToday || 0,
        leadsContacted: leadsContacted || 0,
        leadsQualified: leadsQualified || 0,
        conversionRate: Number(conversionRate.toFixed(1)),
        avgLeadScore: Number(avgLeadScore.toFixed(1)),
        hotLeads: hotLeads || 0,
        revenuePipeline: 0, // You'll implement this with transactions
      });

      setLeads(recentLeads || []);

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-gray-600">
          Welcome back! Here's what's happening with your leads today.
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Leads"
          value={metrics.totalLeads}
          icon={<Users className="h-5 w-5" />}
          change={`+${metrics.newLeadsToday} today`}
          changeType="positive"
        />
        
        <MetricCard
          title="Conversion Rate"
          value={`${metrics.conversionRate}%`}
          icon={<TrendingUp className="h-5 w-5" />}
          change="+2.5% from last week"
          changeType="positive"
        />
        
        <MetricCard
          title="Avg Lead Score"
          value={metrics.avgLeadScore}
          icon={<Target className="h-5 w-5" />}
          change={`${metrics.hotLeads} hot leads`}
          changeType="neutral"
        />
        
        <MetricCard
          title="Revenue Pipeline"
          value={`$${(metrics.revenuePipeline / 1000).toFixed(1)}k`}
          icon={<DollarSign className="h-5 w-5" />}
          change="3 deals in progress"
          changeType="positive"
        />
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Leads Table */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Recent Leads</CardTitle>
                <CardDescription>
                  Your most recently created leads
                </CardDescription>
              </div>
              <Button size="sm" variant="outline">
                View All
              </Button>
            </CardHeader>
            <CardContent>
              <LeadsTable leads={leads} />
            </CardContent>
          </Card>

          {/* Lead Funnel */}
          <Card>
            <CardHeader>
              <CardTitle>Lead Funnel</CardTitle>
              <CardDescription>
                Visualize your lead conversion pipeline
              </CardDescription>
            </CardHeader>
            <CardContent>
              <LeadFunnelChart />
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <QuickActions />
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Latest actions across all leads
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RecentActivity />
            </CardContent>
          </Card>

          {/* Stats Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Lead Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
                    <span className="text-sm">New</span>
                  </div>
                  <span className="font-semibold">
                    {metrics.totalLeads - metrics.leadsContacted - metrics.leadsQualified}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></div>
                    <span className="text-sm">Contacted</span>
                  </div>
                  <span className="font-semibold">{metrics.leadsContacted}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                    <span className="text-sm">Qualified</span>
                  </div>
                  <span className="font-semibold">{metrics.leadsQualified}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-purple-500 mr-2"></div>
                    <span className="text-sm">Converted</span>
                  </div>
                  <span className="font-semibold">12</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  change: string;
  changeType: 'positive' | 'negative' | 'neutral';
}

function MetricCard({ title, value, icon, change, changeType }: MetricCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-gray-600">
          {title}
        </CardTitle>
        <div className="text-gray-400">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <div className="flex items-center text-sm text-gray-500 mt-1">
          {changeType === 'positive' && <ArrowUp className="h-3 w-3 mr-1 text-green-500" />}
          {changeType === 'negative' && <ArrowDown className="h-3 w-3 mr-1 text-red-500" />}
          <span>{change}</span>
        </div>
      </CardContent>
    </Card>
  );
}