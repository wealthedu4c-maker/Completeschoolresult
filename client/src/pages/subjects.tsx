import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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
import { Plus, Search, Pencil, Trash2, Loader2, FileStack } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";

interface Subject {
  id: string;
  name: string;
  code: string;
  category: string;
  description?: string;
  createdAt: string;
}

const defaultFormData = {
  name: "",
  code: "",
  category: "Core",
  description: "",
};

export default function Subjects() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [formData, setFormData] = useState(defaultFormData);

  const { data: subjects = [], isLoading } = useQuery<Subject[]>({
    queryKey: ["/api/subjects"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await apiRequest("POST", "/api/subjects", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/subjects"] });
      closeDialog();
      toast({ title: "Success", description: "Subject created successfully" });
    },
    onError: (error: any) => {
      toast({ variant: "destructive", title: "Error", description: error.message });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      const res = await apiRequest("PATCH", `/api/subjects/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/subjects"] });
      closeDialog();
      toast({ title: "Success", description: "Subject updated successfully" });
    },
    onError: (error: any) => {
      toast({ variant: "destructive", title: "Error", description: error.message });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/subjects/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/subjects"] });
      toast({ title: "Success", description: "Subject deleted successfully" });
    },
    onError: (error: any) => {
      toast({ variant: "destructive", title: "Error", description: error.message });
    },
  });

  const filteredSubjects = subjects.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.code.toLowerCase().includes(search.toLowerCase())
  );

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingSubject(null);
    setFormData(defaultFormData);
  };

  const openEditDialog = (subject: Subject) => {
    setEditingSubject(subject);
    setFormData({
      name: subject.name,
      code: subject.code,
      category: subject.category,
      description: subject.description || "",
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingSubject) {
      updateMutation.mutate({ id: editingSubject.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "Core":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "Elective":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "Vocational":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Subjects</h2>
          <p className="text-muted-foreground">Manage your school's subject catalog</p>
        </div>
        <Button 
          className="gap-2 w-full sm:w-auto" 
          onClick={() => setIsDialogOpen(true)}
          data-testid="button-add-subject"
        >
          <Plus className="w-4 h-4" />
          Add Subject
        </Button>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="max-w-md mx-4 sm:mx-auto">
          <DialogHeader>
            <DialogTitle>{editingSubject ? "Edit Subject" : "Add New Subject"}</DialogTitle>
            <DialogDescription>
              {editingSubject ? "Update subject details" : "Create a new subject for your school curriculum"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Subject Name</Label>
              <Input
                id="name"
                placeholder="e.g., Mathematics"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                data-testid="input-name"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="code">Subject Code</Label>
                <Input
                  id="code"
                  placeholder="e.g., MATH"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  required
                  data-testid="input-code"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger data-testid="select-category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Core">Core</SelectItem>
                    <SelectItem value="Elective">Elective</SelectItem>
                    <SelectItem value="Vocational">Vocational</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                placeholder="Brief description of the subject..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                data-testid="input-description"
              />
            </div>
            <Button type="submit" className="w-full" disabled={isPending} data-testid="button-submit">
              {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {editingSubject ? "Update Subject" : "Create Subject"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileStack className="w-5 h-5" />
              All Subjects ({subjects.length})
            </CardTitle>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search subjects..."
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
          ) : filteredSubjects.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {search ? "No subjects found matching your search" : "No subjects added yet"}
            </div>
          ) : (
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Subject Name</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="hidden md:table-cell">Description</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSubjects.map((subject) => (
                    <TableRow key={subject.id} data-testid={`row-subject-${subject.id}`}>
                      <TableCell className="font-medium">{subject.name}</TableCell>
                      <TableCell>
                        <code className="px-2 py-1 rounded bg-muted text-sm font-mono">{subject.code}</code>
                      </TableCell>
                      <TableCell>
                        <Badge className={getCategoryColor(subject.category)}>{subject.category}</Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell max-w-xs truncate">
                        {subject.description || "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => openEditDialog(subject)}
                            data-testid={`button-edit-${subject.id}`}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => deleteMutation.mutate(subject.id)}
                            disabled={deleteMutation.isPending}
                            data-testid={`button-delete-${subject.id}`}
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
