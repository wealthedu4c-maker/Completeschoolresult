import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Plus, Search, Pencil, Trash2, Loader2, BookOpen } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";

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
  const [editingClass, setEditingClass] = useState<ClassRecord | null>(null);
  const [formData, setFormData] = useState(defaultFormData);

  const { data: classes = [], isLoading } = useQuery<ClassRecord[]>({
    queryKey: ["/api/classes"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await apiRequest("POST", "/api/classes", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/classes"] });
      closeDialog();
      toast({ title: "Success", description: "Class created successfully" });
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

  const filteredClasses = classes.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.level.toLowerCase().includes(search.toLowerCase())
  );

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingClass(null);
    setFormData(defaultFormData);
  };

  const openEditDialog = (classRecord: ClassRecord) => {
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingClass) {
      updateMutation.mutate({ id: editingClass.id, data: formData });
    } else {
      createMutation.mutate(formData);
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
          <p className="text-muted-foreground">Manage your school's class structure</p>
        </div>
        <Button 
          className="gap-2 w-full sm:w-auto" 
          onClick={() => setIsDialogOpen(true)}
          data-testid="button-add-class"
        >
          <Plus className="w-4 h-4" />
          Add Class
        </Button>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="max-w-md mx-4 sm:mx-auto">
          <DialogHeader>
            <DialogTitle>{editingClass ? "Edit Class" : "Add New Class"}</DialogTitle>
            <DialogDescription>
              {editingClass ? "Update class details" : "Create a new class for your school"}
            </DialogDescription>
          </DialogHeader>
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
              {editingClass ? "Update Class" : "Create Class"}
            </Button>
          </form>
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
