import { useEffect, useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { LeaveRequestForm } from '@/components/leaves/LeaveRequestForm';
import { LeaveBalance } from '@/components/leaves/LeaveBalance';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Check, X, Undo2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { LeaveRequest, LeaveBalance as LeaveBalanceType } from '@/types/hrms';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function Leaves() {
  const { user, profile, isAdmin, isManager } = useAuth();
  const [myRequests, setMyRequests] = useState<LeaveRequest[]>([]);
  const [teamRequests, setTeamRequests] = useState<LeaveRequest[]>([]);
  const [balance, setBalance] = useState<LeaveBalanceType | null>(null);
  const [loading, setLoading] = useState(true);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const fetchData = async () => {
    if (!user) return;

    try {
      // Fetch my own requests
      const { data: myData } = await supabase
        .from('leave_requests')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (myData) {
        setMyRequests(myData as unknown as LeaveRequest[]);
      }

      // Fetch team/all requests for managers/admins
      if (isAdmin || isManager) {
        // First get the user IDs we need to fetch
        let userIdsToFetch: string[] = [];

        // For managers, only show their direct reports
        if (isManager && !isAdmin && profile) {
          const { data: reportees } = await supabase
            .from('profiles')
            .select('user_id')
            .eq('reporting_manager_id', profile.id);
          
          if (reportees && reportees.length > 0) {
            userIdsToFetch = reportees.map(r => r.user_id);
          } else {
            setTeamRequests([]);
          }
        }

        // Fetch leave requests
        let requestsQuery = supabase
          .from('leave_requests')
          .select('*')
          .neq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (isManager && !isAdmin && userIdsToFetch.length > 0) {
          requestsQuery = requestsQuery.in('user_id', userIdsToFetch);
        }

        const { data: teamData } = await requestsQuery;
        
        if (teamData && teamData.length > 0) {
          // Fetch all profiles for these requests
          const requestUserIds = [...new Set(teamData.map(r => r.user_id))];
          const { data: profilesData } = await supabase
            .from('profiles')
            .select('user_id, first_name, last_name, reporting_manager_id')
            .in('user_id', requestUserIds);

          // Create a map of user_id to profile
          const profileMap = new Map();
          profilesData?.forEach(p => profileMap.set(p.user_id, p));

          // Attach profile data to each request
          const requestsWithProfiles = teamData.map(request => ({
            ...request,
            profile: profileMap.get(request.user_id) || null
          }));

          setTeamRequests(requestsWithProfiles as unknown as LeaveRequest[]);
        } else {
          setTeamRequests([]);
        }
      }

      // Fetch balance
      const { data: balanceData } = await supabase
        .from('leave_balances')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (balanceData) {
        setBalance(balanceData as LeaveBalanceType);
      }
    } catch (error) {
      console.error('Error fetching leave data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user, isAdmin, isManager]);

  const handleApprove = async (request: LeaveRequest) => {
    try {
      // Calculate number of leave days
      const startDate = new Date(request.start_date);
      const endDate = new Date(request.end_date);
      const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
      const leaveDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

      // Update leave request status
      const { error: updateError } = await supabase
        .from('leave_requests')
        .update({
          status: 'approved',
          approved_by: user?.id,
          approved_at: new Date().toISOString(),
        })
        .eq('id', request.id);

      if (updateError) throw updateError;

      // Deduct from leave balance (only for casual, sick, paid leaves)
      if (request.leave_type !== 'unpaid') {
        const leaveTypeColumn = `${request.leave_type}_leave` as 'casual_leave' | 'sick_leave' | 'paid_leave';
        
        // Get current balance
        const { data: balanceData } = await supabase
          .from('leave_balances')
          .select('*')
          .eq('user_id', request.user_id)
          .maybeSingle();

        if (balanceData) {
          const currentBalance = Number(balanceData[leaveTypeColumn] || 0);
          const newBalance = Math.max(0, currentBalance - leaveDays);

          await supabase
            .from('leave_balances')
            .update({ [leaveTypeColumn]: newBalance })
            .eq('user_id', request.user_id);
        }
      }

      toast.success('Leave request approved');
      fetchData();
    } catch (error) {
      console.error('Error approving leave:', error);
      toast.error('Failed to approve request');
    }
  };

  const openRejectDialog = (request: LeaveRequest) => {
    setSelectedRequest(request);
    setRejectionReason('');
    setRejectDialogOpen(true);
  };

  const handleReject = async () => {
    if (!selectedRequest) return;

    try {
      const { error } = await supabase
        .from('leave_requests')
        .update({
          status: 'rejected',
          approved_by: user?.id,
          approved_at: new Date().toISOString(),
          rejection_reason: rejectionReason || null,
        })
        .eq('id', selectedRequest.id);

      if (error) throw error;
      toast.success('Leave request rejected');
      setRejectDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error('Error rejecting leave:', error);
      toast.error('Failed to reject request');
    }
  };

  const handleWithdraw = async (id: string) => {
    try {
      const { error } = await supabase
        .from('leave_requests')
        .delete()
        .eq('id', id)
        .eq('user_id', user?.id)
        .eq('status', 'pending');

      if (error) throw error;
      toast.success('Leave request withdrawn');
      fetchData();
    } catch (error: any) {
      console.error('Error withdrawing leave:', error);
      toast.error('Failed to withdraw request');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-700">Approved</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-700">Rejected</Badge>;
      default:
        return <Badge className="bg-yellow-100 text-yellow-700">Pending</Badge>;
    }
  };

  const getLeaveTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      casual: 'bg-blue-100 text-blue-700',
      sick: 'bg-red-100 text-red-700',
      paid: 'bg-green-100 text-green-700',
      unpaid: 'bg-gray-100 text-gray-700',
    };
    return colors[type] || 'bg-gray-100 text-gray-700';
  };

  const renderRequestCard = (request: LeaveRequest, showActions: boolean, showWithdraw: boolean) => (
    <div
      key={request.id}
      className="flex items-start justify-between p-4 rounded-lg border border-border"
    >
      <div className="flex-1">
        {request.profile && (
          <p className="font-medium text-foreground mb-1">
            {request.profile.first_name} {request.profile.last_name}
          </p>
        )}
        <div className="flex items-center gap-2 flex-wrap">
          <Badge className={getLeaveTypeBadge(request.leave_type)}>
            {request.leave_type}
          </Badge>
          {getStatusBadge(request.status)}
          <span className="text-sm text-muted-foreground">
            {format(new Date(request.start_date), 'MMM d, yyyy')} - {format(new Date(request.end_date), 'MMM d, yyyy')}
          </span>
        </div>
        {request.reason && (
          <p className="text-sm text-muted-foreground mt-2">{request.reason}</p>
        )}
        {request.rejection_reason && request.status === 'rejected' && (
          <p className="text-sm text-destructive mt-2">
            <span className="font-medium">Reason:</span> {request.rejection_reason}
          </p>
        )}
      </div>
      <div className="flex gap-2 ml-4">
        {showWithdraw && request.status === 'pending' && (
          <Button
            size="sm"
            variant="outline"
            className="text-muted-foreground"
            onClick={() => handleWithdraw(request.id)}
          >
            <Undo2 className="h-4 w-4 mr-1" />
            Withdraw
          </Button>
        )}
        {showActions && request.status === 'pending' && (
          <>
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-100"
              onClick={() => handleApprove(request)}
            >
              <Check className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-red-100"
              onClick={() => openRejectDialog(request)}
            >
              <X className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>
    </div>
  );

  const pendingTeamCount = teamRequests.filter(r => r.status === 'pending').length;

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Leave Management</h1>
          <p className="text-muted-foreground mt-1">Request and manage leaves</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Tabs defaultValue="my-requests">
              <TabsList className="mb-4">
                <TabsTrigger value="my-requests">My Requests</TabsTrigger>
                {(isAdmin || isManager) && (
                  <TabsTrigger value="team-requests">
                    Team Requests
                    {pendingTeamCount > 0 && (
                      <Badge className="ml-2 bg-primary text-primary-foreground">{pendingTeamCount}</Badge>
                    )}
                  </TabsTrigger>
                )}
              </TabsList>

              <TabsContent value="my-requests">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold">My Leave Requests</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                      <p className="text-center py-8 text-muted-foreground">Loading...</p>
                    ) : myRequests.length === 0 ? (
                      <p className="text-center py-8 text-muted-foreground">No leave requests yet</p>
                    ) : (
                      <div className="space-y-4">
                        {myRequests.map((request) => renderRequestCard(request, false, true))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {(isAdmin || isManager) && (
                <TabsContent value="team-requests">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg font-semibold">
                        {isAdmin ? 'All Team Requests' : 'Team Requests'}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {loading ? (
                        <p className="text-center py-8 text-muted-foreground">Loading...</p>
                      ) : teamRequests.length === 0 ? (
                        <p className="text-center py-8 text-muted-foreground">No team requests</p>
                      ) : (
                        <div className="space-y-4">
                          {teamRequests.map((request) => renderRequestCard(request, true, false))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              )}
            </Tabs>
          </div>

          <div className="space-y-6">
            <LeaveBalance balance={balance} />
            <LeaveRequestForm onSuccess={fetchData} />
          </div>
        </div>
      </div>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Leave Request</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Reason for rejection (optional)</Label>
              <Textarea
                placeholder="Enter reason for rejection..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleReject}>
              Reject Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}