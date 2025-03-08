import { useState } from "react";
import Navigation from "@/components/layout/Navigation";
import MobileNavigation from "@/components/layout/MobileNavigation";
import Sidebar from "@/components/layout/Sidebar";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Neighborhood data
const neighborhoods = [
  {
    id: 1,
    name: "SoHo",
    city: "New York",
    description: "Known for its cast-iron architecture and art galleries, SoHo is a trendy neighborhood with high-end shopping and dining.",
    image: "https://images.unsplash.com/photo-1566156403086-4b6174e1b2c2?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
    averageRent: 3500,
    walkScore: 98,
    transitScore: 95,
    amenities: ["Art Galleries", "Boutique Shopping", "Fine Dining", "Coffee Shops"]
  },
  {
    id: 2,
    name: "Williamsburg",
    city: "Brooklyn",
    description: "A vibrant area known for its indie music scene, art, and trendy restaurants. Popular with young professionals and creatives.",
    image: "https://images.unsplash.com/photo-1568111561564-68d3ff7afc22?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
    averageRent: 2800,
    walkScore: 95,
    transitScore: 87,
    amenities: ["Breweries", "Music Venues", "Farmers Market", "Waterfront Parks"]
  },
  {
    id: 3,
    name: "Chelsea",
    city: "New York",
    description: "Famous for its art galleries, Chelsea Market, and the High Line. A diverse neighborhood with great dining and nightlife.",
    image: "https://images.unsplash.com/photo-1518802508264-76256089cddb?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
    averageRent: 3200,
    walkScore: 97,
    transitScore: 92,
    amenities: ["Art Galleries", "High Line Park", "Chelsea Market", "Fine Dining"]
  },
  {
    id: 4,
    name: "Upper West Side",
    city: "New York",
    description: "A family-friendly area with beautiful brownstones, proximity to Central Park, and numerous cultural institutions.",
    image: "https://images.unsplash.com/photo-1574308423203-2a20bf8dd24f?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
    averageRent: 3100,
    walkScore: 96,
    transitScore: 90,
    amenities: ["Museums", "Central Park", "Riverside Park", "Gourmet Grocery Stores"]
  },
  {
    id: 5,
    name: "Park Slope",
    city: "Brooklyn",
    description: "Known for its beautiful brownstones, Prospect Park, and family-friendly atmosphere. Popular with young families.",
    image: "https://images.unsplash.com/photo-1592494657635-ba21ca29793c?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
    averageRent: 2750,
    walkScore: 94,
    transitScore: 85,
    amenities: ["Prospect Park", "Historic Brownstones", "Family-Friendly Restaurants", "Farmers Market"]
  },
  {
    id: 6,
    name: "East Village",
    city: "New York",
    description: "A diverse and eclectic neighborhood known for its vibrant nightlife, international cuisine, and bohemian atmosphere.",
    image: "https://images.unsplash.com/photo-1560093230-101306845069?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
    averageRent: 2900,
    walkScore: 98,
    transitScore: 88,
    amenities: ["Bars & Nightlife", "Unique Boutiques", "International Cuisine", "Tompkins Square Park"]
  }
];

// Local businesses
const localBusinesses = [
  {
    id: 1,
    name: "Artisan Coffee Roasters",
    type: "Cafe",
    neighborhood: "SoHo",
    description: "Specialty coffee shop with single-origin beans and artisanal pastries.",
    image: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
    rating: 4.8
  },
  {
    id: 2,
    name: "Green Market Co-op",
    type: "Grocery",
    neighborhood: "Park Slope",
    description: "Local organic grocery store with farm-to-table produce and sustainably sourced items.",
    image: "https://images.unsplash.com/photo-1534723452862-4c874018d66d?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
    rating: 4.7
  },
  {
    id: 3,
    name: "Urban Fitness Studio",
    type: "Fitness",
    neighborhood: "Chelsea",
    description: "Boutique fitness studio offering yoga, HIIT, and personalized training sessions.",
    image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
    rating: 4.9
  },
  {
    id: 4,
    name: "The Neighborhood Bookshop",
    type: "Retail",
    neighborhood: "Upper West Side",
    description: "Independent bookstore with a curated collection of bestsellers, classics, and local authors.",
    image: "https://images.unsplash.com/photo-1526243741027-444d633d7365?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
    rating: 4.6
  },
  {
    id: 5,
    name: "Craft Brewery & Taproom",
    type: "Entertainment",
    neighborhood: "Williamsburg",
    description: "Local brewery with rotating craft beers on tap and a beer garden atmosphere.",
    image: "https://images.unsplash.com/photo-1559526322-cb97e0c34743?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
    rating: 4.8
  },
  {
    id: 6,
    name: "Global Fusion Restaurant",
    type: "Dining",
    neighborhood: "East Village",
    description: "Innovative restaurant blending flavors from around the world with locally sourced ingredients.",
    image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
    rating: 4.7
  }
];

