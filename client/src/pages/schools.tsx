import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus, Edit, Trash2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
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
import { Badge } from "@/components/ui/badge";
import { SchoolForm } from "@/components/schools/SchoolForm";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { School } from "@shared/schema";

export default function Schools() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);

  const { data: schools, isLoading } = useQuery<School[]>({
    queryKey: ["/api/schools"],
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/schools", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/schools"] });
      setDialogOpen(false);
      setSelectedSchool(null);
      toast({ title: "Success", description: "School created successfully" });
    },
    onError: (error: any) => {
      toast({ variant: "destructive", title: "Error", description: error.message });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => 
      apiRequest("PUT", `/api/schools/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/schools"] });
      setDialogOpen(false);
      setSelectedSchool(null);
      toast({ title: "Success", description: "School updated successfully" });
    },
    onError: (error: any) => {
      toast({ variant: "destructive", title: "Error", description: error.message });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/schools/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/schools"] });
      toast({ title: "Success", description: "School deleted successfully" });
    },
    onError: (error: any) => {
      toast({ variant: "destructive", title: "Error", description: error.message });
    },
  });

  const handleSubmit = async (data: any) => {
    if (selectedSchool) {
      await updateMutation.mutateAsync({ id: selectedSchool.id, data });
    } else {
      await createMutation.mutateAsync(data);
    }
  };

  const filteredSchools = schools?.filter((school) =>
    school.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (school.code && school.code.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (school.subdomain && school.subdomain.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Schools</h2>
          <p className="text-muted-foreground">Manage all schools in the system</p>
        </div>
        <Button onClick={() => {
          setSelectedSchool(null);
          setDialogOpen(true);
        }} data-testid="button-add-school">
          <Plus className="w-4 h-4 mr-2" />
          Add School
        </Button>
      </div>

      <Card className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <Search className="w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search schools..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-sm"
            data-testid="input-search"
          />
        </div>

        <div className="rounded-lg border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Subdomain</TableHead>
                <TableHead className="hidden md:table-cell">Contact</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    Loading schools...
                  </TableCell>
                </TableRow>
              ) : filteredSchools && filteredSchools.length > 0 ? (
                filteredSchools.map((school) => (
                  <TableRow key={school.id} data-testid={`row-school-${school.id}`}>
                    <TableCell>
                      <div className="font-medium">{school.name}</div>
                      {school.code && (
                        <Badge variant="outline" className="font-mono text-xs mt-1">{school.code}</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {school.subdomain ? (
                        <span className="text-sm font-mono text-muted-foreground">
                          {school.subdomain}.smartresult.app
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm">
                      <div>{school.email}</div>
                      {school.phone && <div className="text-muted-foreground">{school.phone}</div>}
                    </TableCell>
                    <TableCell>
                      <Badge variant={school.isActive ? "default" : "secondary"}>
                        {school.isActive ? "Active" : "Pending"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedSchool(school);
                            setDialogOpen(true);
                          }}
                          data-testid={`button-edit-${school.id}`}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            if (confirm("Are you sure you want to delete this school?")) {
                              deleteMutation.mutate(school.id);
                            }
                          }}
                          data-testid={`button-delete-${school.id}`}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No schools found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedSchool ? "Edit School" : "Add New School"}
            </DialogTitle>
            <DialogDescription>
              {selectedSchool 
                ? "Update school information" 
                : "Fill in the details to create a new school"}
            </DialogDescription>
          </DialogHeader>
          <SchoolForm
            school={selectedSchool || undefined}
            onSubmit={handleSubmit}
            isLoading={createMutation.isPending || updateMutation.isPending}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
