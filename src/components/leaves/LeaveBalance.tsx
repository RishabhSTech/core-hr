import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LeaveBalance as LeaveBalanceType } from '@/types/hrms';
import { Briefcase, Heart, DollarSign } from 'lucide-react';

interface LeaveBalanceProps {
  balance: LeaveBalanceType | null;
}

export function LeaveBalance({ balance }: LeaveBalanceProps) {
  const leaves = [
    { 
      type: 'Casual Leave', 
      balance: balance?.casual_leave || 0, 
      total: 12,
      icon: Briefcase,
      color: 'text-blue-600 bg-blue-100'
    },
    { 
      type: 'Sick Leave', 
      balance: balance?.sick_leave || 0, 
      total: 12,
      icon: Heart,
      color: 'text-red-600 bg-red-100'
    },
    { 
      type: 'Paid Leave', 
      balance: balance?.paid_leave || 0, 
      total: 12,
      icon: DollarSign,
      color: 'text-green-600 bg-green-100'
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Leave Balance</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {leaves.map((leave) => (
            <div key={leave.type} className="flex items-center gap-4">
              <div className={`p-2 rounded-lg ${leave.color}`}>
                <leave.icon className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">{leave.type}</p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${(leave.balance / leave.total) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground font-medium">
                    {leave.balance}/{leave.total}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
