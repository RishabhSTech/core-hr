import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { EmployeeTable } from '@/components/employees/EmployeeTable';
import { AddEmployeeDialog } from '@/components/employees/AddEmployeeDialog';
import { CSVUploadDialog } from '@/components/employees/CSVUploadDialog';
import { Input } from '@/components/ui/input';
import { Search, AlertCircle } from 'lucide-react';
import { useEmployees } from '@/hooks/useEmployees';
import { useDepartments } from '@/hooks/useSettings';
import { useAuth } from '@/contexts/AuthContext';
import { useCompany } from '@/contexts/CompanyContext';
import { useDebounce } from '@/hooks/useDebounce';
import { QueryErrorHandler } from '@/components/QueryErrorHandler';
import { TableSkeleton } from '@/components/Skeleton';
import ErrorBoundary from '@/components/ErrorBoundary';

export default function Employees() {
  const { isAdmin } = useAuth();
  const { company } = useCompany();
  const navigate = useNavigate();

  // Check admin access
  if (!isAdmin) {
    navigate('/dashboard');
    return null;
  }

  // Fetch data using service layer
  const { data: employees, isLoading, error, refetch } = useEmployees({ companyId: company?.id, pageSize: 100 });
  const { data: departments, isLoading: deptLoading } = useDepartments(company?.id || null);

  // Search input with debouncing
  const [search, setSearch] = useMemo(() => {
    let searchValue = '';
    const setSearchValue = (value: string) => {
      searchValue = value;
    };
    return [searchValue, setSearchValue];
  }, []);

  const debouncedSearch = useDebounce(search, 300);

  // Filter employees efficiently
  const filteredEmployees = useMemo(() => {
    if (!employees?.data) return [];

    const searchLower = debouncedSearch.toLowerCase();
    if (!searchLower) return employees.data;

    return employees.data.filter(emp => {
      const fullName = `${emp.first_name} ${emp.last_name}`.toLowerCase();
      return (
        fullName.includes(searchLower) ||
        emp.email?.toLowerCase().includes(searchLower) ||
        emp.employee_id?.toLowerCase().includes(searchLower)
      );
    });
  }, [employees?.data, debouncedSearch]);

  const isLoadingData = isLoading || deptLoading;

  return (
    <ErrorBoundary>
      <AppLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Employees</h1>
              <p className="text-muted-foreground mt-1">
                Manage your organization's workforce ({employees?.data?.length || 0} total)
              </p>
            </div>
            <div className="flex gap-2">
              <CSVUploadDialog departments={departments || []} onSuccess={refetch} />
              <AddEmployeeDialog departments={departments || []} onSuccess={refetch} />
            </div>
          </div>

          {/* Search Bar */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search employees by name, email, or ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Error Handler */}
          <QueryErrorHandler error={error} onRetry={refetch} />

          {/* Employee Table */}
          {isLoadingData ? (
            <TableSkeleton rows={5} />
          ) : filteredEmployees.length === 0 ? (
            <div className="text-center py-12">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {search ? 'No employees match your search' : 'No employees found'}
              </p>
            </div>
          ) : (
            <EmployeeTable employees={filteredEmployees} onRefresh={refetch} />
          )}
        </div>
      </AppLayout>
    </ErrorBoundary>
  );
}
