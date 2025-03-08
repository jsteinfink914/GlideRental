import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Navigation from "@/components/layout/Navigation";
import MobileNavigation from "@/components/layout/MobileNavigation";
import Sidebar from "@/components/layout/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import { MaintenanceRequest, Property } from "@shared/schema";

export default function PortalPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");

  // Fetch user's rented property
  const { data: rentedProperty, isLoading: isLoadingProperty } = useQuery({
    queryKey: ['/api/properties/rented'],
    queryFn: async () => {
      // This would be a real API call in a production app
      // For demonstration purposes, we'll return mock data
      return {
        id: 1,
        landlordId: 2,
        title: "Modern Apartment in SoHo",
        description: "Beautiful apartment with high ceilings and modern finishes",
        address: "123 Broadway",
        neighborhood: "SoHo",
        city: "New York",
        state: "NY",
        zipCode: "10013",
        rent: 2850,
        bedrooms: 2,
        bathrooms: 2,
        squareFeet: 950,
        propertyType: "apartment",
        availableDate: new Date("2023-05-01"),
        isPublished: true,
        hasVirtualTour: false,
        hasDoorman: true,
        hasInUnitLaundry: true,
        hasDishwasher: true,
        petFriendly: true,
        rating: 4.8,
        noFee: false,
        images: ["https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60"],
        amenities: ["In-unit laundry", "Dishwasher", "Central AC", "Elevator", "Doorman"],
        embedding: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        building: {
          id: 1,
          name: "SoHo Apartments",
          address: "123 Broadway",
          neighborhood: "SoHo",
          city: "New York",
          state: "NY"
        },
        landlord: {
          id: 2,
          firstName: "John",
          lastName: "Smith",
          email: "landlord@example.com"
        }
      };
    }
  });

  // Fetch maintenance requests
  const { data: maintenanceRequests, isLoading: isLoadingMaintenance } = useQuery({
    queryKey: ['/api/maintenance-requests'],
    enabled: !!rentedProperty
  });

  // Fetch upcoming payments
  const { data: payments, isLoading: isLoadingPayments } = useQuery({
    queryKey: ['/api/payments'],
    enabled: !!rentedProperty
  });

  // Format status for display
  const formatStatus = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Pending</Badge>;
      case 'in-progress':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800 hover:bg-blue-100">In Progress</Badge>;
      case 'completed':
        return <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-100">Completed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Format payment status
  const formatPaymentStatus = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Due</Badge>;
      case 'completed':
        return <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-100">Paid</Badge>;
      case 'failed':
        return <Badge variant="outline" className="bg-red-100 text-red-800 hover:bg-red-100">Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
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
              <h1 className="text-3xl font-heading font-bold text-text-dark">Renter Portal</h1>
              <p className="text-text-medium mt-2">
                Manage rent payments, maintenance requests, and communications
              </p>
            </div>

            {isLoadingProperty ? (
              <div className="space-y-6">
                <Skeleton className="h-40 w-full rounded-xl" />
                <div className="space-y-2">
                  <Skeleton className="h-8 w-64" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              </div>
            ) : !rentedProperty ? (
              <div className="text-center bg-secondary rounded-xl p-8">
                <div className="w-16 h-16 rounded-full bg-accent mx-auto mb-4 flex items-center justify-center">
                  <span className="material-icons text-white text-2xl">home</span>
                </div>
                <h3 className="font-heading font-medium text-lg text-text-dark mb-2">
                  No rental property found
                </h3>
                <p className="text-text-medium mb-4">
                  You don't have any active rentals in our system.
                </p>
                <Button 
                  className="bg-primary hover:bg-primary-light"
                  onClick={() => window.location.href = "/search"}
                >
                  Search for Rentals
                </Button>
              </div>
            ) : (
              <>
                {/* Property Overview */}
                <Card className="mb-6">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row gap-6">
                      <div className="w-full md:w-1/3">
                        <img 
                          src={rentedProperty.images[0]} 
                          alt={rentedProperty.title}
                          className="rounded-lg w-full h-48 object-cover"
                        />
                      </div>
                      <div className="w-full md:w-2/3">
                        <h2 className="text-2xl font-heading font-semibold mb-2">
                          {rentedProperty.title}
                        </h2>
                        <p className="text-text-medium mb-4">
                          {rentedProperty.address}, {rentedProperty.neighborhood}, {rentedProperty.city}, {rentedProperty.state} {rentedProperty.zipCode}
                        </p>
                        
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                          <div>
                            <p className="text-text-medium text-sm">Monthly Rent</p>
                            <p className="font-medium">${rentedProperty.rent.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-text-medium text-sm">Apartment Size</p>
                            <p className="font-medium">
                              {rentedProperty.bedrooms === 0 ? 'Studio' : `${rentedProperty.bedrooms} bed`} / {rentedProperty.bathrooms} bath
                            </p>
                          </div>
                          <div>
                            <p className="text-text-medium text-sm">Square Feet</p>
                            <p className="font-medium">{rentedProperty.squareFeet.toLocaleString()} sqft</p>
                          </div>
                          <div>
                            <p className="text-text-medium text-sm">Building</p>
                            <p className="font-medium">{rentedProperty.building.name}</p>
                          </div>
                          <div>
                            <p className="text-text-medium text-sm">Landlord</p>
                            <p className="font-medium">{rentedProperty.landlord.firstName} {rentedProperty.landlord.lastName}</p>
                          </div>
                          <div>
                            <p className="text-text-medium text-sm">Move-in Date</p>
                            <p className="font-medium">
                              {new Date(rentedProperty.availableDate).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex flex-wrap gap-2">
                          {rentedProperty.amenities.map((amenity, index) => (
                            <Badge key={index} variant="secondary">
                              {amenity}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Portal Tabs */}
                <Tabs 
                  value={activeTab} 
                  onValueChange={setActiveTab}
                  className="space-y-4"
                >
                  <TabsList className="mb-4">
                    <TabsTrigger value="overview" className="px-6">Overview</TabsTrigger>
                    <TabsTrigger value="maintenance" className="px-6">Maintenance</TabsTrigger>
                    <TabsTrigger value="payments" className="px-6">Payments</TabsTrigger>
                    <TabsTrigger value="documents" className="px-6">Documents</TabsTrigger>
                    <TabsTrigger value="messages" className="px-6">Messages</TabsTrigger>
                  </TabsList>

                  {/* Overview Tab */}
                  <TabsContent value="overview">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Rent Payment */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-xl font-heading">Upcoming Rent</CardTitle>
                        </CardHeader>
                        <CardContent>
                          {isLoadingPayments ? (
                            <Skeleton className="h-24 w-full" />
                          ) : payments?.length ? (
                            <div>
                              <div className="flex justify-between mb-4">
                                <div>
                                  <p className="text-text-medium text-sm">Next Payment</p>
                                  <p className="font-medium text-lg">${rentedProperty.rent.toLocaleString()}</p>
                                </div>
                                <div>
                                  <p className="text-text-medium text-sm">Due Date</p>
                                  <p className="font-medium">June 1, 2023</p>
                                </div>
                                <div>
                                  <p className="text-text-medium text-sm">Status</p>
                                  {formatPaymentStatus('pending')}
                                </div>
                              </div>
                              <Button 
                                className="w-full bg-primary hover:bg-primary-light"
                                onClick={() => window.location.href = "/payments"}
                              >
                                Pay Rent
                              </Button>
                            </div>
                          ) : (
                            <div className="text-center py-4">
                              <p className="text-text-medium mb-4">No upcoming payments</p>
                              <Button variant="outline" className="border-primary text-primary">
                                View Payment History
                              </Button>
                            </div>
                          )}
                        </CardContent>
                      </Card>

                      {/* Maintenance Requests */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-xl font-heading">Recent Maintenance</CardTitle>
                        </CardHeader>
                        <CardContent>
                          {isLoadingMaintenance ? (
                            <div className="space-y-2">
                              <Skeleton className="h-6 w-3/4" />
                              <Skeleton className="h-4 w-full" />
                              <Skeleton className="h-6 w-3/4 mt-4" />
                              <Skeleton className="h-4 w-full" />
                            </div>
                          ) : maintenanceRequests?.length ? (
                            <div className="space-y-4">
                              {maintenanceRequests.slice(0, 2).map((request: MaintenanceRequest) => (
                                <div key={request.id} className="border-b pb-4 last:border-0 last:pb-0">
                                  <div className="flex justify-between mb-1">
                                    <h4 className="font-medium">{request.title}</h4>
                                    {formatStatus(request.status)}
                                  </div>
                                  <p className="text-sm text-text-medium mb-2">{request.description}</p>
                                  <p className="text-xs text-text-medium">
                                    Submitted: {new Date(request.createdAt).toLocaleDateString()}
                                  </p>
                                </div>
                              ))}
                              <Button 
                                variant="outline" 
                                className="w-full border-primary text-primary mt-2"
                                onClick={() => setActiveTab("maintenance")}
                              >
                                View All Requests
                              </Button>
                            </div>
                          ) : (
                            <div className="text-center py-4">
                              <p className="text-text-medium mb-4">No maintenance requests</p>
                              <Button 
                                variant="outline" 
                                className="border-primary text-primary"
                                onClick={() => setActiveTab("maintenance")}
                              >
                                Submit Request
                              </Button>
                            </div>
                          )}
                        </CardContent>
                      </Card>

                      {/* Building Announcements */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-xl font-heading">Building Announcements</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <Alert className="mb-4">
                            <AlertTitle className="font-medium">Fire Alarm Testing</AlertTitle>
                            <AlertDescription>
                              Fire alarm testing will be conducted on Tuesday, June 15 from 10am to 12pm.
                            </AlertDescription>
                          </Alert>
                          <Alert className="mb-4">
                            <AlertTitle className="font-medium">Lobby Renovation</AlertTitle>
                            <AlertDescription>
                              The lobby renovation will begin on Monday, June 7 and is expected to be completed by June 14.
                            </AlertDescription>
                          </Alert>
                        </CardContent>
                      </Card>

                      {/* Contact Info */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-xl font-heading">Important Contacts</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div>
                              <h4 className="font-medium">Building Manager</h4>
                              <p className="text-text-medium">Sarah Johnson</p>
                              <p className="text-text-medium">(212) 555-1234</p>
                              <a href="mailto:manager@building.com" className="text-primary hover:underline">
                                manager@building.com
                              </a>
                            </div>
                            <div>
                              <h4 className="font-medium">Maintenance Staff</h4>
                              <p className="text-text-medium">David Chen</p>
                              <p className="text-text-medium">(212) 555-5678</p>
                              <a href="mailto:maintenance@building.com" className="text-primary hover:underline">
                                maintenance@building.com
                              </a>
                            </div>
                            <div>
                              <h4 className="font-medium">Front Desk</h4>
                              <p className="text-text-medium">(212) 555-9012</p>
                              <p className="text-text-medium">Available 24/7</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>

                  {/* Maintenance Tab */}
                  <TabsContent value="maintenance">
                    <Card>
                      <CardHeader>
                        <div className="flex justify-between items-center">
                          <CardTitle className="text-xl font-heading">Maintenance Requests</CardTitle>
                          <Button className="bg-primary hover:bg-primary-light">
                            New Request
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {isLoadingMaintenance ? (
                          <div className="space-y-4">
                            {Array.from({ length: 3 }).map((_, i) => (
                              <div key={i} className="border-b pb-4">
                                <Skeleton className="h-6 w-1/2 mb-2" />
                                <Skeleton className="h-4 w-full mb-2" />
                                <div className="flex justify-between">
                                  <Skeleton className="h-4 w-24" />
                                  <Skeleton className="h-4 w-24" />
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : !maintenanceRequests?.length ? (
                          <div className="text-center py-8">
                            <div className="w-16 h-16 rounded-full bg-accent mx-auto mb-4 flex items-center justify-center">
                              <span className="material-icons text-white text-2xl">build</span>
                            </div>
                            <h3 className="font-heading font-medium text-lg text-text-dark mb-2">
                              No maintenance requests
                            </h3>
                            <p className="text-text-medium mb-4">
                              Submit a request when you need something fixed in your apartment
                            </p>
                            <Button className="bg-primary hover:bg-primary-light">
                              Submit Request
                            </Button>
                          </div>
                        ) : (
                          <div className="space-y-6">
                            {maintenanceRequests.map((request: MaintenanceRequest) => (
                              <div key={request.id} className="border-b pb-6 last:border-0 last:pb-0">
                                <div className="flex justify-between mb-2">
                                  <h4 className="text-lg font-medium">{request.title}</h4>
                                  {formatStatus(request.status)}
                                </div>
                                <p className="text-text-medium mb-4">{request.description}</p>
                                <div className="flex justify-between text-sm text-text-medium">
                                  <div>
                                    <span className="inline-block mr-4">
                                      <span className="font-medium">Priority:</span> {request.priority}
                                    </span>
                                    <span className="inline-block">
                                      <span className="font-medium">Created:</span> {new Date(request.createdAt).toLocaleDateString()}
                                    </span>
                                  </div>
                                  <div>
                                    {request.status !== 'completed' && (
                                      <Button variant="link" className="text-primary p-0">
                                        Update
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Payments Tab */}
                  <TabsContent value="payments">
                    <Card>
                      <CardHeader>
                        <div className="flex justify-between items-center">
                          <CardTitle className="text-xl font-heading">Payment History</CardTitle>
                          <Button className="bg-primary hover:bg-primary-light">
                            Make Payment
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {isLoadingPayments ? (
                          <div className="space-y-4">
                            {Array.from({ length: 3 }).map((_, i) => (
                              <div key={i} className="border-b pb-4">
                                <div className="flex justify-between mb-2">
                                  <Skeleton className="h-6 w-32" />
                                  <Skeleton className="h-6 w-24" />
                                </div>
                                <div className="flex justify-between">
                                  <Skeleton className="h-4 w-24" />
                                  <Skeleton className="h-4 w-20" />
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="space-y-4">
                            <div className="border-b pb-4">
                              <div className="flex justify-between mb-2">
                                <div>
                                  <h4 className="font-medium">June 2023 Rent</h4>
                                  <p className="text-sm text-text-medium">Due: Jun 1, 2023</p>
                                </div>
                                <div className="text-right">
                                  <p className="font-medium">${rentedProperty.rent.toLocaleString()}</p>
                                  {formatPaymentStatus('pending')}
                                </div>
                              </div>
                              <div className="flex justify-end">
                                <Button className="bg-primary hover:bg-primary-light">
                                  Pay Now
                                </Button>
                              </div>
                            </div>
                            <div className="border-b pb-4">
                              <div className="flex justify-between mb-2">
                                <div>
                                  <h4 className="font-medium">May 2023 Rent</h4>
                                  <p className="text-sm text-text-medium">Paid: May 1, 2023</p>
                                </div>
                                <div className="text-right">
                                  <p className="font-medium">${rentedProperty.rent.toLocaleString()}</p>
                                  {formatPaymentStatus('completed')}
                                </div>
                              </div>
                              <div className="flex justify-end">
                                <Button variant="outline" className="border-primary text-primary">
                                  View Receipt
                                </Button>
                              </div>
                            </div>
                            <div className="border-b pb-4">
                              <div className="flex justify-between mb-2">
                                <div>
                                  <h4 className="font-medium">April 2023 Rent</h4>
                                  <p className="text-sm text-text-medium">Paid: Apr 1, 2023</p>
                                </div>
                                <div className="text-right">
                                  <p className="font-medium">${rentedProperty.rent.toLocaleString()}</p>
                                  {formatPaymentStatus('completed')}
                                </div>
                              </div>
                              <div className="flex justify-end">
                                <Button variant="outline" className="border-primary text-primary">
                                  View Receipt
                                </Button>
                              </div>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Documents Tab */}
                  <TabsContent value="documents">
                    <Card>
                      <CardHeader>
                        <div className="flex justify-between items-center">
                          <CardTitle className="text-xl font-heading">Documents</CardTitle>
                          <Button className="bg-primary hover:bg-primary-light">
                            Upload Document
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-6">
                          <div>
                            <h3 className="font-medium text-lg mb-4">Lease Documents</h3>
                            <div className="space-y-2">
                              <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                                <div className="flex items-center">
                                  <span className="material-icons text-primary mr-3">description</span>
                                  <div>
                                    <p className="font-medium">Lease Agreement</p>
                                    <p className="text-sm text-text-medium">Uploaded: May 1, 2023</p>
                                  </div>
                                </div>
                                <Button variant="ghost" size="icon">
                                  <span className="material-icons">download</span>
                                </Button>
                              </div>
                              <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                                <div className="flex items-center">
                                  <span className="material-icons text-primary mr-3">description</span>
                                  <div>
                                    <p className="font-medium">Building Rules & Regulations</p>
                                    <p className="text-sm text-text-medium">Uploaded: May 1, 2023</p>
                                  </div>
                                </div>
                                <Button variant="ghost" size="icon">
                                  <span className="material-icons">download</span>
                                </Button>
                              </div>
                            </div>
                          </div>

                          <div>
                            <h3 className="font-medium text-lg mb-4">Your Documents</h3>
                            <div className="space-y-2">
                              <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                                <div className="flex items-center">
                                  <span className="material-icons text-primary mr-3">description</span>
                                  <div>
                                    <p className="font-medium">Proof of Income</p>
                                    <p className="text-sm text-text-medium">Uploaded: Apr 15, 2023</p>
                                  </div>
                                </div>
                                <div className="flex">
                                  <Button variant="ghost" size="icon">
                                    <span className="material-icons">download</span>
                                  </Button>
                                  <Button variant="ghost" size="icon">
                                    <span className="material-icons">delete</span>
                                  </Button>
                                </div>
                              </div>
                              <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                                <div className="flex items-center">
                                  <span className="material-icons text-primary mr-3">description</span>
                                  <div>
                                    <p className="font-medium">Renter's Insurance</p>
                                    <p className="text-sm text-text-medium">Uploaded: Apr 20, 2023</p>
                                  </div>
                                </div>
                                <div className="flex">
                                  <Button variant="ghost" size="icon">
                                    <span className="material-icons">download</span>
                                  </Button>
                                  <Button variant="ghost" size="icon">
                                    <span className="material-icons">delete</span>
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Messages Tab */}
                  <TabsContent value="messages">
                    <Card>
                      <CardHeader>
                        <div className="flex justify-between items-center">
                          <CardTitle className="text-xl font-heading">Building Messages</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="border-b pb-4">
                            <div className="flex justify-between mb-2">
                              <h4 className="font-medium">Water Shut-off Notice</h4>
                              <p className="text-sm text-text-medium">June 2, 2023</p>
                            </div>
                            <p className="text-text-medium mb-2">
                              Water will be shut off on Thursday, June 8 from 10am to 2pm for scheduled maintenance.
                            </p>
                            <p className="text-sm text-text-medium">
                              From: Building Management
                            </p>
                          </div>
                          <div className="border-b pb-4">
                            <div className="flex justify-between mb-2">
                              <h4 className="font-medium">Package Delivery</h4>
                              <p className="text-sm text-text-medium">May 28, 2023</p>
                            </div>
                            <p className="text-text-medium mb-2">
                              You have a package waiting at the front desk. Please pick it up during front desk hours (8am-8pm).
                            </p>
                            <p className="text-sm text-text-medium">
                              From: Front Desk
                            </p>
                          </div>
                          <div className="border-b pb-4">
                            <div className="flex justify-between mb-2">
                              <h4 className="font-medium">Roof Deck Now Open</h4>
                              <p className="text-sm text-text-medium">May 20, 2023</p>
                            </div>
                            <p className="text-text-medium mb-2">
                              The roof deck is now open for the season! Hours are 8am to 10pm daily. Please remember to follow all posted rules.
                            </p>
                            <p className="text-sm text-text-medium">
                              From: Building Management
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </>
            )}
          </div>
        </main>
      </div>

      <MobileNavigation />
    </div>
  );
}
