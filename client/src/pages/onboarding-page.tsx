import { useEffect } from "react";
import { useLocation } from "wouter";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import OnboardingForm from "@/components/onboarding/OnboardingForm";
import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import { UserPreferences } from "@shared/schema";

export default function OnboardingPage() {
  const [location, setLocation] = useLocation();
  const { user } = useAuth();
  
  // Check if the user has already completed onboarding
  const { data: userPreferences, isLoading: preferencesLoading } = useQuery<UserPreferences | undefined, Error>({
    queryKey: ["/api/user-preferences"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: !!user
  });
  
  useEffect(() => {
    // If not authenticated, redirect to auth page
    if (!user) {
      setLocation("/auth");
      return;
    }
    
    // If user has already completed onboarding or has preferences, redirect to home
    if (user.onboardingCompleted || userPreferences) {
      setLocation("/");
    }
  }, [user, userPreferences, setLocation]);
  
  // Show loading while checking auth/preferences
  if (!user || preferencesLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  return (
    <div className="container py-10 mx-auto min-h-screen">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold">Welcome to Glide</h1>
        <p className="text-muted-foreground mt-2">Let's set up your profile to help you find the perfect home</p>
      </div>
      
      <OnboardingForm />
    </div>
  );
}