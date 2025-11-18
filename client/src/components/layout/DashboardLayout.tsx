import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { ReactNode } from "react";

interface User {
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

interface DashboardLayoutProps {
  children: ReactNode;
  user: User | null;
  onLogout?: () => void;
}

export function DashboardLayout({ children, user, onLogout }: DashboardLayoutProps) {
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar user={user} />
        <div className="flex flex-col flex-1 overflow-hidden">
          <header className="flex items-center justify-between gap-4 p-4 border-b bg-background">
            <div className="flex items-center gap-3">
              <SidebarTrigger data-testid="button-sidebar-toggle" />
              <div>
                <h1 className="text-xl font-semibold">School Result Management</h1>
                <p className="text-sm text-muted-foreground">Manage your school efficiently</p>
              </div>
            </div>
            {onLogout && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onLogout}
                data-testid="button-logout"
                className="gap-2"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </Button>
            )}
          </header>
          <main className="flex-1 overflow-auto bg-background">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
