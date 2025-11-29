import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Search, Eye, CheckCircle, XCircle, Upload } from "lucide-react";
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
import { Link } from "wouter";
import { BulkResultUploadDialog } from "@/components/results/BulkResultUploadDialog";
import { UploadResultDialog } from "@/components/results/UploadResultDialog";
import { ResultDetailsDialog } from "@/components/results/ResultDetailsDialog";

export default function Results() {
  const [searchQuery, setSearchQuery] = useState("");
  const [bulkUploadOpen, setBulkUploadOpen] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedResult, setSelectedResult] = useState<Result | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);

  const { data: results, isLoading } = useQuery<Result[]>({
    queryKey: ["/api/results"],
  });

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const isTeacher = user.role === "teacher";

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "draft":
        return <Badge variant="secondary">Draft</Badge>;
      case "submitted":
        return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">Submitted</Badge>;
      case "approved":
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Approved</Badge>;
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const filteredResults = results?.filter((result) =>
    result.session.toLowerCase().includes(searchQuery.toLowerCase()) ||
    result.term.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Results</h2>
          <p className="text-muted-foreground">
            {isTeacher ? "Upload and manage student results" : "Review and approve results"}
          </p>
        </div>
        {isTeacher && (
          <div className="flex items-center gap-3">
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
        )}
      </div>

      <Card className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <Search className="w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by session or term..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-sm"
            data-testid="input-search"
          />
        </div>

        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Session</TableHead>
                <TableHead>Term</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Student</TableHead>
                <TableHead className="text-center">Subjects</TableHead>
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
                    <TableCell className="text-sm text-muted-foreground">
                      Student #{result.studentId.substring(0, 8)}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline">
                        {Array.isArray(result.subjects) ? result.subjects.length : 0}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {result.averageScore}%
                    </TableCell>
                    <TableCell>{getStatusBadge(result.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedResult(result);
                            setDetailsDialogOpen(true);
                          }}
                          data-testid={`button-view-${result.id}`}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        {!isTeacher && result.status === "submitted" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedResult(result);
                              setDetailsDialogOpen(true);
                            }}
                            data-testid={`button-approve-${result.id}`}
                          >
                            <CheckCircle className="w-4 h-4 text-green-600" />
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
