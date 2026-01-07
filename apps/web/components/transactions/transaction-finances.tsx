'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  DollarSign,
  PieChart,
  TrendingUp,
  Download,
  Plus,
  Edit,
  CheckCircle,
  Clock,
  Users,
  Calculator,
  FileText,
  CreditCard
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell } from 'recharts';

interface TransactionFinancesProps {
  transactionId: string;
}

interface ClosingCost {
  id: string;
  party: string;
  category: string;
  description: string;
  amount: number;
  paid_by: string;
  is_paid: boolean;
}

interface CommissionPayout {
  id: string;
  recipient_name: string;
  recipient_type: string;
  amount: number;
  percentage: number;
  status: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

export function TransactionFinances({ transactionId }: TransactionFinancesProps) {
  const [closingCosts, setClosingCosts] = useState<ClosingCost[]>([]);
  const [commissionPayouts, setCommissionPayouts] = useState<CommissionPayout[]>([]);
  const [transaction, setTransaction] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const supabase = createClient();

  useEffect(() => {
    loadFinances();
  }, [transactionId]);

  const loadFinances = async () => {
    setLoading(true);
    try {
      // Load transaction
      const { data: txData } = await supabase
        .from('transactions')
        .select('*')
        .eq('id', transactionId)
        .single();

      // Load closing costs
      const { data: costsData } = await supabase
        .from('closing_costs')
        .select('*')
        .eq('transaction_id', transactionId);

      // Load commission payouts
      const { data: commissionData } = await supabase
        .from('commission_payouts')
        .select('*')
        .eq('transaction_id', transactionId);

      if (txData) setTransaction(txData);
      if (costsData) setClosingCosts(costsData);
      if (commissionData) setCommissionPayouts(commissionData);

    } catch (error) {
      console.error('Error loading finances:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getTotals = () => {
    const buyerCosts = closingCosts.filter(c => c.party === 'buyer').reduce((sum, c) => sum + c.amount, 0);
    const sellerCosts = closingCosts.filter(c => c.party === 'seller').reduce((sum, c) => sum + c.amount, 0);
    const totalCommission = commissionPayouts.reduce((sum, p) => sum + p.amount, 0);
    const netProceeds = (transaction?.accepted_price || 0) - sellerCosts;
    
    return {
      buyerCosts,
      sellerCosts,
      totalCommission,
      netProceeds,
      totalCosts: buyerCosts + sellerCosts,
    };
  };

  const getChartData = () => {
    const categories = Array.from(new Set(closingCosts.map(c => c.category)));
    return categories.map(category => {
      const total = closingCosts
        .filter(c => c.category === category)
        .reduce((sum, c) => sum + c.amount, 0);
      
      return {
        name: category.replace('_', ' '),
        value: total,
        buyer: closingCosts.filter(c => c.category === category && c.party === 'buyer').reduce((sum, c) => sum + c.amount, 0),
        seller: closingCosts.filter(c => c.category === category && c.party === 'seller').reduce((sum, c) => sum + c.amount, 0),
      };
    });
  };

  const getCommissionChartData = () => {
    return commissionPayouts.map(payout => ({
      name: payout.recipient_name,
      value: payout.amount,
      percentage: payout.percentage,
    }));
  };

  const totals = getTotals();
  const chartData = getChartData();
  const commissionChartData = getCommissionChartData();

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-48 bg-gray-200 rounded"></div>
        <div className="grid grid-cols-2 gap-4">
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4">
          <TabsTrigger value="overview">
            <PieChart className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="closing-costs">
            <Calculator className="h-4 w-4 mr-2" />
            Closing Costs
          </TabsTrigger>
          <TabsTrigger value="commission">
            <Users className="h-4 w-4 mr-2" />
            Commission
          </TabsTrigger>
          <TabsTrigger value="calculator">
            <CreditCard className="h-4 w-4 mr-2" />
            Calculator
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-600">Purchase Price</div>
                    <div className="text-2xl font-bold">
                      {formatCurrency(transaction?.accepted_price || 0)}
                    </div>
                  </div>
                  <DollarSign className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-600">Total Closing Costs</div>
                    <div className="text-2xl font-bold">
                      {formatCurrency(totals.totalCosts)}
                    </div>
                  </div>
                  <Calculator className="h-8 w-8 text-blue-500" />
                </div>
                <div className="flex justify-between text-sm mt-2">
                  <span className="text-gray-600">Buyer: {formatCurrency(totals.buyerCosts)}</span>
                  <span className="text-gray-600">Seller: {formatCurrency(totals.sellerCosts)}</span>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-600">Total Commission</div>
                    <div className="text-2xl font-bold">
                      {formatCurrency(totals.totalCommission)}
                    </div>
                  </div>
                  <Users className="h-8 w-8 text-purple-500" />
                </div>
                <div className="text-sm text-gray-600 mt-2">
                  {transaction?.commission_split?.listing_agent?.percent || 0}% / {transaction?.commission_split?.buyer_agent?.percent || 0}% split
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-600">Seller Net Proceeds</div>
                    <div className="text-2xl font-bold text-green-600">
                      {formatCurrency(totals.netProceeds)}
                    </div>
                  </div>
                  <TrendingUp className="h-8 w-8 text-emerald-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Closing Costs Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Closing Costs Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                      <Bar dataKey="buyer" name="Buyer Costs" fill="#0088FE" />
                      <Bar dataKey="seller" name="Seller Costs" fill="#00C49F" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Commission Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Commission Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={commissionChartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {commissionChartData.map((entry, index) => (
                         <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Closing Costs Tab */}
        <TabsContent value="closing-costs" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">Closing Costs</h3>
              <p className="text-gray-600">Track all transaction-related expenses</p>
            </div>
            <Button className="bg-gradient-to-r from-blue-600 to-indigo-600">
              <Plus className="h-4 w-4 mr-2" />
              Add Cost
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Buyer Costs */}
            <Card>
              <CardHeader className="bg-blue-50">
                <CardTitle className="text-blue-700">Buyer Costs</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y">
                  {closingCosts.filter(c => c.party === 'buyer').map((cost) => (
                    <div key={cost.id} className="p-4 hover:bg-gray-50">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium">{cost.description}</div>
                          <div className="text-sm text-gray-600">
                            {cost.category.replace('_', ' ')}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold">{formatCurrency(cost.amount)}</div>
                          <Badge variant={cost.is_paid ? "default" : "outline"} className="mt-1">
                            {cost.is_paid ? 'Paid' : 'Pending'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                  {closingCosts.filter(c => c.party === 'buyer').length === 0 && (
                    <div className="p-4 text-center text-gray-500">
                      No buyer costs added
                    </div>
                  )}
                  <div className="p-4 border-t bg-gray-50">
                    <div className="flex justify-between font-bold">
                      <span>Total Buyer Costs</span>
                      <span>{formatCurrency(totals.buyerCosts)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Seller Costs */}
            <Card>
              <CardHeader className="bg-green-50">
                <CardTitle className="text-green-700">Seller Costs</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y">
                  {closingCosts.filter(c => c.party === 'seller').map((cost) => (
                    <div key={cost.id} className="p-4 hover:bg-gray-50">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium">{cost.description}</div>
                          <div className="text-sm text-gray-600">
                            {cost.category.replace('_', ' ')}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold">{formatCurrency(cost.amount)}</div>
                          <Badge variant={cost.is_paid ? "default" : "outline"} className="mt-1">
                            {cost.is_paid ? 'Paid' : 'Pending'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                  {closingCosts.filter(c => c.party === 'seller').length === 0 && (
                    <div className="p-4 text-center text-gray-500">
                      No seller costs added
                    </div>
                  )}
                  <div className="p-4 border-t bg-gray-50">
                    <div className="flex justify-between font-bold">
                      <span>Total Seller Costs</span>
                      <span>{formatCurrency(totals.sellerCosts)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Summary */}
            <Card>
              <CardHeader className="bg-gray-50">
                <CardTitle>Financial Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Purchase Price</span>
                    <span className="font-medium">{formatCurrency(transaction?.accepted_price || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Buyer Closing Costs</span>
                    <span className="font-medium text-red-600">-{formatCurrency(totals.buyerCosts)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Seller Closing Costs</span>
                    <span className="font-medium text-red-600">-{formatCurrency(totals.sellerCosts)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Commission</span>
                    <span className="font-medium text-red-600">-{formatCurrency(totals.totalCommission)}</span>
                  </div>
                  <div className="border-t pt-3">
                    <div className="flex justify-between text-lg font-bold">
                      <span>Seller Net Proceeds</span>
                      <span className="text-green-600">{formatCurrency(totals.netProceeds)}</span>
                    </div>
                  </div>
                </div>
                
                <Button className="w-full" variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Download Settlement Statement
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Commission Tab */}
        <TabsContent value="commission" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">Commission Payouts</h3>
              <p className="text-gray-600">Track commission splits and payments</p>
            </div>
            <Button variant="outline">
              <Edit className="h-4 w-4 mr-2" />
              Edit Split
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Commission Split */}
            <Card>
              <CardHeader>
                <CardTitle>Commission Split</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {commissionPayouts.map((payout) => (
                    <div key={payout.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold">
                          {payout.recipient_name[0]}
                        </div>
                        <div>
                          <div className="font-medium">{payout.recipient_name}</div>
                          <div className="text-sm text-gray-600">{payout.recipient_type}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">{formatCurrency(payout.amount)}</div>
                        <div className="text-sm text-gray-600">{payout.percentage}%</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Payout Status */}
            <Card>
              <CardHeader>
                <CardTitle>Payout Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {commissionPayouts.map((payout) => (
                    <div key={payout.id} className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{payout.recipient_name}</div>
                        <div className="text-sm text-gray-600">{formatCurrency(payout.amount)}</div>
                      </div>
                      <Badge 
                        className={
                          payout.status === 'paid' ? 'bg-green-100 text-green-800' :
                          payout.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }
                      >
                        {payout.status === 'paid' ? (
                          <CheckCircle className="h-3 w-3 mr-1" />
                        ) : (
                          <Clock className="h-3 w-3 mr-1" />
                        )}
                        {payout.status}
                      </Badge>
                    </div>
                  ))}
                  
                  <div className="border-t pt-4 mt-4">
                    <div className="flex justify-between font-bold">
                      <span>Total Commission</span>
                      <span>{formatCurrency(totals.totalCommission)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600 mt-1">
                      <span>Based on {transaction?.accepted_price ? formatCurrency(transaction.accepted_price) : 'N/A'} sale price</span>
                      <span>Commission rate: {totals.totalCommission / (transaction?.accepted_price || 1) * 100}%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}