export default function NeighborhoodPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("neighborhoods");

  // Filter neighborhoods based on search term
  const filteredNeighborhoods = neighborhoods.filter(neighborhood => 
    neighborhood.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    neighborhood.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
    neighborhood.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Filter businesses based on search term
  const filteredBusinesses = localBusinesses.filter(business => 
    business.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    business.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    business.neighborhood.toLowerCase().includes(searchTerm.toLowerCase()) ||
    business.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />

      <div className="flex flex-1">
        <Sidebar />

        <main className="flex-1 lg:pl-64 pb-16 md:pb-0">
          <div className="container mx-auto px-4 py-6">
            {/* Page Title */}
            <div className="mb-6">
              <h1 className="text-3xl font-heading font-bold text-text-dark">Neighborhoods</h1>
              <p className="text-text-medium mt-2">
                Explore neighborhoods and discover local businesses
              </p>
            </div>

            {/* Search */}
            <div className="relative mb-6">
              <span className="material-icons absolute left-3 top-1/2 transform -translate-y-1/2 text-text-medium">search</span>
              <Input
                placeholder="Search neighborhoods, businesses, or amenities..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Tabs */}
            <Tabs 
              value={activeTab} 
              onValueChange={setActiveTab}
              className="mb-6"
            >
              <TabsList className="mb-6">
                <TabsTrigger value="neighborhoods" className="px-6">Neighborhoods</TabsTrigger>
                <TabsTrigger value="businesses" className="px-6">Local Businesses</TabsTrigger>
              </TabsList>

              {/* Neighborhoods Tab */}
              <TabsContent value="neighborhoods">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredNeighborhoods.map(neighborhood => (
                    <Card key={neighborhood.id} className="overflow-hidden">
                      <CardContent className="p-0">
                        <div className="relative h-48">
                          <img 
                            src={neighborhood.image} 
                            alt={neighborhood.name}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                          <div className="absolute bottom-4 left-4 text-white">
                            <h3 className="text-xl font-heading font-semibold">{neighborhood.name}</h3>
                            <p>{neighborhood.city}</p>
                          </div>
                        </div>
                        <div className="p-4">
                          <p className="text-text-medium text-sm mb-4">{neighborhood.description}</p>
                          <div className="flex justify-between items-center mb-4">
                            <div>
                              <span className="font-medium">Avg. Rent:</span> ${neighborhood.averageRent}/mo
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="flex items-center">
                                <span className="material-icons text-primary text-sm mr-1">directions_walk</span>
                                <span className="text-sm">{neighborhood.walkScore}</span>
                              </div>
                              <div className="flex items-center">
                                <span className="material-icons text-primary text-sm mr-1">train</span>
                                <span className="text-sm">{neighborhood.transitScore}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2 mb-4">
                            {neighborhood.amenities.map((amenity, index) => (
                              <span 
                                key={index} 
                                className="text-xs bg-secondary text-primary px-2 py-1 rounded-full"
                              >
                                {amenity}
                              </span>
                            ))}
                          </div>
                          <Button variant="link" className="text-primary p-0">
                            View Properties
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              {/* Local Businesses Tab */}
              <TabsContent value="businesses">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredBusinesses.map(business => (
                    <Card key={business.id} className="overflow-hidden">
                      <CardContent className="p-0">
                        <div className="relative h-48">
                          <img 
                            src={business.image} 
                            alt={business.name}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute top-3 right-3 bg-white rounded-lg px-2 py-1 text-sm font-medium flex items-center">
                            <span className="material-icons text-warning text-sm mr-1">star</span>
                            {business.rating}
                          </div>
                        </div>
                        <div className="p-4">
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="font-heading font-medium text-lg text-text-dark">{business.name}</h3>
                            <span className="text-xs bg-secondary text-primary px-2 py-1 rounded-full">
                              {business.type}
                            </span>
                          </div>
                          <p className="text-text-medium text-sm mb-1">
                            {business.neighborhood}
                          </p>
                          <p className="text-text-medium text-sm mb-4">
                            {business.description}
                          </p>
                          <div className="flex justify-between">
                            <Button variant="outline" className="text-primary">
                              Learn More
                            </Button>
                            <Button variant="outline" className="text-primary">
                              Save
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
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
