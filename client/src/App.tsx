import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import ResetPasswordPage from "@/pages/reset-password-page";
import Dashboard from "@/pages/dashboard";
import EquipmentPage from "@/pages/equipment";
import EquipmentDetailPage from "@/pages/equipment-detail";
import RequestsPage from "@/pages/requests";
import CategoriesPage from "@/pages/categories";
import CategoryDetailPage from "@/pages/categories-detail";
import TeamsPage from "@/pages/teams";
import TeamDetailPage from "@/pages/teams-detail";
import { ReactNode } from "react";

function PrivateRoute({ component: Component }: { component: () => JSX.Element }) {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!user) {
    setLocation("/auth");
    return null;
  }

  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <Route path="/reset-password/:token" component={ResetPasswordPage} />
      <Route path="/">
        <PrivateRoute component={Dashboard} />
      </Route>
      <Route path="/equipment">
        <PrivateRoute component={EquipmentPage} />
      </Route>
      <Route path="/equipment/:id">
        <PrivateRoute component={EquipmentDetailPage} />
      </Route>
      <Route path="/requests">
        <PrivateRoute component={RequestsPage} />
      </Route>
      {/* Placeholder pages for navigation */}
      <Route path="/categories">
        <PrivateRoute component={CategoriesPage} />
      </Route>
      <Route path="/categories/:id">
        <PrivateRoute component={CategoryDetailPage} />
      </Route>
      <Route path="/teams">
        <PrivateRoute component={TeamsPage} />
      </Route>
      <Route path="/teams/:id">
        <PrivateRoute component={TeamDetailPage} />
      </Route>
      <Route path="/settings">
        <PrivateRoute component={() => (
          <div className="p-8"><h1 className="text-2xl font-bold">Settings - Coming Soon</h1></div>
        )} />
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Router />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
