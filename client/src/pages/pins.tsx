import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Copy, CheckCircle, XCircle, Key, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { PIN, School } from "@shared/schema";

export default function Pins() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [quantity, setQuantity] = useState("10");
  const [session, setSession] = useState("");
  const [term, setTerm] = useState("First");
  const [selectedSchoolId, setSelectedSchoolId] = useState("");
  const [maxUsageCount, setMaxUsageCount] = useState("1");

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const isSuperAdmin = user.role === "super_admin";

  const { data: pins, isLoading } = useQuery<PIN[]>({
    queryKey: ["/api/pins"],
  });

  const { data: schools } = useQuery<School[]>({
    queryKey: ["/api/schools"],
    enabled: isSuperAdmin,
  });

  const generateMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/pins", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pins"] });
      setDialogOpen(false);
      setQuantity("10");
      setMaxUsageCount("1");
      setSelectedSchoolId("");
      toast({ title: "Success", description: "PINs generated successfully" });
    },
    onError: (error: any) => {
      toast({ variant: "destructive", title: "Error", description: error.message });
    },
  });

  const handleGenerate = async () => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const schoolId = isSuperAdmin ? selectedSchoolId : user.schoolId;
    
    if (!schoolId) {
      toast({ variant: "destructive", title: "Error", description: "Please select a school" });
      return;
    }

    await generateMutation.mutateAsync({
      schoolId,
      quantity: parseInt(quantity),
      session,
      term,
      maxUsageCount: parseInt(maxUsageCount),
      generatedBy: user.id,
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied!", description: "PIN copied to clipboard" });
  };

  const filteredPins = pins?.filter((pin) =>
    pin.pin.toLowerCase().includes(searchQuery.toLowerCase()) ||
    pin.session.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculate availability based on usage count vs max usage count
  const exhaustedPins = pins?.filter(p => {
    const usageCount = (p as any).usageCount || 0;
    const maxUsage = (p as any).maxUsageCount || 1;
    return usageCount >= maxUsage;
  }).length || 0;
  const availablePins = (pins?.length || 0) - exhaustedPins;

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Result PINs</h2>
          <p className="text-sm md:text-base text-muted-foreground">
            {isSuperAdmin 
              ? "Manage result checker PINs" 
              : "View your school's result PINs (request new PINs from the PIN Requests page)"}
          </p>
        </div>
        {isSuperAdmin && (
          <Button onClick={() => setDialogOpen(true)} className="w-full sm:w-auto" data-testid="button-generate-pins">
            <Plus className="w-4 h-4 mr-2" />
            Generate PINs
          </Button>
        )}
      </div>

      <div className="grid gap-3 md:gap-4 grid-cols-1 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total PINs</CardTitle>
            <Key className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="stat-total-pins">
              {pins?.length || 0}
            </div>
            <p className="text-xs text-muted-foreground">All generated PINs</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available PINs</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 dark:text-green-500" data-testid="stat-available-pins">
              {availablePins}
            </div>
            <p className="text-xs text-muted-foreground">Still has remaining uses</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Exhausted PINs</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-muted-foreground" data-testid="stat-exhausted-pins">
              {exhaustedPins}
            </div>
            <p className="text-xs text-muted-foreground">No remaining uses</p>
          </CardContent>
        </Card>
      </div>

      <Card className="p-3 md:p-4">
        <div className="flex items-center gap-2 mb-4">
          <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          <Input
            placeholder="Search PINs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full sm:max-w-sm"
            data-testid="input-search"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
          {isLoading ? (
            <div className="col-span-full text-center py-8 text-muted-foreground">
              Loading PINs...
            </div>
          ) : filteredPins && filteredPins.length > 0 ? (
            filteredPins.map((pin) => {
              const usageCount = (pin as any).usageCount || 0;
              const maxUsage = (pin as any).maxUsageCount || 1;
              const isExhausted = usageCount >= maxUsage;
              
              return (
                <Card key={pin.id} className="p-4" data-testid={`card-pin-${pin.id}`}>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Badge variant={isExhausted ? "secondary" : "default"}>
                        {isExhausted ? "Exhausted" : "Available"}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(pin.pin)}
                        data-testid={`button-copy-${pin.id}`}
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                    <div className="font-mono text-lg font-bold text-center py-2 bg-muted rounded">
                      {pin.pin}
                    </div>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <div>Session: {pin.session}</div>
                      <div>Term: {pin.term}</div>
                      <div>Usage: {usageCount} / {maxUsage}</div>
                      <div>Expires: {new Date(pin.expiryDate).toLocaleDateString()}</div>
                    </div>
                  </div>
                </Card>
              );
            })
          ) : (
            <div className="col-span-full text-center py-8 text-muted-foreground">
              No PINs found
            </div>
          )}
        </div>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md mx-4 sm:mx-auto max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Generate PINs</DialogTitle>
            <DialogDescription>
              Create new result checker PINs for students
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pb-2">
            {isSuperAdmin && (
              <div className="space-y-2">
                <Label htmlFor="school">School</Label>
                <Select value={selectedSchoolId} onValueChange={setSelectedSchoolId}>
                  <SelectTrigger data-testid="select-school">
                    <SelectValue placeholder="Select a school" />
                  </SelectTrigger>
                  <SelectContent>
                    {schools?.filter(s => s.isActive).map((school) => (
                      <SelectItem key={school.id} value={school.id}>
                        {school.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  max="1000"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  data-testid="input-quantity"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxUsageCount">Max Uses</Label>
                <Input
                  id="maxUsageCount"
                  type="number"
                  min="1"
                  max="100"
                  value={maxUsageCount}
                  onChange={(e) => setMaxUsageCount(e.target.value)}
                  data-testid="input-max-usage"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="session">Session</Label>
                <Input
                  id="session"
                  placeholder="2023/2024"
                  value={session}
                  onChange={(e) => setSession(e.target.value)}
                  data-testid="input-session"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="term">Term</Label>
                <Input
                  id="term"
                  placeholder="First, Second..."
                  value={term}
                  onChange={(e) => setTerm(e.target.value)}
                  data-testid="input-term"
                />
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              Max Uses: How many times each PIN can be used (default: 1 for single-use)
            </p>

            <Button
              onClick={handleGenerate}
              disabled={generateMutation.isPending || (isSuperAdmin && !selectedSchoolId)}
              className="w-full"
              data-testid="button-submit"
            >
              {generateMutation.isPending ? "Generating..." : "Generate PINs"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
