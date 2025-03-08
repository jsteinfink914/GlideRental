import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Navigation from "@/components/layout/Navigation";
import MobileNavigation from "@/components/layout/MobileNavigation";
import Sidebar from "@/components/layout/Sidebar";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Property } from "@shared/schema";
import { CheckCircle2, XCircle } from "lucide-react";

export default function ToolsPage() {
  const [selectedProperties, setSelectedProperties] = useState<number[]>([]);

  // Fetch user's saved properties
  const { data: savedProperties, isLoading } = useQuery({
    queryKey: ['/api/saved-properties'],
  });

  const togglePropertySelection = (propertyId: number) => {
    setSelectedProperties(prev => 
      prev.includes(propertyId)
        ? prev.filter(id => id !== propertyId)
        : [...prev, propertyId]
    );
  };

  const isPropertySelected = (propertyId: number) => {
    return selectedProperties.includes(propertyId);
  };

  // Filter properties that are selected for comparison
  const propertiesForComparison = savedProperties
    ?.filter(item => isPropertySelected(item.property.id))
    .map(item => item.property) || [];

  // Function to render amenity check or cross
  const renderAmenityStatus = (property: Property, amenity: string) => {
    const amenityMapping: Record<string, keyof Property> = {
      'In-Unit Laundry': 'hasInUnitLaundry',
      'Dishwasher': 'hasDishwasher',
      'Pet Friendly': 'petFriendly',
      'Doorman': 'hasDoorman',
      'Virtual Tour': 'hasVirtualTour',
      'No Fee': 'noFee'
    };
    
    const propertyKey = amenityMapping[amenity];
    const hasAmenity = propertyKey ? property[propertyKey] : false;
    
    return hasAmenity ? (
      <CheckCircle2 className="h-5 w-5 text-green-500" />
    ) : (
      <XCircle className="h-5 w-5 text-red-500" />
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
              <h1 className="text-3xl font-heading font-bold text-text-dark">Tools</h1>
              <p className="text-text-medium mt-2">
                Compare properties and find the best match for your needs
              </p>
            </div>

            {/* Tools Section */}
            <div className="mb-8">
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl font-heading">
                    Compatibility Tool
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-text-medium mb-6">
                    Select properties to compare and find the best match for your needs.
                  </p>

                  {/* Properties Selection */}
                  <div className="mb-8">
                    <h3 className="font-heading font-medium text-lg mb-4">
                      Your Saved Properties
                    </h3>
                    
                    {isLoading ? (
                      <div className="space-y-4">
                        {Array.from({ length: 3 }).map((_, i) => (
                          <div key={i} className="flex items-center space-x-4">
                            <Skeleton className="h-5 w-5" />
                            <div className="flex-1 space-y-2">
                              <Skeleton className="h-5 w-1/2" />
                              <Skeleton className="h-4 w-full" />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : !savedProperties?.length ? (
                      <div className="text-center py-8 bg-secondary rounded-lg">
                        <p className="text-text-medium mb-4">
                          You haven't saved any properties yet
                        </p>
                        <Button 
                          onClick={() => window.location.href = "/search"} 
                          className="bg-primary hover:bg-primary-light"
                        >
                          Browse Properties
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {savedProperties.map((item) => (
                          <div key={item.savedId} className="flex items-start border-b border-gray-100 pb-4">
                            <Checkbox
                              id={`property-${item.property.id}`}
                              checked={isPropertySelected(item.property.id)}
                              onCheckedChange={() => togglePropertySelection(item.property.id)}
                              className="mt-1 mr-4"
                            />
                            <div>
                              <label 
                                htmlFor={`property-${item.property.id}`}
                                className="font-medium cursor-pointer"
                              >
                                {item.property.title}
                              </label>
                              <p className="text-sm text-text-medium">
                                ${item.property.rent.toLocaleString()}/mo · {item.property.bedrooms === 0 ? 'Studio' : `${item.property.bedrooms} bed`} · {item.property.bathrooms} bath · {item.property.squareFeet ? `${item.property.squareFeet.toLocaleString()} sqft` : 'N/A'}
                              </p>
                              <p className="text-sm text-text-medium">
                                {item.property.address}, {item.property.neighborhood}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Comparison Table */}
                  {propertiesForComparison.length > 0 && (
                    <div>
                      <h3 className="font-heading font-medium text-lg mb-4">
                        Property Comparison
                      </h3>
                      
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-1/4">Features</TableHead>
                              {propertiesForComparison.map(property => (
                                <TableHead key={property.id}>
                                  {property.title}
                                </TableHead>
                              ))}
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {/* Basic Info */}
                            <TableRow>
                              <TableCell className="font-medium">Price</TableCell>
                              {propertiesForComparison.map(property => (
                                <TableCell key={`${property.id}-price`}>
                                  ${property.rent.toLocaleString()}/mo
                                </TableCell>
                              ))}
                            </TableRow>
                            <TableRow>
                              <TableCell className="font-medium">Bedrooms</TableCell>
                              {propertiesForComparison.map(property => (
                                <TableCell key={`${property.id}-bedrooms`}>
                                  {property.bedrooms === 0 ? 'Studio' : property.bedrooms}
                                </TableCell>
                              ))}
                            </TableRow>
                            <TableRow>
                              <TableCell className="font-medium">Bathrooms</TableCell>
                              {propertiesForComparison.map(property => (
                                <TableCell key={`${property.id}-bathrooms`}>
                                  {property.bathrooms}
                                </TableCell>
                              ))}
                            </TableRow>
                            <TableRow>
                              <TableCell className="font-medium">Square Feet</TableCell>
                              {propertiesForComparison.map(property => (
                                <TableCell key={`${property.id}-sqft`}>
                                  {property.squareFeet ? property.squareFeet.toLocaleString() : 'N/A'}
                                </TableCell>
                              ))}
                            </TableRow>
                            <TableRow>
                              <TableCell className="font-medium">Neighborhood</TableCell>
                              {propertiesForComparison.map(property => (
                                <TableCell key={`${property.id}-neighborhood`}>
                                  {property.neighborhood}
                                </TableCell>
                              ))}
                            </TableRow>
                            <TableRow>
                              <TableCell className="font-medium">Available Date</TableCell>
                              {propertiesForComparison.map(property => (
                                <TableCell key={`${property.id}-date`}>
                                  {new Date(property.availableDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                </TableCell>
                              ))}
                            </TableRow>
                            
                            {/* Amenities */}
                            <TableRow>
                              <TableCell className="font-medium">In-Unit Laundry</TableCell>
                              {propertiesForComparison.map(property => (
                                <TableCell key={`${property.id}-laundry`} className="text-center">
                                  {renderAmenityStatus(property, 'In-Unit Laundry')}
                                </TableCell>
                              ))}
                            </TableRow>
                            <TableRow>
                              <TableCell className="font-medium">Dishwasher</TableCell>
                              {propertiesForComparison.map(property => (
                                <TableCell key={`${property.id}-dishwasher`} className="text-center">
                                  {renderAmenityStatus(property, 'Dishwasher')}
                                </TableCell>
                              ))}
                            </TableRow>
                            <TableRow>
                              <TableCell className="font-medium">Pet Friendly</TableCell>
                              {propertiesForComparison.map(property => (
                                <TableCell key={`${property.id}-pet`} className="text-center">
                                  {renderAmenityStatus(property, 'Pet Friendly')}
                                </TableCell>
                              ))}
                            </TableRow>
                            <TableRow>
                              <TableCell className="font-medium">Doorman</TableCell>
                              {propertiesForComparison.map(property => (
                                <TableCell key={`${property.id}-doorman`} className="text-center">
                                  {renderAmenityStatus(property, 'Doorman')}
                                </TableCell>
                              ))}
                            </TableRow>
                            <TableRow>
                              <TableCell className="font-medium">Virtual Tour</TableCell>
                              {propertiesForComparison.map(property => (
                                <TableCell key={`${property.id}-tour`} className="text-center">
                                  {renderAmenityStatus(property, 'Virtual Tour')}
                                </TableCell>
                              ))}
                            </TableRow>
                            <TableRow>
                              <TableCell className="font-medium">No Fee</TableCell>
                              {propertiesForComparison.map(property => (
                                <TableCell key={`${property.id}-fee`} className="text-center">
                                  {renderAmenityStatus(property, 'No Fee')}
                                </TableCell>
                              ))}
                            </TableRow>
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Additional Tools */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-heading">Rent Calculator</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-text-medium mb-4">
                    Calculate how much rent you can afford based on your income.
                  </p>
                  <Button className="bg-primary hover:bg-primary-light">
                    Open Calculator
                  </Button>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-heading">Moving Checklist</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-text-medium mb-4">
                    Keep track of everything you need to do before and after your move.
                  </p>
                  <Button className="bg-primary hover:bg-primary-light">
                    View Checklist
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>

      <MobileNavigation />
    </div>
  );
}
