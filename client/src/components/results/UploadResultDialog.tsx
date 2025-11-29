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
import { Loader2, Plus, Trash2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Student, Subject, Class } from "@shared/schema";

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

export function UploadResultDialog({ open, onOpenChange }: UploadResultDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [session, setSession] = useState("");
  const [term, setTerm] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [subjectScores, setSubjectScores] = useState<SubjectScore[]>([]);

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const { data: students = [] } = useQuery<Student[]>({
    queryKey: ["/api/students"],
  });

  const { data: subjects = [] } = useQuery<Subject[]>({
    queryKey: ["/api/subjects"],
  });

  const { data: classes = [] } = useQuery<Class[]>({
    queryKey: ["/api/classes"],
  });

  const currentYear = new Date().getFullYear();
  const sessions = [
    `${currentYear - 1}/${currentYear}`,
    `${currentYear}/${currentYear + 1}`,
  ];

  // Filter students by selected class
  const filteredStudents = selectedClass
    ? students.filter((s) => s.class === selectedClass)
    : students;

  // Initialize subject scores when subjects are loaded
  useEffect(() => {
    if (subjects.length > 0 && subjectScores.length === 0) {
      setSubjectScores(
        subjects.slice(0, 5).map((s) => ({
          subject: s.name,
          ca1: 0,
          ca2: 0,
          exam: 0,
        }))
      );
    }
  }, [subjects]);

  const addSubjectRow = () => {
    setSubjectScores([
      ...subjectScores,
      { subject: "", ca1: 0, ca2: 0, exam: 0 },
    ]);
  };

  const removeSubjectRow = (index: number) => {
    setSubjectScores(subjectScores.filter((_, i) => i !== index));
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
      // Validate score limits
      if (field === "ca1" || field === "ca2") {
        updated[index][field] = Math.min(10, Math.max(0, numValue));
      } else if (field === "exam") {
        updated[index][field] = Math.min(80, Math.max(0, numValue));
      }
    }
    setSubjectScores(updated);
  };

  const handleSubmit = async () => {
    if (!selectedStudentId) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select a student",
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

    const validSubjects = subjectScores.filter(
      (s) => s.subject && (s.ca1 > 0 || s.ca2 > 0 || s.exam > 0)
    );

    if (validSubjects.length === 0) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter at least one subject with scores",
      });
      return;
    }

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

    try {
      await apiRequest("POST", "/api/results", {
        schoolId: user.schoolId,
        studentId: selectedStudentId,
        session,
        term,
        class: selectedStudent.class,
        subjects: validSubjects,
      });

      queryClient.invalidateQueries({ queryKey: ["/api/results"] });

      toast({
        title: "Result Uploaded",
        description: "The student result has been saved as a draft",
      });

      resetDialog();
      onOpenChange(false);
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
    setSelectedStudentId("");
    setSession("");
    setTerm("");
    setSelectedClass("");
    setSubjectScores(
      subjects.slice(0, 5).map((s) => ({
        subject: s.name,
        ca1: 0,
        ca2: 0,
        exam: 0,
      }))
    );
  };

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
            Enter the scores for each subject. CA1 and CA2 are max 10 marks each, Exam is max 80 marks.
          </DialogDescription>
        </DialogHeader>

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
              <Label>Class (Filter)</Label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger data-testid="select-result-class">
                  <SelectValue placeholder="All classes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Classes</SelectItem>
                  {classes.map((c) => (
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
              <Label>Subject Scores</Label>
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
                  <div className="col-span-2 text-center">CA1 (10)</div>
                  <div className="col-span-2 text-center">CA2 (10)</div>
                  <div className="col-span-2 text-center">Exam (80)</div>
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
                          {subjects.map((s) => (
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
                        max="10"
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
                        max="10"
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
                        max="80"
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
              className="flex-1"
              onClick={() => onOpenChange(false)}
              data-testid="button-cancel"
            >
              Cancel
            </Button>
            <Button
              className="flex-1"
              onClick={handleSubmit}
              disabled={loading || !selectedStudentId || !session || !term}
              data-testid="button-save-result"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Result"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
