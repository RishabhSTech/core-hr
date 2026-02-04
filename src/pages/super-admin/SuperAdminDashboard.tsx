import { useEffect, useState } from 'react';
import { Building2, Users, CreditCard, TrendingUp, ArrowUpRight, ArrowDownRight, Activity, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import SuperAdminLayout from './SuperAdminLayout';
import { format, subDays } from 'date-fns';

interface DashboardStats {
  totalCompanies: number;
  activeCompanies: number;
  totalUsers: number;
  totalRevenue: number;
  newCompaniesThisWeek: number;
  newUsersThisWeek: number;
}

interface RecentCompany {
  id: string;
  name: string;
  slug: string;
  created_at: string;
  is_active: boolean;
}

const SuperAdminDashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalCompanies: 0,
    activeCompanies: 0,
    totalUsers: 0,
    totalRevenue: 0,
    newCompaniesThisWeek: 0,
    newUsersThisWeek: 0,
  });
  const [recentCompanies, setRecentCompanies] = useState<RecentCompany[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const weekAgo = subDays(new Date(), 7).toISOString();

        // Fetch companies count
        const { count: totalCompanies } = await supabase
          .from('companies')
          .select('*', { count: 'exact', head: true });

        const { count: activeCompanies } = await supabase
          .from('companies')
          .select('*', { count: 'exact', head: true })
          .eq('is_active', true);

        const { count: newCompaniesThisWeek } = await supabase
          .from('companies')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', weekAgo);

        // Fetch users count
        const { count: totalUsers } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true });

        const { count: newUsersThisWeek } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', weekAgo);

        // Fetch total revenue from billing
        const { data: billingData } = await supabase
          .from('billing_history')
          .select('amount')
          .eq('status', 'paid');

        const totalRevenue = billingData?.reduce((sum, b) => sum + Number(b.amount), 0) || 0;

        // Fetch recent companies
        const { data: recentData } = await supabase
          .from('companies')
          .select('id, name, slug, created_at, is_active')
          .order('created_at', { ascending: false })
          .limit(5);

        setStats({
          totalCompanies: totalCompanies || 0,
          activeCompanies: activeCompanies || 0,
          totalUsers: totalUsers || 0,
          totalRevenue,
          newCompaniesThisWeek: newCompaniesThisWeek || 0,
          newUsersThisWeek: newUsersThisWeek || 0,
        });

        setRecentCompanies(recentData || []);
      } catch (err) {
        console.error('Failed to fetch stats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const statCards = [
    {
      title: 'Total Companies',
      value: stats.totalCompanies,
      change: stats.newCompaniesThisWeek,
      changeLabel: 'this week',
      icon: Building2,
      gradient: 'from-purple-500 to-pink-500',
      bgGradient: 'from-purple-500/10 to-pink-500/10',
    },
    {
      title: 'Total Users',
      value: stats.totalUsers,
      change: stats.newUsersThisWeek,
      changeLabel: 'this week',
      icon: Users,
      gradient: 'from-blue-500 to-cyan-500',
      bgGradient: 'from-blue-500/10 to-cyan-500/10',
    },
    {
      title: 'Total Revenue',
      value: `₹${stats.totalRevenue.toLocaleString()}`,
      change: null,
      changeLabel: 'all time',
      icon: CreditCard,
      gradient: 'from-green-500 to-emerald-500',
      bgGradient: 'from-green-500/10 to-emerald-500/10',
    },
    {
      title: 'Active Rate',
      value: `${Math.round((stats.activeCompanies / Math.max(stats.totalCompanies, 1)) * 100)}%`,
      change: stats.activeCompanies,
      changeLabel: 'active companies',
      icon: Activity,
      gradient: 'from-orange-500 to-amber-500',
      bgGradient: 'from-orange-500/10 to-amber-500/10',
    },
  ];

  return (
    <SuperAdminLayout>
      <div className="space-y-8">
        {/* Welcome Section */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Welcome back!</h1>
            <p className="text-purple-200/70 mt-1">Here's what's happening with your platform</p>
          </div>
          <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30">
            <Zap className="h-4 w-4 text-purple-400" />
            <span className="text-sm text-purple-200">Platform Status: <span className="text-green-400 font-medium">Healthy</span></span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {statCards.map((stat) => (
            <Card key={stat.title} className={`border-0 bg-gradient-to-br ${stat.bgGradient} backdrop-blur-xl border border-white/10`}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-purple-200/70 mb-1">{stat.title}</p>
                    {loading ? (
                      <div className="h-9 w-24 bg-white/10 animate-pulse rounded" />
                    ) : (
                      <p className="text-3xl font-bold text-white">{stat.value}</p>
                    )}
                    {stat.change !== null && (
                      <div className="flex items-center gap-1 mt-2">
                        <ArrowUpRight className="h-3 w-3 text-green-400" />
                        <span className="text-xs text-green-400">+{stat.change}</span>
                        <span className="text-xs text-purple-200/50">{stat.changeLabel}</span>
                      </div>
                    )}
                  </div>
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.gradient} shadow-lg`}>
                    <stat.icon className="h-5 w-5 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Content Grid */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Recent Companies */}
          <Card className="border-0 bg-white/5 backdrop-blur-xl border border-white/10">
            <CardHeader className="border-b border-white/10">
              <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
                <Building2 className="h-5 w-5 text-purple-400" />
                Recent Companies
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="p-6 space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-14 bg-white/5 animate-pulse rounded-lg" />
                  ))}
                </div>
              ) : recentCompanies.length === 0 ? (
                <div className="p-6 text-center text-purple-200/50">
                  No companies registered yet
                </div>
              ) : (
                <div className="divide-y divide-white/5">
                  {recentCompanies.map((company) => (
                    <div key={company.id} className="flex items-center justify-between p-4 hover:bg-white/5 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-purple-500/30 to-pink-500/30 flex items-center justify-center">
                          <Building2 className="h-5 w-5 text-purple-300" />
                        </div>
                        <div>
                          <p className="font-medium text-white">{company.name}</p>
                          <p className="text-xs text-purple-200/50 font-mono">{company.slug}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`text-xs px-2 py-1 rounded-full ${company.is_active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                          {company.is_active ? 'Active' : 'Inactive'}
                        </span>
                        <p className="text-xs text-purple-200/50 mt-1">
                          {format(new Date(company.created_at), 'MMM d')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card className="border-0 bg-white/5 backdrop-blur-xl border border-white/10">
            <CardHeader className="border-b border-white/10">
              <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-purple-400" />
                Platform Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-purple-200/70">Active Companies</span>
                    <span className="text-white font-medium">{stats.activeCompanies} / {stats.totalCompanies}</span>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all"
                      style={{ width: `${(stats.activeCompanies / Math.max(stats.totalCompanies, 1)) * 100}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-purple-200/70">User Growth (Weekly)</span>
                    <span className="text-white font-medium">+{stats.newUsersThisWeek}</span>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full transition-all"
                      style={{ width: `${Math.min((stats.newUsersThisWeek / 10) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
                <div className="p-4 rounded-xl bg-white/5">
                  <p className="text-xs text-purple-200/50 mb-1">Avg. Users/Company</p>
                  <p className="text-2xl font-bold text-white">
                    {Math.round(stats.totalUsers / Math.max(stats.totalCompanies, 1))}
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-white/5">
                  <p className="text-xs text-purple-200/50 mb-1">Revenue/Company</p>
                  <p className="text-2xl font-bold text-white">
                    ₹{Math.round(stats.totalRevenue / Math.max(stats.totalCompanies, 1)).toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </SuperAdminLayout>
  );
};

export default SuperAdminDashboard;
