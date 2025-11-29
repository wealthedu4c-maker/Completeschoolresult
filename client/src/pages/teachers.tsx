import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Search, UserCheck, UserX, Loader2, Mail, Phone, BookOpen, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";

interface Teacher {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  role: string;
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
}

interface ClassRecord {
  id: string;
  name: string;
  level: string;
  grade: number;
  arm?: string;
  academicYear: string;
}

interface Subject {
  id: string;
  name: string;
  code: string;
  category: string;
}

interface TeacherAssignment {
  id: string;
  teacherId: string;
  classId: string;
  subjectId: string;
  academicYear: string;
}

interface AssignmentSelection {
  classId: string;
  subjectId: string;
}

export default function Teachers() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [assignments, setAssignments] = useState<AssignmentSelection[]>([]);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    phoneNumber: "",
  });

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const { data: teachers = [], isLoading } = useQuery<Teacher[]>({
    queryKey: ["/api/users"],
  });

  const { data: classes = [] } = useQuery<ClassRecord[]>({
    queryKey: ["/api/classes"],
  });

  const { data: subjects = [] } = useQuery<Subject[]>({
    queryKey: ["/api/subjects"],
  });

  const { data: teacherAssignmentsData = [], isLoading: isLoadingAssignments } = useQuery<TeacherAssignment[]>({
    queryKey: ["/api/teacher-assignments", selectedTeacher?.id],
    queryFn: async () => {
      if (!selectedTeacher) return [];
      const res = await fetch(`/api/teacher-assignments/${selectedTeacher.id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      return res.json();
    },
    enabled: !!selectedTeacher,
  });

  useEffect(() => {
    if (selectedTeacher && teacherAssignmentsData.length > 0) {
      setAssignments(
        teacherAssignmentsData.map((a) => ({
          classId: a.classId,
          subjectId: a.subjectId,
        }))
      );
    } else if (selectedTeacher) {
      setAssignments([]);
    }
  }, [selectedTeacher, teacherAssignmentsData]);

  const teachersList = teachers.filter(t => t.role === "teacher");

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await apiRequest("POST", "/api/auth/register", {
        ...data,
        role: "teacher",
        schoolId: user.schoolId,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setIsDialogOpen(false);
      setFormData({ email: "", password: "", firstName: "", lastName: "", phoneNumber: "" });
      toast({ title: "Success", description: "Teacher created successfully" });
    },
    onError: (error: any) => {
      toast({ variant: "destructive", title: "Error", description: error.message });
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const res = await apiRequest("PATCH", `/api/users/${id}`, { isActive });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({ title: "Success", description: "Teacher status updated" });
    },
    onError: (error: any) => {
      toast({ variant: "destructive", title: "Error", description: error.message });
    },
  });

  const assignmentsMutation = useMutation({
    mutationFn: async ({ teacherId, assignments: assignmentData }: { teacherId: string; assignments: AssignmentSelection[] }) => {
      const res = await apiRequest("PUT", `/api/teacher-assignments/${teacherId}`, { assignments: assignmentData });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teacher-assignments"] });
      closeAssignDialog();
      toast({ title: "Success", description: "Teacher assignments updated successfully" });
    },
    onError: (error: any) => {
      toast({ variant: "destructive", title: "Error", description: error.message });
    },
  });

  const closeAssignDialog = () => {
    setIsAssignDialogOpen(false);
    setSelectedTeacher(null);
    setAssignments([]);
  };

  const openAssignDialog = (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    setIsAssignDialogOpen(true);
  };

  const toggleAssignment = (classId: string, subjectId: string) => {
    const exists = assignments.some((a) => a.classId === classId && a.subjectId === subjectId);
    if (exists) {
      setAssignments(assignments.filter((a) => !(a.classId === classId && a.subjectId === subjectId)));
    } else {
      setAssignments([...assignments, { classId, subjectId }]);
    }
  };

  const isAssigned = (classId: string, subjectId: string) => {
    return assignments.some((a) => a.classId === classId && a.subjectId === subjectId);
  };

  const handleAssignSubmit = () => {
    if (selectedTeacher) {
      assignmentsMutation.mutate({
        teacherId: selectedTeacher.id,
        assignments,
      });
    }
  };

  const getTeacherAssignmentCount = (teacherId: string) => {
    return 0;
  };

  const filteredTeachers = teachersList.filter(
    (t) =>
      t.firstName.toLowerCase().includes(search.toLowerCase()) ||
      t.lastName.toLowerCase().includes(search.toLowerCase()) ||
      t.email.toLowerCase().includes(search.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Teachers</h2>
          <p className="text-muted-foreground">Manage your school's teaching staff</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 w-full sm:w-auto" data-testid="button-add-teacher">
              <Plus className="w-4 h-4" />
              Add Teacher
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md mx-4 sm:mx-auto">
            <DialogHeader>
              <DialogTitle>Add New Teacher</DialogTitle>
              <DialogDescription>Create a new teacher account for your school</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    required
                    data-testid="input-first-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    required
                    data-testid="input-last-name"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  data-testid="input-email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  data-testid="input-phone"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Initial Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  minLength={6}
                  data-testid="input-password"
                />
              </div>
              <Button type="submit" className="w-full" disabled={createMutation.isPending} data-testid="button-submit">
                {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Create Teacher
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <CardTitle className="text-lg">All Teachers ({teachersList.length})</CardTitle>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search teachers..."
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                data-testid="input-search"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : filteredTeachers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {search ? "No teachers found matching your search" : "No teachers added yet"}
            </div>
          ) : (
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead className="hidden md:table-cell">Email</TableHead>
                    <TableHead className="hidden lg:table-cell">Phone</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTeachers.map((teacher) => (
                    <TableRow key={teacher.id} data-testid={`row-teacher-${teacher.id}`}>
                      <TableCell>
                        <div className="font-medium">
                          {teacher.firstName} {teacher.lastName}
                        </div>
                        <div className="text-sm text-muted-foreground md:hidden">{teacher.email}</div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-muted-foreground" />
                          {teacher.email}
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {teacher.phoneNumber ? (
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4 text-muted-foreground" />
                            {teacher.phoneNumber}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={teacher.isActive ? "default" : "secondary"}>
                          {teacher.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openAssignDialog(teacher)}
                            className="gap-1"
                            data-testid={`button-assign-${teacher.id}`}
                          >
                            <BookOpen className="w-3 h-3" />
                            <span className="hidden sm:inline">Assign</span>
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => toggleStatusMutation.mutate({ id: teacher.id, isActive: !teacher.isActive })}
                            title={teacher.isActive ? "Deactivate" : "Activate"}
                            data-testid={`button-toggle-${teacher.id}`}
                          >
                            {teacher.isActive ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isAssignDialogOpen} onOpenChange={(open) => !open && closeAssignDialog()}>
        <DialogContent className="max-w-2xl mx-4 sm:mx-auto max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Assign Classes & Subjects
            </DialogTitle>
            <DialogDescription>
              Assign classes and subjects to {selectedTeacher?.firstName} {selectedTeacher?.lastName}. 
              Select the combinations of class and subject this teacher will handle.
            </DialogDescription>
          </DialogHeader>
          
          {isLoadingAssignments ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : (
            <>
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  Click on a class-subject combination to assign or remove. 
                  Selected: <span className="font-semibold">{assignments.length}</span> assignments
                </div>
                
                <ScrollArea className="h-[400px] pr-4 border rounded-lg">
                  <div className="p-4 space-y-4">
                    {classes.length === 0 ? (
                      <p className="text-muted-foreground text-center py-4">
                        No classes available. Please add classes first.
                      </p>
                    ) : subjects.length === 0 ? (
                      <p className="text-muted-foreground text-center py-4">
                        No subjects available. Please add subjects first.
                      </p>
                    ) : (
                      classes.map((classRecord) => (
                        <div key={classRecord.id} className="space-y-2">
                          <div className="font-medium text-sm bg-muted/50 px-3 py-2 rounded-md flex items-center gap-2">
                            <BookOpen className="w-4 h-4" />
                            {classRecord.name}
                            {classRecord.arm && ` (${classRecord.arm})`}
                            <span className="text-xs text-muted-foreground">- {classRecord.academicYear}</span>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pl-4">
                            {subjects.map((subject) => {
                              const assigned = isAssigned(classRecord.id, subject.id);
                              return (
                                <div
                                  key={`${classRecord.id}-${subject.id}`}
                                  className={`flex items-center gap-2 p-2 rounded-md border cursor-pointer transition-colors
                                    ${assigned 
                                      ? "bg-primary/10 border-primary text-primary" 
                                      : "hover-elevate"
                                    }`}
                                  onClick={() => toggleAssignment(classRecord.id, subject.id)}
                                  data-testid={`assignment-${classRecord.id}-${subject.id}`}
                                >
                                  <Checkbox
                                    checked={assigned}
                                    onCheckedChange={() => {}}
                                    className="pointer-events-none"
                                  />
                                  <span className="text-sm truncate">{subject.name}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </div>
              
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={closeAssignDialog}>
                  Cancel
                </Button>
                <Button
                  onClick={handleAssignSubmit}
                  disabled={assignmentsMutation.isPending}
                  data-testid="button-save-assignments"
                >
                  {assignmentsMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : null}
                  Save Assignments
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
