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
import { Plus, Search, Pencil, Trash2, Loader2, BookOpen, FileStack, ChevronRight, ChevronLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ClassRecord {
  id: string;
  name: string;
  level: string;
  grade: number;
  arm?: string;
  academicYear: string;
  capacity?: number;
  createdAt: string;
}

interface Subject {
  id: string;
  name: string;
  code: string;
  category: string;
}

interface ClassSubject {
  id: string;
  classId: string;
  subjectId: string;
}

const defaultFormData = {
  name: "",
  level: "Primary",
  grade: 1,
  arm: "",
  academicYear: new Date().getFullYear() + "/" + (new Date().getFullYear() + 1),
  capacity: 40,
};

export default function Classes() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubjectDialogOpen, setIsSubjectDialogOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<ClassRecord | null>(null);
  const [editingClass, setEditingClass] = useState<ClassRecord | null>(null);
  const [formData, setFormData] = useState(defaultFormData);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [createStep, setCreateStep] = useState<1 | 2>(1);
  const [newlyCreatedClassId, setNewlyCreatedClassId] = useState<string | null>(null);

  const { data: classes = [], isLoading } = useQuery<ClassRecord[]>({
    queryKey: ["/api/classes"],
  });

  const { data: subjects = [] } = useQuery<Subject[]>({
    queryKey: ["/api/subjects"],
  });

  const { data: classSubjects = [], isLoading: isLoadingClassSubjects } = useQuery<ClassSubject[]>({
    queryKey: ["/api/classes", selectedClass?.id, "subjects"],
    queryFn: async () => {
      if (!selectedClass) return [];
      const res = await fetch(`/api/classes/${selectedClass.id}/subjects`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      return res.json();
    },
    enabled: !!selectedClass,
  });

  useEffect(() => {
    if (selectedClass && classSubjects.length > 0) {
      setSelectedSubjects(classSubjects.map(cs => cs.subjectId));
    }
  }, [selectedClass, classSubjects]);

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await apiRequest("POST", "/api/classes", data);
      return res.json();
    },
    onSuccess: (newClass) => {
      queryClient.invalidateQueries({ queryKey: ["/api/classes"] });
      setNewlyCreatedClassId(newClass.id);
      setCreateStep(2);
      toast({ title: "Success", description: "Class created! Now assign subjects." });
    },
    onError: (error: any) => {
      toast({ variant: "destructive", title: "Error", description: error.message });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      const res = await apiRequest("PATCH", `/api/classes/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/classes"] });
      closeDialog();
      toast({ title: "Success", description: "Class updated successfully" });
    },
    onError: (error: any) => {
      toast({ variant: "destructive", title: "Error", description: error.message });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/classes/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/classes"] });
      toast({ title: "Success", description: "Class deleted successfully" });
    },
    onError: (error: any) => {
      toast({ variant: "destructive", title: "Error", description: error.message });
    },
  });

  const updateSubjectsMutation = useMutation({
    mutationFn: async ({ classId, subjectIds }: { classId: string; subjectIds: string[] }) => {
      const res = await apiRequest("PUT", `/api/classes/${classId}/subjects`, { subjectIds });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/classes", selectedClass?.id, "subjects"] });
      closeSubjectDialog();
      toast({ title: "Success", description: "Class subjects updated successfully" });
    },
    onError: (error: any) => {
      toast({ variant: "destructive", title: "Error", description: error.message });
    },
  });

  const assignSubjectsToNewClassMutation = useMutation({
    mutationFn: async ({ classId, subjectIds }: { classId: string; subjectIds: string[] }) => {
      const res = await apiRequest("PUT", `/api/classes/${classId}/subjects`, { subjectIds });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/classes"] });
      closeDialog();
      toast({ title: "Success", description: "Class created and subjects assigned!" });
    },
    onError: (error: any) => {
      toast({ variant: "destructive", title: "Error", description: error.message });
    },
  });

  const filteredClasses = classes.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.level.toLowerCase().includes(search.toLowerCase())
  );

  const closeDialog = () => {
    setIsDialogOpen(false);
    setTimeout(() => {
      setEditingClass(null);
      setFormData(defaultFormData);
      setCreateStep(1);
      setNewlyCreatedClassId(null);
      setSelectedSubjects([]);
    }, 200);
  };

  const openCreateDialog = () => {
    setEditingClass(null);
    setFormData(defaultFormData);
    setCreateStep(1);
    setNewlyCreatedClassId(null);
    setSelectedSubjects([]);
    setIsDialogOpen(true);
  };

  const closeSubjectDialog = () => {
    setIsSubjectDialogOpen(false);
    setSelectedClass(null);
    setSelectedSubjects([]);
  };

  const openEditDialog = (classRecord: ClassRecord) => {
    setCreateStep(1);
    setNewlyCreatedClassId(null);
    setSelectedSubjects([]);
    setEditingClass(classRecord);
    setFormData({
      name: classRecord.name,
      level: classRecord.level,
      grade: classRecord.grade,
      arm: classRecord.arm || "",
      academicYear: classRecord.academicYear,
      capacity: classRecord.capacity || 40,
    });
    setIsDialogOpen(true);
  };

  const openSubjectDialog = (classRecord: ClassRecord) => {
    setSelectedClass(classRecord);
    setSelectedSubjects([]);
    setIsSubjectDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingClass) {
      updateMutation.mutate({ id: editingClass.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleSubjectToggle = (subjectId: string) => {
    setSelectedSubjects((prev) =>
      prev.includes(subjectId)
        ? prev.filter((id) => id !== subjectId)
        : [...prev, subjectId]
    );
  };

  const handleFinishCreation = () => {
    if (newlyCreatedClassId) {
      if (selectedSubjects.length > 0) {
        assignSubjectsToNewClassMutation.mutate({
          classId: newlyCreatedClassId,
          subjectIds: selectedSubjects,
        });
      } else {
        closeDialog();
        toast({ title: "Class Created", description: "No subjects assigned. You can add subjects later." });
      }
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case "Primary":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "JSS":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "SS":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Classes</h2>
          <p className="text-muted-foreground">Manage your school's class structure and subject assignments</p>
        </div>
        <Button 
          className="gap-2 w-full sm:w-auto" 
          onClick={openCreateDialog}
          data-testid="button-add-class"
        >
          <Plus className="w-4 h-4" />
          Add Class
        </Button>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="max-w-md mx-4 sm:mx-auto">
          <DialogHeader>
            <DialogTitle>
              {editingClass 
                ? "Edit Class" 
                : createStep === 1 
                ? "Add New Class" 
                : "Assign Subjects"}
            </DialogTitle>
            <DialogDescription>
              {editingClass 
                ? "Update class details" 
                : createStep === 1 
                ? "Step 1: Create a new class for your school" 
                : "Step 2: Select subjects to be taught in this class"}
            </DialogDescription>
          </DialogHeader>

          {editingClass ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Class Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., Primary 1, JSS 2A"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  data-testid="input-name"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="level">Level</Label>
                  <Select
                    value={formData.level}
                    onValueChange={(value) => setFormData({ ...formData, level: value })}
                  >
                    <SelectTrigger data-testid="select-level">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Primary">Primary</SelectItem>
                      <SelectItem value="JSS">JSS</SelectItem>
                      <SelectItem value="SS">SS</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="grade">Grade</Label>
                  <Select
                    value={String(formData.grade)}
                    onValueChange={(value) => setFormData({ ...formData, grade: Number(value) })}
                  >
                    <SelectTrigger data-testid="select-grade">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5, 6].map((g) => (
                        <SelectItem key={g} value={String(g)}>
                          {g}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="arm">Arm (Optional)</Label>
                  <Input
                    id="arm"
                    placeholder="e.g., A, B, C"
                    value={formData.arm}
                    onChange={(e) => setFormData({ ...formData, arm: e.target.value.toUpperCase() })}
                    maxLength={1}
                    data-testid="input-arm"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="capacity">Capacity</Label>
                  <Input
                    id="capacity"
                    type="number"
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: Number(e.target.value) })}
                    min={1}
                    data-testid="input-capacity"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="academicYear">Academic Year</Label>
                <Input
                  id="academicYear"
                  placeholder="e.g., 2024/2025"
                  value={formData.academicYear}
                  onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                  required
                  data-testid="input-academic-year"
                />
              </div>
              <Button type="submit" className="w-full" disabled={isPending} data-testid="button-submit">
                {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Update Class
              </Button>
            </form>
          ) : createStep === 1 ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Class Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., Primary 1, JSS 2A"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  data-testid="input-name"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="level">Level</Label>
                  <Select
                    value={formData.level}
                    onValueChange={(value) => setFormData({ ...formData, level: value })}
                  >
                    <SelectTrigger data-testid="select-level">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Primary">Primary</SelectItem>
                      <SelectItem value="JSS">JSS</SelectItem>
                      <SelectItem value="SS">SS</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="grade">Grade</Label>
                  <Select
                    value={String(formData.grade)}
                    onValueChange={(value) => setFormData({ ...formData, grade: Number(value) })}
                  >
                    <SelectTrigger data-testid="select-grade">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5, 6].map((g) => (
                        <SelectItem key={g} value={String(g)}>
                          {g}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="arm">Arm (Optional)</Label>
                  <Input
                    id="arm"
                    placeholder="e.g., A, B, C"
                    value={formData.arm}
                    onChange={(e) => setFormData({ ...formData, arm: e.target.value.toUpperCase() })}
                    maxLength={1}
                    data-testid="input-arm"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="capacity">Capacity</Label>
                  <Input
                    id="capacity"
                    type="number"
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: Number(e.target.value) })}
                    min={1}
                    data-testid="input-capacity"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="academicYear">Academic Year</Label>
                <Input
                  id="academicYear"
                  placeholder="e.g., 2024/2025"
                  value={formData.academicYear}
                  onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                  required
                  data-testid="input-academic-year"
                />
              </div>
              <Button type="submit" className="w-full gap-2" disabled={isPending} data-testid="button-submit">
                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Next: Assign Subjects
                <ChevronRight className="w-4 h-4" />
              </Button>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Badge variant="outline">{formData.name}</Badge>
                <span>- Select subjects to assign</span>
              </div>
              
              <ScrollArea className="h-[300px] pr-4 border rounded-lg">
                <div className="p-3 space-y-2">
                  {subjects.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">
                      No subjects available. You can add subjects later.
                    </p>
                  ) : (
                    subjects.map((subject) => (
                      <div
                        key={subject.id}
                        className={`flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-colors
                          ${selectedSubjects.includes(subject.id) 
                            ? "bg-primary/10 border-primary" 
                            : "hover-elevate"
                          }`}
                        onClick={() => handleSubjectToggle(subject.id)}
                        data-testid={`create-subject-toggle-${subject.id}`}
                      >
                        <Checkbox
                          checked={selectedSubjects.includes(subject.id)}
                          onCheckedChange={() => {}}
                          className="pointer-events-none"
                        />
                        <div className="flex-1">
                          <p className="font-medium">{subject.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {subject.code} - {subject.category}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>

              <div className="text-sm text-muted-foreground">
                {selectedSubjects.length} subject(s) selected
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setCreateStep(1)}
                  className="gap-2"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Back
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleFinishCreation}
                  disabled={assignSubjectsToNewClassMutation.isPending}
                  data-testid="button-finish-create"
                >
                  {assignSubjectsToNewClassMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : null}
                  {selectedSubjects.length > 0 ? "Finish & Assign Subjects" : "Skip & Finish"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isSubjectDialogOpen} onOpenChange={(open) => !open && closeSubjectDialog()}>
        <DialogContent className="max-w-md mx-4 sm:mx-auto">
          <DialogHeader>
            <DialogTitle>Assign Subjects to {selectedClass?.name}</DialogTitle>
            <DialogDescription>
              Select which subjects are taught in this class
            </DialogDescription>
          </DialogHeader>
          {isLoadingClassSubjects ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : (
            <>
              <ScrollArea className="h-[300px] pr-4">
                <div className="space-y-3">
                  {subjects.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">
                      No subjects available. Please add subjects first.
                    </p>
                  ) : (
                    subjects.map((subject) => {
                      const isSelected = selectedSubjects.includes(subject.id);
                      
                      return (
                        <div
                          key={subject.id}
                          className={`flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-colors
                            ${isSelected 
                              ? "bg-primary/10 border-primary" 
                              : "hover-elevate"
                            }`}
                          onClick={() => handleSubjectToggle(subject.id)}
                          data-testid={`subject-toggle-${subject.id}`}
                        >
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => {}}
                            className="pointer-events-none"
                          />
                          <div className="flex-1">
                            <p className="font-medium">{subject.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {subject.code} - {subject.category}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </ScrollArea>
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={closeSubjectDialog}>
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    if (selectedClass) {
                      updateSubjectsMutation.mutate({ 
                        classId: selectedClass.id, 
                        subjectIds: selectedSubjects 
                      });
                    }
                  }}
                  disabled={updateSubjectsMutation.isPending}
                  data-testid="button-save-subjects"
                >
                  {updateSubjectsMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : null}
                  Save Changes
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              All Classes ({classes.length})
            </CardTitle>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search classes..."
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
          ) : filteredClasses.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {search ? "No classes found matching your search" : "No classes added yet"}
            </div>
          ) : (
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Class Name</TableHead>
                    <TableHead>Level</TableHead>
                    <TableHead className="hidden md:table-cell">Academic Year</TableHead>
                    <TableHead className="hidden lg:table-cell">Capacity</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClasses.map((classRecord) => (
                    <TableRow key={classRecord.id} data-testid={`row-class-${classRecord.id}`}>
                      <TableCell className="font-medium">
                        {classRecord.name}
                        {classRecord.arm && ` (${classRecord.arm})`}
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getLevelColor(classRecord.level)}`}>
                          {classRecord.level} {classRecord.grade}
                        </span>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">{classRecord.academicYear}</TableCell>
                      <TableCell className="hidden lg:table-cell">{classRecord.capacity || "-"}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openSubjectDialog(classRecord)}
                            className="gap-1"
                            data-testid={`button-subjects-${classRecord.id}`}
                          >
                            <FileStack className="w-3 h-3" />
                            <span className="hidden sm:inline">Subjects</span>
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => openEditDialog(classRecord)}
                            data-testid={`button-edit-${classRecord.id}`}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => deleteMutation.mutate(classRecord.id)}
                            disabled={deleteMutation.isPending}
                            data-testid={`button-delete-${classRecord.id}`}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
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
    </div>
  );
}
