import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { ArrowLeft, Loader2, Download, GraduationCap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface SubjectScore {
  subject: string;
  ca1: number;
  ca2: number;
  exam: number;
  total: number;
  grade: string;
  remark: string;
}

interface ResultData {
  student: {
    firstName: string;
    lastName: string;
    admissionNumber: string;
    class: string;
  };
  school: {
    name: string;
    logo?: string;
    motto?: string;
  };
  session: string;
  term: string;
  subjects: SubjectScore[];
  totalScore: number;
  averageScore: number;
  position?: number;
  totalStudents?: number;
  teacherComment?: string;
  principalComment?: string;
  attendance?: {
    present: number;
    absent: number;
    total: number;
  };
}

export default function CheckResult() {
  const { toast } = useToast();
  const [pin, setPin] = useState("");
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [session, setSession] = useState("");
  const [term, setTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ResultData | null>(null);

  const currentYear = new Date().getFullYear();
  const sessions = [
    `${currentYear - 2}/${currentYear - 1}`,
    `${currentYear - 1}/${currentYear}`,
    `${currentYear}/${currentYear + 1}`,
  ];

  const handleCheckResult = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!session || !term) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select academic year and term",
      });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/public/check-result", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          pin: pin.toUpperCase(), 
          admissionNumber: registrationNumber.toUpperCase(),
          session,
          term,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to check result");
      }

      const data = await response.json();
      setResult(data);

      toast({
        title: "Result Retrieved",
        description: "Your result has been found successfully!",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Invalid PIN or registration number",
      });
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case "A": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "B": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "C": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "D": return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
      case "E": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "F": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const handleReset = () => {
    setResult(null);
    setPin("");
    setRegistrationNumber("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-chart-2/10 p-4">
      <div className="max-w-4xl mx-auto py-8">
        <div className="mb-6">
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-2" data-testid="link-back-home">
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Button>
          </Link>
        </div>

        {!result ? (
          <Card className="max-w-md mx-auto">
            <CardHeader className="space-y-1">
              <div className="flex items-center justify-center mb-4">
                <div className="flex items-center justify-center w-14 h-14 rounded-lg bg-primary text-primary-foreground font-bold text-2xl">
                  <GraduationCap className="w-8 h-8" />
                </div>
              </div>
              <CardTitle className="text-2xl text-center">Check Your Result</CardTitle>
              <CardDescription className="text-center">
                Enter your details to view your academic result
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCheckResult} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="registrationNumber">Registration Number</Label>
                  <Input
                    id="registrationNumber"
                    type="text"
                    placeholder="STU2024001"
                    value={registrationNumber}
                    onChange={(e) => setRegistrationNumber(e.target.value.toUpperCase())}
                    required
                    data-testid="input-registration-number"
                    className="uppercase"
                  />
                  <p className="text-xs text-muted-foreground">
                    Your student registration/admission number
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Academic Year</Label>
                    <Select value={session} onValueChange={setSession}>
                      <SelectTrigger data-testid="select-session">
                        <SelectValue placeholder="Select year" />
                      </SelectTrigger>
                      <SelectContent>
                        {sessions.map((s) => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Term</Label>
                    <Select value={term} onValueChange={setTerm}>
                      <SelectTrigger data-testid="select-term">
                        <SelectValue placeholder="Select term" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="First">First Term</SelectItem>
                        <SelectItem value="Second">Second Term</SelectItem>
                        <SelectItem value="Third">Third Term</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pin">Result PIN</Label>
                  <Input
                    id="pin"
                    type="text"
                    placeholder="XXXX-XXXX-XXXX"
                    value={pin}
                    onChange={(e) => setPin(e.target.value.toUpperCase())}
                    required
                    data-testid="input-pin"
                    className="uppercase font-mono"
                  />
                  <p className="text-xs text-muted-foreground">
                    Contact your school admin to get a result PIN
                  </p>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={loading || !session || !term}
                  data-testid="button-submit"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Checking...
                    </>
                  ) : (
                    "Check Result"
                  )}
                </Button>
              </form>

              <div className="mt-6 pt-6 border-t text-center">
                <p className="text-sm text-muted-foreground">
                  Are you a school administrator?{" "}
                  <Link href="/login">
                    <span className="text-primary hover:underline cursor-pointer" data-testid="link-login">
                      Login here
                    </span>
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <Card>
              <CardHeader className="text-center space-y-4 pb-6">
                <div className="flex flex-col items-center gap-4">
                  {result.school.logo ? (
                    <Avatar className="h-24 w-24">
                      <AvatarImage src={result.school.logo} alt={result.school.name} />
                      <AvatarFallback className="text-2xl font-bold bg-primary text-primary-foreground">
                        {result.school.name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  ) : (
                    <div className="flex items-center justify-center w-24 h-24 rounded-full bg-primary text-primary-foreground font-bold text-2xl">
                      {result.school.name.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <h2 className="text-2xl font-bold" data-testid="text-school-name">{result.school.name}</h2>
                    {result.school.motto && (
                      <p className="text-sm text-muted-foreground italic mt-1">"{result.school.motto}"</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <Badge variant="outline" className="text-base px-4 py-1">
                    {result.session}
                  </Badge>
                  <Badge className="text-base px-4 py-1">
                    {result.term} Term
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Student Info */}
                <div className="grid grid-cols-2 gap-4 p-4 rounded-lg bg-muted/50 border">
                  <div>
                    <p className="text-sm text-muted-foreground">Student Name</p>
                    <p className="font-semibold" data-testid="text-student-name">
                      {result.student.firstName} {result.student.lastName}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Registration Number</p>
                    <p className="font-semibold font-mono" data-testid="text-registration-number">
                      {result.student.admissionNumber}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Class</p>
                    <p className="font-semibold">{result.student.class}</p>
                  </div>
                  {result.position && result.totalStudents && (
                    <div>
                      <p className="text-sm text-muted-foreground">Position</p>
                      <p className="font-semibold">
                        {result.position} of {result.totalStudents}
                      </p>
                    </div>
                  )}
                </div>

                {/* Results Table */}
                <div className="rounded-lg border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Subject</TableHead>
                        <TableHead className="text-center">CA1 (10)</TableHead>
                        <TableHead className="text-center">CA2 (10)</TableHead>
                        <TableHead className="text-center">Exam (80)</TableHead>
                        <TableHead className="text-center">Total</TableHead>
                        <TableHead className="text-center">Grade</TableHead>
                        <TableHead>Remark</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {result.subjects.map((subject, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="font-medium">{subject.subject}</TableCell>
                          <TableCell className="text-center">{subject.ca1}</TableCell>
                          <TableCell className="text-center">{subject.ca2}</TableCell>
                          <TableCell className="text-center">{subject.exam}</TableCell>
                          <TableCell className="text-center font-bold">{subject.total}</TableCell>
                          <TableCell className="text-center">
                            <Badge className={getGradeColor(subject.grade)}>{subject.grade}</Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">{subject.remark}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Summary */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <Card className="p-4">
                    <p className="text-sm text-muted-foreground mb-1">Total Score</p>
                    <p className="text-2xl font-bold" data-testid="text-total-score">{result.totalScore}</p>
                  </Card>
                  <Card className="p-4">
                    <p className="text-sm text-muted-foreground mb-1">Average</p>
                    <p className="text-2xl font-bold" data-testid="text-average">{result.averageScore}%</p>
                  </Card>
                  {result.attendance && (
                    <Card className="p-4">
                      <p className="text-sm text-muted-foreground mb-1">Attendance</p>
                      <p className="text-2xl font-bold">
                        {result.attendance.present}/{result.attendance.total}
                      </p>
                    </Card>
                  )}
                </div>

                {/* Comments */}
                {(result.teacherComment || result.principalComment) && (
                  <div className="space-y-4">
                    {result.teacherComment && (
                      <div className="p-4 rounded-lg bg-muted/50 border">
                        <p className="text-sm font-semibold mb-2">Teacher's Comment</p>
                        <p className="text-sm">{result.teacherComment}</p>
                      </div>
                    )}
                    {result.principalComment && (
                      <div className="p-4 rounded-lg bg-muted/50 border">
                        <p className="text-sm font-semibold mb-2">Principal's Comment</p>
                        <p className="text-sm">{result.principalComment}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-4">
                  <Button 
                    variant="outline" 
                    className="flex-1 gap-2"
                    onClick={handleReset}
                    data-testid="button-check-another"
                  >
                    Check Another Result
                  </Button>
                  <Button 
                    className="flex-1 gap-2"
                    onClick={() => window.print()}
                    data-testid="button-download"
                  >
                    <Download className="w-4 h-4" />
                    Download PDF
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
