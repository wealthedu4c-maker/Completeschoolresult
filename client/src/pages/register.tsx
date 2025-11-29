import { useState } from "react";
import { useLocation, Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Loader2, Building2, User } from "lucide-react";

export default function Register() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);

  const [formData, setFormData] = useState({
    schoolName: "",
    schoolCode: "",
    schoolEmail: "",
    schoolPhone: "",
    adminFirstName: "",
    adminLastName: "",
    adminEmail: "",
    adminPassword: "",
    confirmPassword: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const validateStep1 = () => {
    if (!formData.schoolName || !formData.schoolCode || !formData.schoolEmail) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please fill in all required school fields",
      });
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.adminFirstName || !formData.adminLastName || !formData.adminEmail || !formData.adminPassword) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please fill in all required fields",
      });
      return;
    }

    if (formData.adminPassword !== formData.confirmPassword) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Passwords do not match",
      });
      return;
    }

    if (formData.adminPassword.length < 6) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Password must be at least 6 characters",
      });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/public/register-school", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          schoolName: formData.schoolName,
          schoolCode: formData.schoolCode.toUpperCase(),
          schoolEmail: formData.schoolEmail,
          schoolPhone: formData.schoolPhone,
          adminFirstName: formData.adminFirstName,
          adminLastName: formData.adminLastName,
          adminEmail: formData.adminEmail,
          adminPassword: formData.adminPassword,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Registration failed");
      }

      toast({
        title: "Registration Successful!",
        description: "Your account is pending approval. You will be notified once approved.",
      });

      setLocation("/login");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Registration Failed",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-chart-2/10 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-6">
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-2" data-testid="link-back-home">
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Button>
          </Link>
        </div>

        <Card>
          <CardHeader className="space-y-1 text-center">
            <div className="flex items-center justify-center mb-4">
              <div className="flex items-center justify-center w-14 h-14 rounded-lg bg-primary text-primary-foreground font-bold text-2xl">
                SR
              </div>
            </div>
            <CardTitle className="text-2xl">Register Your School</CardTitle>
            <CardDescription>
              {step === 1 
                ? "Enter your school details to get started" 
                : "Create your admin account"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit}>
              {step === 1 ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                    <Building2 className="w-4 h-4" />
                    <span>Step 1: School Information</span>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="schoolName">School Name *</Label>
                    <Input
                      id="schoolName"
                      name="schoolName"
                      placeholder="Demo High School"
                      value={formData.schoolName}
                      onChange={handleChange}
                      required
                      data-testid="input-school-name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="schoolCode">School Code *</Label>
                    <Input
                      id="schoolCode"
                      name="schoolCode"
                      placeholder="DHS001"
                      value={formData.schoolCode}
                      onChange={handleChange}
                      className="uppercase"
                      required
                      data-testid="input-school-code"
                    />
                    <p className="text-xs text-muted-foreground">
                      A unique code for your school (e.g., DHS001)
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="schoolEmail">School Email *</Label>
                    <Input
                      id="schoolEmail"
                      name="schoolEmail"
                      type="email"
                      placeholder="info@school.edu.ng"
                      value={formData.schoolEmail}
                      onChange={handleChange}
                      required
                      data-testid="input-school-email"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="schoolPhone">School Phone (Optional)</Label>
                    <Input
                      id="schoolPhone"
                      name="schoolPhone"
                      placeholder="+234 xxx xxx xxxx"
                      value={formData.schoolPhone}
                      onChange={handleChange}
                      data-testid="input-school-phone"
                    />
                  </div>

                  <Button
                    type="button"
                    className="w-full"
                    onClick={() => validateStep1() && setStep(2)}
                    data-testid="button-next"
                  >
                    Next Step
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                    <User className="w-4 h-4" />
                    <span>Step 2: Admin Account</span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="adminFirstName">First Name *</Label>
                      <Input
                        id="adminFirstName"
                        name="adminFirstName"
                        placeholder="John"
                        value={formData.adminFirstName}
                        onChange={handleChange}
                        required
                        data-testid="input-admin-first-name"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="adminLastName">Last Name *</Label>
                      <Input
                        id="adminLastName"
                        name="adminLastName"
                        placeholder="Doe"
                        value={formData.adminLastName}
                        onChange={handleChange}
                        required
                        data-testid="input-admin-last-name"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="adminEmail">Admin Email *</Label>
                    <Input
                      id="adminEmail"
                      name="adminEmail"
                      type="email"
                      placeholder="admin@school.edu.ng"
                      value={formData.adminEmail}
                      onChange={handleChange}
                      required
                      data-testid="input-admin-email"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="adminPassword">Password *</Label>
                    <Input
                      id="adminPassword"
                      name="adminPassword"
                      type="password"
                      placeholder="Min 6 characters"
                      value={formData.adminPassword}
                      onChange={handleChange}
                      required
                      data-testid="input-admin-password"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password *</Label>
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      placeholder="Confirm password"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      required
                      data-testid="input-confirm-password"
                    />
                  </div>

                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1"
                      onClick={() => setStep(1)}
                      data-testid="button-back"
                    >
                      Back
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1"
                      disabled={loading}
                      data-testid="button-submit"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Registering...
                        </>
                      ) : (
                        "Register School"
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </form>

            <div className="mt-6 pt-6 border-t text-center">
              <p className="text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link href="/login">
                  <span className="text-primary hover:underline cursor-pointer" data-testid="link-login">
                    Login here
                  </span>
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
