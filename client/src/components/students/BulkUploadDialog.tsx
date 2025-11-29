import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Upload, Download, FileSpreadsheet, Loader2, AlertCircle, CheckCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface BulkUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface UploadResult {
  success: number;
  failed: number;
  errors: string[];
  message: string;
}

export function BulkUploadDialog({ open, onOpenChange }: BulkUploadDialogProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [parsedData, setParsedData] = useState<any[]>([]);

  const downloadTemplate = () => {
    const headers = ["admissionNumber", "firstName", "lastName", "middleName", "gender", "class", "classArm"];
    const sampleData = [
      ["STU2024001", "John", "Doe", "James", "Male", "JSS 1", "A"],
      ["STU2024002", "Jane", "Smith", "", "Female", "JSS 1", "B"],
    ];
    
    const csvContent = [
      headers.join(","),
      ...sampleData.map(row => row.join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "student_upload_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const parseCSV = (text: string): any[] => {
    const lines = text.trim().split("\n");
    if (lines.length < 2) return [];

    const headers = lines[0].split(",").map(h => h.trim().toLowerCase());
    const data = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",").map(v => v.trim());
      const row: any = {};
      
      headers.forEach((header, idx) => {
        const value = values[idx] || "";
        if (header === "admissionnumber") row.admissionNumber = value;
        else if (header === "firstname") row.firstName = value;
        else if (header === "lastname") row.lastName = value;
        else if (header === "middlename" || header === "othernames") row.otherNames = value;
        else if (header === "gender") row.gender = value;
        else if (header === "class") row.class = value;
        else if (header === "classarm") row.classArm = value;
      });

      if (row.admissionNumber && row.firstName && row.lastName) {
        data.push(row);
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

    setLoading(true);
    setResult(null);

    try {
      const response = await apiRequest("POST", "/api/students/bulk", {
        students: parsedData,
      });

      const data = await response.json();
      setResult(data);

      if (data.success > 0) {
        queryClient.invalidateQueries({ queryKey: ["/api/students"] });
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
          <DialogTitle>Bulk Upload Students</DialogTitle>
          <DialogDescription>
            Upload a CSV file with student data. Download the template to see the required format.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
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
              id="csv-upload"
              data-testid="input-file-upload"
            />
            <label htmlFor="csv-upload" className="cursor-pointer">
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
                Found {parsedData.length} student records ready to upload
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
              disabled={loading || parsedData.length === 0}
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
                  Upload Students
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
