import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Check, X } from 'lucide-react';
import { LeaveRequest } from '@/types/hrms';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface LeaveRequestsWidgetProps {
  requests: LeaveRequest[];
  onApprove?: (id: string) => void;
  onReject?: (id: string, reason?: string) => void;
  isAdmin?: boolean;
}

export function LeaveRequestsWidget({ requests, onApprove, onReject, isAdmin }: LeaveRequestsWidgetProps) {
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getLeaveTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      casual: 'bg-blue-100 text-blue-700',
      sick: 'bg-red-100 text-red-700',
      paid: 'bg-green-100 text-green-700',
      unpaid: 'bg-gray-100 text-gray-700',
    };
    return colors[type] || 'bg-gray-100 text-gray-700';
  };

  const handleRejectClick = (requestId: string) => {
    setSelectedRequestId(requestId);
    setRejectionReason('');
    setRejectDialogOpen(true);
  };

  const handleConfirmReject = async () => {
    if (!selectedRequestId) return;
    
    setIsSubmitting(true);
    try {
      await onReject?.(selectedRequestId, rejectionReason || undefined);
      setRejectDialogOpen(false);
      setSelectedRequestId(null);
      setRejectionReason('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-semibold">Pending Leave Requests</CardTitle>
        <Badge variant="secondary">{requests.length}</Badge>
      </CardHeader>
      <CardContent>
        {requests.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No pending requests</p>
        ) : (
          <div className="space-y-4">
            {requests.slice(0, 5).map((request) => (
              <div key={request.id} className="flex items-center justify-between p-3 rounded-lg bg-accent/50">
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">
                    {request.profile?.first_name} {request.profile?.last_name}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge className={getLeaveTypeBadge(request.leave_type)}>
                      {request.leave_type}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(request.start_date), 'MMM d')} - {format(new Date(request.end_date), 'MMM d')}
                    </span>
                  </div>
                </div>
                {isAdmin && (
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-100"
                      onClick={() => onApprove?.(request.id)}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-red-100"
                      onClick={() => handleRejectClick(request.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Rejection Reason Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Leave Request</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this leave request. This helps the employee understand the decision.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="rejection-reason">Rejection Reason</Label>
              <Textarea
                id="rejection-reason"
                placeholder="e.g., Team project deadline conflict, insufficient leave balance..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleConfirmReject}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Rejecting...' : 'Reject Request'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
