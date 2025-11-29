import { useEffect } from "react";
import { useLocation } from "wouter";

export default function Analytics() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    setLocation("/dashboard");
  }, [setLocation]);

  return (
    <div className="p-6 flex items-center justify-center">
      <p className="text-muted-foreground">Redirecting to dashboard...</p>
    </div>
  );
}
