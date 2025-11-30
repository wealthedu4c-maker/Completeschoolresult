import { useQuery, useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Search, Eye, Send, CheckCircle, XCircle, Upload, Globe, FileEdit, Table2, ClipboardList, BookOpen } from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import type { Result, ResultSheet, ResultSheetEntry, Class, Subject } from "@shared/schema";
import { BulkResultUploadDialog } from "@/components/results/BulkResultUploadDialog";
import { UploadResultDialog } from "@/components/results/UploadResultDialog";
import { ResultDetailsDialog } from "@/components/results/ResultDetailsDialog";
import { SpreadsheetResultUpload } from "@/components/results/SpreadsheetResultUpload";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ResultSheetWithDetails extends ResultSheet {
  entries?: ResultSheetEntry[];
  className?: string;
  subjectName?: string;
  teacherName?: string;
}

export default function Results() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sheetStatusFilter, setSheetStatusFilter] = useState("all");
  const [bulkUploadOpen, setBulkUploadOpen] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [spreadsheetUploadOpen, setSpreadsheetUploadOpen] = useState(false);
  const [selectedResult, setSelectedResult] = useState<Result | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [activeTab, setActiveTab] = useState("sheets");
  const [selectedSheet, setSelectedSheet] = useState<ResultSheetWithDetails | null>(null);
  const [sheetDetailsOpen, setSheetDetailsOpen] = useState(false);
  const [sheetRejectDialogOpen, setSheetRejectDialogOpen] = useState(false);
  const [sheetRejectReason, setSheetRejectReason] = useState("");

  const { data: results, isLoading } = useQuery<Result[]>({
    queryKey: ["/api/results"],
  });

  const { data: resultSheets = [], isLoading: sheetsLoading } = useQuery<ResultSheetWithDetails[]>({
    queryKey: ["/api/result-sheets"],
  });

  const { data: classes = [] } = useQuery<Class[]>({
    queryKey: ["/api/classes"],
  });

  const { data: subjects = [] } = useQuery<Subject[]>({
    queryKey: ["/api/subjects"],
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

  const approveSheetMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("PATCH", `/api/result-sheets/${id}/approve`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/result-sheets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/results"] });
      setSheetDetailsOpen(false);
      toast({ title: "Success", description: "Result sheet approved and results aggregated" });
    },
    onError: (error: any) => {
      toast({ variant: "destructive", title: "Error", description: error.message });
    },
  });

  const rejectSheetMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const res = await apiRequest("PATCH", `/api/result-sheets/${id}/reject`, { reason });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/result-sheets"] });
      setSheetRejectDialogOpen(false);
      setSheetRejectReason("");
      setSheetDetailsOpen(false);
      toast({ title: "Success", description: "Result sheet rejected and sent back to teacher" });
    },
    onError: (error: any) => {
      toast({ variant: "destructive", title: "Error", description: error.message });
    },
  });

  const getClassName = (classId: string) => {
    const classRecord = classes.find(c => c.id === classId);
    return classRecord?.name || classId;
  };

  const getSubjectName = (subjectId: string) => {
    const subject = subjects.find(s => s.id === subjectId);
    return subject?.name || subjectId;
  };

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

  const filteredSheets = resultSheets.filter((sheet) => {
    const className = getClassName(sheet.classId);
    const subjectName = getSubjectName(sheet.subjectId);
    const matchesSearch = 
      sheet.session.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sheet.term.toLowerCase().includes(searchQuery.toLowerCase()) ||
      className.toLowerCase().includes(searchQuery.toLowerCase()) ||
      subjectName.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = sheetStatusFilter === "all" || sheet.status === sheetStatusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const pendingSheetsCount = resultSheets.filter(s => s.status === "submitted").length;

  const canSubmit = (result: Result) => 
    (isTeacher || isSchoolAdmin) && (result.status === "draft" || result.status === "rejected");

  const canApprove = (result: Result) => 
    isSchoolAdmin && result.status === "submitted";

  const canReject = (result: Result) => 
    isSchoolAdmin && result.status === "submitted";

  const canPublish = (result: Result) => 
    isSchoolAdmin && result.status === "approved";

  const canApproveSheet = (sheet: ResultSheet) => 
    isSchoolAdmin && sheet.status === "submitted";

  const canRejectSheet = (sheet: ResultSheet) => 
    isSchoolAdmin && sheet.status === "submitted";

  const handleViewSheetDetails = async (sheet: ResultSheetWithDetails) => {
    try {
      const res = await fetch(`/api/result-sheets/${sheet.id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      const data = await res.json();
      setSelectedSheet({ ...sheet, entries: data.entries || [] });
      setSheetDetailsOpen(true);
    } catch (error) {
      setSelectedSheet(sheet);
      setSheetDetailsOpen(true);
    }
  };

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
            <span className="hidden sm:inline">Bulk Upload</span>
            <span className="sm:hidden">Bulk</span>
          </Button>
          <Button 
            onClick={() => setSpreadsheetUploadOpen(true)}
            className="gap-2"
            data-testid="button-upload-result"
          >
            <Table2 className="w-4 h-4" />
            <span className="hidden sm:inline">Upload Results</span>
            <span className="sm:hidden">Upload</span>
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="sheets" className="gap-2" data-testid="tab-result-sheets">
            <ClipboardList className="w-4 h-4" />
            <span className="hidden sm:inline">Result Sheets</span>
            <span className="sm:hidden">Sheets</span>
            {pendingSheetsCount > 0 && (
              <Badge variant="destructive" className="ml-1 h-5 px-1.5">{pendingSheetsCount}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="results" className="gap-2" data-testid="tab-student-results">
            <BookOpen className="w-4 h-4" />
            <span className="hidden sm:inline">Student Results</span>
            <span className="sm:hidden">Results</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sheets">
          <Card className="p-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-4">
              <div className="flex items-center gap-2 flex-1 w-full sm:w-auto">
                <Search className="w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by session, term, class, or subject..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="max-w-sm"
                  data-testid="input-search-sheets"
                />
              </div>
              <div className="flex items-center gap-2">
                <Select value={sheetStatusFilter} onValueChange={setSheetStatusFilter}>
                  <SelectTrigger className="w-[150px]" data-testid="select-sheet-status-filter">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="submitted">Submitted</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
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
                    <TableHead>Subject</TableHead>
                    <TableHead className="text-center hidden sm:table-cell">Students</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sheetsLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        Loading result sheets...
                      </TableCell>
                    </TableRow>
                  ) : filteredSheets.length > 0 ? (
                    filteredSheets.map((sheet) => (
                      <TableRow key={sheet.id} data-testid={`row-sheet-${sheet.id}`}>
                        <TableCell className="font-medium">{sheet.session}</TableCell>
                        <TableCell>{sheet.term}</TableCell>
                        <TableCell>{getClassName(sheet.classId)}</TableCell>
                        <TableCell>{getSubjectName(sheet.subjectId)}</TableCell>
                        <TableCell className="text-center hidden sm:table-cell">
                          <Badge variant="outline">{sheet.entries?.length || "-"}</Badge>
                        </TableCell>
                        <TableCell>{getStatusBadge(sheet.status || "draft")}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1 flex-wrap">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleViewSheetDetails(sheet)}
                              data-testid={`button-view-sheet-${sheet.id}`}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            
                            {canApproveSheet(sheet) && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => approveSheetMutation.mutate(sheet.id)}
                                disabled={approveSheetMutation.isPending}
                                title="Approve Sheet"
                                data-testid={`button-approve-sheet-${sheet.id}`}
                              >
                                <CheckCircle className="w-4 h-4 text-green-600" />
                              </Button>
                            )}

                            {canRejectSheet(sheet) && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setSelectedSheet(sheet);
                                  setSheetRejectDialogOpen(true);
                                }}
                                disabled={rejectSheetMutation.isPending}
                                title="Reject Sheet"
                                data-testid={`button-reject-sheet-${sheet.id}`}
                              >
                                <XCircle className="w-4 h-4 text-red-600" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No result sheets found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="results">
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
        </TabsContent>
      </Tabs>

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
      <SpreadsheetResultUpload open={spreadsheetUploadOpen} onOpenChange={setSpreadsheetUploadOpen} />
      <ResultDetailsDialog 
        open={detailsDialogOpen} 
        onOpenChange={setDetailsDialogOpen} 
        result={selectedResult} 
      />

      <AlertDialog open={sheetRejectDialogOpen} onOpenChange={setSheetRejectDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject Result Sheet</AlertDialogTitle>
            <AlertDialogDescription>
              Please provide a reason for rejecting this result sheet. The teacher will be notified and can make corrections.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2 py-4">
            <Label htmlFor="sheet-reason">Rejection Reason</Label>
            <Textarea
              id="sheet-reason"
              placeholder="Explain why the result sheet is being rejected..."
              value={sheetRejectReason}
              onChange={(e) => setSheetRejectReason(e.target.value)}
              rows={3}
              data-testid="input-sheet-reject-reason"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (selectedSheet && sheetRejectReason.trim()) {
                  rejectSheetMutation.mutate({ id: selectedSheet.id, reason: sheetRejectReason });
                }
              }}
              disabled={!sheetRejectReason.trim() || rejectSheetMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-sheet-reject"
            >
              Reject Sheet
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={sheetDetailsOpen} onOpenChange={setSheetDetailsOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Result Sheet Details</DialogTitle>
            <DialogDescription>
              {selectedSheet && (
                <>
                  {getClassName(selectedSheet.classId)} - {getSubjectName(selectedSheet.subjectId)} | {selectedSheet.session} - {selectedSheet.term} Term
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          
          {selectedSheet && (
            <div className="flex-1 min-h-0 flex flex-col space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getStatusBadge(selectedSheet.status || "draft")}
                  {selectedSheet.entries && (
                    <span className="text-sm text-muted-foreground">
                      {selectedSheet.entries.length} student(s)
                    </span>
                  )}
                </div>
                {canApproveSheet(selectedSheet) && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      onClick={() => {
                        setSheetDetailsOpen(false);
                        setSheetRejectDialogOpen(true);
                      }}
                    >
                      <XCircle className="w-4 h-4" />
                      Reject
                    </Button>
                    <Button
                      size="sm"
                      className="gap-2"
                      onClick={() => approveSheetMutation.mutate(selectedSheet.id)}
                      disabled={approveSheetMutation.isPending}
                    >
                      <CheckCircle className="w-4 h-4" />
                      Approve
                    </Button>
                  </div>
                )}
              </div>

              <ScrollArea className="flex-1 border rounded-md">
                <Table>
                  <TableHeader className="sticky top-0 bg-background">
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead className="text-center w-20">CA1</TableHead>
                      <TableHead className="text-center w-20">CA2</TableHead>
                      <TableHead className="text-center w-20">Exam</TableHead>
                      <TableHead className="text-center w-20">Total</TableHead>
                      <TableHead className="text-center w-20">Grade</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedSheet.entries && selectedSheet.entries.length > 0 ? (
                      selectedSheet.entries.map((entry, idx) => (
                        <TableRow key={entry.id || idx}>
                          <TableCell className="font-medium">
                            Student #{entry.studentId.substring(0, 8)}
                          </TableCell>
                          <TableCell className="text-center">{entry.ca1}</TableCell>
                          <TableCell className="text-center">{entry.ca2}</TableCell>
                          <TableCell className="text-center">{entry.exam}</TableCell>
                          <TableCell className="text-center font-semibold">{entry.total}</TableCell>
                          <TableCell className="text-center">
                            <Badge variant={entry.grade === "F" ? "destructive" : "secondary"}>
                              {entry.grade}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          No entries found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
