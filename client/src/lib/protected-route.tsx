import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect, Route } from "wouter";

// Development mode toggle - set to true to bypass authentication checks
const DEVELOPMENT_MODE = false;

export function ProtectedRoute({
  path,
  component: Component,
}: {
  path: string;
  component: () => React.JSX.Element;
}) {
  const { user, isLoading } = useAuth();

  // In development mode, we'll render the component directly without authentication checks
  if (DEVELOPMENT_MODE) {
    console.log("Development mode: Bypassing authentication for", path);
    return (
      <Route path={path}>
        <>
          {/* Add development mode indicator */}
          <div className="fixed bottom-2 right-2 bg-yellow-200 text-black px-2 py-1 text-xs rounded-md opacity-70 z-50">
            DEV MODE
          </div>
          <Component />
        </>
      </Route>
    );
  }

  if (isLoading) {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Route>
    );
  }

  if (!user) {
    return (
      <Route path={path}>
        <Redirect to="/auth" />
      </Route>
    );
  }

  return <Route path={path} component={Component} />;
}
