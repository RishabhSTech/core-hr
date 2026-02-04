import { useEffect, useState } from 'react';
import { Package, Plus, Edit2, Trash2, Save, X, IndianRupee, Users, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { PlanType } from '@/types/saas';

interface Plan {
  id: string;
  name: string;
  plan_type: PlanType;
  base_price: number;
  price_per_employee: number;
  max_employees: number;
  features: string[];
  is_active: boolean;
}

const SuperAdminPlans = () => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    plan_type: 'free' as PlanType,
    base_price: 0,
    price_per_employee: 0,
    max_employees: 5,
    features: '',
    is_active: true,
  });

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('plans')
        .select('*')
        .order('base_price', { ascending: true });

      if (error) throw error;

      setPlans(
        (data || []).map((p) => ({
          ...p,
          features: Array.isArray(p.features) ? p.features : JSON.parse(p.features as string || '[]'),
        }))
      );
    } catch (err) {
      console.error('Failed to fetch plans:', err);
      toast.error('Failed to load plans');
    } finally {
      setLoading(false);
    }
  };

  const openEditDialog = (plan: Plan) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name,
      plan_type: plan.plan_type,
      base_price: plan.base_price,
      price_per_employee: plan.price_per_employee,
      max_employees: plan.max_employees,
      features: plan.features.join('\n'),
      is_active: plan.is_active,
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      const featuresArray = formData.features.split('\n').filter((f) => f.trim());

      if (editingPlan) {
        const { error } = await supabase
          .from('plans')
          .update({
            name: formData.name,
            base_price: formData.base_price,
            price_per_employee: formData.price_per_employee,
            max_employees: formData.max_employees,
            features: featuresArray,
            is_active: formData.is_active,
          })
          .eq('id', editingPlan.id);

        if (error) throw error;
        toast.success('Plan updated successfully');
      }

      setIsDialogOpen(false);
      setEditingPlan(null);
      fetchPlans();
    } catch (err) {
      console.error('Failed to save plan:', err);
      toast.error('Failed to save plan');
    }
  };

  const togglePlanStatus = async (planId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('plans')
        .update({ is_active: !currentStatus })
        .eq('id', planId);

      if (error) throw error;

      setPlans((prev) =>
        prev.map((p) => (p.id === planId ? { ...p, is_active: !currentStatus } : p))
      );
      toast.success(`Plan ${!currentStatus ? 'activated' : 'deactivated'}`);
    } catch (err) {
      console.error('Failed to toggle plan:', err);
      toast.error('Failed to update plan');
    }
  };

  // Stats
  const activePlans = plans.filter((p) => p.is_active).length;
  const totalRevenuePotential = plans.reduce((acc, p) => acc + p.base_price, 0);

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Plan Management</h1>
            <p className="text-muted-foreground">Configure pricing tiers and features</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Plans</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{plans.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Plans</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activePlans}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Highest Base Price</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{Math.max(...plans.map((p) => p.base_price), 0)}</div>
            </CardContent>
          </Card>
        </div>

        {/* Plans Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {loading ? (
            <div className="col-span-full flex justify-center py-8">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
          ) : (
            plans.map((plan) => (
              <Card
                key={plan.id}
                className={`relative ${!plan.is_active ? 'opacity-60' : ''}`}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <Badge variant={plan.is_active ? 'default' : 'outline'}>
                      {plan.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                    <Button variant="ghost" size="icon" onClick={() => openEditDialog(plan)}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <CardTitle className="capitalize">{plan.name}</CardTitle>
                  <CardDescription className="uppercase text-xs">{plan.plan_type}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold">₹{plan.base_price}</span>
                      <span className="text-muted-foreground">/month</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      + ₹{plan.price_per_employee} per employee
                    </p>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>
                      Up to {plan.max_employees === 9999 ? 'unlimited' : plan.max_employees} employees
                    </span>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-medium">Features:</p>
                    <ul className="space-y-1">
                      {plan.features.slice(0, 4).map((feature, idx) => (
                        <li key={idx} className="flex items-center gap-2 text-sm text-muted-foreground">
                          <CheckCircle2 className="h-3 w-3 text-primary" />
                          {feature}
                        </li>
                      ))}
                      {plan.features.length > 4 && (
                        <li className="text-xs text-muted-foreground">
                          +{plan.features.length - 4} more features
                        </li>
                      )}
                    </ul>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <span className="text-sm text-muted-foreground">Status</span>
                    <Switch
                      checked={plan.is_active}
                      onCheckedChange={() => togglePlanStatus(plan.id, plan.is_active)}
                    />
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Plan - {editingPlan?.name}</DialogTitle>
              <DialogDescription>
                Update pricing and features for this plan
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Plan Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="base_price">Base Price (₹/month)</Label>
                  <Input
                    id="base_price"
                    type="number"
                    value={formData.base_price}
                    onChange={(e) =>
                      setFormData({ ...formData, base_price: parseFloat(e.target.value) || 0 })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price_per_employee">Per Employee (₹)</Label>
                  <Input
                    id="price_per_employee"
                    type="number"
                    value={formData.price_per_employee}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        price_per_employee: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="max_employees">Max Employees</Label>
                <Input
                  id="max_employees"
                  type="number"
                  value={formData.max_employees}
                  onChange={(e) =>
                    setFormData({ ...formData, max_employees: parseInt(e.target.value) || 5 })
                  }
                />
                <p className="text-xs text-muted-foreground">Use 9999 for unlimited</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="features">Features (one per line)</Label>
                <Textarea
                  id="features"
                  rows={5}
                  value={formData.features}
                  onChange={(e) => setFormData({ ...formData, features: e.target.value })}
                  placeholder="Basic attendance&#10;Leave management&#10;Payroll"
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="is_active">Plan Active</Label>
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave}>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </SuperAdminLayout>
  );
};

export default SuperAdminPlans;