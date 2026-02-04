import { useEffect, useState } from 'react';
import { Building2, Search, MoreHorizontal, Eye, Ban, CheckCircle, Edit2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import SuperAdminLayout from './SuperAdminLayout';
import { EditCompanyDialog } from '@/components/super-admin/EditCompanyDialog';
import { Company } from '@/types/saas';
import { format } from 'date-fns';

interface CompanyWithStats extends Company {
  employee_count?: number;
  subscription_status?: string;
  plan_type?: string;
}

const SuperAdminCompanies = () => {
  const [companies, setCompanies] = useState<CompanyWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select(`
          *,
          subscriptions (status, plan_type)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get employee counts
      const companiesWithStats = await Promise.all(
        (data || []).map(async (company: any) => {
          const { count } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .eq('company_id', company.id);

          return {
            ...company,
            employee_count: count || 0,
            subscription_status: company.subscriptions?.[0]?.status || 'none',
            plan_type: company.subscriptions?.[0]?.plan_type || 'free',
          };
        })
      );

      setCompanies(companiesWithStats);
    } catch (err) {
      console.error('Failed to fetch companies:', err);
      toast.error('Failed to load companies');
    } finally {
      setLoading(false);
    }
  };

  const toggleCompanyStatus = async (companyId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('companies')
        .update({ is_active: !currentStatus })
        .eq('id', companyId);

      if (error) throw error;

      setCompanies((prev) =>
        prev.map((c) => (c.id === companyId ? { ...c, is_active: !currentStatus } : c))
      );

      toast.success(`Company ${!currentStatus ? 'activated' : 'deactivated'}`);
    } catch (err) {
      console.error('Failed to toggle company status:', err);
      toast.error('Failed to update company');
    }
  };

  const openEditDialog = (company: CompanyWithStats) => {
    setEditingCompany(company);
    setEditDialogOpen(true);
  };

  const filteredCompanies = companies.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      active: 'default',
      trialing: 'secondary',
      past_due: 'destructive',
      canceled: 'outline',
    };
    return <Badge variant={variants[status] || 'outline'}>{status}</Badge>;
  };

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Companies</h1>
            <p className="text-muted-foreground">Manage all registered companies</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search companies..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
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
                    <TableHead>Slug</TableHead>
                    <TableHead>Employees</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="w-[80px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCompanies.map((company) => (
                    <TableRow key={company.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <Building2 className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{company.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {company.is_active ? 'Active' : 'Inactive'}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{company.slug}</TableCell>
                      <TableCell>{company.employee_count}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{company.plan_type}</Badge>
                      </TableCell>
                      <TableCell>{getStatusBadge(company.subscription_status || 'none')}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(company.created_at), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEditDialog(company)}>
                              <Edit2 className="h-4 w-4 mr-2" />
                              Edit Company
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => toggleCompanyStatus(company.id, company.is_active)}
                            >
                              {company.is_active ? (
                                <>
                                  <Ban className="h-4 w-4 mr-2" />
                                  Deactivate
                                </>
                              ) : (
                                <>
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Activate
                                </>
                              )}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredCompanies.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No companies found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <EditCompanyDialog
          company={editingCompany}
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          onSuccess={fetchCompanies}
        />
      </div>
    </SuperAdminLayout>
  );
};

export default SuperAdminCompanies;
