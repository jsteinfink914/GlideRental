import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import Navigation from "@/components/layout/Navigation";
import MobileNavigation from "@/components/layout/MobileNavigation";
import Sidebar from "@/components/layout/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Property, 
  Building, 
  MaintenanceRequest,
  Payment
} from "@shared/schema";

export default function BuildingOverviewPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("all");
  const [selectedBuilding, setSelectedBuilding] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isMessageDialogOpen, setIsMessageDialogOpen] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState<Property | null>(null);
  const [messageText, setMessageText] = useState("");

  // Fetch landlord's buildings
  const { data: buildings, isLoading: isLoadingBuildings } = useQuery({
    queryKey: ['/api/buildings'],
    queryFn: async () => {
      try {
        // In a real app, this would filter buildings by landlordId
        const response = await fetch('/api/buildings');
        if (!response.ok) {
          throw new Error('Failed to fetch buildings');
        }
        return response.json();
      } catch (error) {
        console.error("Error fetching buildings:", error);
        return [];
      }
    }
  });

  // Fetch properties/units for the buildings
  const { data: properties, isLoading: isLoadingProperties } = useQuery({
    queryKey: ['/api/properties'],
    queryFn: async () => {
      try {
        // In a real app, this would filter properties by landlordId
        const response = await fetch('/api/properties');
        if (!response.ok) {
          throw new Error('Failed to fetch properties');
        }
        return response.json();
      } catch (error) {
        console.error("Error fetching properties:", error);
        return [];
      }
    }
  });

  // Fetch maintenance requests
  const { data: maintenanceRequests, isLoading: isLoadingMaintenance } = useQuery({
    queryKey: ['/api/maintenance-requests'],
    enabled: !!properties
  });

  // Fetch payments
  const { data: payments, isLoading: isLoadingPayments } = useQuery({
    queryKey: ['/api/payments'],
    enabled: !!properties
  });

  // Filter buildings based on search term
  const filteredBuildings = buildings?.filter((building: Building) => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      building.name.toLowerCase().includes(searchLower) ||
      building.address.toLowerCase().includes(searchLower) ||
      building.neighborhood.toLowerCase().includes(searchLower) ||
      building.city.toLowerCase().includes(searchLower)
    );
  }) || [];

  // Filter properties based on selected building and active tab
  const filteredProperties = properties?.filter((property: Property) => {
    // Filter by selected building if one is selected
    if (selectedBuilding && property.landlordId !== selectedBuilding) {
      return false;
    }
    
    // Filter by maintenance status if on maintenance tab
    if (activeTab === "maintenance") {
      const hasMaintenanceRequest = maintenanceRequests?.some((request: MaintenanceRequest) => 
        request.propertyId === property.id && request.status !== "completed"
      );
      return hasMaintenanceRequest;
    }
    
    // Filter by payment status if on payments tab
    if (activeTab === "payments") {
      const hasPendingPayment = payments?.some((payment: Payment) => 
        payment.propertyId === property.id && payment.status === "pending"
      );
      return hasPendingPayment;
    }
    
    // Filter by vacancy if on vacancy tab
    if (activeTab === "vacancy") {
      // In a real app, we would have occupancy information
      // For the demo, we'll assume properties with availableDate in the past are vacant
      const today = new Date();
      const availableDate = new Date(property.availableDate);
      return availableDate <= today;
    }
    
    return true; // Show all on "all" tab
  }) || [];

  // Get maintenance count for a property
  const getMaintenanceCount = (propertyId: number) => {
    if (!maintenanceRequests) return 0;
    
    return maintenanceRequests.filter((request: MaintenanceRequest) => 
      request.propertyId === propertyId && request.status !== "completed"
    ).length;
  };

  // Check if rent is paid for a property
  const isRentPaid = (propertyId: number) => {
    if (!payments) return false;
    
    // Check if there's a completed payment for the current month
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    
    return payments.some((payment: Payment) => {
      if (payment.propertyId !== propertyId || payment.status !== "completed") {
        return false;
      }
      
      // Check if payment was made this month
      const paidDate = payment.paidDate ? new Date(payment.paidDate) : null;
      if (!paidDate) return false;
      
      return paidDate.getMonth() === currentMonth && paidDate.getFullYear() === currentYear;
    });
  };

  // Format date for display
  const formatDate = (dateString: string | Date) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const handleMessageTenant = (property: Property) => {
    setSelectedUnit(property);
    setIsMessageDialogOpen(true);
  };

  const handleSendMessage = () => {
    // In a real app, this would send a message to the tenant
    console.log(`Sending message to tenant of unit ${selectedUnit?.id}: ${messageText}`);
    setIsMessageDialogOpen(false);
    setMessageText("");
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
              <h1 className="text-3xl font-heading font-bold text-text-dark">Building Overview</h1>
              <p className="text-text-medium mt-2">
                Manage your buildings and units
              </p>
            </div>

            {/* Building Filter & Search */}
            <div className="mb-6 flex flex-col md:flex-row gap-4">
              <div className="w-full md:w-1/3">
                <label htmlFor="building-select" className="block text-sm font-medium text-text-medium mb-1">
                  Select Building
                </label>
                <select
                  id="building-select"
                  className="w-full rounded-lg border border-gray-200 p-2 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
                  value={selectedBuilding || ""}
                  onChange={(e) => setSelectedBuilding(e.target.value ? parseInt(e.target.value, 10) : null)}
                >
                  <option value="">All Buildings</option>
                  {filteredBuildings.map((building: Building) => (
                    <option key={building.id} value={building.id}>
                      {building.name} - {building.address}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="w-full md:w-2/3">
                <label htmlFor="search-buildings" className="block text-sm font-medium text-text-medium mb-1">
                  Search Buildings
                </label>
                <div className="relative">
                  <span className="material-icons absolute left-3 top-1/2 transform -translate-y-1/2 text-text-medium">search</span>
                  <Input
                    id="search-buildings"
                    placeholder="Search by building name, address, or neighborhood..."
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Buildings Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
              {isLoadingBuildings ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <Card key={i}>
                    <CardContent className="p-0">
                      <Skeleton className="h-40 w-full" />
                      <div className="p-4">
                        <Skeleton className="h-6 w-3/4 mb-2" />
                        <Skeleton className="h-4 w-full mb-2" />
                        <Skeleton className="h-4 w-2/3" />
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : filteredBuildings.length === 0 ? (
                <div className="col-span-3 text-center py-8 bg-secondary rounded-xl">
                  <div className="w-16 h-16 rounded-full bg-accent mx-auto mb-4 flex items-center justify-center">
                    <span className="material-icons text-white text-2xl">location_city</span>
                  </div>
                  <h3 className="font-heading font-medium text-lg text-text-dark mb-2">
                    No buildings found
                  </h3>
                  <p className="text-text-medium mb-4">
                    Add your buildings to manage them here
                  </p>
                  <Button className="bg-primary hover:bg-primary-light">
                    Add Building
                  </Button>
                </div>
              ) : (
                filteredBuildings.map((building: Building) => {
                  // Get all properties for this building
                  const buildingProperties = properties?.filter((p: Property) => p.landlordId === building.id) || [];
                  
                  // Count units with issues
                  const unitsWithMaintenance = buildingProperties.filter((p: Property) => 
                    getMaintenanceCount(p.id) > 0
                  ).length;
                  
                  const unitsWithUnpaidRent = buildingProperties.filter((p: Property) => 
                    !isRentPaid(p.id)
                  ).length;
                  
                  return (
                    <Card key={building.id} className="overflow-hidden">
                      <CardContent className="p-0">
                        <div className="relative h-40 bg-gray-100">
                          <div className="absolute inset-0 bg-secondary flex items-center justify-center">
                            <span className="material-icons text-5xl text-primary">apartment</span>
                          </div>
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                          <div className="absolute bottom-4 left-4 text-white">
                            <h3 className="text-xl font-heading font-semibold">{building.name}</h3>
                            <p>{building.neighborhood}</p>
                          </div>
                        </div>
                        <div className="p-4">
                          <p className="text-text-medium text-sm mb-3">
                            {building.address}, {building.city}, {building.state} {building.zipCode}
                          </p>
                          <div className="flex justify-between text-sm mb-3">
                            <span><strong>Units:</strong> {building.numberOfUnits}</span>
                            <span><strong>Occupancy:</strong> 85%</span>
                          </div>
                          <div className="flex flex-wrap gap-2 mb-4">
                            {unitsWithMaintenance > 0 && (
                              <Badge variant="outline" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
                                {unitsWithMaintenance} Maintenance
                              </Badge>
                            )}
                            {unitsWithUnpaidRent > 0 && (
                              <Badge variant="outline" className="bg-red-100 text-red-800 hover:bg-red-100">
                                {unitsWithUnpaidRent} Unpaid Rent
                              </Badge>
                            )}
                          </div>
                          <Button 
                            variant="outline" 
                            className="w-full border-primary text-primary"
                            onClick={() => setSelectedBuilding(building.id)}
                          >
                            View Details
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>

            {/* Units/Properties Tabs */}
            <div className="mb-6">
              <Card>
                <CardHeader>
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                    <CardTitle className="text-xl font-heading">
                      {selectedBuilding 
                        ? `Units in ${filteredBuildings.find((b: Building) => b.id === selectedBuilding)?.name || 'Selected Building'}`
                        : 'All Units'
                      }
                    </CardTitle>
                    <div className="mt-4 md:mt-0">
                      <Button className="bg-primary hover:bg-primary-light">
                        <span className="material-icons mr-1">add</span>
                        Add Unit
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Tabs 
                    value={activeTab} 
                    onValueChange={setActiveTab}
                    className="space-y-4"
                  >
                    <TabsList className="mb-4">
                      <TabsTrigger value="all" className="px-6">All Units</TabsTrigger>
                      <TabsTrigger value="maintenance" className="px-6">Maintenance Needed</TabsTrigger>
                      <TabsTrigger value="payments" className="px-6">Payment Due</TabsTrigger>
                      <TabsTrigger value="vacancy" className="px-6">Vacancy</TabsTrigger>
                    </TabsList>

                    <TabsContent value={activeTab}>
                      {isLoadingProperties ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="border rounded-lg p-4">
                              <Skeleton className="h-6 w-1/2 mb-2" />
                              <Skeleton className="h-4 w-full mb-2" />
                              <Skeleton className="h-4 w-3/4 mb-4" />
                              <div className="flex justify-between">
                                <Skeleton className="h-10 w-20" />
                                <Skeleton className="h-10 w-20" />
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : filteredProperties.length === 0 ? (
                        <div className="text-center py-8">
                          <div className="w-16 h-16 rounded-full bg-accent mx-auto mb-4 flex items-center justify-center">
                            <span className="material-icons text-white text-2xl">domain</span>
                          </div>
                          <h3 className="font-heading font-medium text-lg text-text-dark mb-2">
                            No units found
                          </h3>
                          <p className="text-text-medium mb-4">
                            {activeTab === "all" 
                              ? "Add units to your building" 
                              : activeTab === "maintenance"
                                ? "No units need maintenance"
                                : activeTab === "payments"
                                  ? "All rent payments are up to date"
                                  : "No vacant units available"
                            }
                          </p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {filteredProperties.map((property: Property) => {
                            const maintenanceCount = getMaintenanceCount(property.id);
                            const rentPaid = isRentPaid(property.id);
                            
                            return (
                              <div key={property.id} className="border rounded-lg overflow-hidden">
                                <div className="p-4">
                                  <div className="flex justify-between items-start mb-2">
                                    <h3 className="font-heading font-medium text-lg text-text-dark">
                                      Unit {property.title.split(' ').pop()}
                                    </h3>
                                    <span className="font-medium">${property.rent.toLocaleString()}/mo</span>
                                  </div>
                                  
                                  <p className="text-text-medium text-sm mb-2">
                                    {property.address}
                                  </p>
                                  
                                  <div className="flex gap-4 mb-3">
                                    <div className="flex items-center gap-1">
                                      <span className="material-icons text-text-medium text-sm">king_bed</span>
                                      <span className="text-sm">
                                        {property.bedrooms === 0 ? 'Studio' : `${property.bedrooms} bed${property.bedrooms > 1 ? 's' : ''}`}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <span className="material-icons text-text-medium text-sm">bathtub</span>
                                      <span className="text-sm">{property.bathrooms} bath{property.bathrooms !== 1 ? 's' : ''}</span>
                                    </div>
                                    {property.squareFeet && (
                                      <div className="flex items-center gap-1">
                                        <span className="material-icons text-text-medium text-sm">straighten</span>
                                        <span className="text-sm">{property.squareFeet.toLocaleString()} sqft</span>
                                      </div>
                                    )}
                                  </div>
                                  
                                  <div className="flex flex-wrap gap-2 mb-3">
                                    {!rentPaid && (
                                      <Badge variant="outline" className="bg-red-100 text-red-800 hover:bg-red-100">
                                        Rent Due
                                      </Badge>
                                    )}
                                    {maintenanceCount > 0 && (
                                      <Badge variant="outline" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
                                        {maintenanceCount} Maintenance {maintenanceCount === 1 ? 'Issue' : 'Issues'}
                                      </Badge>
                                    )}
                                    {new Date(property.availableDate) <= new Date() && (
                                      <Badge variant="outline" className="bg-blue-100 text-blue-800 hover:bg-blue-100">
                                        Vacant
                                      </Badge>
                                    )}
                                  </div>
                                  
                                  <div className="flex justify-between">
                                    <Button 
                                      variant="outline" 
                                      className="border-primary text-primary"
                                      onClick={() => {
                                        window.location.href = `/properties/${property.id}`;
                                      }}
                                    >
                                      Details
                                    </Button>
                                    <Button 
                                      className="bg-primary hover:bg-primary-light"
                                      onClick={() => handleMessageTenant(property)}
                                    >
                                      <span className="material-icons mr-1">chat</span>
                                      Message
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>

            {/* Building Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-heading">Occupancy Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center">
                    <div className="w-16 h-16 rounded-full border-4 border-primary flex items-center justify-center mr-4">
                      <span className="text-xl font-bold">85%</span>
                    </div>
                    <div>
                      <p className="text-text-medium">17 out of 20 units occupied</p>
                      <p className="text-sm text-text-medium">3 units available</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-heading">Rent Collection</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center">
                    <div className="w-16 h-16 rounded-full border-4 border-primary flex items-center justify-center mr-4">
                      <span className="text-xl font-bold">92%</span>
                    </div>
                    <div>
                      <p className="text-text-medium">$45,600 collected this month</p>
                      <p className="text-sm text-text-medium">$3,850 pending</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-heading">Maintenance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center">
                    <div className="w-16 h-16 rounded-full border-4 border-primary flex items-center justify-center mr-4">
                      <span className="text-xl font-bold">4</span>
                    </div>
                    <div>
                      <p className="text-text-medium">Open maintenance requests</p>
                      <p className="text-sm text-text-medium">2 high priority</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>

      {/* Message Dialog */}
      <Dialog open={isMessageDialogOpen} onOpenChange={setIsMessageDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Message Tenant</DialogTitle>
            <DialogDescription>
              Send a message to the tenant of {selectedUnit?.title}
            </DialogDescription>
          </DialogHeader>
          
          <div className="mb-4">
            <label htmlFor="message" className="block text-sm font-medium text-text-medium mb-2">
              Message
            </label>
            <textarea
              id="message"
              rows={5}
              className="w-full p-3 border border-gray-200 rounded-lg focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
              placeholder="Type your message here..."
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
            ></textarea>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsMessageDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              className="bg-primary hover:bg-primary-light"
              onClick={handleSendMessage}
              disabled={!messageText.trim()}
            >
              Send Message
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <MobileNavigation />
    </div>
  );
}
