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
import RequestDetailPage from "@/pages/requests-detail";
import WorkCentersPage from "@/pages/work-centers";
import WorkCenterDetailPage from "@/pages/work-centers-detail";
import CategoriesPage from "@/pages/categories";
import CategoryDetailPage from "@/pages/categories-detail";
import TeamsPage from "@/pages/teams";
import TeamDetailPage from "@/pages/teams-detail";
import UsersPage from "@/pages/users";
import UserDetailPage from "@/pages/users-detail";
import ProfilePage from "@/pages/profile";
import MaintenanceCalendarPage from "@/pages/maintenance-calendar";
import { ReactNode } from "react";


function PrivateRoute({ component: Component }: { component: () => JSX.Element }): JSX.Element | null {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!user) {
    setLocation("/auth");
    return <></>;
  }


  return <Component />;
}


function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <Route path="/reset-password/:token" component={ResetPasswordPage} />
      <Route path="/profile">
        <PrivateRoute component={ProfilePage} />
      </Route>
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
      <Route path="/requests/:id">
        <PrivateRoute component={RequestDetailPage} />
      </Route>
      <Route path="/work-centers">
        <PrivateRoute component={WorkCentersPage} />
      </Route>
      <Route path="/work-centers/:id">
        <PrivateRoute component={WorkCenterDetailPage} />
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
      <Route path="/users">
        <PrivateRoute component={UsersPage} />
      </Route>
      <Route path="/users/:id">
        <PrivateRoute component={UserDetailPage} />
      </Route>
      <Route path="/calendar">
        <PrivateRoute component={MaintenanceCalendarPage} />
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
