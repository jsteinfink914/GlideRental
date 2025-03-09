import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Property } from "@shared/schema";
import Navigation from "@/components/layout/Navigation";
import MobileNavigation from "@/components/layout/MobileNavigation";
import Sidebar from "@/components/layout/Sidebar";
import RentalTabs from "@/components/layout/RentalTabs";
import PropertyGrid from "@/components/rentals/PropertyGrid";
import { useMap } from "@/hooks/use-map";

export default function ForYouPage() {
  const { user } = useAuth();
  const { selectProperty } = useMap();
  
  // Fetch properties
  const { data: properties, isLoading: isLoadingProperties } = useQuery<Property[]>({
    queryKey: ['/api/properties'],
  });
  
  // In a real app, this would use a recommendation algorithm based on user preferences
  // For now, we'll just show properties in a different order to simulate recommendations
  const recommendedProperties = [...(properties || [])].sort((a, b) => {
    // This would be replaced with actual recommendation scoring
    return (b.rating || 0) - (a.rating || 0);
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
              <h1 className="text-3xl font-heading font-bold text-text-dark">Recommended for You</h1>
              <p className="text-text-medium mt-2">
                Properties tailored to your preferences
              </p>
            </div>

            {/* Content Tabs */}
            <RentalTabs />

            {/* Recommendation Explanation */}
            <div className="bg-secondary/20 p-4 rounded-lg mb-6">
              <h3 className="font-medium text-primary mb-2">How recommendations work</h3>
              <p className="text-text-medium text-sm">
                We use your search history, saved properties, and preferences to find homes that match your needs.
                Update your preferences in your account settings to improve recommendations.
              </p>
            </div>

            {/* Property Grid */}
            <PropertyGrid 
              properties={recommendedProperties}
              isLoading={isLoadingProperties}
              onSelectProperty={handlePropertySelect}
            />
          </div>
        </main>
      </div>

      <MobileNavigation />
    </div>
  );
}