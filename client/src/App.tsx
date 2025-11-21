import { useState, useEffect } from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Navigation } from "@/components/navigation";
import { getCurrentUser, logout } from "@/lib/auth";
import Dashboard from "@/pages/dashboard";
import LoginPage from "@/pages/login";
import RegisterPage from "@/pages/register";
import SeriesManagement from "@/pages/series-management";
import ProfilePage from "@/pages/profile";
import NotFound from "@/pages/not-found";
import type { User } from "@shared/schema";

function Router({
  user,
  onAuthChange,
}: {
  user: User | null;
  onAuthChange: () => void;
}) {
  const [, setLocation] = useLocation();

  return (
    <Switch>
      <Route path="/">
        <Dashboard isAdmin={user?.role === "admin"} />
      </Route>
      <Route path="/login">
        {user ? (
          <Dashboard isAdmin={user.role === "admin"} />
        ) : (
          <LoginPage onLoginSuccess={onAuthChange} />
        )}
      </Route>
      <Route path="/register">
        {user ? (
          <Dashboard isAdmin={user.role === "admin"} />
        ) : (
          <RegisterPage onRegisterSuccess={onAuthChange} />
        )}
      </Route>
      <Route path="/series">
        {user?.role === "admin" ? (
          <SeriesManagement />
        ) : (
          <Dashboard isAdmin={false} />
        )}
      </Route>
      <Route path="/profile">
        {user?.role === "admin" ? (
          <ProfilePage />
        ) : (
          <Dashboard isAdmin={false} />
        )}
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUser = async () => {
    setIsLoading(true);
    const currentUser = await getCurrentUser();
    setUser(currentUser);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const [, setLocation] = useLocation();

  const handleLogout = async () => {
    await logout();
    setUser(null);
    queryClient.clear();
    setLocation("/");
  };

  const handleNavigate = (path: string) => {
    setLocation(path);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse space-y-4">
          <div className="h-4 w-48 bg-muted rounded"></div>
          <div className="h-4 w-64 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen bg-background text-foreground">
          <Navigation user={user} onLogout={handleLogout} onNavigate={handleNavigate} />
          <Router user={user} onAuthChange={fetchUser} />
        </div>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
