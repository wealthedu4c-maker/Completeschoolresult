import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useEffect, useState } from "react";

// Public Pages
import Landing from "@/pages/landing";
import Login from "@/pages/login";
import CheckResult from "@/pages/check-result";
import NotFound from "@/pages/not-found";

// Dashboard Pages
import Dashboard from "@/pages/dashboard";
import Schools from "@/pages/schools";
import Students from "@/pages/students";
import Results from "@/pages/results";
import Pins from "@/pages/pins";
import Teachers from "@/pages/teachers";
import Classes from "@/pages/classes";
import Subjects from "@/pages/subjects";
import PinRequests from "@/pages/pin-requests";
import Users from "@/pages/users";
import Analytics from "@/pages/analytics";

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  schoolId?: string;
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const [, setLocation] = useLocation();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const token = localStorage.getItem("token");
    
    if (!storedUser || !token) {
      setLocation("/login");
      return;
    }
    
    try {
      setUser(JSON.parse(storedUser));
    } catch {
      setLocation("/login");
    }
  }, [setLocation]);

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    setLocation("/login");
  };

  if (!user) {
    return null;
  }

  return (
    <DashboardLayout user={user} onLogout={handleLogout}>
      {children}
    </DashboardLayout>
  );
}

function Router() {
  return (
    <Switch>
      {/* Public Routes */}
      <Route path="/" component={Landing} />
      <Route path="/login" component={Login} />
      <Route path="/check-result" component={CheckResult} />

      {/* Protected Dashboard Routes */}
      <Route path="/dashboard">
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      </Route>

      <Route path="/schools">
        <ProtectedRoute>
          <Schools />
        </ProtectedRoute>
      </Route>

      <Route path="/students">
        <ProtectedRoute>
          <Students />
        </ProtectedRoute>
      </Route>

      <Route path="/results">
        <ProtectedRoute>
          <Results />
        </ProtectedRoute>
      </Route>

      <Route path="/pins">
        <ProtectedRoute>
          <Pins />
        </ProtectedRoute>
      </Route>

      <Route path="/teachers">
        <ProtectedRoute>
          <Teachers />
        </ProtectedRoute>
      </Route>

      <Route path="/classes">
        <ProtectedRoute>
          <Classes />
        </ProtectedRoute>
      </Route>

      <Route path="/subjects">
        <ProtectedRoute>
          <Subjects />
        </ProtectedRoute>
      </Route>

      <Route path="/pin-requests">
        <ProtectedRoute>
          <PinRequests />
        </ProtectedRoute>
      </Route>

      <Route path="/users">
        <ProtectedRoute>
          <Users />
        </ProtectedRoute>
      </Route>

      <Route path="/analytics">
        <ProtectedRoute>
          <Analytics />
        </ProtectedRoute>
      </Route>

      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
