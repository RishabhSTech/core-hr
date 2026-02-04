import { useEffect, useState } from 'react';
import { CreditCard, Search, Building2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import SuperAdminLayout from './SuperAdminLayout';
import { format } from 'date-fns';
import { PlanType, SubscriptionStatus } from '@/types/saas';

interface SubscriptionWithCompany {
  id: string;
  company_id: string;
  company_name: string;
  plan_type: PlanType;
  status: SubscriptionStatus;
  max_employees: number;
  current_period_end: string | null;
  created_at: string;
}

const SuperAdminSubscriptions = () => {
  const [subscriptions, setSubscriptions] = useState<SubscriptionWithCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const fetchSubscriptions = async () => {
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select(`
          *,
          companies (name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formatted = (data || []).map((sub: any) => ({
        ...sub,
        company_name: sub.companies?.name || 'Unknown',
      }));

      setSubscriptions(formatted);
    } catch (err) {
      console.error('Failed to fetch subscriptions:', err);
      toast.error('Failed to load subscriptions');
    } finally {
      setLoading(false);
    }
  };

  const updatePlan = async (subscriptionId: string, newPlan: PlanType) => {
    try {
      const maxEmployees = {
        free: 5,
        starter: 25,
        professional: 100,
        enterprise: 9999,
      };

      const { error } = await supabase
        .from('subscriptions')
        .update({
          plan_type: newPlan,
          max_employees: maxEmployees[newPlan],
        })
        .eq('id', subscriptionId);

      if (error) throw error;

      setSubscriptions((prev) =>
        prev.map((s) =>
          s.id === subscriptionId
            ? { ...s, plan_type: newPlan, max_employees: maxEmployees[newPlan] }
            : s
        )
      );

      toast.success('Plan updated successfully');
    } catch (err) {
      console.error('Failed to update plan:', err);
      toast.error('Failed to update plan');
    }
  };

  const filteredSubscriptions = subscriptions.filter((s) => {
    const matchesSearch = s.company_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: SubscriptionStatus) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      active: 'default',
      trialing: 'secondary',
      past_due: 'destructive',
      canceled: 'outline',
      paused: 'outline',
    };
    return <Badge variant={variants[status] || 'outline'}>{status}</Badge>;
  };

  // Stats
  const activeCount = subscriptions.filter((s) => s.status === 'active').length;
  const trialingCount = subscriptions.filter((s) => s.status === 'trialing').length;
  const paidCount = subscriptions.filter((s) => ['starter', 'professional', 'enterprise'].includes(s.plan_type)).length;

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Subscriptions</h1>
          <p className="text-muted-foreground">Manage company subscriptions and billing</p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Active Subscriptions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Trialing
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{trialingCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Paid Plans
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{paidCount}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by company..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="trialing">Trialing</SelectItem>
                  <SelectItem value="past_due">Past Due</SelectItem>
                  <SelectItem value="canceled">Canceled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Company</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Max Employees</TableHead>
                    <TableHead>Renews</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSubscriptions.map((sub) => (
                    <TableRow key={sub.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <Building2 className="h-4 w-4 text-primary" />
                          </div>
                          <span className="font-medium">{sub.company_name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={sub.plan_type}
                          onValueChange={(value) => updatePlan(sub.id, value as PlanType)}
                        >
                          <SelectTrigger className="w-[130px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="free">Free</SelectItem>
                            <SelectItem value="starter">Starter</SelectItem>
                            <SelectItem value="professional">Professional</SelectItem>
                            <SelectItem value="enterprise">Enterprise</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>{getStatusBadge(sub.status)}</TableCell>
                      <TableCell>{sub.max_employees === 9999 ? 'Unlimited' : sub.max_employees}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {sub.current_period_end
                          ? format(new Date(sub.current_period_end), 'MMM d, yyyy')
                          : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredSubscriptions.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        No subscriptions found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </SuperAdminLayout>
  );
};

export default SuperAdminSubscriptions;
