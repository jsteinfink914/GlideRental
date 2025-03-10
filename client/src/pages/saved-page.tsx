import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Property } from "@shared/schema";
import Navigation from "@/components/layout/Navigation";
import MobileNavigation from "@/components/layout/MobileNavigation";
import Sidebar from "@/components/layout/Sidebar";
import RentalTabs from "@/components/layout/RentalTabs";
import PropertyGrid from "@/components/rentals/PropertyGrid";
import { useMap } from "@/hooks/use-map";
import { Loader2 } from "lucide-react";
import { Link } from "wouter";

// Check if we're in development mode
const DEVELOPMENT_MODE = true;

export default function SavedPage() {
  const { user } = useAuth();
  const { selectProperty } = useMap();

  // Log development mode in browser console
  if (DEVELOPMENT_MODE) {
    console.log("Development mode: Bypassing authentication for", "/saved");
  }

  // Fetch saved properties (always enabled in dev mode)
  const { data: savedProperties, isLoading: isLoadingSaved } = useQuery<{savedId: number; property: Property}[]>({
    queryKey: ['/api/saved-properties'],
    // In development mode, we always fetch saved properties
    enabled: DEVELOPMENT_MODE || !!user
  });

  const handlePropertySelect = (property: Property) => {
    selectProperty(property);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />

      <div className="flex flex-1">
        <Sidebar />

        <main className="flex-1 lg:pl-64 pb-16 md:pb-0">
          <div className="container mx-auto px-4 py-6">
            
            {/* Page Title */}
            <div className="mb-6">
              <h1 className="text-3xl font-heading font-bold text-text-dark">Saved Properties</h1>
              <p className="text-text-medium mt-2">
                {savedProperties?.length || 0} saved {(savedProperties?.length || 0) === 1 ? 'property' : 'properties'}
              </p>
            </div>

            {/* Content Tabs */}
            <RentalTabs />

            {/* Saved Properties */}
            {isLoadingSaved ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : !savedProperties || savedProperties.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <div className="material-icons text-4xl text-text-light mb-2">bookmarks</div>
                <h3 className="font-medium text-lg mb-2">No saved properties yet</h3>
                <p className="text-text-medium mb-4">
                  Save properties to compare and keep track of the places you love.
                </p>
                <Link href="/search" className="text-primary font-medium">
                  Start browsing
                </Link>
              </div>
            ) : (
              <PropertyGrid 
                properties={savedProperties.map(item => item.property)}
                savedProperties={savedProperties}
                isLoading={isLoadingSaved}
                onSelectProperty={handlePropertySelect}
              />
            )}
          </div>
        </main>
      </div>

      {/* Development Mode Indicator */}
      {DEVELOPMENT_MODE && (
        <div className="fixed bottom-4 right-4 bg-black/70 text-white px-2 py-1 text-xs rounded-md z-50">
          DEV MODE
        </div>
      )}

      <MobileNavigation />
    </div>
  );
}