// src/services/exportService.ts
import { BaseService } from './baseService';

class ExportService extends BaseService {
  async exportToCSV(data: any[], filename: string): Promise<void> {
    if (!data || data.length === 0) {
      throw new Error('No data to export');
    }

    // Get headers from first object
    const headers = Object.keys(data[0]);
    
    // Create CSV content
    let csv = headers.join(',') + '\n';
    
    data.forEach(row => {
      const values = headers.map(header => {
        const value = row[header];
        // Escape quotes and wrap in quotes if contains comma
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      });
      csv += values.join(',') + '\n';
    });

    // Create blob and download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    this.downloadFile(blob, `${filename}.csv`);
  }

  async exportEmployeesToCSV(employees: any[]): Promise<void> {
    const data = employees.map(emp => ({
      'Employee ID': emp.id,
      'Name': emp.first_name + ' ' + emp.last_name,
      'Email': emp.email,
      'Phone': emp.phone || '',
      'Position': emp.position || '',
      'Department': emp.department_id || '',
      'Join Date': emp.joining_date || '',
      'Status': emp.status || 'active',
    }));

    await this.exportToCSV(data, 'employees');
  }

  async exportPayrollToCSV(payroll: any[]): Promise<void> {
    const data = payroll.map(p => ({
      'Employee ID': p.user_id,
      'Month': p.month,
      'Year': p.year,
      'Base Salary': p.base_salary || 0,
      'Allowances': p.allowances || 0,
      'Deductions': p.total_deductions || 0,
      'Net Salary': p.net_salary || 0,
      'Status': p.status || 'pending',
      'Date': p.created_at?.split('T')[0] || '',
    }));

    await this.exportToCSV(data, 'payroll');
  }

  async exportAttendanceToCSV(attendance: any[]): Promise<void> {
    const data = attendance.map(a => ({
      'Employee ID': a.user_id,
      'Date': a.date,
      'Sign In': a.sign_in_time ? a.sign_in_time.split('T')[1] : '',
      'Sign Out': a.sign_out_time ? a.sign_out_time.split('T')[1] : '',
      'Status': a.status,
      'Location': a.sign_in_lat && a.sign_in_lng ? `${a.sign_in_lat}, ${a.sign_in_lng}` : '',
    }));

    await this.exportToCSV(data, 'attendance');
  }

  async exportLeavesToCSV(leaves: any[]): Promise<void> {
    const data = leaves.map(l => ({
      'Employee ID': l.user_id,
      'Leave Type': l.leave_type,
      'Start Date': l.start_date,
      'End Date': l.end_date,
      'Days': Math.ceil((new Date(l.end_date).getTime() - new Date(l.start_date).getTime()) / (1000 * 60 * 60 * 24)) + 1,
      'Reason': l.reason || '',
      'Status': l.status,
      'Applied On': l.created_at?.split('T')[0] || '',
    }));

    await this.exportToCSV(data, 'leaves');
  }

  private downloadFile(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  async generatePDFReport(title: string, content: any, filename: string): Promise<void> {
    // This would require a PDF library like jsPDF
    // For now, we'll create a simple HTML to PDF conversion
    const html = `
      <html>
        <head>
          <title>${title}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #333; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
          </style>
        </head>
        <body>
          <h1>${title}</h1>
          <p>Generated on: ${new Date().toLocaleString()}</p>
          ${this.contentToHTML(content)}
        </body>
      </html>
    `;

    const blob = new Blob([html], { type: 'text/html' });
    this.downloadFile(blob, filename);
  }

  private contentToHTML(content: any): string {
    if (Array.isArray(content) && content.length > 0) {
      const headers = Object.keys(content[0]);
      let table = '<table><thead><tr>';
      headers.forEach(h => table += `<th>${h}</th>`);
      table += '</tr></thead><tbody>';
      
      content.forEach(row => {
        table += '<tr>';
        headers.forEach(h => table += `<td>${row[h]}</td>`);
        table += '</tr>';
      });
      
      table += '</tbody></table>';
      return table;
    }
    return `<pre>${JSON.stringify(content, null, 2)}</pre>`;
  }
}

export const exportService = new ExportService();
