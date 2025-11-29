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
import { Upload, Download, FileSpreadsheet, Loader2, AlertCircle, CheckCircle, Save, Send } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { Subject, Class, Student, ScoreMetric } from "@shared/schema";

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

interface TeacherAssignment {
  id: string;
  teacherId: string;
  classId: string;
  subjectId: string;
  academicYear: string;
}

export function BulkResultUploadDialog({ open, onOpenChange }: BulkResultUploadDialogProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [loadingAction, setLoadingAction] = useState<"draft" | "submit" | null>(null);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [session, setSession] = useState("");
  const [term, setTerm] = useState("");
  const [selectedClassId, setSelectedClassId] = useState("");

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const isTeacher = user.role === "teacher";

  const { data: subjects = [] } = useQuery<Subject[]>({
    queryKey: ["/api/subjects"],
  });

  const { data: classes = [] } = useQuery<Class[]>({
    queryKey: ["/api/classes"],
  });

  const { data: students = [] } = useQuery<Student[]>({
    queryKey: ["/api/students"],
  });

  const { data: scoreMetrics = [] } = useQuery<ScoreMetric[]>({
    queryKey: ["/api/score-metrics"],
  });

  const { data: teacherAssignments = [] } = useQuery<TeacherAssignment[]>({
    queryKey: ["/api/teacher-assignments", user.id],
    queryFn: async () => {
      if (!isTeacher) return [];
      const res = await fetch(`/api/teacher-assignments/${user.id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      return res.json();
    },
    enabled: isTeacher,
  });

  const currentYear = new Date().getFullYear();
  const sessions = [
    `${currentYear - 1}/${currentYear}`,
    `${currentYear}/${currentYear + 1}`,
  ];

  const assignedClassIds = isTeacher 
    ? Array.from(new Set(teacherAssignments.map(a => a.classId)))
    : classes.map(c => c.id);

  const filteredClasses = isTeacher
    ? classes.filter(c => assignedClassIds.includes(c.id))
    : classes;

  const selectedClass = classes.find(c => c.id === selectedClassId);

  const getAssignedSubjectsForClass = (classId: string) => {
    if (!isTeacher) return subjects;
    const assignedSubjectIds = teacherAssignments
      .filter(a => a.classId === classId)
      .map(a => a.subjectId);
    return subjects.filter(s => assignedSubjectIds.includes(s.id));
  };

  const availableSubjects = selectedClassId
    ? getAssignedSubjectsForClass(selectedClassId)
    : subjects;

  const classStudents = selectedClass
    ? students.filter(s => s.class === selectedClass.name)
    : [];

  const getScoreMetricName = (type: "ca1" | "ca2" | "exam") => {
    const metric = scoreMetrics.find(m => 
      m.name.toLowerCase().includes(type === "ca1" ? "ca1" : type === "ca2" ? "ca2" : "exam")
    );
    return metric?.name || (type === "ca1" ? "CA1" : type === "ca2" ? "CA2" : "Exam");
  };

  const getMaxScore = (type: "ca1" | "ca2" | "exam") => {
    const metric = scoreMetrics.find(m => 
      m.name.toLowerCase().includes(type === "ca1" ? "ca1" : type === "ca2" ? "ca2" : "exam")
    );
    if (type === "exam") return metric?.maxScore || 80;
    return metric?.maxScore || 10;
  };

  const downloadTemplate = () => {
    if (!selectedClassId) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select a class first to download the template",
      });
      return;
    }

    const subjectNames = availableSubjects.length > 0 
      ? availableSubjects.map(s => s.name)
      : ["Mathematics", "English", "Science"];

    const ca1Label = getScoreMetricName("ca1");
    const ca2Label = getScoreMetricName("ca2");
    const examLabel = getScoreMetricName("exam");
    
    const headers = [
      "studentName",
      "admissionNumber", 
      ...subjectNames.flatMap(s => [`${s}_${ca1Label}`, `${s}_${ca2Label}`, `${s}_${examLabel}`])
    ];

    const sampleData = classStudents.slice(0, 3).map(student => [
      `${student.firstName} ${student.lastName}`,
      student.admissionNumber,
      ...subjectNames.flatMap(() => ["", "", ""])
    ]);

    if (sampleData.length === 0) {
      sampleData.push([
        "Student Name",
        "STU2024001",
        ...subjectNames.flatMap(() => ["8", "9", "70"])
      ]);
    }
    
    const csvContent = [
      headers.join(","),
      ...sampleData.map(row => row.join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `result_template_${selectedClass?.name || "class"}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const parseCSV = (text: string): any[] => {
    const lines = text.trim().split("\n");
    if (lines.length < 2) return [];

    const headers = lines[0].split(",").map(h => h.trim());
    const data = [];

    const subjectColumns: { [key: string]: { ca1Idx?: number; ca2Idx?: number; examIdx?: number } } = {};
    
    headers.forEach((header, idx) => {
      if (header.toLowerCase() === "admissionnumber" || header.toLowerCase() === "studentname") return;
      
      const match = header.match(/^(.+?)_(.+)$/i);
      if (match) {
        const subjectName = match[1];
        const scoreType = match[2].toLowerCase();
        if (!subjectColumns[subjectName]) {
          subjectColumns[subjectName] = {};
        }
        if (scoreType.includes("ca1") || scoreType === "ca1") subjectColumns[subjectName].ca1Idx = idx;
        else if (scoreType.includes("ca2") || scoreType === "ca2") subjectColumns[subjectName].ca2Idx = idx;
        else if (scoreType.includes("exam") || scoreType === "exam") subjectColumns[subjectName].examIdx = idx;
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

  const handleUpload = async (submitAfterSave: boolean = false) => {
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

    if (!selectedClassId) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select a class",
      });
      return;
    }

    setLoading(true);
    setLoadingAction(submitAfterSave ? "submit" : "draft");
    setResult(null);

    try {
      const response = await apiRequest("POST", "/api/results/bulk", {
        results: parsedData,
        session,
        term,
        classId: selectedClassId,
        className: selectedClass?.name,
        status: "draft",
        submitAfterSave,
      });

      const data = await response.json();
      setResult(data);

      if (data.success > 0) {
        queryClient.invalidateQueries({ queryKey: ["/api/results"] });
        queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
        
        toast({
          title: submitAfterSave ? "Results Submitted" : "Drafts Saved",
          description: submitAfterSave 
            ? `${data.success} results submitted for review` 
            : `${data.success} results saved as drafts`,
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
      setLoadingAction(null);
    }
  };

  const resetDialog = () => {
    setParsedData([]);
    setResult(null);
    setSession("");
    setTerm("");
    setSelectedClassId("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const hasNoAssignments = isTeacher && teacherAssignments.length === 0;

  return (
    <Dialog open={open} onOpenChange={(open) => {
      if (!open) resetDialog();
      onOpenChange(open);
    }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Bulk Upload Results</DialogTitle>
          <DialogDescription>
            Select a class, download the template with student names, fill in scores, and upload.
          </DialogDescription>
        </DialogHeader>

        {hasNoAssignments ? (
          <Alert>
            <AlertDescription>
              You don't have any class or subject assignments yet. Please contact your school admin to assign you to classes and subjects.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Class {isTeacher && "(Assigned)"}</Label>
              <Select value={selectedClassId || "select"} onValueChange={(value) => setSelectedClassId(value === "select" ? "" : value)}>
                <SelectTrigger data-testid="select-class">
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="select">Select Class</SelectItem>
                  {filteredClasses.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

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
              disabled={!selectedClassId}
              data-testid="button-download-template"
            >
              <Download className="w-4 h-4" />
              Download CSV Template {selectedClass && `for ${selectedClass.name}`}
            </Button>

            {selectedClassId && (
              <p className="text-sm text-muted-foreground">
                Template includes {classStudents.length} students and {availableSubjects.length} subjects
              </p>
            )}

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

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                variant="secondary"
                className="flex-1 gap-2"
                onClick={() => handleUpload(false)}
                disabled={loading || parsedData.length === 0 || !session || !term || !selectedClassId}
                data-testid="button-save-draft"
              >
                {loadingAction === "draft" ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Save as Drafts
              </Button>
              <Button
                className="flex-1 gap-2"
                onClick={() => handleUpload(true)}
                disabled={loading || parsedData.length === 0 || !session || !term || !selectedClassId}
                data-testid="button-submit"
              >
                {loadingAction === "submit" ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                Submit All
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
