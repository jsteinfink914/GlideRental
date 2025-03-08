import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Navigation from "@/components/layout/Navigation";
import MobileNavigation from "@/components/layout/MobileNavigation";
import Sidebar from "@/components/layout/Sidebar";
import PropertyGrid from "@/components/rentals/PropertyGrid";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Property } from "@shared/schema";

export default function FeedPage() {
  const [activeTab, setActiveTab] = useState("for-you");

  // Fetch properties recommended for the user
  const { data: recommendedProperties, isLoading: isLoadingRecommended } = useQuery({
    queryKey: ['/api/properties'],
    queryFn: async () => {
      const response = await fetch('/api/properties');
      if (!response.ok) {
        throw new Error('Failed to fetch recommended properties');
      }
      return response.json();
    }
  });

  // Fetch user's saved properties
  const { data: savedProperties, isLoading: isLoadingSaved } = useQuery({
    queryKey: ['/api/saved-properties'],
  });

  // In a real app, we would fetch roommate shared liked properties
  // This is mocked for demonstration purposes
  const { data: roommateProperties, isLoading: isLoadingRoommateProperties } = useQuery({
    queryKey: ['/api/properties'],
    select: (data: Property[]) => {
      // For demonstration, we'll just use the same properties
      // In a real app, this would be filtered to show only mutual likes
      return data.slice(0, 3);
    }
  });

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />

      <div className="flex flex-1">
        <Sidebar />

        <main className="flex-1 lg:pl-64 pb-16 md:pb-0">
          <div className="container mx-auto px-4 py-6">
            {/* Page Title */}
            <div className="mb-6">
              <h1 className="text-3xl font-heading font-bold text-text-dark">Your Feed</h1>
              <p className="text-text-medium mt-2">
                Discover properties tailored to your preferences
              </p>
            </div>

            {/* Tabs */}
            <Tabs 
              value={activeTab} 
              onValueChange={setActiveTab}
              className="mb-6"
            >
              <TabsList className="mb-6">
                <TabsTrigger value="for-you" className="px-6">For You</TabsTrigger>
                <TabsTrigger value="roommate" className="px-6">Roommate</TabsTrigger>
                <TabsTrigger value="saved" className="px-6">Saved</TabsTrigger>
              </TabsList>

              {/* For You Tab */}
              <TabsContent value="for-you">
                <div className="mb-6">
                  <h2 className="text-xl font-heading font-semibold text-text-dark mb-4">
                    Recommended for you
                  </h2>
                  <p className="text-text-medium mb-6">
                    Properties that match your preferences and search history
                  </p>
                  
                  <PropertyGrid 
                    properties={recommendedProperties}
                    savedProperties={savedProperties}
                    isLoading={isLoadingRecommended}
                  />
                </div>

                {/* Recently Viewed */}
                <div className="mt-10">
                  <h2 className="text-xl font-heading font-semibold text-text-dark mb-4">
                    Recently Viewed
                  </h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {isLoadingRecommended ? (
                      Array.from({ length: 3 }).map((_, i) => (
                        <Card key={i}>
                          <CardContent className="p-0">
                            <Skeleton className="h-40 w-full" />
                            <div className="p-4">
                              <Skeleton className="h-6 w-3/4 mb-2" />
                              <Skeleton className="h-4 w-full mb-3" />
                              <Skeleton className="h-4 w-24" />
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    ) : recommendedProperties?.length ? (
                      recommendedProperties.slice(0, 3).map((property) => (
                        <Card key={property.id} className="overflow-hidden">
                          <CardContent className="p-0">
                            <div className="relative h-40">
                              <img 
                                src={property.images?.[0] || "https://via.placeholder.com/300x200?text=Property"} 
                                alt={property.title}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="p-4">
                              <h3 className="font-heading font-medium text-lg text-text-dark mb-1">
                                {property.title}
                              </h3>
                              <p className="text-text-medium text-sm mb-2">
                                ${property.rent.toLocaleString()}/mo · {property.bedrooms === 0 ? 'Studio' : `${property.bedrooms} bed`} · {property.bathrooms} bath
                              </p>
                              <Button variant="link" className="text-primary p-0">
                                View Details
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    ) : (
                      <div className="col-span-3 text-center py-12">
                        <p className="text-text-medium">No recently viewed properties</p>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>

              {/* Roommate Tab */}
              <TabsContent value="roommate">
                <div className="mb-6">
                  <h2 className="text-xl font-heading font-semibold text-text-dark mb-4">
                    Roommate Matches
                  </h2>
                  <p className="text-text-medium mb-6">
                    Properties you and your roommate both liked
                  </p>
                  
                  {isLoadingRoommateProperties ? (
                    <PropertyGrid isLoading={true} />
                  ) : roommateProperties?.length ? (
                    <>
                      <PropertyGrid 
                        properties={roommateProperties}
                        savedProperties={savedProperties}
                      />
                      
                      <div className="mt-8 bg-secondary rounded-xl p-6">
                        <h3 className="font-heading font-medium text-lg text-text-dark mb-2">
                          Invite a roommate
                        </h3>
                        <p className="text-text-medium mb-4">
                          Share apartments and coordinate your search with potential roommates
                        </p>
                        <Button className="bg-primary hover:bg-primary-light">
                          Send Invite
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div className="text-center bg-secondary rounded-xl p-8">
                      <div className="w-16 h-16 rounded-full bg-accent mx-auto mb-4 flex items-center justify-center">
                        <span className="material-icons text-white text-2xl">group_add</span>
                      </div>
                      <h3 className="font-heading font-medium text-lg text-text-dark mb-2">
                        No roommate matches yet
                      </h3>
                      <p className="text-text-medium mb-4">
                        Invite a roommate to see mutual liked properties
                      </p>
                      <Button className="bg-primary hover:bg-primary-light">
                        Invite Roommate
                      </Button>
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* Saved Tab */}
              <TabsContent value="saved">
                <div className="mb-6">
                  <h2 className="text-xl font-heading font-semibold text-text-dark mb-4">
                    Saved Properties
                  </h2>
                  <p className="text-text-medium mb-6">
                    Properties you've saved for later
                  </p>
                  
                  {isLoadingSaved ? (
                    <PropertyGrid isLoading={true} />
                  ) : savedProperties?.length ? (
                    <PropertyGrid savedProperties={savedProperties} />
                  ) : (
                    <div className="text-center bg-secondary rounded-xl p-8">
                      <div className="w-16 h-16 rounded-full bg-accent mx-auto mb-4 flex items-center justify-center">
                        <span className="material-icons text-white text-2xl">favorite</span>
                      </div>
                      <h3 className="font-heading font-medium text-lg text-text-dark mb-2">
                        No saved properties yet
                      </h3>
                      <p className="text-text-medium mb-4">
                        Save properties you like and they will appear here
                      </p>
                      <Button 
                        className="bg-primary hover:bg-primary-light"
                        onClick={() => window.location.href = "/search"}
                      >
                        Start Searching
                      </Button>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>

      <MobileNavigation />
    </div>
  );
}
