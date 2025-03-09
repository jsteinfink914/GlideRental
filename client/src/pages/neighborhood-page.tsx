import { useState, useEffect } from "react";
import Navigation from "@/components/layout/Navigation";
import MobileNavigation from "@/components/layout/MobileNavigation";
import Sidebar from "@/components/layout/Sidebar";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Property } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";

// Local amenities by category
const amenities = [
  {
    id: 1,
    name: "Fresh Market Grocery",
    type: "Grocery",
    distance: 0.2,
    address: "123 Main Street",
    rating: 4.6,
    description: "Local grocery store with fresh produce and organic selections.",
    image: "https://images.unsplash.com/photo-1542838132-92c53300491e",
    hours: "7am - 10pm",
    features: ["Organic", "Local Produce", "Deli Counter"]
  },
  {
    id: 2,
    name: "City Pharmacy",
    type: "Pharmacy",
    distance: 0.3,
    address: "456 Elm Avenue",
    rating: 4.8,
    description: "Full-service pharmacy with prescription services and health products.",
    image: "https://images.unsplash.com/photo-1563453392212-326f5e854473",
    hours: "8am - 9pm",
    features: ["24-Hour Pickup", "Drive-Thru", "Vaccination Services"]
  },
  {
    id: 3,
    name: "Spotless Cleaners",
    type: "Dry Cleaner",
    distance: 0.4,
    address: "789 Oak Boulevard",
    rating: 4.7,
    description: "Professional dry cleaning with same-day service available.",
    image: "https://images.unsplash.com/photo-1545173168-9f1947eebb7f",
    hours: "7am - 7pm",
    features: ["Same Day Service", "Eco-Friendly", "Alterations"]
  },
  {
    id: 4,
    name: "Community Fitness Center",
    type: "Gym",
    distance: 0.5,
    address: "321 Pine Street",
    rating: 4.5,
    description: "Modern gym with classes, equipment, and personal training.",
    image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48",
    hours: "5am - 11pm",
    features: ["Classes Included", "Pool", "Sauna"]
  },
  {
    id: 5,
    name: "Neighborhood Cafe",
    type: "Cafe",
    distance: 0.1,
    address: "555 Maple Road",
    rating: 4.9,
    description: "Cozy cafe with specialty coffee, pastries, and light meals.",
    image: "https://images.unsplash.com/photo-1554118811-1e0d58224f24",
    hours: "6am - 8pm",
    features: ["Free WiFi", "Outdoor Seating", "Local Roasters"]
  },
  {
    id: 6,
    name: "Quick Mart",
    type: "Convenience Store",
    distance: 0.2,
    address: "222 Cedar Lane",
    rating: 4.3,
    description: "Convenience store with essentials and late-night hours.",
    image: "https://images.unsplash.com/photo-1578916171728-46686eac299d",
    hours: "6am - 12am",
    features: ["ATM", "Lottery", "Hot Food"]
  },
  {
    id: 7,
    name: "Parkside Laundromat",
    type: "Laundromat",
    distance: 0.3,
    address: "444 Birch Street",
    rating: 4.4,
    description: "Clean, modern laundromat with large-capacity machines.",
    image: "https://images.unsplash.com/photo-1521656693074-0ef32e80a5d5",
    hours: "6am - 10pm",
    features: ["Free WiFi", "Wash & Fold Service", "Card Payment"]
  },
  {
    id: 8,
    name: "Urban Hardware",
    type: "Hardware Store",
    distance: 0.6,
    address: "888 Walnut Avenue",
    rating: 4.7,
    description: "Family-owned hardware store with helpful staff and wide selection.",
    image: "https://images.unsplash.com/photo-1516972810927-80185773b7a8",
    hours: "8am - 7pm",
    features: ["Key Cutting", "Paint Mixing", "Tool Rental"]
  },
  {
    id: 9,
    name: "Corner Liquor & Wine",
    type: "Liquor Store",
    distance: 0.4,
    address: "999 Spruce Boulevard",
    rating: 4.5,
    description: "Curated selection of wines, spirits, and craft beers.",
    image: "https://images.unsplash.com/photo-1516541196182-6bdb0516ed27",
    hours: "10am - 10pm",
    features: ["Wine Tastings", "Local Spirits", "Craft Beer"]
  },
  {
    id: 10,
    name: "Village Pet Shop",
    type: "Pet Store",
    distance: 0.7,
    address: "111 Aspen Court",
    rating: 4.8,
    description: "Pet supplies, food, and grooming services for all pets.",
    image: "https://images.unsplash.com/photo-1583337130417-3346a1be7dee",
    hours: "9am - 8pm",
    features: ["Grooming", "Self-Wash Stations", "Premium Foods"]
  },
  {
    id: 11,
    name: "Neighborhood Bank",
    type: "Bank",
    distance: 0.5,
    address: "777 Redwood Drive",
    rating: 4.2,
    description: "Full-service bank with ATMs and financial advisors.",
    image: "https://images.unsplash.com/photo-1601597111158-2fceff292cdc",
    hours: "9am - 5pm",
    features: ["24-Hour ATM", "Notary Service", "Safe Deposit Boxes"]
  },
  {
    id: 12,
    name: "Community Health Clinic",
    type: "Medical",
    distance: 0.8,
    address: "333 Sycamore Street",
    rating: 4.7,
    description: "Walk-in clinic for routine care and minor emergencies.",
    image: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d",
    hours: "8am - 8pm",
    features: ["Walk-In Welcome", "Telehealth", "Lab Services"]
  }
];

