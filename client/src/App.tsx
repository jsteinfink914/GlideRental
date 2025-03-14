import { Switch, Route, useLocation } from "wouter";
import { useEffect } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
// Authentication bypass is controlled in protected-route.tsx by setting DEVELOPMENT_MODE = true/false
import { ProtectedRoute } from "./lib/protected-route";
import { AuthProvider } from "./hooks/use-auth";
import SearchPage from "@/pages/search-page";
import FeedPage from "@/pages/feed-page";
import ToolsPage from "@/pages/tools-page";
import NearbyPage from "@/pages/nearby-page";
import MessagesPage from "@/pages/messages-page";
import PortalPage from "@/pages/portal-page";
import PaymentsPage from "@/pages/payments-page";
import AccountPage from "@/pages/account-page";
import OnboardingPage from "@/pages/onboarding-page";
import SavedPage from "@/pages/saved-page";
import LeasingPage from "@/pages/landlord/leasing-page";
import BuildingOverviewPage from "@/pages/landlord/building-overview";
import HomePage from "@/pages/home-page";
import ForYouPage from "@/pages/for-you-page";
import DocumentsPage from "@/pages/documents-page";
import ComparePage from "@/pages/compare-page";

// Redirect component for wouter
function RedirectTo({ to }: { to: string }) {
  const [, navigate] = useLocation();
  
  useEffect(() => {
    navigate(to);
  }, [navigate, to]);
  
  return null;
}

function Router() {
  return (
    <Switch>
      {/* Auth Route (public) */}
      <Route path="/auth" component={AuthPage} />
      
      {/* Onboarding */}
      <Route path="/onboarding" component={OnboardingPage} />
      
      {/* Protected Routes */}
      <ProtectedRoute path="/" component={PortalPage} />
      <Route path="/search" component={SearchPage} />  {/* Public search page */}
      <ProtectedRoute path="/messages" component={MessagesPage} />
      <ProtectedRoute path="/portal" component={PortalPage} />
      <ProtectedRoute path="/payments" component={PaymentsPage} />
      <ProtectedRoute path="/account" component={AccountPage} />
      <ProtectedRoute path="/documents" component={DocumentsPage} />
      
      {/* Landlord Routes */}
      <ProtectedRoute path="/landlord/leasing" component={LeasingPage} />
      <ProtectedRoute path="/landlord/buildings" component={BuildingOverviewPage} />
      
      {/* Search Section Pages */}
      <ProtectedRoute path="/for-you" component={ForYouPage} />
      <ProtectedRoute path="/tools" component={ToolsPage} />
      <ProtectedRoute path="/saved" component={SavedPage} />
      <Route path="/compare" component={ComparePage} />
      <Route path="/feed">
        <RedirectTo to="/portal" />
      </Route>
      <Route path="/search-tools">
        <RedirectTo to="/search" />
      </Route>
      <ProtectedRoute path="/nearby" component={NearbyPage} />
      <Route path="/roommates">
        <RedirectTo to="/portal" />
      </Route>
      
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
