'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp,
  AlertCircle,
  Clock,
  CheckCircle,
  DollarSign,
  Users,
  Home,
  Calendar,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { format } from 'date-fns';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export function TransactionDashboard() {
  const [stats, setStats] = useState({
    totalVolume: 0,
    avgDaysToClose: 0,
    closingRate: 0,
    activeTransactions: 0,
    urgentTasks: 0,
    commissionEarned: 0,
  });
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [upcomingDeadlines, setUpcomingDeadlines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Load transaction stats
      const { data: transactions } = await supabase
        .from('transactions')
        .select('*');

      // Load upcoming deadlines
      const { data: deadlines } = await supabase
        .from('upcoming_deadlines')
        .select('*')
        .limit(5);

      if (transactions) {
        const totalVolume = transactions.reduce((sum, tx) => sum + (tx.closing_price || 0), 0);
        const closedTransactions = transactions.filter(tx => tx.status === 'closed');
        const avgDaysToClose = closedTransactions.length > 0
          ? closedTransactions.reduce((sum, tx) => {
              if (tx.closing_date && tx.contract_date) {
                const days = (new Date(tx.closing_date).getTime() - new Date(tx.contract_date).getTime()) / (1000 * 60 * 60 * 24);
                return sum + days;
              }
              return sum;
            }, 0) / closedTransactions.length
          : 0;

        const closingRate = transactions.length > 0
          ? (closedTransactions.length / transactions.length) * 100
          : 0;

        const activeTransactions = transactions.filter(tx => 
          ['under_contract', 'due_diligence', 'financing', 'closing'].includes(tx.status)
        ).length;

        const commissionEarned = closedTransactions.reduce((sum, tx) => sum + (tx.commission_total || 0), 0);

        setStats({
          totalVolume,
          avgDaysToClose: Math.round(avgDaysToClose),
          closingRate: Math.round(closingRate),
          activeTransactions,
          urgentTasks: deadlines?.length || 0,
          commissionEarned,
        });

        setRecentTransactions(transactions.slice(0, 5));
      }

      if (deadlines) {
        setUpcomingDeadlines(deadlines);
      }

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const performanceData = [
    { month: 'Jan', volume: 1200000, transactions: 4 },
    { month: 'Feb', volume: 1800000, transactions: 6 },
    { month: 'Mar', volume: 2200000, transactions: 7 },
    { month: 'Apr', volume: 1900000, transactions: 5 },
    { month: 'May', volume: 2500000, transactions: 8 },
    { month: 'Jun', volume: 3200000, transactions: 10 },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
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
      {/* Performance Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="h-5 w-5 mr-2" />
            Transaction Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => [
                  typeof value === 'number' ? `$${value.toLocaleString()}` : value,
                  'Volume'
                ]} />
                <Line 
                  type="monotone" 
                  dataKey="volume" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">
                  ${(stats.totalVolume / 1000000).toFixed(1)}M
                </div>
                <div className="text-sm text-gray-600">Pipeline Volume</div>
              </div>
              <div className="p-2 bg-blue-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div className="flex items-center text-sm text-green-600 mt-2">
              <ArrowUp className="h-3 w-3 mr-1" />
              +12% from last month
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{stats.avgDaysToClose}</div>
                <div className="text-sm text-gray-600">Avg Days to Close</div>
              </div>
              <div className="p-2 bg-green-100 rounded-lg">
                <Calendar className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <div className="flex items-center text-sm text-green-600 mt-2">
              <ArrowDown className="h-3 w-3 mr-1" />
              -3 days from average
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{stats.closingRate}%</div>
                <div className="text-sm text-gray-600">Closing Rate</div>
              </div>
              <div className="p-2 bg-purple-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <div className="flex items-center text-sm text-green-600 mt-2">
              <ArrowUp className="h-3 w-3 mr-1" />
              +8% from target
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{stats.activeTransactions}</div>
                <div className="text-sm text-gray-600">Active Transactions</div>
              </div>
              <div className="p-2 bg-orange-100 rounded-lg">
                <Users className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{stats.urgentTasks}</div>
                <div className="text-sm text-gray-600">Urgent Tasks</div>
              </div>
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">
                  ${(stats.commissionEarned / 1000).toFixed(1)}k
                </div>
                <div className="text-sm text-gray-600">Commission Earned</div>
              </div>
              <div className="p-2 bg-emerald-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions & Deadlines */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Transactions */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentTransactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${
                      transaction.status === 'closed' ? 'bg-green-100 text-green-800' :
                      transaction.status === 'closing' ? 'bg-blue-100 text-blue-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {transaction.status === 'closed' ? (
                        <CheckCircle className="h-5 w-5" />
                      ) : transaction.status === 'closing' ? (
                        <Clock className="h-5 w-5" />
                      ) : (
                        <AlertCircle className="h-5 w-5" />
                      )}
                    </div>
                    <div>
                      <div className="font-medium">{transaction.transaction_number}</div>
                      <div className="text-sm text-gray-600">
                        {transaction.property_city}, {transaction.property_state}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">
                      ${transaction.closing_price?.toLocaleString() || 'N/A'}
                    </div>
                    <Badge variant="outline" className="mt-1 capitalize">
                      {transaction.status.replace('_', ' ')}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Deadlines */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Upcoming Deadlines</span>
              <Badge variant="destructive">{upcomingDeadlines.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingDeadlines.map((deadline) => (
                <div key={deadline.task_id} className="p-3 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium">{deadline.task_title}</div>
                    <Badge className={
                      deadline.deadline_urgency === 'today' ? 'bg-red-100 text-red-800' :
                      deadline.deadline_urgency === 'tomorrow' ? 'bg-orange-100 text-orange-800' :
                      'bg-yellow-100 text-yellow-800'
                    }>
                      {deadline.deadline_urgency}
                    </Badge>
                  </div>
                  <div className="text-sm text-gray-600">
                    <div className="flex items-center">
                      <Home className="h-3 w-3 mr-1" />
                      {deadline.transaction_number}
                    </div>
                    <div className="flex items-center mt-1">
                      <Calendar className="h-3 w-3 mr-1" />
                      Due: {format(new Date(deadline.due_date), 'MMM d, yyyy')}
                    </div>
                    {deadline.assignee_name && (
                      <div className="flex items-center mt-1">
                        <Users className="h-3 w-3 mr-1" />
                        Assigned to: {deadline.assignee_name}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              {upcomingDeadlines.length === 0 && (
                <div className="text-center py-6">
                  <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No upcoming deadlines</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}