import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import SuperAdminLayout from './SuperAdminLayout';
import { Shield, Search, Download, Filter, Clock, User, Building2 } from 'lucide-react';
import { format } from 'date-fns';

interface AuditLog {
  id: string;
  timestamp: number;
  action: string;
  actor: {
    id: string;
    email: string;
    role: string;
  };
  target: {
    type: 'company' | 'user' | 'plan' | 'payment';
    id: string;
    name: string;
  };
  status: 'success' | 'failed' | 'pending';
  details: Record<string, any>;
  ipAddress: string;
  userAgent: string;
}

const MOCK_LOGS: AuditLog[] = [
  {
    id: 'log_001',
    timestamp: Date.now() - 3600000,
    action: 'company_activated',
    actor: { id: 'user_1', email: 'admin@company.com', role: 'super_admin' },
    target: { type: 'company', id: 'comp_1', name: 'Tech Corp' },
    status: 'success',
    details: { reason: 'Manual activation' },
    ipAddress: '192.168.1.1',
    userAgent: 'Chrome/120.0',
  },
  {
    id: 'log_002',
    timestamp: Date.now() - 7200000,
    action: 'payment_processed',
    actor: { id: 'system', email: 'system@hrms.local', role: 'system' },
    target: { type: 'payment', id: 'pay_1', name: 'Monthly Subscription' },
    status: 'success',
    details: { amount: 50000, currency: 'INR' },
    ipAddress: 'system',
    userAgent: 'Node.js',
  },
  {
    id: 'log_003',
    timestamp: Date.now() - 10800000,
    action: 'user_created',
    actor: { id: 'user_1', email: 'admin@company.com', role: 'company_admin' },
    target: { type: 'user', id: 'user_2', name: 'John Doe' },
    status: 'success',
    details: { department: 'Engineering' },
    ipAddress: '192.168.1.2',
    userAgent: 'Safari/605',
  },
  {
    id: 'log_004',
    timestamp: Date.now() - 14400000,
    action: 'plan_upgraded',
    actor: { id: 'user_1', email: 'admin@company.com', role: 'company_admin' },
    target: { type: 'plan', id: 'plan_1', name: 'Premium Plan' },
    status: 'success',
    details: { from: 'Standard', to: 'Premium' },
    ipAddress: '192.168.1.1',
    userAgent: 'Firefox/121.0',
  },
  {
    id: 'log_005',
    timestamp: Date.now() - 18000000,
    action: 'failed_login_attempt',
    actor: { id: 'unknown', email: 'unknown@email.com', role: 'guest' },
    target: { type: 'user', id: 'user_3', name: 'Jane Smith' },
    status: 'failed',
    details: { reason: 'Invalid credentials' },
    ipAddress: '203.0.113.0',
    userAgent: 'Chrome/120.0',
  },
];

export default function SuperAdminAuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>(MOCK_LOGS);
  const [filteredLogs, setFilteredLogs] = useState<AuditLog[]>(MOCK_LOGS);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAction, setFilterAction] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    let filtered = logs;

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(log =>
        log.actor.email.toLowerCase().includes(term) ||
        log.target.name.toLowerCase().includes(term) ||
        log.ipAddress.includes(term)
      );
    }

    // Filter by action
    if (filterAction !== 'all') {
      filtered = filtered.filter(log => log.action === filterAction);
    }

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(log => log.status === filterStatus);
    }

    setFilteredLogs(filtered);
  }, [searchTerm, filterAction, filterStatus, logs]);

  const getActionColor = (action: string) => {
    if (action.includes('created')) return 'bg-green-500/20 text-green-400';
    if (action.includes('updated') || action.includes('upgraded')) return 'bg-blue-500/20 text-blue-400';
    if (action.includes('deleted')) return 'bg-red-500/20 text-red-400';
    if (action.includes('login')) return 'bg-purple-500/20 text-purple-400';
    return 'bg-gray-500/20 text-gray-400';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'bg-green-500/20 text-green-400';
      case 'failed': return 'bg-red-500/20 text-red-400';
      case 'pending': return 'bg-yellow-500/20 text-yellow-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getTargetIcon = (type: string) => {
    switch (type) {
      case 'company': return <Building2 className="h-4 w-4" />;
      case 'user': return <User className="h-4 w-4" />;
      default: return <Shield className="h-4 w-4" />;
    }
  };

  return (
    <SuperAdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Audit Logs</h1>
            <p className="text-purple-200/70 mt-1">System activity and security events</p>
          </div>
          <Button className="bg-purple-600 hover:bg-purple-700 gap-2">
            <Download className="h-4 w-4" />
            Export Logs
          </Button>
        </div>

        {/* Filters */}
        <Card className="border-0 bg-white/5 backdrop-blur-xl border border-white/10">
          <CardContent className="p-6">
            <div className="grid gap-4 md:grid-cols-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-purple-400" />
                <Input
                  placeholder="Search email, name, IP..."
                  className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-purple-200/50"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <Select value={filterAction} onValueChange={setFilterAction}>
                <SelectTrigger className="bg-white/10 border-white/20 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-white/20">
                  <SelectItem value="all">All Actions</SelectItem>
                  <SelectItem value="company_activated">Company Activated</SelectItem>
                  <SelectItem value="payment_processed">Payment Processed</SelectItem>
                  <SelectItem value="user_created">User Created</SelectItem>
                  <SelectItem value="plan_upgraded">Plan Upgraded</SelectItem>
                  <SelectItem value="failed_login_attempt">Failed Login</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="bg-white/10 border-white/20 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-white/20">
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="success">Success</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
                <Filter className="h-4 w-4 mr-2" />
                Reset Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Logs Table */}
        <Card className="border-0 bg-white/5 backdrop-blur-xl border border-white/10">
          <CardHeader className="border-b border-white/10">
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>{filteredLogs.length} events found</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {filteredLogs.length === 0 ? (
              <div className="p-6 text-center text-purple-200/50">
                No logs found matching your filters
              </div>
            ) : (
              <div className="divide-y divide-white/10">
                {filteredLogs.map((log) => (
                  <div key={log.id} className="p-6 hover:bg-white/5 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4 flex-1">
                        {/* Avatar */}
                        <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-purple-500/30 to-pink-500/30 flex items-center justify-center flex-shrink-0">
                          {getTargetIcon(log.target.type)}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-medium text-white capitalize">
                              {log.action.replace(/_/g, ' ')}
                            </p>
                            <Badge className={getActionColor(log.action)}>
                              {log.target.type}
                            </Badge>
                            <Badge className={getStatusColor(log.status)}>
                              {log.status}
                            </Badge>
                          </div>

                          <div className="mt-2 space-y-1 text-sm">
                            <p className="text-purple-200/70">
                              <span className="font-medium text-white">{log.actor.email}</span>
                              {' '} on {' '}
                              <span className="font-medium text-white">{log.target.name}</span>
                            </p>
                            <p className="text-purple-200/50 font-mono text-xs">
                              IP: {log.ipAddress} • {log.userAgent}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Timestamp */}
                      <div className="flex items-center gap-1 text-purple-200/50 text-xs flex-shrink-0">
                        <Clock className="h-3 w-3" />
                        {format(new Date(log.timestamp), 'MMM d, HH:mm:ss')}
                      </div>
                    </div>

                    {/* Details */}
                    {Object.keys(log.details).length > 0 && (
                      <div className="mt-4 p-3 rounded-lg bg-white/5 border border-white/10 text-xs font-mono text-purple-200/70">
                        {JSON.stringify(log.details, null, 2)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </SuperAdminLayout>
  );
}