// Categories for filtering
const categories = [
  { id: "all", name: "All", icon: "category" },
  { id: "grocery", name: "Grocery", icon: "shopping_cart" },
  { id: "pharmacy", name: "Pharmacy", icon: "medication" },
  { id: "dry-cleaner", name: "Dry Cleaner", icon: "dry_cleaning" },
  { id: "gym", name: "Gym", icon: "fitness_center" },
  { id: "cafe", name: "Cafe", icon: "local_cafe" },
  { id: "convenience", name: "Convenience", icon: "storefront" },
  { id: "laundromat", name: "Laundromat", icon: "local_laundry_service" },
  { id: "hardware", name: "Hardware", icon: "hardware" },
  { id: "liquor", name: "Liquor", icon: "liquor" },
  { id: "pet", name: "Pet Store", icon: "pets" },
  { id: "bank", name: "Bank", icon: "account_balance" },
  { id: "medical", name: "Medical", icon: "medical_services" }
];

export default function NeighborhoodPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [activeTab, setActiveTab] = useState("nearby");

  // Get properties data
  const { data: properties } = useQuery<Property[]>({
    queryKey: ['/api/properties'],
  });

  // Set the first property as the default selected property when data loads
  useEffect(() => {
    if (properties && properties.length > 0 && !selectedProperty) {
      setSelectedProperty(properties[0]);
    }
  }, [properties, selectedProperty]);

  // Filter amenities based on category and search
  const filteredAmenities = amenities.filter(amenity => {
    const matchesSearch = searchTerm === "" || 
      amenity.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      amenity.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      amenity.description.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesCategory = activeCategory === "all" || 
      amenity.type.toLowerCase().includes(activeCategory.toLowerCase());
      
    return matchesSearch && matchesCategory;
  });

  // Sort amenities by distance
  const sortedAmenities = [...filteredAmenities].sort((a, b) => a.distance - b.distance);

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />

      <div className="flex flex-1">
        <Sidebar />

        <main className="flex-1 lg:pl-64 pb-16 md:pb-0">
          <div className="container mx-auto px-4 py-6">
            {/* Page Title */}
            <div className="mb-6">
              <h1 className="text-3xl font-heading font-bold text-text-dark">Neighborhood</h1>
              <p className="text-text-medium mt-2">
                Discover amenities and services near your rental
              </p>
            </div>

            {/* Property Selector */}
            <Card className="mb-6">
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row gap-4 items-center">
                  <div className="min-w-fit">
                    <h3 className="font-medium text-lg">Selected Property</h3>
                    <div className="text-sm text-text-medium">Choose a property to see nearby amenities</div>
                  </div>
                  <div className="flex-1">
                    <select 
                      className="w-full p-2 border rounded-md"
                      value={selectedProperty?.id || ""}
                      onChange={(e) => {
                        const property = properties?.find(p => p.id === Number(e.target.value));
                        if (property) setSelectedProperty(property);
                      }}
                    >
                      {properties?.map(property => (
                        <option key={property.id} value={property.id}>
                          {property.title} - {property.neighborhood}
                        </option>
                      ))}
                    </select>
                  </div>
                  <Button variant="outline" className="whitespace-nowrap">
                    Use Current Location
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Tabs */}
            <Tabs 
              value={activeTab} 
              onValueChange={setActiveTab}
              className="mb-6"
            >
              <TabsList className="mb-6">
                <TabsTrigger value="nearby" className="px-6">Nearby Amenities</TabsTrigger>
                <TabsTrigger value="map" className="px-6">Map View</TabsTrigger>
              </TabsList>

              {/* Nearby Amenities Tab */}
              <TabsContent value="nearby">
                {/* Search & Categories */}
                <div className="mb-6 space-y-4">
                  <div className="relative">
                    <span className="material-icons absolute left-3 top-1/2 transform -translate-y-1/2 text-text-medium">search</span>
                    <Input
                      placeholder="Search for grocery stores, pharmacies, cleaners..."
                      className="pl-10"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  
                  {/* Categories */}
                  <div className="flex overflow-x-auto pb-2 gap-2">
                    {categories.map(category => (
                      <Button
                        key={category.id}
                        variant={activeCategory === category.id ? "default" : "outline"}
                        className="flex items-center gap-1 whitespace-nowrap px-3"
                        onClick={() => setActiveCategory(category.id)}
                      >
                        <span className="material-icons text-sm">{category.icon}</span>
                        {category.name}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Amenities List */}
                <div className="space-y-4">
                  {sortedAmenities.length === 0 ? (
                    <div className="text-center py-8 bg-gray-50 rounded-lg">
                      <span className="material-icons text-4xl text-text-light mb-2">search_off</span>
                      <h3 className="font-medium text-lg mb-2">No amenities found</h3>
                      <p className="text-text-medium">
                        Try adjusting your search or category filters.
                      </p>
                    </div>
                  ) : (
                    sortedAmenities.map(amenity => (
                      <Card key={amenity.id} className="overflow-hidden">
                        <CardContent className="p-0">
                          <div className="flex flex-col md:flex-row">
                            <div className="md:w-1/4 h-40 md:h-auto">
                              <img 
                                src={amenity.image} 
                                alt={amenity.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="p-4 md:w-3/4">
                              <div className="flex flex-col md:flex-row md:items-start justify-between gap-2 mb-2">
                                <div>
                                  <h3 className="text-lg font-medium">{amenity.name}</h3>
                                  <p className="text-text-medium text-sm">{amenity.address}</p>
                                </div>
                                <div className="flex items-center gap-3">
                                  <Badge variant="outline" className="flex items-center gap-1">
                                    <span className="material-icons text-xs">straighten</span>
                                    {amenity.distance} mi
                                  </Badge>
                                  <Badge variant="outline" className="flex items-center gap-1">
                                    <span className="material-icons text-warning text-xs">star</span>
                                    {amenity.rating}
                                  </Badge>
                                </div>
                              </div>
                              
                              <p className="text-sm mb-3">{amenity.description}</p>
                              
                              <div className="flex items-center gap-2 mb-3 text-sm">
                                <span className="material-icons text-primary text-xs">schedule</span>
                                <span className="text-text-medium">{amenity.hours}</span>
                              </div>
                              
                              <div className="flex flex-wrap gap-2 mb-4">
                                {amenity.features.map((feature, index) => (
                                  <Badge key={index} variant="secondary" className="text-xs">
                                    {feature}
                                  </Badge>
                                ))}
                              </div>
                              
                              <div className="flex justify-between">
                                <Button variant="outline" size="sm" className="flex items-center gap-1">
                                  <span className="material-icons text-xs">directions</span>
                                  Directions
                                </Button>
                                <Button variant="outline" size="sm" className="flex items-center gap-1">
                                  <span className="material-icons text-xs">share</span>
                                  Share
                                </Button>
                                <Button variant="outline" size="sm" className="flex items-center gap-1">
                                  <span className="material-icons text-xs">bookmark</span>
                                  Save
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </TabsContent>

              {/* Map View Tab */}
              <TabsContent value="map">
                <div className="bg-gray-100 rounded-xl mb-6 min-h-[60vh] flex items-center justify-center">
                  <div className="text-center max-w-md p-6">
                    <div className="material-icons text-5xl text-primary mb-4">map</div>
                    <h3 className="text-xl font-medium mb-3">Interactive Neighborhood Map</h3>
                    <p className="text-text-medium mb-4">
                      View all nearby amenities on an interactive map with distance overlays
                      and walking directions.
                    </p>
                    <p className="text-xs text-text-light">
                      Map functionality will be implemented in a future update.
                    </p>
                  </div>
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
