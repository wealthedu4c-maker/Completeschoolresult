import { useState, useEffect } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Pencil, Trash2, Loader2, Settings2, GripVertical, AlertTriangle, GraduationCap, Calculator, Save, Award } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Badge } from "@/components/ui/badge";

interface ScoreMetric {
  id: string;
  name: string;
  maxScore: number;
  order: number;
  isActive: boolean;
  createdAt: string;
}

interface GradeRange {
  grade: string;
  minScore: number;
  maxScore: number;
  remark: string;
}

interface GradingConfig {
  gradeRanges: GradeRange[];
  computationMode: string;
}

const defaultGradeRanges: GradeRange[] = [
  { grade: "A", minScore: 70, maxScore: 100, remark: "Excellent" },
  { grade: "B", minScore: 60, maxScore: 69.99, remark: "Very Good" },
  { grade: "C", minScore: 50, maxScore: 59.99, remark: "Good" },
  { grade: "D", minScore: 40, maxScore: 49.99, remark: "Fair" },
  { grade: "E", minScore: 30, maxScore: 39.99, remark: "Pass" },
  { grade: "F", minScore: 0, maxScore: 29.99, remark: "Fail" },
];

const computationModes = [
  { value: "total_average_only", label: "Total & Average Only", description: "Show only total score and average" },
  { value: "position_average_only", label: "Position & Average Only", description: "Show position in class and average" },
  { value: "total_average_position", label: "Total, Average & Position", description: "Show all: total, average, and position" },
];

const defaultFormData = {
  name: "",
  maxScore: 10,
  order: 0,
};

