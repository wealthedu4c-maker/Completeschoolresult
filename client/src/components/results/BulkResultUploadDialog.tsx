import { useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Upload, Download, FileSpreadsheet, Loader2, AlertCircle, CheckCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { Subject } from "@shared/schema";

interface BulkResultUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface UploadResult {
  success: number;
  failed: number;
  errors: string[];
  message: string;
}

export function BulkResultUploadDialog({ open, onOpenChange }: BulkResultUploadDialogProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [session, setSession] = useState("");
  const [term, setTerm] = useState("");

  const { data: subjects = [] } = useQuery<Subject[]>({
    queryKey: ["/api/subjects"],
  });

  const currentYear = new Date().getFullYear();
  const sessions = [
    `${currentYear - 1}/${currentYear}`,
    `${currentYear}/${currentYear + 1}`,
  ];

  const downloadTemplate = () => {
    const subjectNames = subjects.length > 0 
      ? subjects.map(s => s.name).slice(0, 5) 
      : ["Mathematics", "English", "Science", "Social Studies", "Computer"];
    
    const headers = ["admissionNumber", ...subjectNames.flatMap(s => [`${s}_ca1`, `${s}_ca2`, `${s}_exam`])];
    const sampleData = [
      ["STU2024001", ...subjectNames.flatMap(() => ["8", "9", "70"])],
      ["STU2024002", ...subjectNames.flatMap(() => ["7", "8", "65"])],
    ];
    
    const csvContent = [
      headers.join(","),
      ...sampleData.map(row => row.join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "result_upload_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const parseCSV = (text: string): any[] => {
    const lines = text.trim().split("\n");
    if (lines.length < 2) return [];

    const headers = lines[0].split(",").map(h => h.trim());
    const data = [];

    // Find subject columns (pattern: SubjectName_ca1, SubjectName_ca2, SubjectName_exam)
    const subjectColumns: { [key: string]: { ca1Idx?: number; ca2Idx?: number; examIdx?: number } } = {};
    
    headers.forEach((header, idx) => {
      if (header.toLowerCase() === "admissionnumber") return;
      
      const match = header.match(/^(.+?)_(ca1|ca2|exam)$/i);
      if (match) {
        const subjectName = match[1];
        const scoreType = match[2].toLowerCase();
        if (!subjectColumns[subjectName]) {
          subjectColumns[subjectName] = {};
        }
        if (scoreType === "ca1") subjectColumns[subjectName].ca1Idx = idx;
        else if (scoreType === "ca2") subjectColumns[subjectName].ca2Idx = idx;
        else if (scoreType === "exam") subjectColumns[subjectName].examIdx = idx;
      }
    });

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",").map(v => v.trim());
      const admissionNumberIdx = headers.findIndex(h => h.toLowerCase() === "admissionnumber");
      const admissionNumber = values[admissionNumberIdx];

      if (!admissionNumber) continue;

      const subjects = Object.entries(subjectColumns).map(([subjectName, indices]) => ({
        subject: subjectName,
        ca1: Number(values[indices.ca1Idx ?? -1]) || 0,
        ca2: Number(values[indices.ca2Idx ?? -1]) || 0,
        exam: Number(values[indices.examIdx ?? -1]) || 0,
      })).filter(s => s.ca1 > 0 || s.ca2 > 0 || s.exam > 0);

      if (subjects.length > 0) {
        data.push({ admissionNumber, subjects });
      }
    }

    return data;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const data = parseCSV(text);
      setParsedData(data);
      setResult(null);
    };
    reader.readAsText(file);
  };

  const handleUpload = async () => {
    if (parsedData.length === 0) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No valid data to upload",
      });
      return;
    }

    if (!session || !term) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select session and term",
      });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await apiRequest("POST", "/api/results/bulk", {
        results: parsedData,
        session,
        term,
      });

      const data = await response.json();
      setResult(data);

      if (data.success > 0) {
        queryClient.invalidateQueries({ queryKey: ["/api/results"] });
        toast({
          title: "Upload Complete",
          description: data.message,
        });
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Upload Failed",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const resetDialog = () => {
    setParsedData([]);
    setResult(null);
    setSession("");
    setTerm("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => {
      if (!open) resetDialog();
      onOpenChange(open);
    }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Bulk Upload Results</DialogTitle>
          <DialogDescription>
            Upload a CSV file with student results. Download the template to see the required format.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Session</Label>
              <Select value={session} onValueChange={setSession}>
                <SelectTrigger data-testid="select-session">
                  <SelectValue placeholder="Select session" />
                </SelectTrigger>
                <SelectContent>
                  {sessions.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Term</Label>
              <Select value={term} onValueChange={setTerm}>
                <SelectTrigger data-testid="select-term">
                  <SelectValue placeholder="Select term" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="First">First Term</SelectItem>
                  <SelectItem value="Second">Second Term</SelectItem>
                  <SelectItem value="Third">Third Term</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button
            variant="outline"
            className="w-full gap-2"
            onClick={downloadTemplate}
            data-testid="button-download-template"
          >
            <Download className="w-4 h-4" />
            Download CSV Template
          </Button>

          <div className="border-2 border-dashed rounded-lg p-6 text-center">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
              id="csv-result-upload"
              data-testid="input-file-upload"
            />
            <label htmlFor="csv-result-upload" className="cursor-pointer">
              <FileSpreadsheet className="w-10 h-10 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                Click to upload CSV file
              </p>
            </label>
          </div>

          {parsedData.length > 0 && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Found {parsedData.length} result records ready to upload
              </AlertDescription>
            </Alert>
          )}

          {result && (
            <div className="space-y-2">
              <Alert variant={result.failed > 0 ? "destructive" : "default"}>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Success: {result.success}, Failed: {result.failed}
                </AlertDescription>
              </Alert>
              {result.errors.length > 0 && (
                <div className="max-h-32 overflow-y-auto text-sm text-destructive space-y-1">
                  {result.errors.slice(0, 10).map((err, idx) => (
                    <p key={idx}>{err}</p>
                  ))}
                  {result.errors.length > 10 && (
                    <p className="text-muted-foreground">
                      ...and {result.errors.length - 10} more errors
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 gap-2"
              onClick={handleUpload}
              disabled={loading || parsedData.length === 0 || !session || !term}
              data-testid="button-upload"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Upload Results
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
