import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Check, X, Loader2, ClipboardList, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";

interface PinRequest {
  id: string;
  schoolId: string;
  requestedBy: string;
  session: string;
  term: string;
  quantity: number;
  status: string;
  processedAt?: string;
  rejectionReason?: string;
  createdAt: string;
}

export default function PinRequests() {
  const { toast } = useToast();
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [formData, setFormData] = useState({
    quantity: 10,
    session: new Date().getFullYear() + "/" + (new Date().getFullYear() + 1),
    term: "First",
  });

  const { data: requests = [], isLoading } = useQuery<PinRequest[]>({
    queryKey: ["/api/pin-requests"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await apiRequest("POST", "/api/pin-requests", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pin-requests"] });
      setIsDialogOpen(false);
      setFormData({
        quantity: 10,
        session: new Date().getFullYear() + "/" + (new Date().getFullYear() + 1),
        term: "First",
      });
      toast({ title: "Success", description: "PIN request submitted successfully" });
    },
    onError: (error: any) => {
      toast({ variant: "destructive", title: "Error", description: error.message });
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("POST", `/api/pin-requests/${id}/approve`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pin-requests"] });
      toast({
        title: "Success",
        description: "PIN request approved and PINs generated",
      });
    },
    onError: (error: any) => {
      toast({ variant: "destructive", title: "Error", description: error.message });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const res = await apiRequest("POST", `/api/pin-requests/${id}/reject`, { reason });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pin-requests"] });
      setRejectDialogOpen(false);
      setSelectedRequestId(null);
      setRejectionReason("");
      toast({
        title: "Success",
        description: "PIN request rejected",
      });
    },
    onError: (error: any) => {
      toast({ variant: "destructive", title: "Error", description: error.message });
    },
  });

  const handleReject = () => {
    if (selectedRequestId) {
      rejectMutation.mutate({ id: selectedRequestId, reason: rejectionReason });
    }
  };

  const openRejectDialog = (requestId: string) => {
    setSelectedRequestId(requestId);
    setRejectionReason("");
    setRejectDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">Pending</Badge>;
      case "approved":
        return <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Approved</Badge>;
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const pendingCount = requests.filter(r => r.status === "pending").length;

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">PIN Requests</h2>
          <p className="text-muted-foreground">
            {user.role === "super_admin" 
              ? "Manage PIN generation requests from schools" 
              : "Request result checking PINs for your school"}
          </p>
        </div>
        {user.role === "school_admin" && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 w-full sm:w-auto" data-testid="button-request-pins">
                <Plus className="w-4 h-4" />
                Request PINs
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md mx-4 sm:mx-auto">
              <DialogHeader>
                <DialogTitle>Request Result PINs</DialogTitle>
                <DialogDescription>Submit a request for result checking PINs</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="quantity">Number of PINs</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min={1}
                    max={1000}
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                    required
                    data-testid="input-quantity"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="session">Academic Session</Label>
                    <Input
                      id="session"
                      placeholder="e.g., 2024/2025"
                      value={formData.session}
                      onChange={(e) => setFormData({ ...formData, session: e.target.value })}
                      required
                      data-testid="input-session"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="term">Term</Label>
                    <Select
                      value={formData.term}
                      onValueChange={(value) => setFormData({ ...formData, term: value })}
                    >
                      <SelectTrigger data-testid="select-term">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="First">First Term</SelectItem>
                        <SelectItem value="Second">Second Term</SelectItem>
                        <SelectItem value="Third">Third Term</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={createMutation.isPending} data-testid="button-submit">
                  {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Submit Request
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {user.role === "super_admin" && pendingCount > 0 && (
        <Card className="border-yellow-500/50 bg-yellow-50/50 dark:bg-yellow-900/10">
          <CardContent className="flex items-center gap-3 py-4">
            <Clock className="w-5 h-5 text-yellow-600" />
            <span className="text-sm">
              <strong>{pendingCount}</strong> pending PIN request{pendingCount > 1 ? "s" : ""} awaiting approval
            </span>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <ClipboardList className="w-5 h-5" />
            {user.role === "super_admin" ? "All PIN Requests" : "My PIN Requests"} ({requests.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No PIN requests yet
            </div>
          ) : (
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Session / Term</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden md:table-cell">Requested</TableHead>
                    {user.role === "super_admin" && <TableHead className="text-right">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.map((request) => (
                    <TableRow key={request.id} data-testid={`row-request-${request.id}`}>
                      <TableCell>
                        <div className="font-medium">{request.session}</div>
                        <div className="text-sm text-muted-foreground">{request.term} Term</div>
                      </TableCell>
                      <TableCell>
                        <span className="font-semibold">{request.quantity}</span> PINs
                      </TableCell>
                      <TableCell>{getStatusBadge(request.status)}</TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground">
                        {format(new Date(request.createdAt), "MMM d, yyyy")}
                      </TableCell>
                      {user.role === "super_admin" && (
                        <TableCell className="text-right">
                          {request.status === "pending" && (
                            <div className="flex justify-end gap-2">
                              <Button
                                size="icon"
                                variant="ghost"
                                className="text-green-600 hover:text-green-700 hover:bg-green-100"
                                onClick={() => approveMutation.mutate(request.id)}
                                disabled={approveMutation.isPending}
                                data-testid={`button-approve-${request.id}`}
                              >
                                <Check className="w-4 h-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="text-red-600 hover:text-red-700 hover:bg-red-100"
                                onClick={() => openRejectDialog(request.id)}
                                disabled={rejectMutation.isPending}
                                data-testid={`button-reject-${request.id}`}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Rejection Reason Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent className="max-w-md mx-4 sm:mx-auto">
          <DialogHeader>
            <DialogTitle>Reject PIN Request</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this PIN request
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Rejection Reason</Label>
              <Textarea
                id="reason"
                placeholder="Enter the reason for rejection..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={3}
                data-testid="input-rejection-reason"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setRejectDialogOpen(false)}
              data-testid="button-cancel-rejection"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={rejectMutation.isPending || !rejectionReason.trim()}
              data-testid="button-confirm-rejection"
            >
              {rejectMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Reject Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
