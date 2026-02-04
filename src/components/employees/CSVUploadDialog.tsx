import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Upload, Download, FileSpreadsheet, AlertCircle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Department } from '@/types/hrms';
import { z } from 'zod';
import { mapDatabaseError } from '@/utils/errorMapper';

interface CSVUploadDialogProps {
  departments: Department[];
  onSuccess: () => void;
}

// Validation schema for CSV rows
const csvRowSchema = z.object({
  email: z.string().email('Invalid email format').max(100, 'Email too long'),
  password: z.string().min(6, 'Password must be at least 6 characters').max(128, 'Password too long'),
  first_name: z.string().min(1, 'First name is required').max(50, 'First name too long').regex(/^[a-zA-Z\s'-]+$/, 'First name contains invalid characters'),
  last_name: z.string().min(1, 'Last name is required').max(50, 'Last name too long').regex(/^[a-zA-Z\s'-]+$/, 'Last name contains invalid characters'),
  role: z.enum(['employee', 'manager', 'admin']).optional(),
  department: z.string().max(100, 'Department name too long').optional(),
  monthly_salary: z.string().regex(/^(\d+(\.\d{1,2})?)?$/, 'Invalid salary format').optional().refine(
    (val) => !val || parseFloat(val) <= 10000000,
    'Salary exceeds maximum allowed value'
  ),
  phone: z.string().regex(/^(\d{10})?$/, 'Phone must be 10 digits').optional(),
});

// File size and row limits
const MAX_FILE_SIZE = 1024 * 1024; // 1MB
const MAX_ROWS = 500;

interface CSVRow {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  role?: string;
  department?: string;
  monthly_salary?: string;
  phone?: string;
}

export function CSVUploadDialog({ departments, onSuccess }: CSVUploadDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{ success: number; failed: number; errors: string[] }>({ success: 0, failed: 0, errors: [] });
  const [showResults, setShowResults] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Generate a secure random temporary password
  const generateTempPassword = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%';
    return Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  };

  const downloadTemplate = () => {
    const headers = ['email', 'password', 'first_name', 'last_name', 'role', 'department', 'monthly_salary', 'phone'];
    // Generate unique temporary passwords for each sample row
    const sampleData = [
      ['john@company.com', generateTempPassword(), 'John', 'Doe', 'employee', 'Engineering', '50000', '9876543210'],
      ['jane@company.com', generateTempPassword(), 'Jane', 'Smith', 'manager', 'Marketing', '75000', '9876543211'],
      ['mike@company.com', generateTempPassword(), 'Mike', 'Johnson', 'employee', 'Sales', '45000', '9876543212'],
    ];

    const csvContent = [
      headers.join(','),
      ...sampleData.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'employee_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('Template downloaded - Remember to change passwords before importing!');
  };

  const parseCSV = (text: string): CSVRow[] => {
    const lines = text.trim().split('\n');
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const rows: CSVRow[] = [];

    // Limit to MAX_ROWS
    const maxLines = Math.min(lines.length, MAX_ROWS + 1);

    for (let i = 1; i < maxLines; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      const row: Record<string, string> = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      rows.push({
        email: row.email || '',
        password: row.password || '',
        first_name: row.first_name || '',
        last_name: row.last_name || '',
        role: row.role,
        department: row.department,
        monthly_salary: row.monthly_salary,
        phone: row.phone,
      });
    }

    return rows;
  };

  const processCSV = async (rows: CSVRow[]) => {
    setLoading(true);
    const successCount = { value: 0 };
    const failedCount = { value: 0 };
    const errorMessages: string[] = [];

    for (const row of rows) {
      try {
        // Validate row with Zod schema
        const validation = csvRowSchema.safeParse({
          email: row.email,
          password: row.password,
          first_name: row.first_name,
          last_name: row.last_name,
          role: row.role?.toLowerCase() || undefined,
          department: row.department || undefined,
          monthly_salary: row.monthly_salary || undefined,
          phone: row.phone || undefined,
        });

        if (!validation.success) {
          const firstError = validation.error.errors[0];
          throw new Error(firstError.message);
        }

        // Find department ID
        const dept = departments.find(d => d.name.toLowerCase() === row.department?.toLowerCase());

        // Create user account
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: row.email,
          password: row.password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: {
              first_name: row.first_name,
              last_name: row.last_name,
            },
          },
        });

        if (authError) throw authError;
        if (!authData.user) throw new Error('Failed to create user');

        // Update profile
        const salary = row.monthly_salary ? parseFloat(row.monthly_salary) : 0;
        await supabase
          .from('profiles')
          .update({
            phone: row.phone || null,
            department_id: dept?.id || null,
            monthly_salary: salary,
          })
          .eq('user_id', authData.user.id);

        // Update role if specified
        const role = row.role?.toLowerCase();
        if (role && ['admin', 'manager'].includes(role)) {
          await supabase
            .from('user_roles')
            .update({ role: role as 'admin' | 'manager' })
            .eq('user_id', authData.user.id);
        }

        successCount.value++;
      } catch (error: unknown) {
        failedCount.value++;
        const userMessage = mapDatabaseError(error);
        errorMessages.push(`Row ${row.email || 'unknown'}: ${userMessage}`);
      }
    }

    setResults({
      success: successCount.value,
      failed: failedCount.value,
      errors: errorMessages.slice(0, 20), // Limit displayed errors
    });
    setShowResults(true);
    setLoading(false);

    if (successCount.value > 0) {
      onSuccess();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.name.endsWith('.csv')) {
      toast.error('Please upload a CSV file');
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      toast.error(`File too large. Maximum size is ${MAX_FILE_SIZE / 1024}KB`);
      return;
    }

    const text = await file.text();
    const rows = parseCSV(text);

    if (rows.length === 0) {
      toast.error('No valid data found in CSV');
      return;
    }

    if (rows.length > MAX_ROWS) {
      toast.error(`Too many rows. Maximum is ${MAX_ROWS} employees per upload.`);
      return;
    }

    await processCSV(rows);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setShowResults(false); }}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Upload className="h-4 w-4 mr-2" />
          Import CSV
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Import Employees from CSV</DialogTitle>
          <DialogDescription>Upload a CSV file with employee data to bulk import.</DialogDescription>
        </DialogHeader>

        {showResults ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-green-50 border border-green-200 text-center">
                <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-green-700">{results.success}</p>
                <p className="text-sm text-green-600">Successfully Added</p>
              </div>
              <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-center">
                <AlertCircle className="h-8 w-8 text-red-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-red-700">{results.failed}</p>
                <p className="text-sm text-red-600">Failed</p>
              </div>
            </div>

            {results.errors.length > 0 && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 max-h-40 overflow-y-auto">
                <p className="text-sm font-medium text-red-700 mb-2">Errors:</p>
                {results.errors.map((error, i) => (
                  <p key={i} className="text-xs text-red-600">{error}</p>
                ))}
                {results.failed > results.errors.length && (
                  <p className="text-xs text-red-500 mt-2">
                    ...and {results.failed - results.errors.length} more errors
                  </p>
                )}
              </div>
            )}

            <Button className="w-full" onClick={() => { setOpen(false); setShowResults(false); }}>
              Done
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-muted border border-border">
              <div className="flex items-start gap-3">
                <FileSpreadsheet className="h-10 w-10 text-primary" />
                <div>
                  <p className="font-medium text-foreground">CSV Format</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Download the template to see the required format. Fill in employee data and upload.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
              <p className="text-xs text-amber-700">
                <strong>Required columns:</strong> email, password, first_name, last_name<br />
                <strong>Optional:</strong> role (employee/manager/admin), department, monthly_salary, phone<br />
                <strong>Limits:</strong> Max {MAX_ROWS} employees, {MAX_FILE_SIZE / 1024}KB file size<br />
                <strong className="text-red-600">⚠️ Important:</strong> Change the template passwords before importing!
              </p>
            </div>

            <Button variant="outline" className="w-full" onClick={downloadTemplate}>
              <Download className="h-4 w-4 mr-2" />
              Download Template
            </Button>

            <div className="relative">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                disabled={loading}
              />
              <Button className="w-full" disabled={loading}>
                <Upload className="h-4 w-4 mr-2" />
                {loading ? 'Processing...' : 'Upload CSV File'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
