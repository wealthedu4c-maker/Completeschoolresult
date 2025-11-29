import { useState, useEffect, useMemo } from "react";
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
import { Loader2, Save, Send, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Student, Subject, Class, ScoreMetric } from "@shared/schema";

interface SpreadsheetResultUploadProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface StudentScore {
  studentId: string;
  studentName: string;
  registrationNumber: string;
  ca1: number;
  ca2: number;
  exam: number;
}

interface TeacherAssignment {
  id: string;
  teacherId: string;
  classId: string;
  subjectId: string;
  academicYear: string;
}

export function SpreadsheetResultUpload({ open, onOpenChange }: SpreadsheetResultUploadProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [loadingAction, setLoadingAction] = useState<"draft" | "submit" | null>(null);
  const [session, setSession] = useState("");
  const [term, setTerm] = useState("");
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [studentScores, setStudentScores] = useState<StudentScore[]>([]);

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const isTeacher = user.role === "teacher";

  const { data: students = [] } = useQuery<Student[]>({
    queryKey: ["/api/students"],
  });

  const { data: subjects = [] } = useQuery<Subject[]>({
    queryKey: ["/api/subjects"],
  });

  const { data: classes = [] } = useQuery<Class[]>({
    queryKey: ["/api/classes"],
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
  const sessions = Array.from({ length: 10 }, (_, i) => {
    const year = currentYear - 1 + i;
    return `${year}/${year + 1}`;
  });

  const assignedClassIds = isTeacher 
    ? Array.from(new Set(teacherAssignments.map(a => a.classId)))
    : classes.map(c => c.id);

  const filteredClasses = isTeacher
    ? classes.filter(c => assignedClassIds.includes(c.id))
    : classes;

  const getAssignedSubjectsForClass = (classId: string) => {
    if (!isTeacher) return subjects;
    const assignedSubjectIds = teacherAssignments
      .filter(a => a.classId === classId)
      .map(a => a.subjectId);
    return subjects.filter(s => assignedSubjectIds.includes(s.id));
  };

  const availableSubjects = selectedClassId
    ? getAssignedSubjectsForClass(selectedClassId)
    : [];

  const filteredStudents = useMemo(() => {
    if (!selectedClassId) return [];
    const selectedClass = classes.find(c => c.id === selectedClassId);
    if (!selectedClass) return [];
    return students.filter((s) => s.class === selectedClass.name);
  }, [selectedClassId, students, classes]);

  useEffect(() => {
    if (selectedClassId && selectedSubjectId && filteredStudents.length > 0) {
      setStudentScores(
        filteredStudents.map((student) => ({
          studentId: student.id,
          studentName: `${student.firstName} ${student.lastName}`,
          registrationNumber: student.admissionNumber,
          ca1: 0,
          ca2: 0,
          exam: 0,
        }))
      );
    } else {
      setStudentScores([]);
    }
  }, [selectedClassId, selectedSubjectId, filteredStudents]);

  const getMaxScore = (field: "ca1" | "ca2" | "exam") => {
    const metric = scoreMetrics.find(m => 
      m.name.toLowerCase().includes(field === "ca1" ? "ca1" : field === "ca2" ? "ca2" : "exam")
    );
    if (field === "exam") return metric?.maxScore || 80;
    return metric?.maxScore || 10;
  };

  const updateStudentScore = (
    studentId: string,
    field: "ca1" | "ca2" | "exam",
    value: string
  ) => {
    const numValue = Number(value) || 0;
    const maxScore = getMaxScore(field);
    const clampedValue = Math.min(maxScore, Math.max(0, numValue));

    setStudentScores(prev =>
      prev.map(score =>
        score.studentId === studentId
          ? { ...score, [field]: clampedValue }
          : score
      )
    );
  };

  const calculateTotal = (score: StudentScore) => {
    return score.ca1 + score.ca2 + score.exam;
  };

  const validateForm = () => {
    if (!session || !term) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select session and term",
      });
      return false;
    }

    if (!selectedClassId) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select a class",
      });
      return false;
    }

    if (!selectedSubjectId) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select a subject",
      });
      return false;
    }

    const studentsWithScores = studentScores.filter(
      (s) => s.ca1 > 0 || s.ca2 > 0 || s.exam > 0
    );

    if (studentsWithScores.length === 0) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter scores for at least one student",
      });
      return false;
    }

    return true;
  };

  const handleSave = async (submitAfterSave: boolean = false) => {
    if (!validateForm()) return;

    const selectedSubject = subjects.find(s => s.id === selectedSubjectId);
    const selectedClass = classes.find(c => c.id === selectedClassId);
    
    if (!selectedSubject || !selectedClass) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Invalid class or subject selection",
      });
      return;
    }

    const studentsWithScores = studentScores.filter(
      (s) => s.ca1 > 0 || s.ca2 > 0 || s.exam > 0
    );

    setLoading(true);
    setLoadingAction(submitAfterSave ? "submit" : "draft");

    try {
      let successCount = 0;
      let errorCount = 0;

      for (const studentScore of studentsWithScores) {
        try {
          const response = await apiRequest("POST", "/api/results", {
            schoolId: user.schoolId,
            studentId: studentScore.studentId,
            session,
            term,
            class: selectedClass.name,
            subjects: [{
              subject: selectedSubject.name,
              ca1: studentScore.ca1,
              ca2: studentScore.ca2,
              exam: studentScore.exam,
            }],
            status: "draft",
          });

          const result = await response.json();

          if (submitAfterSave && result.id) {
            await apiRequest("POST", `/api/results/${result.id}/submit`);
          }
          
          successCount++;
        } catch (error) {
          errorCount++;
          console.error(`Failed to save result for student ${studentScore.studentName}:`, error);
        }
      }

      if (successCount > 0) {
        toast({
          title: submitAfterSave ? "Results Submitted" : "Drafts Saved",
          description: `Successfully ${submitAfterSave ? "submitted" : "saved"} ${successCount} result(s)${errorCount > 0 ? `. ${errorCount} failed.` : ""}`,
        });
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to save any results",
        });
      }

      queryClient.invalidateQueries({ queryKey: ["/api/results"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });

      if (successCount > 0) {
        resetDialog();
        onOpenChange(false);
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: submitAfterSave ? "Submit Failed" : "Save Failed",
        description: error.message,
      });
    } finally {
      setLoading(false);
      setLoadingAction(null);
    }
  };

  const resetDialog = () => {
    setSession("");
    setTerm("");
    setSelectedClassId("");
    setSelectedSubjectId("");
    setStudentScores([]);
  };

  const hasNoAssignments = isTeacher && teacherAssignments.length === 0;
  const hasStudents = studentScores.length > 0;
  const studentsWithScoresCount = studentScores.filter(s => s.ca1 > 0 || s.ca2 > 0 || s.exam > 0).length;

  return (
    <Dialog
      open={open}
      onOpenChange={(open) => {
        if (!open) resetDialog();
        onOpenChange(open);
      }}
    >
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Upload Results - Spreadsheet View</DialogTitle>
          <DialogDescription>
            Enter scores for all students in the selected class for a specific subject
          </DialogDescription>
        </DialogHeader>

        {hasNoAssignments ? (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              You don't have any class or subject assignments yet. Please contact your school admin to assign you to classes and subjects before uploading results.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="flex-1 flex flex-col min-h-0 space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 flex-shrink-0">
              <div className="space-y-1.5">
                <Label className="text-xs">Session</Label>
                <Select value={session} onValueChange={setSession}>
                  <SelectTrigger data-testid="select-spreadsheet-session" className="h-9">
                    <SelectValue placeholder="Session" />
                  </SelectTrigger>
                  <SelectContent>
                    {sessions.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Term</Label>
                <Select value={term} onValueChange={setTerm}>
                  <SelectTrigger data-testid="select-spreadsheet-term" className="h-9">
                    <SelectValue placeholder="Term" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="First">First Term</SelectItem>
                    <SelectItem value="Second">Second Term</SelectItem>
                    <SelectItem value="Third">Third Term</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Class {isTeacher && "(Assigned)"}</Label>
                <Select 
                  value={selectedClassId} 
                  onValueChange={(value) => {
                    setSelectedClassId(value);
                    setSelectedSubjectId("");
                  }}
                >
                  <SelectTrigger data-testid="select-spreadsheet-class" className="h-9">
                    <SelectValue placeholder="Class" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredClasses.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Subject {isTeacher && "(Assigned)"}</Label>
                <Select 
                  value={selectedSubjectId} 
                  onValueChange={setSelectedSubjectId}
                  disabled={!selectedClassId}
                >
                  <SelectTrigger data-testid="select-spreadsheet-subject" className="h-9">
                    <SelectValue placeholder="Subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableSubjects.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {selectedClassId && selectedSubjectId && (
              <div className="flex-1 min-h-0 flex flex-col">
                {!hasStudents ? (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      No students found in this class. Please add students first.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <>
                    <div className="text-sm text-muted-foreground mb-2 flex-shrink-0">
                      {filteredStudents.length} student(s) in class • {studentsWithScoresCount} with scores entered
                    </div>
                    
                    <div className="flex-1 overflow-auto border rounded-md min-h-0">
                      <Table>
                        <TableHeader className="sticky top-0 bg-background z-10">
                          <TableRow>
                            <TableHead className="min-w-[140px]">Student Name</TableHead>
                            <TableHead className="min-w-[100px] hidden sm:table-cell">Reg. No.</TableHead>
                            <TableHead className="w-[70px] text-center">
                              <span className="hidden sm:inline">CA1 ({getMaxScore("ca1")})</span>
                              <span className="sm:hidden">CA1</span>
                            </TableHead>
                            <TableHead className="w-[70px] text-center">
                              <span className="hidden sm:inline">CA2 ({getMaxScore("ca2")})</span>
                              <span className="sm:hidden">CA2</span>
                            </TableHead>
                            <TableHead className="w-[70px] text-center">
                              <span className="hidden sm:inline">Exam ({getMaxScore("exam")})</span>
                              <span className="sm:hidden">Exam</span>
                            </TableHead>
                            <TableHead className="w-[70px] text-center font-semibold">Total</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {studentScores.map((score, index) => (
                            <TableRow key={score.studentId} data-testid={`row-student-${index}`}>
                              <TableCell className="font-medium py-2">
                                <div className="truncate max-w-[140px]" title={score.studentName}>
                                  {score.studentName}
                                </div>
                                <div className="text-xs text-muted-foreground sm:hidden">
                                  {score.registrationNumber}
                                </div>
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground hidden sm:table-cell py-2">
                                {score.registrationNumber}
                              </TableCell>
                              <TableCell className="py-1">
                                <Input
                                  type="number"
                                  min="0"
                                  max={getMaxScore("ca1")}
                                  value={score.ca1 || ""}
                                  onChange={(e) => updateStudentScore(score.studentId, "ca1", e.target.value)}
                                  className="h-8 text-center w-full"
                                  data-testid={`input-ca1-${index}`}
                                />
                              </TableCell>
                              <TableCell className="py-1">
                                <Input
                                  type="number"
                                  min="0"
                                  max={getMaxScore("ca2")}
                                  value={score.ca2 || ""}
                                  onChange={(e) => updateStudentScore(score.studentId, "ca2", e.target.value)}
                                  className="h-8 text-center w-full"
                                  data-testid={`input-ca2-${index}`}
                                />
                              </TableCell>
                              <TableCell className="py-1">
                                <Input
                                  type="number"
                                  min="0"
                                  max={getMaxScore("exam")}
                                  value={score.exam || ""}
                                  onChange={(e) => updateStudentScore(score.studentId, "exam", e.target.value)}
                                  className="h-8 text-center w-full"
                                  data-testid={`input-exam-${index}`}
                                />
                              </TableCell>
                              <TableCell className="text-center font-semibold py-2" data-testid={`total-${index}`}>
                                {calculateTotal(score)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </>
                )}
              </div>
            )}

            {!selectedClassId && !selectedSubjectId && (
              <div className="flex-1 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <p>Select a class and subject to view students</p>
                </div>
              </div>
            )}

            <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4 border-t flex-shrink-0">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="sm:w-auto"
                data-testid="button-cancel"
              >
                Cancel
              </Button>
              <div className="flex flex-col sm:flex-row gap-2 sm:flex-1">
                <Button
                  variant="secondary"
                  className="flex-1 gap-2"
                  onClick={() => handleSave(false)}
                  disabled={loading || !hasStudents || !session || !term || studentsWithScoresCount === 0}
                  data-testid="button-save-draft"
                >
                  {loadingAction === "draft" ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Save Draft
                </Button>
                <Button
                  className="flex-1 gap-2"
                  onClick={() => handleSave(true)}
                  disabled={loading || !hasStudents || !session || !term || studentsWithScoresCount === 0}
                  data-testid="button-submit-result"
                >
                  {loadingAction === "submit" ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  Submit to School Admin
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
