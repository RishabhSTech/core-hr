import { useEffect, useState } from 'react';
import { CreditCard, Receipt, Calendar, Users, TrendingUp, Clock, CheckCircle2, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { AppLayout } from '@/components/layout/AppLayout';
import { useCompany } from '@/contexts/CompanyContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { PLAN_LIMITS, PlanType } from '@/types/saas';

interface BillingRecord {
  id: string;
  amount: number;
  currency: string;
  description: string | null;
  status: string;
  created_at: string;
  invoice_url: string | null;
}

interface Plan {
  id: string;
  name: string;
  plan_type: PlanType;
  base_price: number;
  price_per_employee: number;
  max_employees: number;
  features: string[];
}

const Billing = () => {
  const { company, subscription, refreshCompany } = useCompany();
  const [billingHistory, setBillingHistory] = useState<BillingRecord[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [employeeCount, setEmployeeCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (company) {
      fetchBillingData();
    }
  }, [company]);

  const fetchBillingData = async () => {
    try {
      // Fetch billing history
      const { data: historyData } = await supabase
        .from('billing_history')
        .select('*')
        .eq('company_id', company!.id)
        .order('created_at', { ascending: false })
        .limit(10);

      setBillingHistory(historyData || []);

      // Fetch available plans
      const { data: plansData } = await supabase
        .from('plans')
        .select('*')
        .eq('is_active', true)
        .order('base_price', { ascending: true });

      setPlans((plansData || []).map(p => ({
        ...p,
        features: Array.isArray(p.features) ? p.features : JSON.parse(p.features as string || '[]')
      })));

      // Fetch employee count
      const { count } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', company!.id);

      setEmployeeCount(count || 0);
    } catch (err) {
      console.error('Failed to fetch billing data:', err);
      toast.error('Failed to load billing information');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      active: 'default',
      trialing: 'secondary',
      past_due: 'destructive',
      canceled: 'outline',
      paused: 'outline',
    };
    return <Badge variant={variants[status] || 'outline'}>{status}</Badge>;
  };

  const currentPlan = plans.find(p => p.plan_type === subscription?.plan_type) || null;
  const usagePercent = subscription?.max_employees 
    ? Math.min((employeeCount / subscription.max_employees) * 100, 100) 
    : 0;

  const calculateMonthlyTotal = () => {
    if (!currentPlan) return 0;
    return currentPlan.base_price + (currentPlan.price_per_employee * employeeCount);
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6 p-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Billing & Subscription</h1>
          <p className="text-muted-foreground">Manage your subscription plan and billing</p>
        </div>

        {/* Current Plan Overview */}
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="md:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Current Plan
                  </CardTitle>
                  <CardDescription>Your active subscription</CardDescription>
                </div>
                {subscription && getStatusBadge(subscription.status)}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold capitalize">{subscription?.plan_type || 'Free'}</h3>
                  <p className="text-muted-foreground">
                    {currentPlan ? `₹${currentPlan.base_price}/month base + ₹${currentPlan.price_per_employee}/employee` : 'Free tier'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Monthly Total</p>
                  <p className="text-3xl font-bold text-primary">₹{calculateMonthlyTotal()}</p>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Employee Usage</span>
                  <span className="font-medium">{employeeCount} / {subscription?.max_employees === 9999 ? '∞' : subscription?.max_employees || 5}</span>
                </div>
                <Progress value={subscription?.max_employees === 9999 ? 10 : usagePercent} className="h-2" />
                {usagePercent >= 80 && subscription?.max_employees !== 9999 && (
                  <p className="text-xs text-destructive">You're nearing your employee limit. Consider upgrading.</p>
                )}
              </div>

              {subscription?.current_period_end && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>Renews on {format(new Date(subscription.current_period_end), 'MMMM d, yyyy')}</span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Quick Stats
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Employees</span>
                </div>
                <span className="font-semibold">{employeeCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Trial Ends</span>
                </div>
                <span className="font-semibold">
                  {company?.trial_ends_at ? format(new Date(company.trial_ends_at), 'MMM d') : 'N/A'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Receipt className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Invoices</span>
                </div>
                <span className="font-semibold">{billingHistory.length}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Available Plans */}
        <Card>
          <CardHeader>
            <CardTitle>Available Plans</CardTitle>
            <CardDescription>Choose the plan that fits your organization</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              {plans.map((plan) => (
                <div
                  key={plan.id}
                  className={`relative rounded-lg border p-4 ${
                    plan.plan_type === subscription?.plan_type
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  {plan.plan_type === subscription?.plan_type && (
                    <Badge className="absolute -top-2 right-2">Current</Badge>
                  )}
                  <div className="space-y-3">
                    <h4 className="font-semibold capitalize">{plan.name}</h4>
                    <div>
                      <span className="text-2xl font-bold">₹{plan.base_price}</span>
                      <span className="text-muted-foreground">/month</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      + ₹{plan.price_per_employee}/employee
                    </p>
                    <div className="text-sm text-muted-foreground">
                      Up to {plan.max_employees === 9999 ? 'unlimited' : plan.max_employees} employees
                    </div>
                    <Separator />
                    <ul className="space-y-2">
                      {(plan.features || []).slice(0, 3).map((feature, idx) => (
                        <li key={idx} className="flex items-center gap-2 text-sm">
                          <CheckCircle2 className="h-3 w-3 text-primary" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                    {plan.plan_type !== subscription?.plan_type && (
                      <Button variant="outline" className="w-full mt-2" size="sm">
                        {plans.indexOf(plan) > plans.findIndex(p => p.plan_type === subscription?.plan_type)
                          ? 'Upgrade'
                          : 'Switch'}
                        <ArrowRight className="h-4 w-4 ml-1" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Billing History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Billing History
            </CardTitle>
            <CardDescription>Your recent invoices and payments</CardDescription>
          </CardHeader>
          <CardContent>
            {billingHistory.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Receipt className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No billing history yet</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {billingHistory.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>{format(new Date(record.created_at), 'MMM d, yyyy')}</TableCell>
                      <TableCell>{record.description || 'Subscription payment'}</TableCell>
                      <TableCell className="font-medium">
                        {record.currency === 'INR' ? '₹' : record.currency} {record.amount}
                      </TableCell>
                      <TableCell>
                        <Badge variant={record.status === 'paid' ? 'default' : 'destructive'}>
                          {record.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {record.invoice_url && (
                          <Button variant="ghost" size="sm" asChild>
                            <a href={record.invoice_url} target="_blank" rel="noopener noreferrer">
                              View Invoice
                            </a>
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Billing;