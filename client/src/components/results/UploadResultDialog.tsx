import { useState, useEffect } from "react";
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
import { Loader2, Plus, Trash2, Save, Send } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { Student, Subject, Class, ScoreMetric } from "@shared/schema";

interface UploadResultDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface SubjectScore {
  subject: string;
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

export function UploadResultDialog({ open, onOpenChange }: UploadResultDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [loadingAction, setLoadingAction] = useState<"draft" | "submit" | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [session, setSession] = useState("");
  const [term, setTerm] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [subjectScores, setSubjectScores] = useState<SubjectScore[]>([]);

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

  const getAssignedSubjectsForClass = (classId: string) => {
    if (!isTeacher) return subjects;
    const assignedSubjectIds = teacherAssignments
      .filter(a => a.classId === classId)
      .map(a => a.subjectId);
    return subjects.filter(s => assignedSubjectIds.includes(s.id));
  };

  const availableSubjects = selectedClass
    ? getAssignedSubjectsForClass(
        classes.find(c => c.name === selectedClass)?.id || ""
      )
    : isTeacher
    ? subjects.filter(s => 
        teacherAssignments.some(a => a.subjectId === s.id)
      )
    : subjects;

  const filteredStudents = selectedClass
    ? students.filter((s) => s.class === selectedClass)
    : students;

  useEffect(() => {
    if (availableSubjects.length > 0 && open) {
      setSubjectScores(
        availableSubjects.slice(0, 5).map((s) => ({
          subject: s.name,
          ca1: 0,
          ca2: 0,
          exam: 0,
        }))
      );
    }
  }, [availableSubjects.length, open]);

  const addSubjectRow = () => {
    setSubjectScores([
      ...subjectScores,
      { subject: "", ca1: 0, ca2: 0, exam: 0 },
    ]);
  };

  const removeSubjectRow = (index: number) => {
    setSubjectScores(subjectScores.filter((_, i) => i !== index));
  };

  const getMaxScore = (field: "ca1" | "ca2" | "exam") => {
    const metric = scoreMetrics.find(m => 
      m.name.toLowerCase().includes(field === "ca1" ? "ca1" : field === "ca2" ? "ca2" : "exam")
    );
    if (field === "exam") return metric?.maxScore || 80;
    return metric?.maxScore || 10;
  };

  const updateSubjectScore = (
    index: number,
    field: keyof SubjectScore,
    value: string | number
  ) => {
    const updated = [...subjectScores];
    if (field === "subject") {
      updated[index].subject = value as string;
    } else {
      const numValue = Number(value) || 0;
      const maxScore = getMaxScore(field);
      updated[index][field] = Math.min(maxScore, Math.max(0, numValue));
    }
    setSubjectScores(updated);
  };

  const validateForm = () => {
    if (!selectedStudentId) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select a student",
      });
      return false;
    }

    if (!session || !term) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select session and term",
      });
      return false;
    }

    const validSubjects = subjectScores.filter(
      (s) => s.subject && (s.ca1 > 0 || s.ca2 > 0 || s.exam > 0)
    );

    if (validSubjects.length === 0) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter at least one subject with scores",
      });
      return false;
    }

    return true;
  };

  const handleSave = async (submitAfterSave: boolean = false) => {
    if (!validateForm()) return;

    const validSubjects = subjectScores.filter(
      (s) => s.subject && (s.ca1 > 0 || s.ca2 > 0 || s.exam > 0)
    );

    const selectedStudent = students.find((s) => s.id === selectedStudentId);
    if (!selectedStudent) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Student not found",
      });
      return;
    }

    setLoading(true);
    setLoadingAction(submitAfterSave ? "submit" : "draft");

    try {
      const response = await apiRequest("POST", "/api/results", {
        schoolId: user.schoolId,
        studentId: selectedStudentId,
        session,
        term,
        class: selectedStudent.class,
        subjects: validSubjects,
        status: "draft",
      });

      const result = await response.json();

      if (submitAfterSave && result.id) {
        await apiRequest("POST", `/api/results/${result.id}/submit`);
        toast({
          title: "Result Submitted",
          description: "The result has been submitted for review by the school admin",
        });
      } else {
        toast({
          title: "Draft Saved",
          description: "The result has been saved as a draft. You can edit and submit it later.",
        });
      }

      queryClient.invalidateQueries({ queryKey: ["/api/results"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });

      resetDialog();
      onOpenChange(false);
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
    setSelectedStudentId("");
    setSession("");
    setTerm("");
    setSelectedClass("");
    setSubjectScores([]);
  };

  const hasNoAssignments = isTeacher && teacherAssignments.length === 0;

  return (
    <Dialog
      open={open}
      onOpenChange={(open) => {
        if (!open) resetDialog();
        onOpenChange(open);
      }}
    >
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Upload Student Result</DialogTitle>
          <DialogDescription>
            Enter the scores for each subject. Save as draft to continue later, or submit for review.
          </DialogDescription>
        </DialogHeader>

        {hasNoAssignments ? (
          <Alert>
            <AlertDescription>
              You don't have any class or subject assignments yet. Please contact your school admin to assign you to classes and subjects before uploading results.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Session</Label>
                <Select value={session} onValueChange={setSession}>
                  <SelectTrigger data-testid="select-result-session">
                    <SelectValue placeholder="Select session" />
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

              <div className="space-y-2">
                <Label>Term</Label>
                <Select value={term} onValueChange={setTerm}>
                  <SelectTrigger data-testid="select-result-term">
                    <SelectValue placeholder="Select term" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="First">First Term</SelectItem>
                    <SelectItem value="Second">Second Term</SelectItem>
                    <SelectItem value="Third">Third Term</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Class {isTeacher && "(Assigned)"}</Label>
                <Select 
                  value={selectedClass || "select"} 
                  onValueChange={(value) => {
                    setSelectedClass(value === "select" ? "" : value);
                    setSubjectScores([]);
                  }}
                >
                  <SelectTrigger data-testid="select-result-class">
                    <SelectValue placeholder="Select class" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="select">Select Class</SelectItem>
                    {filteredClasses.map((c) => (
                      <SelectItem key={c.id} value={c.name}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Student</Label>
              <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
                <SelectTrigger data-testid="select-result-student">
                  <SelectValue placeholder="Select a student" />
                </SelectTrigger>
                <SelectContent>
                  {filteredStudents.map((student) => (
                    <SelectItem key={student.id} value={student.id}>
                      {student.firstName} {student.lastName} ({student.admissionNumber})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Subject Scores {isTeacher && "(Assigned Subjects)"}</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addSubjectRow}
                  data-testid="button-add-subject"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Subject
                </Button>
              </div>

              <ScrollArea className="h-[300px] rounded-md border p-4">
                <div className="space-y-3">
                  <div className="grid grid-cols-12 gap-2 text-sm font-medium text-muted-foreground">
                    <div className="col-span-4">Subject</div>
                    <div className="col-span-2 text-center">CA1 ({getMaxScore("ca1")})</div>
                    <div className="col-span-2 text-center">CA2 ({getMaxScore("ca2")})</div>
                    <div className="col-span-2 text-center">Exam ({getMaxScore("exam")})</div>
                    <div className="col-span-2 text-center">Total</div>
                  </div>

                  {subjectScores.map((score, index) => (
                    <div key={index} className="grid grid-cols-12 gap-2 items-center">
                      <div className="col-span-4">
                        <Select
                          value={score.subject}
                          onValueChange={(value) =>
                            updateSubjectScore(index, "subject", value)
                          }
                        >
                          <SelectTrigger data-testid={`select-subject-${index}`}>
                            <SelectValue placeholder="Select subject" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableSubjects.map((s) => (
                              <SelectItem key={s.id} value={s.name}>
                                {s.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-2">
                        <Input
                          type="number"
                          min="0"
                          max={getMaxScore("ca1")}
                          value={score.ca1 || ""}
                          onChange={(e) =>
                            updateSubjectScore(index, "ca1", e.target.value)
                          }
                          className="text-center"
                          data-testid={`input-ca1-${index}`}
                        />
                      </div>
                      <div className="col-span-2">
                        <Input
                          type="number"
                          min="0"
                          max={getMaxScore("ca2")}
                          value={score.ca2 || ""}
                          onChange={(e) =>
                            updateSubjectScore(index, "ca2", e.target.value)
                          }
                          className="text-center"
                          data-testid={`input-ca2-${index}`}
                        />
                      </div>
                      <div className="col-span-2">
                        <Input
                          type="number"
                          min="0"
                          max={getMaxScore("exam")}
                          value={score.exam || ""}
                          onChange={(e) =>
                            updateSubjectScore(index, "exam", e.target.value)
                          }
                          className="text-center"
                          data-testid={`input-exam-${index}`}
                        />
                      </div>
                      <div className="col-span-2 flex items-center justify-between">
                        <span className="font-semibold text-center flex-1">
                          {score.ca1 + score.ca2 + score.exam}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeSubjectRow(index)}
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          data-testid={`button-remove-subject-${index}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                data-testid="button-cancel"
              >
                Cancel
              </Button>
              <Button
                variant="secondary"
                className="flex-1 gap-2"
                onClick={() => handleSave(false)}
                disabled={loading || !selectedStudentId || !session || !term}
                data-testid="button-save-draft"
              >
                {loadingAction === "draft" ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Save as Draft
              </Button>
              <Button
                className="flex-1 gap-2"
                onClick={() => handleSave(true)}
                disabled={loading || !selectedStudentId || !session || !term}
                data-testid="button-submit-result"
              >
                {loadingAction === "submit" ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                Submit for Review
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
