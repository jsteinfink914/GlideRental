import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import Navigation from "@/components/layout/Navigation";
import MobileNavigation from "@/components/layout/MobileNavigation";
import Sidebar from "@/components/layout/Sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function HomePage() {
  const { user } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    // Redirect to appropriate page based on user type
    if (user) {
      if (user.userType === "renter") {
        navigate("/search");
      } else if (user.userType === "landlord") {
        navigate("/landlord/leasing");
      }
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />

      <div className="flex flex-1">
        <Sidebar />

        <main className="flex-1 p-6 pt-8 lg:pt-6 lg:pl-64">
          <div className="container mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-heading font-bold text-text-dark mb-2">
                Welcome to Glide, {user?.firstName}!
              </h1>
              <p className="text-text-medium">
                Your modern rental platform with AI-powered matching
              </p>
            </div>

            {/* Dashboard content */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 rounded-full bg-primary bg-opacity-10 flex items-center justify-center mr-4">
                      <span className="material-icons text-primary">search</span>
                    </div>
                    <div>
                      <h2 className="text-xl font-heading font-medium">Find Properties</h2>
                      <p className="text-text-medium text-sm">Search for your perfect home</p>
                    </div>
                  </div>
                  <p className="mb-4 text-text-medium">
                    Browse thousands of listings tailored to your preferences with our AI-powered recommendations.
                  </p>
                  <Button onClick={() => navigate("/search")} className="bg-primary hover:bg-primary-light">
                    Start Searching
                  </Button>
                </CardContent>
              </Card>

              {user?.userType === "renter" ? (
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center mb-4">
                      <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center mr-4">
                        <span className="material-icons text-primary">dynamic_feed</span>
                      </div>
                      <div>
                        <h2 className="text-xl font-heading font-medium">For You Feed</h2>
                        <p className="text-text-medium text-sm">Personalized recommendations</p>
                      </div>
                    </div>
                    <p className="mb-4 text-text-medium">
                      Discover properties tailored to your preferences and share them with potential roommates.
                    </p>
                    <Button onClick={() => navigate("/feed")} variant="outline" className="border-primary text-primary hover:bg-secondary">
                      View Feed
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center mb-4">
                      <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center mr-4">
                        <span className="material-icons text-primary">apartment</span>
                      </div>
                      <div>
                        <h2 className="text-xl font-heading font-medium">Manage Listings</h2>
                        <p className="text-text-medium text-sm">Update your property listings</p>
                      </div>
                    </div>
                    <p className="mb-4 text-text-medium">
                      Manage your property listings, track applications, and communicate with potential tenants.
                    </p>
                    <Button 
                      onClick={() => navigate("/landlord/leasing")} 
                      variant="outline" 
                      className="border-primary text-primary hover:bg-secondary"
                    >
                      View Listings
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Additional cards based on user type */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {user?.userType === "renter" ? (
                <>
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center mb-4">
                        <span className="material-icons text-primary mr-2">view_list</span>
                        <h3 className="font-heading font-medium">Tools</h3>
                      </div>
                      <p className="text-sm text-text-medium mb-4">
                        Compare your saved listings and find the best match for your needs.
                      </p>
                      <Button variant="link" onClick={() => navigate("/tools")} className="text-primary p-0">
                        Use Tools
                      </Button>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center mb-4">
                        <span className="material-icons text-primary mr-2">location_city</span>
                        <h3 className="font-heading font-medium">Neighborhoods</h3>
                      </div>
                      <p className="text-sm text-text-medium mb-4">
                        Explore neighborhoods and discover local amenities.
                      </p>
                      <Button variant="link" onClick={() => navigate("/neighborhood")} className="text-primary p-0">
                        Explore Areas
                      </Button>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center mb-4">
                        <span className="material-icons text-primary mr-2">home</span>
                        <h3 className="font-heading font-medium">Portal</h3>
                      </div>
                      <p className="text-sm text-text-medium mb-4">
                        Access your building's portal for rent payments and maintenance requests.
                      </p>
                      <Button variant="link" onClick={() => navigate("/portal")} className="text-primary p-0">
                        Go to Portal
                      </Button>
                    </CardContent>
                  </Card>
                </>
              ) : (
                <>
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center mb-4">
                        <span className="material-icons text-primary mr-2">location_city</span>
                        <h3 className="font-heading font-medium">Buildings</h3>
                      </div>
                      <p className="text-sm text-text-medium mb-4">
                        Manage your buildings and units in one central dashboard.
                      </p>
                      <Button variant="link" onClick={() => navigate("/landlord/buildings")} className="text-primary p-0">
                        View Buildings
                      </Button>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center mb-4">
                        <span className="material-icons text-primary mr-2">chat</span>
                        <h3 className="font-heading font-medium">Messages</h3>
                      </div>
                      <p className="text-sm text-text-medium mb-4">
                        Communicate with current and prospective tenants.
                      </p>
                      <Button variant="link" onClick={() => navigate("/messages")} className="text-primary p-0">
                        View Messages
                      </Button>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center mb-4">
                        <span className="material-icons text-primary mr-2">add_circle</span>
                        <h3 className="font-heading font-medium">New Listing</h3>
                      </div>
                      <p className="text-sm text-text-medium mb-4">
                        Create a new property listing to attract potential tenants.
                      </p>
                      <Button variant="link" onClick={() => navigate("/landlord/leasing")} className="text-primary p-0">
                        Add Listing
                      </Button>
                    </CardContent>
                  </Card>
                </>
              )}
            </div>
          </div>
        </main>
      </div>

      <MobileNavigation />
    </div>
  );
}
