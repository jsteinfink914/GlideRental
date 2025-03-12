import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Property } from "@shared/schema";
import Navigation from "@/components/layout/Navigation";
import MobileNavigation from "@/components/layout/MobileNavigation";
import Sidebar from "@/components/layout/Sidebar";
import RentalTabs from "@/components/layout/RentalTabs";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapComparison } from "@/components/rentals/MapComparison";
import RentCalculator from "@/components/tools/RentCalculator";

export default function ToolsPage() {
  const { user } = useAuth();
  const [selectedPropertyIds, setSelectedPropertyIds] = useState<number[]>([]);
  
  // Fetch saved properties
  const { data: savedProperties, isLoading } = useQuery<{savedId: number; property: Property}[]>({
    queryKey: ['/api/saved-properties'],
    enabled: !!user
  });
  
  const isPropertySelected = (id: number) => selectedPropertyIds.includes(id);
  
  const togglePropertySelection = (id: number) => {
    if (isPropertySelected(id)) {
      setSelectedPropertyIds(selectedPropertyIds.filter((propId) => propId !== id));
    } else {
      if (selectedPropertyIds.length < 3) {
        setSelectedPropertyIds([...selectedPropertyIds, id]);
      }
    }
  };
  
  const propertiesForComparison = savedProperties
    ?.filter(item => isPropertySelected(item.property.id))
    .map(item => item.property) || [];
  
  const renderAmenityStatus = (property: Property, amenity: string) => {
    const hasAmenity = property[amenity as keyof Property];
    return (
      <div className={`flex items-center ${hasAmenity ? "text-green-500" : "text-red-500"}`}>
        <span className="material-icons mr-1">{hasAmenity ? "check_circle" : "cancel"}</span>
        <span>{hasAmenity ? "Yes" : "No"}</span>
      </div>
    );
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
              <h1 className="text-3xl font-heading font-bold text-text-dark">Rental Tools</h1>
              <p className="text-text-medium mt-2">
                Compare properties, calculate costs, and more
              </p>
            </div>

            {/* Content Tabs */}
            <RentalTabs />

            {/* Tools Tabs */}
            <Tabs defaultValue="compare" className="mt-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="compare">Compare Properties</TabsTrigger>
                <TabsTrigger value="calculator">Rent Calculator</TabsTrigger>
                <TabsTrigger value="checklist">Moving Checklist</TabsTrigger>
              </TabsList>
              
              <TabsContent value="compare">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                  {/* Select properties section */}
                  <div className="border p-4 rounded-lg md:col-span-3">
                    <h3 className="font-medium mb-4">Select up to 3 properties to compare</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {savedProperties?.map((item: {savedId: number; property: Property}) => (
                        <div 
                          key={item.property.id}
                          className={`border rounded-lg p-3 flex items-center cursor-pointer ${
                            isPropertySelected(item.property.id) ? "border-primary bg-secondary/10" : ""
                          }`}
                          onClick={() => togglePropertySelection(item.property.id)}
                        >
                          <Checkbox 
                            checked={isPropertySelected(item.property.id)}
                            className="mr-3"
                            disabled={selectedPropertyIds.length >= 3 && !isPropertySelected(item.property.id)}
                          />
                          <div className="flex-1 truncate">
                            <p className="font-medium truncate">{item.property.title}</p>
                            <p className="text-sm text-text-medium truncate">{item.property.neighborhood}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Comparison section */}
                  {propertiesForComparison.length > 0 ? (
                    <>
                      {/* Basic info comparison */}
                      <Card className="md:col-span-3">
                        <CardHeader>
                          <CardTitle>Basic Information</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-4 gap-4">
                            <div></div>
                            {propertiesForComparison.map((property: Property) => (
                              <div key={property.id} className="text-center">
                                <p className="font-medium">{property.title}</p>
                              </div>
                            ))}
                            
                            <div className="font-medium">Price</div>
                            {propertiesForComparison.map((property: Property) => (
                              <div key={`${property.id}-price`} className="text-center">
                                ${property.rent.toLocaleString()}/mo
                              </div>
                            ))}
                            
                            <div className="font-medium">Bedrooms</div>
                            {propertiesForComparison.map((property: Property) => (
                              <div key={`${property.id}-bedrooms`} className="text-center">
                                {property.bedrooms}
                              </div>
                            ))}
                            
                            <div className="font-medium">Bathrooms</div>
                            {propertiesForComparison.map((property: Property) => (
                              <div key={`${property.id}-bathrooms`} className="text-center">
                                {property.bathrooms}
                              </div>
                            ))}
                            
                            <div className="font-medium">Square Feet</div>
                            {propertiesForComparison.map((property: Property) => (
                              <div key={`${property.id}-sqft`} className="text-center">
                                {property.squareFeet}
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                      
                      {/* Amenities comparison */}
                      <Card className="md:col-span-3">
                        <CardHeader>
                          <CardTitle>Amenities</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-4 gap-4">
                            <div></div>
                            {propertiesForComparison.map((property: Property) => (
                              <div key={`${property.id}-header`} className="text-center">
                                <p className="font-medium">{property.title}</p>
                              </div>
                            ))}
                            
                            <div className="font-medium">In-unit Laundry</div>
                            {propertiesForComparison.map((property: Property) => (
                              <div key={`${property.id}-laundry`} className="text-center">
                                {renderAmenityStatus(property, 'hasInUnitLaundry')}
                              </div>
                            ))}
                            
                            <div className="font-medium">Dishwasher</div>
                            {propertiesForComparison.map((property: Property) => (
                              <div key={`${property.id}-dishwasher`} className="text-center">
                                {renderAmenityStatus(property, 'hasDishwasher')}
                              </div>
                            ))}
                            
                            <div className="font-medium">Pet Friendly</div>
                            {propertiesForComparison.map((property: Property) => (
                              <div key={`${property.id}-pet`} className="text-center">
                                {renderAmenityStatus(property, 'petFriendly')}
                              </div>
                            ))}
                            
                            <div className="font-medium">Doorman</div>
                            {propertiesForComparison.map((property: Property) => (
                              <div key={`${property.id}-doorman`} className="text-center">
                                {renderAmenityStatus(property, 'hasDoorman')}
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                      
                      {/* Location Comparison Map */}
                      <Card className="md:col-span-3 mb-8">
                        <CardHeader>
                          <CardTitle>Compare Routes & Distances</CardTitle>
                          <p className="text-muted-foreground">
                            {propertiesForComparison.length >= 1 
                              ? "Find nearby places and analyze travel times for your saved properties" 
                              : "Please select at least one property to enable route comparison"}
                          </p>
                        </CardHeader>
                        <CardContent>
                          {propertiesForComparison.length > 0 ? (
                            <MapComparison properties={propertiesForComparison} />
                          ) : (
                            <div className="text-center py-6">
                              <p className="mb-3">Please select properties to compare routes and distances.</p>
                              <p className="text-sm text-muted-foreground">Use the checkboxes above to select properties for comparison.</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </>
                  ) : (
                    <div className="md:col-span-3 text-center py-12 bg-gray-50 rounded-lg">
                      <h3 className="font-medium text-lg mb-2">Select properties to compare</h3>
                      <p className="text-text-medium mb-4">
                        Choose up to 3 properties from your saved list to compare side by side.
                      </p>
                      <a href="/saved" className="text-primary font-medium">
                        View saved properties
                      </a>
                    </div>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="calculator">
                <div className="py-6">
                  {/* Rent Calculator Component */}
                  <RentCalculator 
                    initialRent={selectedPropertyIds.length > 0 && propertiesForComparison.length > 0 
                      ? propertiesForComparison[0].rent 
                      : 2000} 
                  />
                </div>
              </TabsContent>
              
              <TabsContent value="checklist">
                <div className="py-6 text-center">
                  <p className="text-lg mb-4">Moving checklist coming soon!</p>
                  <p className="text-text-medium">
                    We're creating a comprehensive checklist to help you prepare for your move,
                    from packing to settling into your new home.
                  </p>
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