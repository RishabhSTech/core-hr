import { useEffect, useState } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import SuperAdminLayout from './SuperAdminLayout';
import { TrendingUp, Users, Building2, DollarSign, Calendar } from 'lucide-react';
import { subDays, format } from 'date-fns';

interface AnalyticsData {
  date: string;
  companies: number;
  users: number;
  revenue: number;
  activeUsers: number;
}

export default function SuperAdminAnalytics() {
  const [analytics, setAnalytics] = useState<AnalyticsData[]>([]);
  const [timeRange, setTimeRange] = useState('30');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate analytics data
    const generateData = () => {
      const days = parseInt(timeRange);
      const data: AnalyticsData[] = [];
      
      for (let i = days; i >= 0; i--) {
        const date = subDays(new Date(), i);
        data.push({
          date: format(date, 'MMM dd'),
          companies: Math.floor(Math.random() * 50) + 100,
          users: Math.floor(Math.random() * 500) + 1000,
          revenue: Math.floor(Math.random() * 100000) + 50000,
          activeUsers: Math.floor(Math.random() * 300) + 500,
        });
      }
      return data;
    };

    setLoading(true);
    setTimeout(() => {
      setAnalytics(generateData());
      setLoading(false);
    }, 500);
  }, [timeRange]);

  return (
    <SuperAdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Analytics</h1>
            <p className="text-purple-200/70 mt-1">Platform performance and growth metrics</p>
          </div>
          <div className="w-48">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="bg-white/10 border-white/20 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-white/20">
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
                <SelectItem value="365">Last year</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[
            { label: 'Total Revenue', value: '₹45.2L', change: '+12.5%', icon: DollarSign, color: 'from-green-500 to-emerald-500' },
            { label: 'Active Users', value: '2,845', change: '+8.2%', icon: Users, color: 'from-blue-500 to-cyan-500' },
            { label: 'Companies', value: '156', change: '+4.3%', icon: Building2, color: 'from-purple-500 to-pink-500' },
            { label: 'Growth Rate', value: '23.5%', change: '+2.1%', icon: TrendingUp, color: 'from-orange-500 to-amber-500' },
          ].map((metric, i) => (
            <Card key={i} className="border-0 bg-white/5 backdrop-blur-xl border border-white/10">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-purple-200/70 mb-2">{metric.label}</p>
                    <p className="text-2xl font-bold text-white">{metric.value}</p>
                    <p className="text-xs text-green-400 mt-2">📈 {metric.change}</p>
                  </div>
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${metric.color}`}>
                    <metric.icon className="h-5 w-5 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts */}
        <Tabs defaultValue="growth" className="space-y-6">
          <TabsList className="bg-white/10 border border-white/20">
            <TabsTrigger value="growth" className="data-[state=active]:bg-white/20">Growth</TabsTrigger>
            <TabsTrigger value="revenue" className="data-[state=active]:bg-white/20">Revenue</TabsTrigger>
            <TabsTrigger value="users" className="data-[state=active]:bg-white/20">Users</TabsTrigger>
          </TabsList>

          <TabsContent value="growth">
            <Card className="border-0 bg-white/5 backdrop-blur-xl border border-white/10">
              <CardHeader>
                <CardTitle>Company Growth</CardTitle>
                <CardDescription>Number of new companies over time</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="h-80 bg-white/10 animate-pulse rounded-lg" />
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={analytics}>
                      <CartesianGrid stroke="#ffffff20" />
                      <XAxis stroke="#a78bfa" />
                      <YAxis stroke="#a78bfa" />
                      <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #ffffff20' }} />
                      <Legend />
                      <Line type="monotone" dataKey="companies" stroke="#a78bfa" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="revenue">
            <Card className="border-0 bg-white/5 backdrop-blur-xl border border-white/10">
              <CardHeader>
                <CardTitle>Revenue Trend</CardTitle>
                <CardDescription>Monthly revenue growth</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="h-80 bg-white/10 animate-pulse rounded-lg" />
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={analytics}>
                      <CartesianGrid stroke="#ffffff20" />
                      <XAxis stroke="#a78bfa" />
                      <YAxis stroke="#a78bfa" />
                      <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #ffffff20' }} />
                      <Legend />
                      <Bar dataKey="revenue" fill="#10b981" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users">
            <Card className="border-0 bg-white/5 backdrop-blur-xl border border-white/10">
              <CardHeader>
                <CardTitle>User Analytics</CardTitle>
                <CardDescription>Active users and growth metrics</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="h-80 bg-white/10 animate-pulse rounded-lg" />
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={analytics}>
                      <CartesianGrid stroke="#ffffff20" />
                      <XAxis stroke="#a78bfa" />
                      <YAxis stroke="#a78bfa" />
                      <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #ffffff20' }} />
                      <Legend />
                      <Line type="monotone" dataKey="users" stroke="#3b82f6" strokeWidth={2} />
                      <Line type="monotone" dataKey="activeUsers" stroke="#06b6d4" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </SuperAdminLayout>
  );
}
