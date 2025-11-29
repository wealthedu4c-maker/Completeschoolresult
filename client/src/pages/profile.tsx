import { useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Upload, X, Save, User, Building2, Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Separator } from "@/components/ui/separator";
import type { School } from "@shared/schema";

export default function Profile() {
  const { toast } = useToast();
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [loading, setLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [logoLoading, setLogoLoading] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const { data: school } = useQuery<School>({
    queryKey: ["/api/schools", user.schoolId],
    enabled: !!user.schoolId && user.role === "school_admin",
  });

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!passwordData.currentPassword || !passwordData.newPassword) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please fill in all password fields",
      });
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "New passwords do not match",
      });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Password must be at least 6 characters",
      });
      return;
    }

    setPasswordLoading(true);

    try {
      await apiRequest("PATCH", `/api/users/${user.id}/password`, {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });

      toast({
        title: "Password Updated",
        description: "Your password has been changed successfully",
      });

      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to update password",
      });
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({
        variant: "destructive",
        title: "Invalid file",
        description: "Please upload an image file",
      });
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: "File too large",
        description: "Please upload an image smaller than 2MB",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUrl = event.target?.result as string;
      setLogoPreview(dataUrl);
      
      // Upload immediately
      setLogoLoading(true);
      try {
        await apiRequest("PATCH", `/api/schools/${user.schoolId}`, {
          logo: dataUrl,
        });

        queryClient.invalidateQueries({ queryKey: ["/api/schools", user.schoolId] });

        toast({
          title: "Logo Updated",
          description: "Your school logo has been updated successfully",
        });
      } catch (error: any) {
        toast({
          variant: "destructive",
          title: "Error",
          description: error.message || "Failed to update logo",
        });
        setLogoPreview(null);
      } finally {
        setLogoLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const removeLogo = async () => {
    setLogoLoading(true);
    try {
      await apiRequest("PATCH", `/api/schools/${user.schoolId}`, {
        logo: null,
      });

      queryClient.invalidateQueries({ queryKey: ["/api/schools", user.schoolId] });
      setLogoPreview(null);

      toast({
        title: "Logo Removed",
        description: "Your school logo has been removed",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to remove logo",
      });
    } finally {
      setLogoLoading(false);
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "super_admin": return "Super Admin";
      case "school_admin": return "School Admin";
      case "teacher": return "Teacher";
      default: return role;
    }
  };

  const currentLogo = logoPreview || school?.logo;

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6 max-w-4xl">
      <div>
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Profile Settings</h2>
        <p className="text-sm md:text-base text-muted-foreground">
          Manage your account settings and preferences
        </p>
      </div>

      <div className="grid gap-4 md:gap-6">
        {/* User Information Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base md:text-lg">
              <User className="w-4 h-4 md:w-5 md:h-5" />
              Account Information
            </CardTitle>
            <CardDescription className="text-xs md:text-sm">
              Your personal account details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <Avatar className="w-16 h-16 md:w-20 md:h-20">
                <AvatarFallback className="bg-primary text-primary-foreground text-xl md:text-2xl font-semibold">
                  {user.firstName?.[0]}{user.lastName?.[0]}
                </AvatarFallback>
              </Avatar>
              <div className="text-center sm:text-left">
                <h3 className="text-base md:text-lg font-semibold" data-testid="text-user-name">
                  {user.firstName} {user.lastName}
                </h3>
                <p className="text-xs md:text-sm text-muted-foreground break-all" data-testid="text-user-email">
                  {user.email}
                </p>
                <Badge className="mt-1" data-testid="badge-user-role">
                  {getRoleLabel(user.role)}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* School Logo Card - Only for School Admin */}
        {user.role === "school_admin" && user.schoolId && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                <Building2 className="w-4 h-4 md:w-5 md:h-5" />
                School Logo
              </CardTitle>
              <CardDescription className="text-xs md:text-sm">
                Upload your school logo to display on result sheets
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
                <div className="relative flex-shrink-0">
                  {currentLogo ? (
                    <div className="relative">
                      <Avatar className="w-20 h-20 md:w-24 md:h-24">
                        <AvatarImage src={currentLogo} alt="School logo" />
                        <AvatarFallback className="text-xl md:text-2xl font-bold bg-primary text-primary-foreground">
                          {school?.name?.slice(0, 2).toUpperCase() || "SC"}
                        </AvatarFallback>
                      </Avatar>
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute -top-2 -right-2 h-6 w-6"
                        onClick={removeLogo}
                        disabled={logoLoading}
                        data-testid="button-remove-logo"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <div
                      className="w-20 h-20 md:w-24 md:h-24 rounded-full border-2 border-dashed border-muted-foreground/25 flex items-center justify-center cursor-pointer hover:border-primary/50 transition-colors"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {logoLoading ? (
                        <Loader2 className="w-6 h-6 md:w-8 md:h-8 animate-spin text-muted-foreground" />
                      ) : (
                        <Upload className="w-6 h-6 md:w-8 md:h-8 text-muted-foreground" />
                      )}
                    </div>
                  )}
                </div>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                  className="hidden"
                  data-testid="input-logo"
                />
                
                <div className="space-y-2 text-center sm:text-left">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={logoLoading}
                    className="w-full sm:w-auto"
                    data-testid="button-upload-logo"
                  >
                    {logoLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        {currentLogo ? "Change Logo" : "Upload Logo"}
                      </>
                    )}
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    Recommended: Square image, max 2MB (PNG or JPG)
                  </p>
                  {school?.name && (
                    <p className="text-sm font-medium">
                      School: {school.name}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Change Password Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base md:text-lg">
              <Lock className="w-4 h-4 md:w-5 md:h-5" />
              Change Password
            </CardTitle>
            <CardDescription className="text-xs md:text-sm">
              Update your account password
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
              <div className="space-y-2">
                <Label htmlFor="currentPassword" className="text-sm">Current Password</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  placeholder="Enter current password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                  data-testid="input-current-password"
                />
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="newPassword" className="text-sm">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  placeholder="Enter new password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                  data-testid="input-new-password"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm new password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  data-testid="input-confirm-password"
                />
              </div>

              <Button 
                type="submit" 
                disabled={passwordLoading}
                className="w-full sm:w-auto"
                data-testid="button-change-password"
              >
                {passwordLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Update Password
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
