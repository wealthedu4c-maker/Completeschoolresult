import { 
  Home, 
  School, 
  Users, 
  GraduationCap, 
  FileText, 
  Key, 
  BarChart3, 
  Settings,
  BookOpen,
  ClipboardList,
  FileStack,
  Settings2
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Link, useLocation } from "wouter";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface User {
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

interface AppSidebarProps {
  user: User | null;
}

export function AppSidebar({ user }: AppSidebarProps) {
  const [location] = useLocation();

  const superAdminItems = [
    { title: "Dashboard", url: "/dashboard", icon: Home },
    { title: "Schools", url: "/schools", icon: School },
    { title: "Users", url: "/users", icon: Users },
    { title: "PINs", url: "/pins", icon: Key },
    { title: "PIN Requests", url: "/pin-requests", icon: ClipboardList },
    { title: "Analytics", url: "/analytics", icon: BarChart3 },
  ];

  const schoolAdminItems = [
    { title: "Dashboard", url: "/dashboard", icon: Home },
    { title: "Students", url: "/students", icon: GraduationCap },
    { title: "Teachers", url: "/teachers", icon: Users },
    { title: "Classes", url: "/classes", icon: BookOpen },
    { title: "Subjects", url: "/subjects", icon: FileStack },
    { title: "Score Metrics", url: "/score-metrics", icon: Settings2 },
    { title: "Results", url: "/results", icon: FileText },
    { title: "PINs", url: "/pins", icon: Key },
    { title: "PIN Requests", url: "/pin-requests", icon: ClipboardList },
    { title: "Analytics", url: "/analytics", icon: BarChart3 },
  ];

  const teacherItems = [
    { title: "Dashboard", url: "/dashboard", icon: Home },
    { title: "My Students", url: "/students", icon: GraduationCap },
    { title: "Results", url: "/results", icon: FileText },
  ];

  const menuItems = 
    user?.role === "super_admin" ? superAdminItems :
    user?.role === "school_admin" ? schoolAdminItems :
    teacherItems;

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "super_admin": return "bg-primary text-primary-foreground";
      case "school_admin": return "bg-chart-2 text-white";
      case "teacher": return "bg-chart-4 text-white";
      default: return "";
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

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary text-primary-foreground font-bold text-lg">
            SR
          </div>
          <div className="flex-1">
            <h2 className="text-base font-semibold">SmartResult</h2>
            <p className="text-xs text-muted-foreground">Result Checker</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                const isActive = location === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild data-active={isActive} data-testid={`link-${item.title.toLowerCase().replace(/\s+/g, '-')}`}>
                      <Link href={item.url}>
                        <item.icon className="w-4 h-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {user && (
        <SidebarFooter className="p-4">
          <Link href="/profile">
            <div 
              className="flex items-start gap-3 p-3 rounded-lg bg-sidebar-accent hover-elevate cursor-pointer"
              data-testid="link-profile"
            >
              <Avatar className="w-10 h-10">
                <AvatarFallback className="bg-primary text-primary-foreground text-sm font-semibold">
                  {user.firstName[0]}{user.lastName[0]}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge className={`text-xs ${getRoleBadgeColor(user.role)}`} data-testid="badge-user-role">
                    {getRoleLabel(user.role)}
                  </Badge>
                  <Settings className="w-3 h-3 text-muted-foreground" />
                </div>
              </div>
            </div>
          </Link>
        </SidebarFooter>
      )}
    </Sidebar>
  );
}
