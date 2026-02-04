import { useState, useEffect } from 'react';
import { Save, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
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
import { Company, PlanType } from '@/types/saas';

interface EditCompanyDialogProps {
  company: Company | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface Subscription {
  id: string;
  plan_type: PlanType;
  status: string;
  max_employees: number;
  price_per_employee: number;
  base_price: number;
}

export function EditCompanyDialog({ company, open, onOpenChange, onSuccess }: EditCompanyDialogProps) {
  const [loading, setLoading] = useState(false);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    domain: '',
    is_active: true,
    plan_type: 'free' as PlanType,
    max_employees: 5,
    price_per_employee: 0,
    base_price: 0,
  });

  useEffect(() => {
    if (company && open) {
      setFormData({
        name: company.name,
        slug: company.slug,
        domain: company.domain || '',
        is_active: company.is_active,
        plan_type: 'free',
        max_employees: 5,
        price_per_employee: 0,
        base_price: 0,
      });
      fetchSubscription();
    }
  }, [company, open]);

  const fetchSubscription = async () => {
    if (!company) return;
    
    try {
      const { data } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('company_id', company.id)
        .maybeSingle();

      if (data) {
        setSubscription(data as unknown as Subscription);
        setFormData(prev => ({
          ...prev,
          plan_type: (data.plan_type as PlanType) || 'free',
          max_employees: data.max_employees || 5,
          price_per_employee: (data as any).price_per_employee || 0,
          base_price: (data as any).base_price || 0,
        }));
      }
    } catch (err) {
      console.error('Failed to fetch subscription:', err);
    }
  };

  const handleSave = async () => {
    if (!company) return;
    setLoading(true);

    try {
      // Update company
      const { error: companyError } = await supabase
        .from('companies')
        .update({
          name: formData.name,
          slug: formData.slug,
          domain: formData.domain || null,
          is_active: formData.is_active,
        })
        .eq('id', company.id);

      if (companyError) throw companyError;

      // Update subscription
      if (subscription) {
        const { error: subError } = await supabase
          .from('subscriptions')
          .update({
            plan_type: formData.plan_type,
            max_employees: formData.max_employees,
            price_per_employee: formData.price_per_employee,
            base_price: formData.base_price,
          })
          .eq('id', subscription.id);

        if (subError) throw subError;
      }

      toast.success('Company updated successfully');
      onSuccess();
      onOpenChange(false);
    } catch (err) {
      console.error('Failed to update company:', err);
      toast.error('Failed to update company');
    } finally {
      setLoading(false);
    }
  };

  const planMaxEmployees: Record<PlanType, number> = {
    free: 5,
    starter: 25,
    professional: 100,
    enterprise: 9999,
  };

  const handlePlanChange = (plan: PlanType) => {
    setFormData(prev => ({
      ...prev,
      plan_type: plan,
      max_employees: planMaxEmployees[plan],
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Edit Company
          </DialogTitle>
          <DialogDescription>
            Update company details and subscription settings
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Company Details */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-muted-foreground">Company Details</h4>
            
            <div className="space-y-2">
              <Label htmlFor="name">Company Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="slug">Slug (Company Code)</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase() })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="domain">Domain (Optional)</Label>
                <Input
                  id="domain"
                  value={formData.domain}
                  onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                  placeholder="example.com"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="is_active">Company Active</Label>
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
            </div>
          </div>

          {/* Subscription Details */}
          <div className="space-y-4 pt-4 border-t">
            <h4 className="text-sm font-medium text-muted-foreground">Subscription Settings</h4>

            <div className="space-y-2">
              <Label>Plan Type</Label>
              <Select
                value={formData.plan_type}
                onValueChange={(value) => handlePlanChange(value as PlanType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="starter">Starter</SelectItem>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="enterprise">Enterprise</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
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
              <Label htmlFor="base_price">Custom Base Price (₹/month)</Label>
              <Input
                id="base_price"
                type="number"
                value={formData.base_price}
                onChange={(e) =>
                  setFormData({ ...formData, base_price: parseFloat(e.target.value) || 0 })
                }
              />
              <p className="text-xs text-muted-foreground">
                Override plan base price for this company. Leave 0 to use default.
              </p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? (
              <div className="animate-spin h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full mr-2" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}