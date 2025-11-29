import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Copy, CheckCircle, XCircle, Key, Search, Download, FileText, FileSpreadsheet, CalendarIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { PIN, School } from "@shared/schema";

export default function Pins() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [quantity, setQuantity] = useState("10");
  const [session, setSession] = useState("2024/2025");
  const [term, setTerm] = useState("First");
  const [selectedSchoolId, setSelectedSchoolId] = useState("");
  const [maxUsageCount, setMaxUsageCount] = useState("1");
  const [expiryDate, setExpiryDate] = useState<Date | undefined>(undefined);
  const [neverExpires, setNeverExpires] = useState(false);

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const sessionOptions = useMemo(() => {
    const options = [];
    for (let year = 2024; year <= 2098; year++) {
      options.push(`${year}/${year + 1}`);
    }
    return options;
  }, []);

  const termOptions = ["First", "Second", "Third"];
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
      setExpiryDate(undefined);
      setNeverExpires(false);
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

    if (!neverExpires && !expiryDate) {
      toast({ variant: "destructive", title: "Error", description: "Please select an expiry date or check 'Never Expires'" });
      return;
    }

    const calculatedExpiryDate = neverExpires 
      ? new Date("2099-12-31") 
      : expiryDate;

    await generateMutation.mutateAsync({
      schoolId,
      quantity: parseInt(quantity),
      session,
      term,
      maxUsageCount: parseInt(maxUsageCount),
      expiryDate: calculatedExpiryDate?.toISOString(),
      generatedBy: user.id,
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied!", description: "PIN copied to clipboard" });
  };

  const downloadCSV = (pinsToDownload: PIN[], filename: string = "pins") => {
    const headers = ["PIN", "Session", "Term", "Status", "Usage", "Max Usage", "Expiry Date"];
    const rows = pinsToDownload.map((pin) => {
      const usageCount = (pin as any).usageCount || 0;
      const maxUsage = (pin as any).maxUsageCount || 1;
      const isExhausted = usageCount >= maxUsage;
      const expiryDisplay = new Date(pin.expiryDate).getFullYear() >= 2099 
        ? "Never" 
        : new Date(pin.expiryDate).toLocaleDateString();
      return [
        pin.pin,
        pin.session,
        pin.term,
        isExhausted ? "Exhausted" : "Available",
        usageCount.toString(),
        maxUsage.toString(),
        expiryDisplay,
      ];
    });

    const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: "Downloaded", description: `${pinsToDownload.length} PIN(s) exported as CSV` });
  };

  const downloadPDF = (pinsToDownload: PIN[], filename: string = "pins") => {
    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.text("Result Checker PINs", 14, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 28);
    doc.text(`Total PINs: ${pinsToDownload.length}`, 14, 34);

    const tableData = pinsToDownload.map((pin) => {
      const usageCount = (pin as any).usageCount || 0;
      const maxUsage = (pin as any).maxUsageCount || 1;
      const isExhausted = usageCount >= maxUsage;
      const expiryDisplay = new Date(pin.expiryDate).getFullYear() >= 2099 
        ? "Never" 
        : new Date(pin.expiryDate).toLocaleDateString();
      return [
        pin.pin,
        pin.session,
        pin.term,
        isExhausted ? "Exhausted" : "Available",
        `${usageCount}/${maxUsage}`,
        expiryDisplay,
      ];
    });

    autoTable(doc, {
      head: [["PIN", "Session", "Term", "Status", "Usage", "Expiry"]],
      body: tableData,
      startY: 40,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [59, 130, 246] },
    });

    doc.save(`${filename}.pdf`);
    toast({ title: "Downloaded", description: `${pinsToDownload.length} PIN(s) exported as PDF` });
  };

  const downloadSinglePIN = (pin: PIN, format: "pdf" | "csv") => {
    if (format === "csv") {
      downloadCSV([pin], `pin-${pin.pin}`);
    } else {
      downloadPDF([pin], `pin-${pin.pin}`);
    }
  };

  const downloadAllPINs = (format: "pdf" | "csv") => {
    const pinsToDownload = filteredPins || pins || [];
    if (pinsToDownload.length === 0) {
      toast({ variant: "destructive", title: "No PINs", description: "No PINs available to download" });
      return;
    }
    if (format === "csv") {
      downloadCSV(pinsToDownload, `all-pins-${new Date().toISOString().split("T")[0]}`);
    } else {
      downloadPDF(pinsToDownload, `all-pins-${new Date().toISOString().split("T")[0]}`);
    }
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
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full sm:w-auto" data-testid="button-download-pins">
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Export Format</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => downloadAllPINs("pdf")} data-testid="button-download-pdf">
                <FileText className="w-4 h-4 mr-2" />
                Download as PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => downloadAllPINs("csv")} data-testid="button-download-csv">
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                Download as CSV
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          {isSuperAdmin && (
            <Button onClick={() => setDialogOpen(true)} className="w-full sm:w-auto" data-testid="button-generate-pins">
              <Plus className="w-4 h-4 mr-2" />
              Generate PINs
            </Button>
          )}
        </div>
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
                      <div className="flex items-center gap-1">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" data-testid={`button-download-single-${pin.id}`}>
                              <Download className="w-3 h-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => downloadSinglePIN(pin, "pdf")}>
                              <FileText className="w-3 h-3 mr-2" /> PDF
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => downloadSinglePIN(pin, "csv")}>
                              <FileSpreadsheet className="w-3 h-3 mr-2" /> CSV
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(pin.pin)}
                          data-testid={`button-copy-${pin.id}`}
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                    <div className="font-mono text-lg font-bold text-center py-2 bg-muted rounded">
                      {pin.pin}
                    </div>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <div>Session: {pin.session}</div>
                      <div>Term: {pin.term}</div>
                      <div>Usage: {usageCount} / {maxUsage}</div>
                      <div>Expires: {
                        new Date(pin.expiryDate).getFullYear() >= 2099 
                          ? "Never" 
                          : new Date(pin.expiryDate).toLocaleDateString()
                      }</div>
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
                <Select value={session} onValueChange={setSession}>
                  <SelectTrigger data-testid="select-session">
                    <SelectValue placeholder="Select session" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {sessionOptions.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="term">Term</Label>
                <Select value={term} onValueChange={setTerm}>
                  <SelectTrigger data-testid="select-term">
                    <SelectValue placeholder="Select term" />
                  </SelectTrigger>
                  <SelectContent>
                    {termOptions.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Expiry Date</Label>
              <div className="flex flex-col gap-3">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !expiryDate && !neverExpires && "text-muted-foreground"
                      )}
                      disabled={neverExpires}
                      data-testid="button-expiry-date"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {neverExpires 
                        ? "Never Expires" 
                        : expiryDate 
                          ? format(expiryDate, "PPP") 
                          : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={expiryDate}
                      onSelect={setExpiryDate}
                      initialFocus
                      disabled={(date) => date < new Date()}
                    />
                  </PopoverContent>
                </Popover>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="neverExpires" 
                    checked={neverExpires} 
                    onCheckedChange={(checked) => {
                      setNeverExpires(checked as boolean);
                      if (checked) setExpiryDate(undefined);
                    }}
                    data-testid="checkbox-never-expires"
                  />
                  <label 
                    htmlFor="neverExpires" 
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Never Expires (Forever)
                  </label>
                </div>
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