export default function ScoreMetrics() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("metrics");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMetric, setEditingMetric] = useState<ScoreMetric | null>(null);
  const [formData, setFormData] = useState(defaultFormData);
  
  const [gradeRanges, setGradeRanges] = useState<GradeRange[]>(defaultGradeRanges);
  const [computationMode, setComputationMode] = useState("total_average_only");
  const [editingGrade, setEditingGrade] = useState<GradeRange | null>(null);
  const [isGradeDialogOpen, setIsGradeDialogOpen] = useState(false);
  const [gradeFormData, setGradeFormData] = useState<GradeRange>({ grade: "", minScore: 0, maxScore: 100, remark: "" });

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const { data: metrics = [], isLoading: metricsLoading } = useQuery<ScoreMetric[]>({
    queryKey: ["/api/score-metrics"],
  });

  const { data: gradingConfig, isLoading: gradingLoading, refetch: refetchGrading } = useQuery<GradingConfig>({
    queryKey: ["/api/schools", user.schoolId, "grading"],
    enabled: !!user.schoolId,
  });

  useEffect(() => {
    if (gradingConfig) {
      if (gradingConfig.gradeRanges && gradingConfig.gradeRanges.length > 0) {
        setGradeRanges(gradingConfig.gradeRanges);
      }
      if (gradingConfig.computationMode) {
        setComputationMode(gradingConfig.computationMode);
      }
    }
  }, [gradingConfig]);

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

  const saveGradingMutation = useMutation({
    mutationFn: async (data: { gradeRanges: GradeRange[]; computationMode: string }) => {
      const res = await apiRequest("PATCH", `/api/schools/${user.schoolId}/grading`, data);
      return res.json();
    },
    onSuccess: () => {
      refetchGrading();
      toast({ title: "Success", description: "Grading configuration saved successfully" });
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

  const handleGradeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingGrade) {
      setGradeRanges(prev => prev.map(g => g.grade === editingGrade.grade ? gradeFormData : g));
    } else {
      setGradeRanges(prev => [...prev, gradeFormData]);
    }
    setIsGradeDialogOpen(false);
    setEditingGrade(null);
    setGradeFormData({ grade: "", minScore: 0, maxScore: 100, remark: "" });
  };

  const openGradeEditDialog = (grade: GradeRange) => {
    setEditingGrade(grade);
    setGradeFormData({ ...grade });
    setIsGradeDialogOpen(true);
  };

  const deleteGrade = (grade: string) => {
    setGradeRanges(prev => prev.filter(g => g.grade !== grade));
  };

  const saveGradingConfig = () => {
    saveGradingMutation.mutate({ gradeRanges, computationMode });
  };

  const resetToDefaults = () => {
    setGradeRanges(defaultGradeRanges);
    setComputationMode("total_average_only");
  };

  const isPending = createMutation.isPending || updateMutation.isPending;
  const isGradingSaving = saveGradingMutation.isPending;

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Grading Configuration</h2>
          <p className="text-muted-foreground">Configure score metrics, grade ranges, and result computation</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 md:w-auto md:inline-flex">
          <TabsTrigger value="metrics" className="gap-2" data-testid="tab-metrics">
            <Settings2 className="w-4 h-4" />
            Score Metrics
          </TabsTrigger>
          <TabsTrigger value="grading" className="gap-2" data-testid="tab-grading">
            <GraduationCap className="w-4 h-4" />
            Grade Ranges
          </TabsTrigger>
        </TabsList>

        <TabsContent value="metrics" className="space-y-4">
          <div className="flex justify-end">
            <Button 
              className="gap-2 w-full sm:w-auto" 
              onClick={() => setIsDialogOpen(true)}
              data-testid="button-add-metric"
            >
              <Plus className="w-4 h-4" />
              Add Metric
            </Button>
          </div>

          {metrics.length === 0 && !metricsLoading && (
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
                  {metricsLoading ? (
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
        </TabsContent>

        <TabsContent value="grading" className="space-y-4">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Award className="w-5 h-5" />
                      Grade Ranges
                    </CardTitle>
                    <CardDescription>
                      Define how scores map to letter grades and remarks
                    </CardDescription>
                  </div>
                  <Button 
                    size="sm" 
                    onClick={() => {
                      setEditingGrade(null);
                      setGradeFormData({ grade: "", minScore: 0, maxScore: 100, remark: "" });
                      setIsGradeDialogOpen(true);
                    }}
                    data-testid="button-add-grade"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {gradingLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin" />
                  </div>
                ) : (
                  <div className="overflow-x-auto -mx-4 sm:mx-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Grade</TableHead>
                          <TableHead className="text-center">Min</TableHead>
                          <TableHead className="text-center">Max</TableHead>
                          <TableHead>Remark</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {gradeRanges
                          .sort((a, b) => b.minScore - a.minScore)
                          .map((grade) => (
                            <TableRow key={grade.grade} data-testid={`row-grade-${grade.grade}`}>
                              <TableCell>
                                <Badge variant="outline" className="font-bold text-lg">
                                  {grade.grade}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-center">{grade.minScore}</TableCell>
                              <TableCell className="text-center">{grade.maxScore}</TableCell>
                              <TableCell className="text-muted-foreground">{grade.remark}</TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-1">
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => openGradeEditDialog(grade)}
                                    data-testid={`button-edit-grade-${grade.grade}`}
                                  >
                                    <Pencil className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => deleteGrade(grade.grade)}
                                    data-testid={`button-delete-grade-${grade.grade}`}
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

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Calculator className="w-5 h-5" />
                    Computation Mode
                  </CardTitle>
                  <CardDescription>
                    Choose what metrics to compute and display on result sheets
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Select value={computationMode} onValueChange={setComputationMode}>
                    <SelectTrigger data-testid="select-computation-mode">
                      <SelectValue placeholder="Select computation mode" />
                    </SelectTrigger>
                    <SelectContent>
                      {computationModes.map((mode) => (
                        <SelectItem key={mode.value} value={mode.value}>
                          <div className="flex flex-col">
                            <span>{mode.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md">
                    {computationModes.find(m => m.value === computationMode)?.description}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Save Configuration</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Save your grade ranges and computation mode settings. These will be applied to all result calculations for your school.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button 
                      className="flex-1 gap-2" 
                      onClick={saveGradingConfig}
                      disabled={isGradingSaving}
                      data-testid="button-save-grading"
                    >
                      {isGradingSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      Save Configuration
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={resetToDefaults}
                      data-testid="button-reset-defaults"
                    >
                      Reset to Defaults
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>

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

      <Dialog open={isGradeDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setIsGradeDialogOpen(false);
          setEditingGrade(null);
        }
      }}>
        <DialogContent className="max-w-md mx-4 sm:mx-auto">
          <DialogHeader>
            <DialogTitle>{editingGrade ? "Edit Grade Range" : "Add Grade Range"}</DialogTitle>
            <DialogDescription>
              Define the score range and remark for this grade
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleGradeSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="grade">Grade Letter</Label>
              <Input
                id="grade"
                placeholder="e.g., A, B, C"
                value={gradeFormData.grade}
                onChange={(e) => setGradeFormData({ ...gradeFormData, grade: e.target.value.toUpperCase() })}
                required
                maxLength={2}
                disabled={!!editingGrade}
                data-testid="input-grade"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="minScore">Minimum Score</Label>
                <Input
                  id="minScore"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={gradeFormData.minScore}
                  onChange={(e) => setGradeFormData({ ...gradeFormData, minScore: parseFloat(e.target.value) || 0 })}
                  required
                  data-testid="input-min-score"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxScore">Maximum Score</Label>
                <Input
                  id="maxScore"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={gradeFormData.maxScore}
                  onChange={(e) => setGradeFormData({ ...gradeFormData, maxScore: parseFloat(e.target.value) || 0 })}
                  required
                  data-testid="input-max-score-grade"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="remark">Remark</Label>
              <Input
                id="remark"
                placeholder="e.g., Excellent, Very Good, Good"
                value={gradeFormData.remark}
                onChange={(e) => setGradeFormData({ ...gradeFormData, remark: e.target.value })}
                required
                data-testid="input-remark"
              />
            </div>
            <Button type="submit" className="w-full" data-testid="button-submit-grade">
              {editingGrade ? "Update Grade" : "Add Grade"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
