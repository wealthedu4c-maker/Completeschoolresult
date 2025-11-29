import { useQuery, useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Search, Eye, Send, CheckCircle, XCircle, Upload, Globe, FileEdit } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useState } from "react";
import type { Result } from "@shared/schema";
import { BulkResultUploadDialog } from "@/components/results/BulkResultUploadDialog";
import { UploadResultDialog } from "@/components/results/UploadResultDialog";
import { ResultDetailsDialog } from "@/components/results/ResultDetailsDialog";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export default function Results() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [bulkUploadOpen, setBulkUploadOpen] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedResult, setSelectedResult] = useState<Result | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const { data: results, isLoading } = useQuery<Result[]>({
    queryKey: ["/api/results"],
  });

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const isTeacher = user.role === "teacher";
  const isSchoolAdmin = user.role === "school_admin";

  const submitMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("POST", `/api/results/${id}/submit`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/results"] });
      toast({ title: "Success", description: "Result submitted for review" });
    },
    onError: (error: any) => {
      toast({ variant: "destructive", title: "Error", description: error.message });
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("POST", `/api/results/${id}/approve`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/results"] });
      toast({ title: "Success", description: "Result approved successfully" });
    },
    onError: (error: any) => {
      toast({ variant: "destructive", title: "Error", description: error.message });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const res = await apiRequest("POST", `/api/results/${id}/reject`, { reason });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/results"] });
      setRejectDialogOpen(false);
      setRejectReason("");
      toast({ title: "Success", description: "Result rejected and sent back to teacher" });
    },
    onError: (error: any) => {
      toast({ variant: "destructive", title: "Error", description: error.message });
    },
  });

  const publishMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("POST", `/api/results/${id}/publish`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/results"] });
      toast({ title: "Success", description: "Result published! Students can now view it" });
    },
    onError: (error: any) => {
      toast({ variant: "destructive", title: "Error", description: error.message });
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "draft":
        return <Badge variant="secondary" className="gap-1"><FileEdit className="w-3 h-3" /> Draft</Badge>;
      case "submitted":
        return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 gap-1"><Send className="w-3 h-3" /> Submitted</Badge>;
      case "approved":
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 gap-1"><CheckCircle className="w-3 h-3" /> Approved</Badge>;
      case "rejected":
        return <Badge variant="destructive" className="gap-1"><XCircle className="w-3 h-3" /> Rejected</Badge>;
      case "published":
        return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 gap-1"><Globe className="w-3 h-3" /> Published</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const filteredResults = results?.filter((result) => {
    const matchesSearch = 
      result.session.toLowerCase().includes(searchQuery.toLowerCase()) ||
      result.term.toLowerCase().includes(searchQuery.toLowerCase()) ||
      result.class.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || result.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const canSubmit = (result: Result) => 
    (isTeacher || isSchoolAdmin) && (result.status === "draft" || result.status === "rejected");

  const canApprove = (result: Result) => 
    isSchoolAdmin && result.status === "submitted";

  const canReject = (result: Result) => 
    isSchoolAdmin && result.status === "submitted";

  const canPublish = (result: Result) => 
    isSchoolAdmin && result.status === "approved";

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Results</h2>
          <p className="text-muted-foreground">
            {isTeacher ? "Upload and manage student results" : "Review and manage results"}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
          <Button 
            variant="outline" 
            className="gap-2"
            onClick={() => setBulkUploadOpen(true)}
            data-testid="button-bulk-upload"
          >
            <Upload className="w-4 h-4" />
            Bulk Upload
          </Button>
          <Button 
            onClick={() => setUploadDialogOpen(true)}
            data-testid="button-upload-result"
          >
            <Plus className="w-4 h-4 mr-2" />
            Upload Result
          </Button>
        </div>
      </div>

      <Card className="p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-4">
          <div className="flex items-center gap-2 flex-1 w-full sm:w-auto">
            <Search className="w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by session, term, or class..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-sm"
              data-testid="input-search"
            />
          </div>
          <div className="flex items-center gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]" data-testid="select-status-filter">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="submitted">Submitted</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="published">Published</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="rounded-lg border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Session</TableHead>
                <TableHead>Term</TableHead>
                <TableHead>Class</TableHead>
                <TableHead className="hidden md:table-cell">Student</TableHead>
                <TableHead className="text-center hidden sm:table-cell">Subjects</TableHead>
                <TableHead className="text-right">Average</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    Loading results...
                  </TableCell>
                </TableRow>
              ) : filteredResults && filteredResults.length > 0 ? (
                filteredResults.map((result) => (
                  <TableRow key={result.id} data-testid={`row-result-${result.id}`}>
                    <TableCell className="font-medium">{result.session}</TableCell>
                    <TableCell>{result.term}</TableCell>
                    <TableCell>{result.class}</TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                      #{result.studentId.substring(0, 8)}
                    </TableCell>
                    <TableCell className="text-center hidden sm:table-cell">
                      <Badge variant="outline">
                        {Array.isArray(result.subjects) ? result.subjects.length : 0}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {result.averageScore}%
                    </TableCell>
                    <TableCell>{getStatusBadge(result.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1 flex-wrap">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedResult(result);
                            setDetailsDialogOpen(true);
                          }}
                          data-testid={`button-view-${result.id}`}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        
                        {canSubmit(result) && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => submitMutation.mutate(result.id)}
                            disabled={submitMutation.isPending}
                            title="Submit for Review"
                            data-testid={`button-submit-${result.id}`}
                          >
                            <Send className="w-4 h-4 text-blue-600" />
                          </Button>
                        )}

                        {canApprove(result) && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => approveMutation.mutate(result.id)}
                            disabled={approveMutation.isPending}
                            title="Approve"
                            data-testid={`button-approve-${result.id}`}
                          >
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          </Button>
                        )}

                        {canReject(result) && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedResult(result);
                              setRejectDialogOpen(true);
                            }}
                            disabled={rejectMutation.isPending}
                            title="Reject"
                            data-testid={`button-reject-${result.id}`}
                          >
                            <XCircle className="w-4 h-4 text-red-600" />
                          </Button>
                        )}

                        {canPublish(result) && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => publishMutation.mutate(result.id)}
                            disabled={publishMutation.isPending}
                            title="Publish"
                            data-testid={`button-publish-${result.id}`}
                          >
                            <Globe className="w-4 h-4 text-blue-600" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No results found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      <AlertDialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject Result</AlertDialogTitle>
            <AlertDialogDescription>
              Please provide a reason for rejecting this result. The teacher will be notified and can make corrections.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2 py-4">
            <Label htmlFor="reason">Rejection Reason</Label>
            <Textarea
              id="reason"
              placeholder="Explain why the result is being rejected..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
              data-testid="input-reject-reason"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (selectedResult && rejectReason.trim()) {
                  rejectMutation.mutate({ id: selectedResult.id, reason: rejectReason });
                }
              }}
              disabled={!rejectReason.trim() || rejectMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-reject"
            >
              Reject Result
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <BulkResultUploadDialog open={bulkUploadOpen} onOpenChange={setBulkUploadOpen} />
      <UploadResultDialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen} />
      <ResultDetailsDialog 
        open={detailsDialogOpen} 
        onOpenChange={setDetailsDialogOpen} 
        result={selectedResult} 
      />
    </div>
  );
}
