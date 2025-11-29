import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import { Plus, Pencil, Trash2, Loader2, Settings2, GripVertical, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Badge } from "@/components/ui/badge";

interface ScoreMetric {
  id: string;
  name: string;
  maxScore: number;
  weight: string;
  order: number;
  isActive: boolean;
  createdAt: string;
}

const defaultFormData = {
  name: "",
  maxScore: 10,
  weight: "1",
  order: 0,
};

export default function ScoreMetrics() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMetric, setEditingMetric] = useState<ScoreMetric | null>(null);
  const [formData, setFormData] = useState(defaultFormData);

  const { data: metrics = [], isLoading } = useQuery<ScoreMetric[]>({
    queryKey: ["/api/score-metrics"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await apiRequest("POST", "/api/score-metrics", {
        ...data,
        order: metrics.length,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/score-metrics"] });
      closeDialog();
      toast({ title: "Success", description: "Score metric created successfully" });
    },
    onError: (error: any) => {
      toast({ variant: "destructive", title: "Error", description: error.message });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      const res = await apiRequest("PATCH", `/api/score-metrics/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/score-metrics"] });
      closeDialog();
      toast({ title: "Success", description: "Score metric updated successfully" });
    },
    onError: (error: any) => {
      toast({ variant: "destructive", title: "Error", description: error.message });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/score-metrics/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/score-metrics"] });
      toast({ title: "Success", description: "Score metric deleted successfully" });
    },
    onError: (error: any) => {
      toast({ variant: "destructive", title: "Error", description: error.message });
    },
  });

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingMetric(null);
    setFormData(defaultFormData);
  };

  const openEditDialog = (metric: ScoreMetric) => {
    setEditingMetric(metric);
    setFormData({
      name: metric.name,
      maxScore: metric.maxScore,
      weight: metric.weight,
      order: metric.order,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingMetric) {
      updateMutation.mutate({ id: editingMetric.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const getTotalMaxScore = () => {
    return metrics.reduce((sum, m) => sum + m.maxScore, 0);
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Score Metrics</h2>
          <p className="text-muted-foreground">Configure how student scores are structured (e.g., CA1, CA2, Exam)</p>
        </div>
        <Button 
          className="gap-2 w-full sm:w-auto" 
          onClick={() => setIsDialogOpen(true)}
          data-testid="button-add-metric"
        >
          <Plus className="w-4 h-4" />
          Add Metric
        </Button>
      </div>

      {metrics.length === 0 && !isLoading && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertTriangle className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Score Metrics Configured</h3>
            <p className="text-muted-foreground text-center max-w-md mb-4">
              Your school doesn't have any score metrics yet. The default metrics (CA1, CA2, Exam) will be used.
              Add custom metrics to match your school's grading system.
            </p>
            <Button onClick={() => setIsDialogOpen(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              Add Your First Metric
            </Button>
          </CardContent>
        </Card>
      )}

      <Dialog open={isDialogOpen} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="max-w-md mx-4 sm:mx-auto">
          <DialogHeader>
            <DialogTitle>{editingMetric ? "Edit Score Metric" : "Add Score Metric"}</DialogTitle>
            <DialogDescription>
              {editingMetric 
                ? "Update this scoring component" 
                : "Add a new scoring component (e.g., CA, Test, Exam)"
              }
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Metric Name</Label>
              <Input
                id="name"
                placeholder="e.g., CA1, Midterm Test, Final Exam"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                data-testid="input-name"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="maxScore">Maximum Score</Label>
                <Input
                  id="maxScore"
                  type="number"
                  min="1"
                  max="100"
                  placeholder="e.g., 10, 20, 60"
                  value={formData.maxScore}
                  onChange={(e) => setFormData({ ...formData, maxScore: parseInt(e.target.value) || 0 })}
                  required
                  data-testid="input-max-score"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="weight">Weight (for GPA)</Label>
                <Input
                  id="weight"
                  type="number"
                  step="0.1"
                  min="0"
                  max="10"
                  placeholder="e.g., 1.0"
                  value={formData.weight}
                  onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                  required
                  data-testid="input-weight"
                />
              </div>
            </div>
            <div className="bg-muted/50 p-3 rounded-md text-sm">
              <p className="font-medium mb-1">Example Setup:</p>
              <ul className="text-muted-foreground space-y-1">
                <li>CA1 = 10 marks (continuous assessment)</li>
                <li>CA2 = 10 marks (continuous assessment)</li>
                <li>Exam = 80 marks (final examination)</li>
                <li>Total = 100 marks</li>
              </ul>
            </div>
            <Button type="submit" className="w-full" disabled={isPending} data-testid="button-submit">
              {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {editingMetric ? "Update Metric" : "Add Metric"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {metrics.length > 0 && (
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="md:col-span-2">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Settings2 className="w-5 h-5" />
                Configured Metrics ({metrics.length})
              </CardTitle>
              <CardDescription>
                These metrics will be used when uploading and viewing student results
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              ) : (
                <div className="overflow-x-auto -mx-4 sm:mx-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-8"></TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead className="text-center">Max Score</TableHead>
                        <TableHead className="text-center">Weight</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {metrics
                        .sort((a, b) => a.order - b.order)
                        .map((metric, index) => (
                          <TableRow key={metric.id} data-testid={`row-metric-${metric.id}`}>
                            <TableCell>
                              <GripVertical className="w-4 h-4 text-muted-foreground cursor-move" />
                            </TableCell>
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="min-w-[24px] justify-center">
                                  {index + 1}
                                </Badge>
                                {metric.name}
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <code className="px-2 py-1 rounded bg-muted text-sm">{metric.maxScore}</code>
                            </TableCell>
                            <TableCell className="text-center">
                              {parseFloat(metric.weight).toFixed(1)}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => openEditDialog(metric)}
                                  data-testid={`button-edit-${metric.id}`}
                                >
                                  <Pencil className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => deleteMutation.mutate(metric.id)}
                                  disabled={deleteMutation.isPending}
                                  data-testid={`button-delete-${metric.id}`}
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

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Total Metrics</span>
                <span className="font-semibold">{metrics.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Total Max Score</span>
                <span className="font-semibold text-lg">{getTotalMaxScore()}</span>
              </div>
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  CSV templates for result uploads will automatically include columns for each metric you configure here.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
